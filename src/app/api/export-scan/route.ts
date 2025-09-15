
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

    const allScanned = allDetails.every((item: any) => {
        const isDomestic = item.fields.tire_type === 'Nội địa';
        const scannedCount = item.fields.scanned || 0;
        const requiredQuantity = item.fields.quantity;
        const seriesCount = item.fields.series ? item.fields.series.split(',').map((s:string) => s.trim()).length : 0;
        
        if (isDomestic) {
            return scannedCount >= requiredQuantity;
        } else { // Nước ngoài
            return scannedCount >= requiredQuantity && seriesCount >= requiredQuantity;
        }
    });

    if (allScanned) {
        const updatePayload = {
            records: [{ id: noteId, fields: { status: 'Đã scan đủ' } }],
            fieldKeyType: 'dbFieldName',
        };
        const updateUrl = `${API_ENDPOINT}/table/${EXPORT_TBL_ID}/record`;
        await apiRequest(updateUrl, 'PATCH', cookieHeader, updatePayload);
    }
}

async function processScan(noteId: string, imageDataUri: string, cookieHeader: string) {
    const recognizedInfo = await recognizeTireInfo(imageDataUri);

    if (!recognizedInfo || (!recognizedInfo.dotNumber && !recognizedInfo.seriesNumber)) {
        return NextResponse.json({ success: false, message: "Không nhận dạng được DOT hoặc Series. Vui lòng thử lại." }, { status: 400 });
    }

    const { dotNumber, seriesNumber } = recognizedInfo;

    const detailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID!, noteId, 'export_note', cookieHeader);
    const details = detailsResponse.records;

    let targetItem: any = null;
    let updateType: 'dot' | 'series' | null = null;
    
    // Prioritize series number for lookup
    if (seriesNumber) {
        // Check for duplicate series in THIS note
        for (const item of details) {
            if (item.fields.series && item.fields.series.split(',').map((s: string) => s.trim()).includes(seriesNumber)) {
                return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã được quét cho phiếu này.` }, { status: 409 });
            }
        }
        
        // Find a foreign tire that needs this series
        targetItem = details.find((item: any) => {
            if (item.fields.tire_type !== 'Nước ngoài' || !item.fields.quantity) return false;
            const seriesCount = item.fields.series ? item.fields.series.split(',').length : 0;
            return seriesCount < item.fields.quantity;
        });

        if(targetItem) updateType = 'series';
    }
    
    // If no series match, or no series found, try DOT
    if (!targetItem && dotNumber) {
        const valueToScan = dotNumber.slice(-2);
        targetItem = details.find((item: any) => String(item.fields.dot) === valueToScan);
        if(targetItem) updateType = 'dot';
    }

    if (!targetItem) {
        return NextResponse.json({ success: false, message: `Không tìm thấy lốp phù hợp cho thông tin đã quét (DOT: ${dotNumber || 'N/A'}, Series: ${seriesNumber || 'N/A'}).` }, { status: 404 });
    }

    // --- Process the update ---
    const fieldsToUpdate: any = {};
    let message = "";
    
    if (updateType === 'dot') {
        const currentScanned = targetItem.fields.scanned || 0;
        const totalQuantity = targetItem.fields.quantity;
        
        if (currentScanned >= totalQuantity) {
            return NextResponse.json({ success: true, warning: true, message: `Đã quét đủ số lượng cho DOT ${targetItem.fields.dot}.`});
        }
        
        const newScannedCount = currentScanned + 1;
        fieldsToUpdate.scanned = newScannedCount;
        
        if (newScannedCount >= totalQuantity) fieldsToUpdate.status = 'Đã scan đủ';
        
        message = targetItem.fields.tire_type === 'Nước ngoài'
            ? `DOT ${targetItem.fields.dot} hợp lệ. Hãy quét tiếp series cho lốp này.`
            : `Đã ghi nhận DOT ${targetItem.fields.dot} (${newScannedCount}/${totalQuantity})`;

    } else if (updateType === 'series' && seriesNumber) {
        const newSeries = targetItem.fields.series ? `${targetItem.fields.series}, ${seriesNumber}` : seriesNumber;
        fieldsToUpdate.series = newSeries;
        message = `Đã ghi nhận Series ${seriesNumber} cho DOT ${targetItem.fields.dot}.`;
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
        const updatePayload = {
            records: [{ id: targetItem.id, fields: fieldsToUpdate }],
            fieldKeyType: "dbFieldName"
        };
        await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
        await updateNoteStatusIfCompleted(noteId, cookieHeader);
    } else {
        return NextResponse.json({ success: false, message: "Không có thông tin gì để cập nhật." }, { status: 400 });
    }
    
    return NextResponse.json({
        success: true, message, dot: targetItem.fields.dot, series: seriesNumber,
    });
}

export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { noteId, imageDataUri } = await request.json();

    if (!noteId || !imageDataUri) {
        return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }
    
    if (!API_ENDPOINT || !EXPORT_TBL_ID || !EXPORT_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    try {
       return await processScan(noteId, imageDataUri, cookieHeader);
    } catch (error: any) {
        console.error('Error processing export scan:', error);
        return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
