
export type NoteDetailRecord = {
    id: string;
    name: string;
    fields: {
        DOT?: string;
        dot?: string;
        quantity: number;
        scanned?: number;
        series?: string;
        reason?: string;
    };
    createdTime: string;
};
