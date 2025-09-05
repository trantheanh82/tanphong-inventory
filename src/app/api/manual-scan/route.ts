
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ENDPOINT = process.env.API_ENDPOINT;

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

async function updateNoteStatusIfCompleted(noteType: 'import' | 'export', noteId: string, cookieHeader: string | null) {
    const { IMPORT_TBL_ID, EXPORT_TBL_ID, IMPORT_DETAIL_TBL_ID, EXPORT_DETAIL_TBL_ID } = process.env;
    
    const detailTableId = noteType === 'import' ? IMPORT_DETAIL_TBL_ID : EXPORT_DETAIL_TBL_ID;
    const noteTableId = noteType === 'import' ? IMPORT_TBL_ID : EXPORT_TBL_ID;
    const noteLinkField = noteType === 'import' ? 'import_note' : 'export_note';

    if (!detailTableId || !noteTableId) return;

    const allDetailsResponse = await fetchNoteDetails(detailTableId, noteId, noteLinkField, cookieHeader);
    const allDetails = allDetailsResponse.records;

    if (!allDetails || allDetails.length === 0) return;

    const allScanned = allDetails.every((item: any) => (item.fields.scanned || 0) >= item.fields.quantity);

    if (allScanned) {
        const updatePayload = {
            records: [{ id: noteId, fields: { status: 'Đã scan đủ' } }],
            fieldKeyType: 'dbFieldName',
        };
        const updateUrl = `${API_ENDPOINT}/table/${noteTableId}/record`;
        await apiRequest(updateUrl, 'PATCH', cookieHeader, updatePayload);
    }
}


export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { noteId, noteType, valueToScan } = await request.json();

    if (!noteId || !noteType || !valueToScan) {
        return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }
    
    if (!/^\d{2}$/.test(valueToScan)) {
         return NextResponse.json({ success: false, message: "DOT phải là 2 chữ số." }, { status: 400 });
    }

    const { IMPORT_DETAIL_TBL_ID, EXPORT_DETAIL_TBL_ID } = process.env;

    let detailTableId: string | undefined;
    let noteLinkField: string | undefined;
    let dotField: string | undefined;

    switch (noteType) {
        case 'import':
            detailTableId = IMPORT_DETAIL_TBL_ID;
            noteLinkField = 'import_note';
            dotField = 'dot';
            break;
        case 'export':
            detailTableId = EXPORT_DETAIL_TBL_ID;
            noteLinkField = 'export_note';
            dotField = 'dot';
            break;
        case 'warranty':
            return NextResponse.json({ message: 'Warranty scanning not yet implemented.' }, { status: 400 });
        default:
            return NextResponse.json({ message: 'Invalid note type.' }, { status: 400 });
    }

    if (!detailTableId || !noteLinkField || !dotField) {
        return NextResponse.json({ message: 'Server configuration error for the given note type.' }, { status: 500 });
    }

    try {
        const detailsResponse = await fetchNoteDetails(detailTableId, noteId, noteLinkField, cookieHeader);
        const details = detailsResponse.records;

        if (!details || details.length === 0) {
            return NextResponse.json({ message: 'Could not find details for this note.' }, { status: 404 });
        }

        const targetItem = details.find((item: any) => String(item.fields[dotField!]) === valueToScan);

        if (!targetItem) {
            return NextResponse.json({ success: false, message: `DOT ${valueToScan} không có trong phiếu nhận.` }, { status: 404 });
        }

        const currentScanned = targetItem.fields.scanned || 0;
        const totalQuantity = targetItem.fields.quantity;

        if (currentScanned >= totalQuantity) {
            return NextResponse.json({ 
                success: true, 
                message: `Đã quét đủ số lượng cho DOT ${valueToScan}.`,
                scanned: currentScanned,
                total: totalQuantity,
                dot: valueToScan,
                isCompleted: true
            });
        }

        const newScannedCount = currentScanned + 1;
        const isItemCompleted = newScannedCount >= totalQuantity;

        const fieldsToUpdate: { scanned: number, status?: string } = { scanned: newScannedCount };
        if (isItemCompleted) {
            fieldsToUpdate.status = 'Đã scan đủ';
        }

        const updatePayload = {
            records: [{
                id: targetItem.id,
                fields: fieldsToUpdate,
            }],
            fieldKeyType: "dbFieldName"
        };
        const updateUrl = `${API_ENDPOINT}/table/${detailTableId}/record`;

        await apiRequest(updateUrl, 'PATCH', cookieHeader, updatePayload);

        if (isItemCompleted) {
            // Check if the whole note is completed
            await updateNoteStatusIfCompleted(noteType, noteId, cookieHeader);
        }
        
        let overallMessage = `Đã ghi nhận DOT ${valueToScan} (${newScannedCount}/${totalQuantity})`;
        if (isItemCompleted) {
            overallMessage = `Bạn đã quét đủ số lượng cho DOT ${valueToScan} (${newScannedCount}/${totalQuantity})`;
        }

        return NextResponse.json({
            success: true,
            message: overallMessage,
            scanned: newScannedCount,
            total: totalQuantity,
            dot: valueToScan,
            isCompleted: newScannedCount === totalQuantity,
        });

    } catch (error: any) {
        console.error('Error processing scan:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
