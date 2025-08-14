import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const inventoryItems = [
    { id: "IMP-0128", type: "Import", name: "Lốp Michelin 205/55R16", quantity: 50, date: "2023-10-26" },
    { id: "EXP-0075", type: "Export", name: "Lốp Bridgestone 185/65R15", quantity: -20, date: "2023-10-25" },
    { id: "IMP-0127", type: "Import", name: "Lốp Goodyear 225/45R17", quantity: 30, date: "2023-10-24" },
    { id: "EXP-0074", type: "Export", name: "Lốp Michelin 205/55R16", quantity: -15, date: "2023-10-23" },
    { id: "IMP-0126", type: "Import", name: "Lốp Pirelli 245/40R18", quantity: 40, date: "2023-10-22" },
    { id: "IMP-0125", type: "Import", name: "Lốp Continental 215/60R16", quantity: 60, date: "2023-10-21" },
    { id: "EXP-0073", type: "Export", name: "Lốp Goodyear 225/45R17", quantity: -10, date: "2023-10-20" },
];

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in-0 duration-500">
      <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">A comprehensive list of all tire movements.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[120px] text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Tên phiếu (Tire Name)</TableHead>
                <TableHead className="text-right text-muted-foreground">Số lượng (Quantity)</TableHead>
                <TableHead className="w-[150px] text-muted-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === "Import" ? "default" : "secondary"}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
