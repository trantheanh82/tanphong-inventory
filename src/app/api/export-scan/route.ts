
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeTireInfo } from '@/ai/flows/export-scan-flow';

const { API_ENDPOINT, EXPORT_TBL_ID, EXPORT_DETAIL_TBL_ID, SERIES_IMAGE_FIELD_ID, DOT_IMAGE_FIELD_ID } = process.env;

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
    
    const responseText = await response.text();
    if (!responseText) {
        return {};
    }
    
    try {
        return JSON.parse(responseText);
    } catch (e) {
        return responseText;
    }
}

async function uploadAttachment(recordId: string, imageDataUri: string, fieldId: string, cookieHeader: string | null): Promise<boolean> {
    if (!API_ENDPOINT || !EXPORT_DETAIL_TBL_ID || !fieldId) {
        console.error('Missing env vars for attachment upload or fieldId not provided');
        return false;
    }
    try {
        const base64Data = imageDataUri.split(',')[1];
        if (!base64Data) {
            console.error('Invalid imageDataUri format for upload');
            return false;
        }
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', imageBlob, 'scan.jpg');
        
        const url = `${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record/${recordId}/${fieldId}/uploadAttachment`;

        const headers: HeadersInit = {};
        if (cookieHeader) {
            headers['Cookie'] = cookieHeader;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error during attachment upload for record ${recordId}:`, errorText);
            return false;
        }
        
        console.log(`Successfully requested attachment upload for record ${recordId} to field ${fieldId}`);
        return true;
    } catch (error) {
        console.error('Error during attachment upload:', error);
        return false;
    }
}

async function searchRecordBySeries(series: string, cookieHeader: string | null) {
    if (!API_ENDPOINT || !EXPORT_DETAIL_TBL_ID) {
        throw new Error('Environment variables for API endpoint and table IDs are not set.');
    }
    
    const filterObject = {
        conjunction: 'and',
        filterSet: [
            { fieldId: 'series', operator: 'contains', value: series }
        ],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record?filter=${filterQuery}&fieldKeyType=dbFieldName`;
    
    const response = await apiRequest(url, 'GET', cookieHeader);
    
    if (!response.records || response.records.length === 0) {
        return undefined;
    }

    for (const record of response.records) {
        if (record.fields && record.fields.series) {
            const seriesList = String(record.fields.series).split(',').map((s: string) => s.trim());
            if (seriesList.includes(series)) {
                return record; 
            }
        }
    }
    
    return undefined;
}

async function fetchNoteDetails(tableId: string, noteId: string, filterField: string, cookieHeader: string | null) {
    const filterObject = {
        conjunction: 'and',
        filterSet: [{ fieldId: filterField, operator: 'is', value: noteId }],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${tableId}/record?filter=${filterQuery}&fieldKeyType=dbFieldName&take=1000`;
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

async function processScan(noteId: string, cookieHeader: string, payload: { imageDataUri?: string; scanMode: 'dot' | 'series' | 'both'; dotNumber?: string; seriesNumber?: string, rescanRecordId?: string, recordId?: string }) {
    const { imageDataUri, scanMode, recordId: existingRecordId } = payload;
    
    if (!imageDataUri) {
        return NextResponse.json({ success: false, message: "Không có hình ảnh để quét." }, { status: 400 });
    }
        
    const recognizedInfo = await recognizeTireInfo(imageDataUri);
    const recognizedDot = recognizedInfo?.dotNumber;
    const recognizedSeries = recognizedInfo?.seriesNumber;

    if (!recognizedDot && !recognizedSeries) {
        return NextResponse.json({ success: false, message: 'Không nhận dạng được DOT hay Series từ hình ảnh.' }, { status: 400 });
    }

    const detailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID!, noteId, 'export_note', cookieHeader);
    const details = detailsResponse.records;

    let targetItem: any = null;
    let fieldsToUpdate: any = {};
    let message = "";
    let dotImageUploaded = false;
    let seriesImageUploaded = false;

    // Handle second scan in a 'both' flow
    if (existingRecordId && scanMode === 'both') {
        targetItem = details.find((item: any) => item.id === existingRecordId);
        if (!targetItem) {
            return NextResponse.json({ success: false, message: "Không tìm thấy mục đã quét từ bước 1." }, { status: 404 });
        }
        
        // At this point, the targetItem already has either a DOT or a Series. We need to find the other.
        const isFinishingWithDot = !!targetItem.fields.series; // We already have a series, now we need a dot
        const isFinishingWithSeries = !targetItem.fields.series; // We don't have a series, so we need one
        
        if (isFinishingWithDot) {
            if (!recognizedDot) return NextResponse.json({ success: false, message: "Không nhận dạng được DOT cho bước 2." }, { status: 400 });
            const recognizedLastTwoDigits = recognizedDot.slice(-2);
            if (String(targetItem.fields.dot) !== String(recognizedLastTwoDigits)) {
                return NextResponse.json({ success: false, message: `DOT ${recognizedLastTwoDigits} (từ lốp ${recognizedDot}) không khớp với DOT ${targetItem.fields.dot} của lốp đã chọn.` }, { status: 400 });
            }
            dotImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, DOT_IMAGE_FIELD_ID!, cookieHeader);
            message = `Đã ghi nhận DOT ${recognizedLastTwoDigits}. Hoàn tất quét lốp.`;
        } else if (isFinishingWithSeries) {
            if (!recognizedSeries) return NextResponse.json({ success: false, message: "Không nhận dạng được Series cho bước 2." }, { status: 400 });
            const duplicateRecord = await searchRecordBySeries(recognizedSeries, cookieHeader);
            if (duplicateRecord) return NextResponse.json({ success: false, message: `Series ${recognizedSeries} đã tồn tại.` }, { status: 409 });
            
            seriesImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, SERIES_IMAGE_FIELD_ID!, cookieHeader);
            fieldsToUpdate.series = recognizedSeries;
            message = `Đã ghi nhận Series ${recognizedSeries}. Hoàn tất quét lốp.`;
        } else {
            return NextResponse.json({ success: false, message: "Yêu cầu không hợp lệ cho bước 2." }, { status: 400 });
        }

        const newCount = (targetItem.fields.scanned || 0) + 1;
        fieldsToUpdate.scanned = newCount;
        if (newCount >= targetItem.fields.quantity) {
            fieldsToUpdate.status = 'Đã scan đủ';
        }
        
        message += ` (${newCount}/${targetItem.fields.quantity})`;
        const updatePayload = { records: [{ id: targetItem.id, fields: fieldsToUpdate }], fieldKeyType: "dbFieldName" };
        await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
        
        await updateNoteStatusIfCompleted(noteId, cookieHeader);
        return NextResponse.json({ success: true, message, dotImageUploaded, seriesImageUploaded, partial: false, isCompleted: true });
    
    } else if (scanMode === 'both') {
        // This is the FIRST scan of a 'both' item
        if (recognizedDot) {
            const recognizedLastTwoDigits = recognizedDot.slice(-2);
            targetItem = details.find((item: any) => 
                item.fields.has_dot && 
                String(item.fields.dot) === String(recognizedLastTwoDigits) && 
                (item.fields.scanned || 0) < item.fields.quantity
            );

            if (!targetItem) return NextResponse.json({ success: false, message: `Lốp có DOT ${recognizedLastTwoDigits} (từ lốp ${recognizedDot}) không có trong phiếu hoặc đã quét đủ.` }, { status: 404 });
            
            dotImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, DOT_IMAGE_FIELD_ID!, cookieHeader);

            return NextResponse.json({
                success: true,
                message: `Đã ghi nhận DOT ${recognizedDot}. Bây giờ hãy quét Series.`,
                partial: true,
                recordId: targetItem.id,
                dot: recognizedDot,
                series: null,
                dotImageUploaded,
            });

        } else { // recognizedSeries must be true here
            const duplicateRecord = await searchRecordBySeries(recognizedSeries!, cookieHeader);
            if (duplicateRecord) return NextResponse.json({ success: false, message: `Series ${recognizedSeries} đã tồn tại.` }, { status: 409 });

            // Find a suitable item that needs a series and is not fully scanned
            targetItem = details.find((item: any) => 
                item.fields.has_dot && 
                (item.fields.scanned || 0) < item.fields.quantity &&
                !item.fields.series // Find one that doesn't have a series yet
            );
            if (!targetItem) return NextResponse.json({ success: false, message: `Không tìm thấy lốp phù hợp (có DOT, cần series) hoặc đã quét đủ.` }, { status: 404 });

            seriesImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, SERIES_IMAGE_FIELD_ID!, cookieHeader);
            
            // Update the series right away for the first step
            const updatePayload = { records: [{ id: targetItem.id, fields: { series: recognizedSeries } }], fieldKeyType: "dbFieldName" };
            await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);

            return NextResponse.json({
                success: true,
                message: `Đã ghi nhận Series ${recognizedSeries}. Bây giờ hãy quét DOT.`,
                partial: true,
                recordId: targetItem.id,
                dot: null,
                series: recognizedSeries,
                seriesImageUploaded,
            });
        }
    }
    
    // Handle single scan modes ('dot' or 'series')
    if (scanMode === 'dot') {
        if (!recognizedDot) return NextResponse.json({ success: false, message: `Không nhận dạng được DOT.` }, { status: 400 });
        const recognizedLastTwoDigits = recognizedDot.slice(-2);
        targetItem = details.find((item: any) => item.fields.tire_type === 'Nội địa' && String(item.fields.dot) === String(recognizedLastTwoDigits) && (item.fields.scanned || 0) < item.fields.quantity);
        if (!targetItem) return NextResponse.json({ success: false, message: `DOT ${recognizedLastTwoDigits} (từ lốp ${recognizedDot}) không có trong phiếu hoặc đã quét đủ.` }, { status: 404 });
    
    } else if (scanMode === 'series') {
        if (!recognizedSeries) return NextResponse.json({ success: false, message: `Không nhận dạng được Series.` }, { status: 400 });
        const duplicateRecord = await searchRecordBySeries(recognizedSeries, cookieHeader);
        if (duplicateRecord) return NextResponse.json({ success: false, message: `Series ${recognizedSeries} đã tồn tại.` }, { status: 409 });
        targetItem = details.find((item: any) => item.fields.tire_type === 'Nước ngoài' && !item.fields.has_dot && (item.fields.scanned || 0) < item.fields.quantity);
        if (!targetItem) return NextResponse.json({ success: false, message: `Đã quét đủ số lượng cho lốp chỉ có Series.` }, { status: 404 });
    }
    
    if (!targetItem) {
        return NextResponse.json({ success: false, message: "Không tìm thấy mục phù hợp để cập nhật." }, { status: 404 });
    }
    
    const newCount = (targetItem.fields.scanned || 0) + 1;
    fieldsToUpdate.scanned = newCount;
    
    if (newCount >= targetItem.fields.quantity) {
        fieldsToUpdate.status = 'Đã scan đủ';
    }

    if (scanMode === 'dot') {
        dotImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, DOT_IMAGE_FIELD_ID!, cookieHeader);
        message = `Đã ghi nhận DOT ${recognizedDot?.slice(-2)} (từ lốp ${recognizedDot}).`;
    } else if (scanMode === 'series') {
        seriesImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, SERIES_IMAGE_FIELD_ID!, cookieHeader);
        const currentSeries = targetItem.fields.series ? String(targetItem.fields.series).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        fieldsToUpdate.series = [...currentSeries, recognizedSeries].join(', ');
        message = `Đã ghi nhận Series ${recognizedSeries}.`;
    }
    
    message += ` (${newCount}/${targetItem.fields.quantity})`;
    const updatePayload = { records: [{ id: targetItem.id, fields: fieldsToUpdate }], fieldKeyType: "dbFieldName" };
    await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
    
    await updateNoteStatusIfCompleted(noteId, cookieHeader);
    
    return NextResponse.json({ success: true, message, dotImageUploaded, seriesImageUploaded, partial: false, isCompleted: true });
}

export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    
    let body;
    try {
        body = await request.json();
    } catch(e) {
        return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
    }

    const { noteId, scanMode } = body;
    if (!noteId || !scanMode) {
        return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }
    
    if (!API_ENDPOINT || !EXPORT_TBL_ID || !EXPORT_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    if (!SERIES_IMAGE_FIELD_ID || !DOT_IMAGE_FIELD_ID) {
        return NextResponse.json({ message: 'Image field IDs are not configured on the server.' }, { status: 500 });
    }

    try {
       return await processScan(noteId, cookieHeader, body);
    } catch (error: any) {
        console.error('Error processing export scan:', error);
        return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}

    