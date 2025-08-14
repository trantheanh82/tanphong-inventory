import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowDown, ArrowUp, DollarSign, Package } from "lucide-react";

const summaryData = [
    { title: "Total Tires", value: "12,450", icon: Package, change: "+2.5%" },
    { title: "Total Imports", value: "1,230", icon: ArrowUp, change: "+10.1%" },
    { title: "Total Exports", value: "890", icon: ArrowDown, change: "-3.2%" },
    { title: "Stock Value", value: "$2.1M", icon: DollarSign, change: "+5.0%" },
];

const recentActivities = [
    { id: "IMP-0128", type: "Import", name: "Lốp Michelin 205/55R16", quantity: 50, date: "2023-10-26" },
    { id: "EXP-0075", type: "Export", name: "Lốp Bridgestone 185/65R15", quantity: 20, date: "2023-10-25" },
    { id: "IMP-0127", type: "Import", name: "Lốp Goodyear 225/45R17", quantity: 30, date: "2023-10-24" },
    { id: "EXP-0074", type: "Export", name: "Lốp Michelin 205/55R16", quantity: 15, date: "2023-10-23" },
    { id: "IMP-0126", type: "Import", name: "Lốp Pirelli 245/40R18", quantity: 40, date: "2023-10-22" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in-0 duration-500">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item) => (
            <Card key={item.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{item.value}</div>
                    <p className="text-xs text-muted-foreground">
                        {item.change} from last month
                    </p>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
            </CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tên phiếu</TableHead>
                        <TableHead className="text-right">Số lượng</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentActivities.map((activity) => (
                        <TableRow key={activity.id}>
                            <TableCell className="font-medium">{activity.id}</TableCell>
                            <TableCell>
                                <Badge variant={activity.type === "Import" ? "default" : "secondary"}>
                                    {activity.type}
                                </Badge>
                            </TableCell>
                            <TableCell>{activity.name}</TableCell>
                            <TableCell className="text-right">{activity.quantity}</TableCell>
                            <TableCell className="text-muted-foreground">{activity.date}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
