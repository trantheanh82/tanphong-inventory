
export type NoteDetailRecord = {
    id: string;
    name: string;
    fields: {
        dot?: string;
        quantity: number;
        scanned?: number;
        series?: string;
        reason?: string;
    };
    createdTime: string;
};
