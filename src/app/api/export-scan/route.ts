
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

async function processScan(noteId: string, imageDataUri: string, scanMode: 'dot' | 'series' | 'both', cookieHeader: string) {
    let twoDigitDot: string | undefined;
    let seriesNumber: string | undefined;
    let fullDotNumber: string | undefined;

    try {
        const recognizedInfo = await recognizeTireInfo(imageDataUri);
        fullDotNumber = recognizedInfo?.dotNumber;
        seriesNumber = recognizedInfo?.seriesNumber;
        
        if (fullDotNumber) {
            twoDigitDot = fullDotNumber.slice(-2);
        }

    } catch (aiError) {
        console.error("AI recognition error:", aiError);
        return NextResponse.json({ success: false, message: 'AI processing failed. Please try again.' }, { status: 500 });
    }
    
    if (!twoDigitDot && !seriesNumber) {
        return NextResponse.json({ success: false, message: "Không nhận dạng được thông tin lốp xe. Vui lòng thử lại." }, { status: 400 });
    }

    const detailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID!, noteId, 'export_note', cookieHeader);
    const details = detailsResponse.records;
    
    let targetItem: any = null;
    
    // --- Logic to find the target item ---

    // Rule 1: Prioritize matching International tires by Series if a series was scanned
    if (seriesNumber && (scanMode === 'series' || scanMode === 'both')) {
        // Check for duplicates first
        for (const item of details) {
            const existingSeries = item.fields.series ? item.fields.series.split(',').map((s: string) => s.trim()) : [];
            if (existingSeries.includes(seriesNumber)) {
                return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã được quét cho phiếu này.` }, { status: 409 });
            }
        }
        
        targetItem = details.find((item: any) => {
            const seriesCount = item.fields.series ? item.fields.series.split(',').map((s: string) => s.trim()).filter(Boolean).length : 0;
            const quantityNeeded = item.fields.quantity || 0;
            return item.fields.tire_type === 'Nước ngoài' && seriesCount < quantityNeeded;
        });
    }
    
    // Rule 2: If no series match was made (or no series was scanned), try to match ANY tire by DOT.
    if (!targetItem && twoDigitDot && (scanMode === 'dot' || scanMode === 'both')) {
        targetItem = details.find((item: any) => {
            const scannedCount = item.fields.scanned || 0;
            const quantityNeeded = item.fields.quantity || 0;
            return String(item.fields.dot) === twoDigitDot && scannedCount < quantityNeeded;
        });
    }

    if (!targetItem) {
        let msg = `Không tìm thấy lốp phù hợp hoặc đã quét đủ số lượng.`;
        if (fullDotNumber && twoDigitDot) msg += ` DOT quét được: ${fullDotNumber} (sử dụng ${twoDigitDot}).`;
        if (seriesNumber) msg += ` Series quét được: ${seriesNumber}.`;
        return NextResponse.json({ success: false, message: msg }, { status: 404 });
    }

    // --- Process the update ---
    const fieldsToUpdate: any = {};
    let message = "";
    const currentScanned = targetItem.fields.scanned || 0;
    const totalQuantity = targetItem.fields.quantity;
    const newCount = currentScanned + 1;
    
    fieldsToUpdate.scanned = newCount;
    
    if (newCount >= totalQuantity) {
        fieldsToUpdate.status = 'Đã scan đủ';
    }

    if (seriesNumber && targetItem.fields.tire_type === 'Nước ngoài') {
        const currentSeries = targetItem.fields.series ? targetItem.fields.series.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        const newSeries = [...currentSeries, seriesNumber].join(', ');
        fieldsToUpdate.series = newSeries;
        message = `Đã ghi nhận Series ${seriesNumber}. (${newCount}/${totalQuantity})`;
        if (twoDigitDot) {
             message = `Đã ghi nhận DOT ${twoDigitDot} (từ ${fullDotNumber}) và Series ${seriesNumber}. (${newCount}/${totalQuantity})`;
        }
    } else if (twoDigitDot) {
        message = `Đã ghi nhận DOT ${twoDigitDot} (từ lốp ${fullDotNumber}). (${newCount}/${totalQuantity})`;
        if (seriesNumber && targetItem.fields.tire_type !== 'Nước ngoài') {
            message = `Đã ghi nhận DOT ${twoDigitDot} (từ lốp ${fullDotNumber}). Series ${seriesNumber} không áp dụng cho lốp nội địa. (${newCount}/${totalQuantity})`;
        }
    } else {
         if (seriesNumber) {
             message = `Series ${seriesNumber} không áp dụng cho lốp này, nhưng đã ghi nhận số lượng. (${newCount}/${totalQuantity})`;
        } else {
            // This case should not be possible if we found a targetItem. Fallback.
            return NextResponse.json({ success: false, message: "Không thể xác định thông tin để cập nhật." }, { status: 400 });
        }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
        const updatePayload = {
            records: [{ id: targetItem.id, fields: fieldsToUpdate }],
            fieldKeyType: "dbFieldName"
        };
        await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
        await updateNoteStatusIfCompleted(noteId, cookieHeader);
    }
    
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
    const { noteId, imageDataUri, scanMode } = await request.json();

    if (!noteId || !imageDataUri || !scanMode) {
        return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }
    
    if (!API_ENDPOINT || !EXPORT_TBL_ID || !EXPORT_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    try {
       return await processScan(noteId, imageDataUri, scanMode, cookieHeader);
    } catch (error: any) {
        console.error('Error processing export scan:', error);
        return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
