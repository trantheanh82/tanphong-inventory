
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeDotNumber } from '@/ai/flows/scan-flow';
import { recognizeSeriesNumber } from '@/ai/flows/warranty-scan-flow';

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

async function handleDotScan(noteId: string, imageDataUri: string, cookieHeader: string) {
    const recognizedDot = await recognizeDotNumber(imageDataUri);
    if (!recognizedDot) {
        return NextResponse.json({ success: false, message: "Không nhận dạng được DOT. Vui lòng thử lại." }, { status: 400 });
    }

    const valueToScan = recognizedDot.slice(-2);

    const detailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID!, noteId, 'export_note', cookieHeader);
    const details = detailsResponse.records;

    const targetItem = details.find((item: any) => String(item.fields.dot) === valueToScan);

    if (!targetItem) {
        return NextResponse.json({ success: false, message: `DOT ${valueToScan} (từ ${recognizedDot}) không có trong phiếu.` }, { status: 404 });
    }

    const currentScanned = targetItem.fields.scanned || 0;
    const totalQuantity = targetItem.fields.quantity;

    if (currentScanned >= totalQuantity) {
        return NextResponse.json({ 
            success: true, warning: true, message: `Đã quét đủ số lượng cho DOT ${valueToScan}.`,
            dot: valueToScan, isCompleted: true
        });
    }

    const newScannedCount = currentScanned + 1;
    const isItemCompleted = newScannedCount >= totalQuantity;

    const fieldsToUpdate: any = { scanned: newScannedCount };
    if (isItemCompleted) fieldsToUpdate.status = 'Đã scan đủ';
    
    const updatePayload = {
        records: [{ id: targetItem.id, fields: fieldsToUpdate }],
        fieldKeyType: "dbFieldName"
    };

    await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
    if (isItemCompleted) await updateNoteStatusIfCompleted(noteId, cookieHeader);

    const message = targetItem.fields.tire_type === 'Nước ngoài'
        ? `DOT ${valueToScan} hợp lệ. Hãy quét tiếp series cho lốp này.`
        : `Đã ghi nhận DOT ${valueToScan} (${newScannedCount}/${totalQuantity})`;

    return NextResponse.json({
        success: true, message, dot: valueToScan, isCompleted: isItemCompleted,
    });
}

async function handleSeriesScan(noteId: string, imageDataUri: string, cookieHeader: string) {
    const seriesNumber = await recognizeSeriesNumber(imageDataUri);
    if (!seriesNumber) {
        return NextResponse.json({ success: false, message: "Không nhận dạng được series. Vui lòng thử lại." }, { status: 400 });
    }
    
    const detailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID!, noteId, 'export_note', cookieHeader);
    const details = detailsResponse.records;

    // Find first "Nước ngoài" item that needs a series
    const targetItem = details.find((item: any) => {
        if (item.fields.tire_type !== 'Nước ngoài' || !item.fields.quantity) return false;
        const seriesCount = item.fields.series ? item.fields.series.split(',').length : 0;
        return seriesCount < item.fields.quantity;
    });

    if (!targetItem) {
        return NextResponse.json({ success: false, message: "Tất cả các lốp 'Nước ngoài' đã được quét series." }, { status: 400 });
    }

    // Check for duplicate series in THIS note
    for (const item of details) {
        if (item.fields.series && item.fields.series.includes(seriesNumber)) {
            return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã được quét cho phiếu này.` }, { status: 409 });
        }
    }

    const newSeries = targetItem.fields.series ? `${targetItem.fields.series}, ${seriesNumber}` : seriesNumber;

    const updatePayload = {
        records: [{ id: targetItem.id, fields: { series: newSeries } }],
        fieldKeyType: "dbFieldName"
    };

    await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);

    return NextResponse.json({
        success: true,
        message: `Đã ghi nhận Series ${seriesNumber} cho DOT ${targetItem.fields.dot}.`,
        dot: targetItem.fields.dot,
        series: seriesNumber,
    });
}


export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { noteId, imageDataUri, scanType } = await request.json();

    if (!noteId || !imageDataUri || !scanType) {
        return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }
    
    if (!API_ENDPOINT || !EXPORT_TBL_ID || !EXPORT_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    try {
        if (scanType === 'dot') {
            return await handleDotScan(noteId, imageDataUri, cookieHeader);
        } else if (scanType === 'series') {
            return await handleSeriesScan(noteId, imageDataUri, cookieHeader);
        } else {
            return NextResponse.json({ message: 'Invalid scan type.' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Error processing export scan:', error);
        return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
