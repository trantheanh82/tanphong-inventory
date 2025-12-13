
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ENDPOINT = process.env.API_ENDPOINT;
const EXPORT_TBL_ID = process.env.EXPORT_TBL_ID;
const EXPORT_DETAIL_TBL_ID = process.env.EXPORT_DETAIL_TBL_ID;

interface Tire {
    dot?: string;
    quantity: number;
}

interface ExportNoteRequestBody {
    name: string;
    customer?: string;
    dotTires: Tire[];
    seriesTires: { quantity: number }[];
    dotSeriesTires: Tire[];
}


async function apiRequest(url: string, method: string, body: any, cookieHeader: string | null) {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
            errorMessage = await response.text();
        }
        console.error(`API Error: ${errorMessage}`);
        throw new Error(errorMessage);
    }

    return response.json();
}

export async function POST(request: NextRequest) {
    if (!API_ENDPOINT || !EXPORT_TBL_ID || !EXPORT_DETAIL_TBL_ID) {
        return NextResponse.json({ message: 'Environment variables for API endpoint and table IDs are not set.' }, { status: 500 });
    }

    const cookieHeader = (await cookies()).toString();

    try {
        const { name, customer, dotTires, seriesTires, dotSeriesTires }: ExportNoteRequestBody = await request.json();

        if (!name) {
            return NextResponse.json({ message: 'Invalid request body. Name is required.' }, { status: 400 });
        }
        
        const totalQuantity = 
            dotTires.reduce((sum, tire) => sum + tire.quantity, 0) +
            seriesTires.reduce((sum, tire) => sum + tire.quantity, 0) +
            dotSeriesTires.reduce((sum, tire) => sum + tire.quantity, 0);

        if (totalQuantity === 0) {
            return NextResponse.json({ message: 'At least one tire must be added to the export note.' }, { status: 400 });
        }


        // 1. Create Export Note
        const createNotePayload = {
            records: [{ fields: { name: name, customer: customer, total_quantity: totalQuantity } }],
            fieldKeyType: "dbFieldName"
        };
        const createNoteUrl = `${API_ENDPOINT}/table/${EXPORT_TBL_ID}/record`;
        
        const noteResponse = await apiRequest(createNoteUrl, 'POST', createNotePayload, cookieHeader);
        
        const noteRecord = noteResponse.records?.[0];
        if (!noteRecord || !noteRecord.id) {
            throw new Error('Failed to create export note or get its ID.');
        }
        const exportNoteId = noteRecord.id;

        // 2. Prepare Export Note Details
        const detailRecords: any[] = [];

        dotTires.forEach(tire => {
            detailRecords.push({
                fields: {
                    export_note: { id: exportNoteId },
                    dot: parseInt(tire.dot!, 10),
                    quantity: tire.quantity,
                    tire_type: 'Nội địa'
                }
            });
        });

        seriesTires.forEach(tire => {
            for (let i = 0; i < tire.quantity; i++) {
                detailRecords.push({
                    fields: {
                        export_note: { id: exportNoteId },
                        quantity: 1,
                        tire_type: 'Nước ngoài'
                    }
                });
            }
        });
        
        dotSeriesTires.forEach(tire => {
            for (let i = 0; i < tire.quantity; i++) {
                detailRecords.push({
                    fields: {
                        export_note: { id: exportNoteId },
                        dot: parseInt(tire.dot!, 10),
                        quantity: 1,
                        tire_type: 'Nước ngoài',
                        has_dot: true,
                    }
                });
            }
        });

        // 3. Create Export Note Details in a single batch
        if (detailRecords.length > 0) {
            const createDetailsPayload = { 
                records: detailRecords,
                fieldKeyType: "dbFieldName"
            };
            const createDetailsUrl = `${API_ENDPOINT}/table/${EXPORT_DETAIL_TBL_ID}/record`;
            await apiRequest(createDetailsUrl, 'POST', createDetailsPayload, cookieHeader);
        }

        // 4. Return success with the export note ID
        return NextResponse.json({ success: true, exportNoteId: exportNoteId }, { status: 200 });

    } catch (error: any) {
        console.error('Error creating export note:', error);
        const message = error.message || 'An internal server error occurred.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
