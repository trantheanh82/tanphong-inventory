
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { recognizeSeriesNumber } from '@/ai/flows/warranty-scan-flow';

const API_ENDPOINT = process.env.API_ENDPOINT;
const EXPORT_DETAIL_TBL_ID = process.env.EXPORT_DETAIL_TBL_ID;

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

async function findExportDetailRecord(noteId: string, dot: string, cookieHeader: string | null) {
    if (!API_ENDPOINT || !EXPORT_DETAIL_TBL_ID) {
        throw new Error('Environment variables for API endpoint and table IDs are not set.');
    }

    const filterObject = {
        conjunction: 'and',
        filterSet: [
            { fieldId: 'export_note', operator: 'is', value: noteId },
            { fieldId: 'dot', operator: 'is', value: parseInt(dot, 10) }
        ],
    };
    const filterQuery = encodeURIComponent(JSON.stringify(filterObject));
    const url = `${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record?filter=${filterQuery}&fieldKeyType=dbFieldName&take=1`;
    
    const response = await apiRequest(url, 'GET', cookieHeader);
    return response.records?.[0];
}


export async function POST(request: NextRequest) {
    const cookieHeader = cookies().toString();
    const { noteId, dot, imageDataUri } = await request.json();

    if (!noteId || !dot || !imageDataUri) {
        return NextResponse.json({ message: 'Missing required parameters.' }, { status: 400 });
    }

    // Step 1: Recognize Series Number from image
    let seriesNumber: string | undefined;
    try {
        seriesNumber = await recognizeSeriesNumber(imageDataUri);
    } catch (aiError) {
        console.error("AI recognition error:", aiError);
        return NextResponse.json({ success: false, message: 'AI processing failed. Please try again.' }, { status: 500 });
    }
    
    if (!seriesNumber) {
        return NextResponse.json({ success: false, message: "Không nhận dạng được series. Vui lòng thử lại." }, { status: 400 });
    }

    if (!EXPORT_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Server configuration error for export detail table.' }, { status: 500 });
    }

    try {
        const targetItem = await findExportDetailRecord(noteId, dot, cookieHeader);

        if (!targetItem) {
            return NextResponse.json({ success: false, message: `DOT ${dot} không có trong phiếu xuất.` }, { status: 404 });
        }

        const currentScanned = targetItem.fields.scanned || 0;
        const totalQuantity = targetItem.fields.quantity;

        if (currentScanned >= totalQuantity) {
            return NextResponse.json({ 
                success: true,
                warning: true,
                message: `Đã quét đủ số lượng cho DOT ${dot}.`,
            });
        }
        
        const newScannedCount = currentScanned + 1;
        
        // This is a simplified approach. A robust system would create a new detail record for each unique series.
        // For now, we update the existing record with the series and increment the scan count.
        const updatePayload = {
            record: {
                fields: { 
                    scanned: newScannedCount,
                    series: targetItem.fields.series ? `${targetItem.fields.series}, ${seriesNumber}` : seriesNumber
                },
            },
            fieldKeyType: "dbFieldName"
        };
        const updateUrl = `${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record/${targetItem.id}`;

        await apiRequest(updateUrl, 'PATCH', cookieHeader, updatePayload);

        const isCompleted = newScannedCount === totalQuantity;
        let overallMessage = `Đã ghi nhận Series ${seriesNumber} cho DOT ${dot}.`;
        if (isCompleted) {
            overallMessage = `Bạn đã quét đủ số lượng cho DOT ${dot}.`;
        }

        return NextResponse.json({
            success: true,
            message: overallMessage,
            dot: dot,
            series: seriesNumber,
            isCompleted: isCompleted,
        });

    } catch (error: any) {
        console.error('Error processing series scan:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
