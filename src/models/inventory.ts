
export type RecordItem = {
  id: string;
  name: string;
  fields: { [key: string]: any };
};

export type DashboardData = {
  imports: RecordItem[];
  exports: RecordItem[];
  warranties: RecordItem[];
};

export type InventoryItemDetail = {
    dot: string;
    quantity: number;
    series?: string;
    reason?: string;
};

export type InventoryItem = {
    id: string;
    type: "Import" | "Export" | "Warranty";
    name: string;
    quantity: number;
    date: string;
    details: InventoryItemDetail[];
};
