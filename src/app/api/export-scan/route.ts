
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeTireInfo } from '@/ai/flows/export-scan-flow';

const { API_ENDPOINT, EXPORT_TBL_ID, EXPORT_DETAIL_TBL_ID, SERIES_IMAGE_FIELD_ID } = process.env;

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

async function uploadAttachment(recordId: string, imageDataUri: string, cookieHeader: string | null) {
    if (!API_ENDPOINT || !EXPORT_DETAIL_TBL_ID || !SERIES_IMAGE_FIELD_ID) {
        console.error('Missing env vars for attachment upload');
        return;
    }

    try {
        const base64Data = imageDataUri.split(',')[1];
        if (!base64Data) {
            console.error('Invalid imageDataUri format');
            return;
        }
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('file', imageBlob, 'scan.jpg');

        const url = `${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record/${recordId}/${SERIES_IMAGE_FIELD_ID}/uploadAttachment`;

        const headers: HeadersInit = {};
        if (cookieHeader) {
            headers['Cookie'] = cookieHeader;
        }

        const uploadResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error(`Failed to upload attachment for record ${recordId}:`, errorText);
        } else {
            console.log(`Successfully uploaded attachment for record ${recordId}`);
        }
    } catch (error) {
        console.error('Error during attachment upload:', error);
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

    // Since 'contains' can have partial matches, we must verify the full series number.
    for (const record of response.records) {
        if (record.fields && record.fields.series) {
            const seriesList = record.fields.series.split(',').map((s: string) => s.trim());
            if (seriesList.includes(series)) {
                return record; // Return the first record with an exact match
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

async function processScan(noteId: string, cookieHeader: string, payload: { imageDataUri?: string; scanMode: 'dot' | 'series' | 'both'; dotNumber?: string; seriesNumber?: string, rescanRecordId?: string }) {
    const { imageDataUri, scanMode, dotNumber: payloadDot, seriesNumber: payloadSeries, rescanRecordId } = payload;
    
    let seriesNumber: string | undefined;
    let fullDotNumber: string | undefined;

    // --- Step 1: Get DOT and Series info ---
    if (scanMode === 'both' && payloadDot && payloadSeries) {
        fullDotNumber = payloadDot;
        seriesNumber = payloadSeries;
    } else if (imageDataUri) {
        try {
            const recognizedInfo = await recognizeTireInfo(imageDataUri);
            
            if (payloadDot) {
                fullDotNumber = payloadDot;
                seriesNumber = recognizedInfo?.seriesNumber;
            } else if (payloadSeries) {
                seriesNumber = payloadSeries;
                fullDotNumber = recognizedInfo?.dotNumber;
            } else {
                fullDotNumber = recognizedInfo?.dotNumber;
                seriesNumber = recognizedInfo?.seriesNumber;
            }
            
            if (seriesNumber && seriesNumber.length > 10) {
              return NextResponse.json({ success: false, message: 'Series tối đa chỉ 10 số. Vui lòng quét lại.' }, { status: 400 });
            }
            
            if (seriesNumber) {
                const existingRecord = await searchRecordBySeries(seriesNumber, cookieHeader);
                if (existingRecord && existingRecord.id !== rescanRecordId) {
                    return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã có trong hệ thống, vui lòng quét lại` }, { status: 409 });
                }
            }

            if (scanMode === 'dot' && !fullDotNumber) {
                return NextResponse.json({ success: false, message: 'Không nhận dạng được DOT hợp lệ.' }, { status: 400 });
            }
            if (scanMode === 'series' && !seriesNumber) {
                return NextResponse.json({ success: false, message: 'Không nhận dạng được Series.' }, { status: 400 });
            }
            if (scanMode === 'both' && !fullDotNumber && !seriesNumber) {
                 return NextResponse.json({ success: false, message: 'Không nhận dạng được DOT hay Series.' }, { status: 400 });
            }


        } catch (aiError) {
            console.error("AI recognition error:", aiError);
            return NextResponse.json({ success: false, message: 'AI processing failed. Please try again.' }, { status: 500 });
        }
    } else if (payloadDot && (scanMode === 'dot' || scanMode === 'both')) {
        fullDotNumber = payloadDot;
    } else if (payloadSeries && (scanMode === 'series' || scanMode === 'both')) {
        seriesNumber = payloadSeries;
    } else {
        return NextResponse.json({ success: false, message: "Không có thông tin để quét." }, { status: 400 });
    }

    const twoDigitDot = fullDotNumber ? fullDotNumber.slice(-2) : undefined;
    
    if (scanMode === 'both' && imageDataUri && (!fullDotNumber || !seriesNumber)) {
         return NextResponse.json({
            success: true,
            dot: twoDigitDot,
            fullDotNumber: fullDotNumber,
            series: seriesNumber,
            message: "Partial scan recognized.",
            partial: true,
        });
    }
    
    if (seriesNumber && !imageDataUri) { // This handles manual entry for series
        const existingRecord = await searchRecordBySeries(seriesNumber, cookieHeader);
        if (existingRecord && existingRecord.id !== rescanRecordId) {
            return NextResponse.json({ success: false, message: `Series ${seriesNumber} đã có trong hệ thống, vui lòng quét lại` }, { status: 409 });
        }
    }
    
    const detailsResponse = await fetchNoteDetails(EXPORT_DETAIL_TBL_ID!, noteId, 'export_note', cookieHeader);
    const details = detailsResponse.records;
    
    let targetItem: any = null;
    let message = "";

    // --- Step 3: Find the target item to update ---
    if (rescanRecordId) {
        targetItem = details.find((item: any) => item.id === rescanRecordId);
        if (!targetItem) {
            return NextResponse.json({ success: false, message: "Không tìm thấy mục để quét lại." }, { status: 404 });
        }
    } else {
       switch(scanMode) {
           case 'dot':
                if (!twoDigitDot) return NextResponse.json({ success: false, message: 'Không nhận dạng được DOT hợp lệ.' }, { status: 400 });
                targetItem = details.find((item: any) => 
                    item.fields.tire_type === 'Nội địa' &&
                    String(item.fields.dot) === twoDigitDot &&
                    (item.fields.scanned || 0) < item.fields.quantity
                );
                if (!targetItem) return NextResponse.json({ success: false, message: `DOT ${twoDigitDot} không có trong phiếu hoặc đã quét đủ.` }, { status: 404 });
                break;
           case 'series':
                if (!seriesNumber) return NextResponse.json({ success: false, message: 'Không nhận dạng được Series hợp lệ.' }, { status: 400 });
                targetItem = details.find((item: any) => 
                    item.fields.tire_type === 'Nước ngoài' &&
                    !item.fields.has_dot &&
                    (item.fields.scanned || 0) < item.fields.quantity
                );
                 if (!targetItem) return NextResponse.json({ success: false, message: `Đã quét đủ số lượng cho lốp chỉ có Series.` }, { status: 404 });
                break;
           case 'both':
                 if (!seriesNumber || !twoDigitDot) {
                    return NextResponse.json({ success: false, message: 'Bắt buộc phải có cả DOT và Series cho loại lốp này.' }, { status: 400 });
                }

                targetItem = details.find((item: any) => 
                    item.fields.has_dot &&
                    String(item.fields.dot) === twoDigitDot &&
                    (item.fields.scanned || 0) < item.fields.quantity
                );

                if (!targetItem) {
                    return NextResponse.json({ success: false, message: `Lốp DOT ${twoDigitDot} không có trong phiếu hoặc đã quét đủ.` }, { status: 404 });
                }
                break;
       }
    }

    if (!targetItem) {
        return NextResponse.json({ success: false, message: "Không tìm thấy lốp phù hợp để cập nhật." }, { status: 404 });
    }

    // --- Step 4: Prepare fields for update based on scan mode ---
    const fieldsToUpdate: any = {};
    const isRescan = !!rescanRecordId;
    
    const newCount = isRescan ? (targetItem.fields.scanned || 1) : (targetItem.fields.scanned || 0) + 1;

    if (!isRescan) {
        fieldsToUpdate.scanned = newCount;
    }

    if (newCount >= targetItem.fields.quantity && !isRescan) {
        fieldsToUpdate.status = 'Đã scan đủ';
    }
    
    if (seriesNumber) {
        const currentSeries = targetItem.fields.series ? targetItem.fields.series.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        if (isRescan) {
             if (targetItem.fields.quantity === 1) {
                fieldsToUpdate.series = seriesNumber;
             } else {
                 return NextResponse.json({ success: false, message: "Quét lại cho mục số lượng lớn chưa được hỗ trợ." }, { status: 400 });
             }
        } else {
            fieldsToUpdate.series = [...currentSeries, seriesNumber].join(', ');
        }
         message = isRescan ? `Đã cập nhật Series ${seriesNumber}.` : `Đã ghi nhận Series ${seriesNumber}.`;
         if (twoDigitDot) message += ` cho DOT ${twoDigitDot}.`
    
    } else if (scanMode === 'dot') {
        if (!twoDigitDot) return NextResponse.json({ success: false, message: 'Không nhận dạng được DOT hợp lệ.' }, { status: 400 });
        message = `Đã ghi nhận DOT ${twoDigitDot} (từ lốp ${fullDotNumber}).`;
    }
    
    if (!isRescan) {
        message += ` (${newCount}/${targetItem.fields.quantity})`;
    }


    const updatePayload = {
        records: [{ id: targetItem.id, fields: fieldsToUpdate }],
        fieldKeyType: "dbFieldName"
    };
    await apiRequest(`${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`, 'PATCH', cookieHeader, updatePayload);
    
    // UPLOAD ATTACHMENT FOR ALL MODES IF IMAGE IS PRESENT
    if (imageDataUri && targetItem) {
        await uploadAttachment(targetItem.id, imageDataUri, cookieHeader);
    }
    
    if (!isRescan) {
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
