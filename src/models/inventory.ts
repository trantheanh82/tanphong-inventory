
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

export type ImportNote = {
  fields: {
    name: string;
    status: string;
    total_quantity: number;
    import_detail: {
      id: string;
      title: string;
    }[];
    createdAt: string;
    total_import_note: string;
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
};

export type ImportNoteDetail = {
  fields: {
    name: string;
    Phieu_nhap: {
      id: string;
      title: string;
    };
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
};
