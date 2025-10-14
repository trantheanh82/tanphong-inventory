
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
    
    // Handle empty response body
    const responseText = await response.text();
    if (!responseText) {
        return {};
    }
    
    try {
        return JSON.parse(responseText);
    } catch (e) {
        // If it's not JSON, it might be a simple string response from some API calls.
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
            headers: headers, // Let fetch set the Content-Type with boundary for FormData
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
            const seriesList = record.fields.series.split(',').map((s: string) => s.trim());
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

async function processScan(noteId: string, cookieHeader: string, payload: { imageDataUri?: string; scanMode: 'dot' | 'series' | 'both'; scanType?: 'dot' | 'series'; dotNumber?: string; seriesNumber?: string, rescanRecordId?: string }) {
    const { imageDataUri, scanMode, scanType, dotNumber: payloadDot, seriesNumber: payloadSeries, rescanRecordId } = payload;
    
    if (rescanRecordId) {
        // --- RESCAN LOGIC ---
        if (!imageDataUri) {
            return NextResponse.json({ success: false, message: "Không có hình ảnh để quét lại." }, { status: 400 });
        }
        
        const detailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID!, noteId, 'export_note', cookieHeader);
        const targetItem = detailsResponse.records.find((item: any) => item.id === rescanRecordId);
        
        if (!targetItem) {
            return NextResponse.json({ success: false, message: "Không tìm thấy mục để quét lại." }, { status: 404 });
        }
        
        const recognizedInfo = await recognizeTireInfo(imageDataUri);
        const newSeries = recognizedInfo?.seriesNumber;
        const newDot = recognizedInfo?.dotNumber;
        
        const fieldsToUpdate: any = {};
        let message = "Đã cập nhật: ";
        let dotImageUploaded = false;
        let seriesImageUploaded = false;

        if (targetItem.fields.has_dot) { // Rescanning for DOT & Series item
            if (newSeries) {
                const duplicateRecord = await searchRecordBySeries(newSeries, cookieHeader);
                if (duplicateRecord && duplicateRecord.id !== rescanRecordId) {
                    return NextResponse.json({ success: false, message: `Series ${newSeries} đã tồn tại ở một mục khác.` }, { status: 409 });
                }
                fieldsToUpdate.series = newSeries;
                message += `Series ${newSeries}. `;
                seriesImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, SERIES_IMAGE_FIELD_ID!, cookieHeader);
            } else if (newDot) {
                message += `DOT ${newDot}. `;
                 dotImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, DOT_IMAGE_FIELD_ID!, cookieHeader);
            } else {
                 return NextResponse.json({ success: false, message: 'Không nhận dạng được thông tin mới để cập nhật.' }, { status: 400 });
            }
        } else { // Rescanning for Series-only item
             if (!newSeries) {
                return NextResponse.json({ success: false, message: 'Không nhận dạng được Series để cập nhật.' }, { status: 400 });
            }
            const duplicateRecord = await searchRecordBySeries(newSeries, cookieHeader);
            if (duplicateRecord && duplicateRecord.id !== rescanRecordId) {
                 return NextResponse.json({ success: false, message: `Series ${newSeries} đã tồn tại ở một mục khác.` }, { status: 409 });
            }
            fieldsToUpdate.series = newSeries;
            message += `Series ${newSeries}.`;
            seriesImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, SERIES_IMAGE_FIELD_ID!, cookieHeader);
        }

        if (Object.keys(fieldsToUpdate).length > 0) {
            const updatePayload = { records: [{ id: targetItem.id, fields: fieldsToUpdate }], fieldKeyType: "dbFieldName" };
            await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
        }
        
        return NextResponse.json({ success: true, message, dotImageUploaded, seriesImageUploaded, rescan: true });

    } else {
        // --- NEW SCAN LOGIC ---
        if (!imageDataUri) {
            return NextResponse.json({ success: false, message: "Không có hình ảnh để quét." }, { status: 400 });
        }
        
        const recognizedInfo = await recognizeTireInfo(imageDataUri);
        const recognizedDot = recognizedInfo?.dotNumber;
        const recognizedSeries = recognizedInfo?.seriesNumber;
        
        const detailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID!, noteId, 'export_note', cookieHeader);
        const details = detailsResponse.records;
        
        let targetItem: any = null;
        let fieldsToUpdate: any = {};
        let message = "";
        let dotImageUploaded = false;
        let seriesImageUploaded = false;
        const existingRecordId = payload.dotNumber ? noteId : null; // Simplified, need better state management from client

        // Handle first scan in a 'both' flow
        if (scanMode === 'both' && !payloadDot && !payloadSeries) {
             if (!recognizedDot && !recognizedSeries) {
                 return NextResponse.json({ success: false, message: 'Với chế độ này, vui lòng quét lốp có DOT hoặc Series.' }, { status: 400 });
            }

            if (recognizedSeries) {
                const duplicateRecord = await searchRecordBySeries(recognizedSeries, cookieHeader);
                if (duplicateRecord) return NextResponse.json({ success: false, message: `Series ${recognizedSeries} đã tồn tại.` }, { status: 409 });
            }

            if(recognizedDot) {
                const twoDigitDot = recognizedDot.slice(-2);
                targetItem = details.find((item: any) => 
                    item.fields.has_dot && 
                    String(item.fields.dot) === twoDigitDot && 
                    (item.fields.scanned || 0) < item.fields.quantity
                );
    
                if (!targetItem) return NextResponse.json({ success: false, message: `Lốp có DOT ${twoDigitDot} không có trong phiếu hoặc đã quét đủ.` }, { status: 404 });
                
                dotImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, DOT_IMAGE_FIELD_ID!, cookieHeader);
    
                return NextResponse.json({
                    success: true,
                    message: `Đã ghi nhận DOT ${recognizedDot}. Bây giờ hãy quét Series.`,
                    partial: true,
                    recordId: targetItem.id,
                    dot: recognizedDot,
                    series: recognizedSeries, // Can be null, client should check
                    dotImageUploaded
                });

            } else { // recognizedSeries must be true
                 targetItem = details.find((item: any) => 
                    item.fields.has_dot && 
                    (item.fields.scanned || 0) < item.fields.quantity &&
                    !item.fields.series // Find one that doesn't have a series yet or has quantity > 1
                );
                 if (!targetItem) return NextResponse.json({ success: false, message: `Không tìm thấy lốp phù hợp (có DOT, cần series) hoặc đã quét đủ.` }, { status: 404 });

                seriesImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, SERIES_IMAGE_FIELD_ID!, cookieHeader);
                
                const updatePayload = { records: [{ id: targetItem.id, fields: { series: recognizedSeries } }], fieldKeyType: "dbFieldName" };
                await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);


                return NextResponse.json({
                    success: true,
                    message: `Đã ghi nhận Series ${recognizedSeries}. Bây giờ hãy quét DOT.`,
                    partial: true,
                    recordId: targetItem.id,
                    dot: null,
                    series: recognizedSeries,
                    seriesImageUploaded
                });
            }
        }
        
        // Handle second scan in a 'both' flow OR a single scan mode
        const recordIdForUpdate = payloadDot || payloadSeries ? noteId : null; // This logic needs client to send recordId
        if(payload.dotNumber || payload.seriesNumber){
             targetItem = details.find((item: any) => item.id === recordIdForUpdate);
        }

        if (!targetItem) {
            // Logic to find target item for single scan modes
            if (scanMode === 'dot') {
                if (!recognizedDot) return NextResponse.json({ success: false, message: `Không nhận dạng được DOT.` }, { status: 400 });
                const twoDigitDot = recognizedDot.slice(-2);
                targetItem = details.find((item: any) => item.fields.tire_type === 'Nội địa' && String(item.fields.dot) === twoDigitDot && (item.fields.scanned || 0) < item.fields.quantity);
                if (!targetItem) return NextResponse.json({ success: false, message: `DOT ${twoDigitDot} không có trong phiếu hoặc đã quét đủ.` }, { status: 404 });
            } else if (scanMode === 'series') {
                if (!recognizedSeries) return NextResponse.json({ success: false, message: `Không nhận dạng được Series.` }, { status: 400 });
                const duplicateRecord = await searchRecordBySeries(recognizedSeries, cookieHeader);
                if (duplicateRecord) return NextResponse.json({ success: false, message: `Series ${recognizedSeries} đã tồn tại.` }, { status: 409 });
                targetItem = details.find((item: any) => item.fields.tire_type === 'Nước ngoài' && !item.fields.has_dot && (item.fields.scanned || 0) < item.fields.quantity);
                if (!targetItem) return NextResponse.json({ success: false, message: `Đã quét đủ số lượng cho lốp chỉ có Series.` }, { status: 404 });
            }
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
            const currentSeries = targetItem.fields.series ? targetItem.fields.series.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
            fieldsToUpdate.series = [...currentSeries, recognizedSeries].join(', ');
            message = `Đã ghi nhận Series ${recognizedSeries}.`;
        } else if (scanMode === 'both') {
            // This is the second step
            if (scanType === 'dot' && recognizedDot) {
                 dotImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, DOT_IMAGE_FIELD_ID!, cookieHeader);
                 message = `Đã ghi nhận DOT ${recognizedDot.slice(-2)} cho lốp.`;
            } else if (scanType === 'series' && recognizedSeries) {
                const duplicateRecord = await searchRecordBySeries(recognizedSeries, cookieHeader);
                if (duplicateRecord) return NextResponse.json({ success: false, message: `Series ${recognizedSeries} đã tồn tại.` }, { status: 409 });
                seriesImageUploaded = await uploadAttachment(targetItem.id, imageDataUri, SERIES_IMAGE_FIELD_ID!, cookieHeader);
                const currentSeries = targetItem.fields.series ? targetItem.fields.series.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                fieldsToUpdate.series = [...currentSeries, recognizedSeries].join(', ');
                message = `Đã ghi nhận Series ${recognizedSeries}.`;
            }
        }
        
        message += ` (${newCount}/${targetItem.fields.quantity})`;
        const updatePayload = { records: [{ id: targetItem.id, fields: fieldsToUpdate }], fieldKeyType: "dbFieldName" };
        await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
        
        await updateNoteStatusIfCompleted(noteId, cookieHeader);
        
        return NextResponse.json({ success: true, message, dotImageUploaded, seriesImageUploaded });
    }
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

    