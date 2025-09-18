
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeTireInfo } from '@/ai/flows/export-scan-flow';
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

    const allScanned = allDetails.every((item: any) => {
        const isDomestic = item.fields.tire_type === 'Nội địa';
        const scannedCount = item.fields.scanned || 0;
        const requiredQuantity = item.fields.quantity;
        const seriesCount = item.fields.series ? item.fields.series.split(',').map((s:string) => s.trim()).filter(Boolean).length : 0;
        
        if (isDomestic) {
            return scannedCount >= requiredQuantity;
        } else { // Nước ngoài
            return seriesCount >= requiredQuantity;
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

async function processScan(noteId: string, imageDataUri: string, scanMode: 'dot' | 'series' | 'both', cookieHeader: string) {
    let twoDigitDot: string | undefined; // This will be the 2-digit DOT for matching
    let seriesNumber: string | undefined;
    let fullDotNumber: string | undefined; // This will be the 4-digit DOT for display

    try {
        if (scanMode === 'dot') {
            const recognizedDot = await recognizeDotNumber(imageDataUri);
            if (recognizedDot && /^\d{4}$/.test(recognizedDot)) {
                fullDotNumber = recognizedDot;
                twoDigitDot = recognizedDot.slice(-2);
            }
        } else if (scanMode === 'series') {
            seriesNumber = await recognizeSeriesNumber(imageDataUri);
        } else { // 'both'
            const recognizedInfo = await recognizeTireInfo(imageDataUri);
            if (recognizedInfo?.dotNumber && /^\d{4}$/.test(recognizedInfo.dotNumber)) {
                fullDotNumber = recognizedInfo.dotNumber;
                twoDigitDot = recognizedInfo.dotNumber.slice(-2);
            }
            seriesNumber = recognizedInfo?.seriesNumber;
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
    let updateType: 'dot' | 'series' | null = null;
    
    // Logic to find the target item
    if (seriesNumber) {
        // Rule: Series can't be scanned twice for the same note
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

        if (targetItem) {
            updateType = 'series';
        }
    }
    
    // If a series match wasn't found (or wasn't scanned), and a DOT number was scanned, try to match by DOT.
    if (!targetItem && twoDigitDot) {
        targetItem = details.find((item: any) => {
            const scannedCount = item.fields.scanned || 0;
            const quantityNeeded = item.fields.quantity || 0;
            // Ensure types are the same for comparison
            return String(item.fields.dot) === twoDigitDot && item.fields.tire_type === 'Nội địa' && scannedCount < quantityNeeded;
        });
        if(targetItem) {
            updateType = 'dot';
        }
    }

    if (!targetItem) {
        let msg = `Không tìm thấy lốp phù hợp hoặc đã quét đủ số lượng.`;
        if (fullDotNumber) msg += ` DOT quét được: ${fullDotNumber} (sử dụng ${twoDigitDot}).`;
        if (seriesNumber) msg += ` Series quét được: ${seriesNumber}.`;
        return NextResponse.json({ success: false, message: msg }, { status: 404 });
    }

    // --- Process the update ---
    const fieldsToUpdate: any = {};
    let message = "";
    
    if (updateType === 'dot') {
        const currentScanned = targetItem.fields.scanned || 0;
        const totalQuantity = targetItem.fields.quantity;
        
        const newScannedCount = currentScanned + 1;
        fieldsToUpdate.scanned = newScannedCount;
        
        message = `Đã ghi nhận DOT ${targetItem.fields.dot} (từ lốp ${fullDotNumber}). (${newScannedCount}/${totalQuantity})`;

    } else if (updateType === 'series' && seriesNumber) {
        const currentSeries = targetItem.fields.series ? targetItem.fields.series.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        
        const newSeries = [...currentSeries, seriesNumber].join(', ');
        fieldsToUpdate.series = newSeries;
        const newSeriesCount = currentSeries.length + 1;
        message = `Đã ghi nhận Series ${seriesNumber}. (${newSeriesCount}/${targetItem.fields.quantity})`;
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
        const updatePayload = {
            records: [{ id: targetItem.id, fields: fieldsToUpdate }],
            fieldKeyType: "dbFieldName"
        };
        await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
        await updateNoteStatusIfCompleted(noteId, cookieHeader);
    } else {
        if (twoDigitDot && !seriesNumber && targetItem.fields.tire_type === 'Nước ngoài') {
             return NextResponse.json({ success: false, message: `Lốp nước ngoài yêu cầu quét Series. Vui lòng chọn chế độ quét "Series" hoặc "Cả hai".` }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: "Không có thông tin gì để cập nhật." }, { status: 400 });
    }
    
    return NextResponse.json({
        success: true, message, dot: targetItem.fields.dot, series: seriesNumber,
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
