
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeTireInfo } from '@/ai/flows/export-scan-flow';

const { API_ENDPOINT, EXPORT_TBL_ID, EXPORT_DETAIL_TBL_ID } = process.env;

async function apiRequest(url: string, method: string, cookieHeader: string | null, body?: any) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorMessage = await response.text();
        }
        console.error(`API Error from ${method} ${url}: ${errorMessage}`);
        throw new Error(errorMessage);
    }

    return response.json();
}

async function fetchNoteDetails(tableId: string, noteId: string, filterField: string, cookieHeader: string | null) {
    const filterObject = {
        conjunction: 'and',
        filterSet: [{ fieldId: filterField, operator: 'is', value: noteId }],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${tableId}/record?filter=${filterQuery}&fieldKeyType=dbFieldName`;
    return apiRequest(url, 'GET', cookieHeader);
}

async function updateNoteStatusIfCompleted(noteId: string, cookieHeader: string | null) {
    if (!EXPORT_DETAIL_TBL_ID || !EXPORT_TBL_ID) return;
    
    const allDetailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID, noteId, 'export_note', cookieHeader);
    const allDetails = allDetailsResponse.records;

    if (!allDetails || allDetails.length === 0) return;

    const allScanned = allDetails.every((item: any) => (item.fields.scanned || 0) >= item.fields.quantity);

    if (allScanned) {
        const updatePayload = {
            records: [{ id: noteId, fields: { status: 'Đã scan đủ' } }],
            fieldKeyType: 'dbFieldName',
        };
        const updateUrl = `${API_ENDPOINT}/table/${EXPORT_TBL_ID}/record`;
        await apiRequest(updateUrl, 'PATCH', cookieHeader, updatePayload);
    }
}

async function processScan(noteId: string, cookieHeader: string, payload: { imageDataUri?: string; scanMode: 'dot' | 'series' | 'both'; dotNumber?: string; seriesNumber?: string }) {
    const { imageDataUri, scanMode, dotNumber: payloadDot, seriesNumber: payloadSeries } = payload;
    
    let twoDigitDot: string | undefined;
    let seriesNumber: string | undefined;
    let fullDotNumber: string | undefined;

    // --- Step 1: Get DOT and Series info ---
    if (scanMode === 'both' && payloadDot && payloadSeries) {
        fullDotNumber = payloadDot;
        seriesNumber = payloadSeries;
    } else if (imageDataUri) {
        try {
            const recognizedInfo = await recognizeTireInfo(imageDataUri);
            fullDotNumber = recognizedInfo?.dotNumber;
            seriesNumber = recognizedInfo?.seriesNumber;

            if (scanMode === 'dot' && !fullDotNumber) {
                return NextResponse.json({ success: false, message: 'Không nhận dạng được DOT hợp lệ.' }, { status: 400 });
            }
            if (scanMode === 'series' && !seriesNumber) {
                return NextResponse.json({ success: false, message: 'Không nhận dạng được Series.' }, { status: 400 });
            }

        } catch (aiError) {
            console.error("AI recognition error:", aiError);
            return NextResponse.json({ success: false, message: 'AI processing failed. Please try again.' }, { status: 500 });
        }
    } else {
        return NextResponse.json({ success: false, message: "Không có thông tin để quét." }, { status: 400 });
    }

    if (fullDotNumber) {
        twoDigitDot = fullDotNumber.slice(-2);
    }
    
    if (!twoDigitDot && !seriesNumber) {
        return NextResponse.json({ success: false, message: "Không nhận dạng được thông tin lốp xe. Vui lòng thử lại." }, { status: 400 });
    }

    const detailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID!, noteId, 'export_note', cookieHeader);
    const details = detailsResponse.records;
    
    let targetItem: any = null;
    let message = "";
    
    // --- Step 2: Check for duplicate series ---
    if (seriesNumber) {
        for (const item of details) {
            const existingSeries = item.fields.series ? item.fields.series.split(',').map((s: string) => s.trim()) : [];
            if (existingSeries.includes(seriesNumber)) {
                return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã được quét cho phiếu này.` }, { status: 409 });
            }
        }
    }

    // --- Step 3: Find the target item to update ---
    if (scanMode === 'both') {
         targetItem = details.find((item: any) =>
            twoDigitDot && String(item.fields.dot) === twoDigitDot &&
            (item.fields.scanned || 0) < item.fields.quantity
        );
        if (targetItem) {
             message = `Đã ghi nhận DOT ${twoDigitDot} (từ ${fullDotNumber}) và Series ${seriesNumber}.`;
        }
    } else if (scanMode === 'series') {
        // Find the first available item to add a series to
        targetItem = details.find((item: any) => (item.fields.scanned || 0) < item.fields.quantity);
        if (targetItem) {
            message = `Đã ghi nhận Series ${seriesNumber}.`;
        }
    } else if (scanMode === 'dot') {
        // Find the first available item to add a DOT to
        targetItem = details.find((item: any) => (item.fields.scanned || 0) < item.fields.quantity);
        if (targetItem) {
            message = `Đã ghi nhận DOT ${twoDigitDot} (từ lốp ${fullDotNumber}).`;
        }
    }


    if (!targetItem) {
        let msg = `Không tìm thấy lốp phù hợp hoặc đã quét đủ số lượng.`;
        if (fullDotNumber && twoDigitDot) msg += ` DOT quét được: ${fullDotNumber} (sử dụng ${twoDigitDot}).`;
        if (seriesNumber) msg += ` Series quét được: ${seriesNumber}.`;
        return NextResponse.json({ success: false, message: msg }, { status: 404 });
    }

    // --- Step 4: Process the update ---
    const fieldsToUpdate: any = {};
    const currentScanned = targetItem.fields.scanned || 0;
    const totalQuantity = targetItem.fields.quantity;
    const newCount = currentScanned + 1;
    
    fieldsToUpdate.scanned = newCount;
    
    if (newCount >= totalQuantity) {
        fieldsToUpdate.status = 'Đã scan đủ';
    }

    if (seriesNumber && (scanMode === 'series' || scanMode === 'both')) {
        const currentSeries = targetItem.fields.series ? targetItem.fields.series.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        const newSeries = [...currentSeries, seriesNumber].join(', ');
        fieldsToUpdate.series = newSeries;
    }
    
    if (twoDigitDot && (scanMode === 'dot' || scanMode === 'both')) {
        fieldsToUpdate.dot = parseInt(twoDigitDot, 10);
    }
    
    const totalItemsInNote = details.length;
    message += ` (${newCount}/${totalQuantity})`;

    const updatePayload = {
        records: [{ id: targetItem.id, fields: fieldsToUpdate }],
        fieldKeyType: "dbFieldName"
    };
    await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
    await updateNoteStatusIfCompleted(noteId, cookieHeader);
    
    return NextResponse.json({
        success: true, message, 
        dot: twoDigitDot,
        fullDotNumber: fullDotNumber,
        series: seriesNumber,
        scanned: newCount,
        total: targetItem.fields.quantity,
    });
}

export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const body = await request.json();

    const { noteId, scanMode } = body;
    if (!noteId || !scanMode) {
        return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }
    
    if (!API_ENDPOINT || !EXPORT_TBL_ID || !EXPORT_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    try {
       return await processScan(noteId, cookieHeader, body);
    } catch (error: any) {
        console.error('Error processing export scan:', error);
        return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
