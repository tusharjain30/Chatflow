import { useEffect, useMemo, useState } from "react";

import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Download,
  Eye,
  DollarSign,
  Building2,
  CreditCard,
  Users,
} from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type InvoiceItem = {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  customerName: string;
  resellerId: string | null;
  resellerName: string;
  planName: string;
  amount: number;
  currency: string;
  commissionRate: number;
  commissionAmount: number;
  issuedAt: string;
  endDate: string | null;
  status: "PAID" | "ARCHIVED";
};

type ResellerOption = {
  id: string;
  companyName: string;
};

type CustomerOption = {
  id: string;
  companyName: string;
  resellerId?: string | null;
};

const statusStyles = {
  PAID: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-700",
};

export default function PaymentHistory() {
  const { toast } = useToast();
  const token = localStorage.getItem("auth_token");

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [resellers, setResellers] = useState<ResellerOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resellerFilter, setResellerFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const visibleCustomers = useMemo(() => {
    if (resellerFilter === "all") return customers;
    return customers.filter((customer) => customer.resellerId === resellerFilter);
  }, [customers, resellerFilter]);

  const fetchInvoices = async (
    nextSearch = searchQuery,
    nextStatus = statusFilter,
    nextReseller = resellerFilter,
    nextCustomer = customerFilter,
  ) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "50");
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextReseller !== "all") params.set("resellerId", nextReseller);
    if (nextCustomer !== "all") params.set("customerId", nextCustomer);

    const response = await fetch(
      `${API_BASE}/super-admin/invoices/list?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const json = await response.json();

    if (!response.ok || json.status !== 1) {
      throw new Error(json.message || "Unable to load invoices");
    }

    setItems(json.data.items || []);
    setResellers(json.data.filters?.resellers || []);
    setCustomers(json.data.filters?.customers || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchInvoices();
      } catch (error) {
        toast({
          title: "Unable to load invoices",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(
    () => ({
      totalRevenue: items.reduce((acc, item) => acc + item.amount, 0),
      totalInvoices: items.length,
      uniqueResellers: new Set(items.map((item) => item.resellerId).filter(Boolean)).size,
      uniqueCustomers: new Set(items.map((item) => item.customerId).filter(Boolean)).size,
    }),
    [items],
  );

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      await fetchInvoices();
    } catch (error) {
      toast({
        title: "Unable to refresh invoices",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildDownloadUrl = (invoiceId?: string) => {
    if (invoiceId) {
      return `${API_BASE}/super-admin/invoices/download/${invoiceId}`;
    }

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (resellerFilter !== "all") params.set("resellerId", resellerFilter);
    if (customerFilter !== "all") params.set("customerId", customerFilter);
    return `${API_BASE}/super-admin/invoices/download?${params.toString()}`;
  };

  const downloadWithAuth = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleBulkDownload = () =>
    downloadWithAuth(buildDownloadUrl(), `global-invoices-${Date.now()}.csv`);

  const handleSingleDownload = (invoice: InvoiceItem) =>
    downloadWithAuth(buildDownloadUrl(invoice.id), `${invoice.invoiceNumber}.txt`);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invoice Management</h1>
            <p className="text-muted-foreground">
              View all invoices globally and filter by reseller or customer.
            </p>
          </div>
          <Button variant="outline" onClick={handleBulkDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Invoice Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                INR {stats.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Resellers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueResellers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueCustomers}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col xl:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice, reseller, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full xl:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={resellerFilter}
            onValueChange={(value) => {
              setResellerFilter(value);
              setCustomerFilter("all");
            }}
          >
            <SelectTrigger className="w-full xl:w-[220px]">
              <SelectValue placeholder="Reseller" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resellers</SelectItem>
              {resellers.map((reseller) => (
                <SelectItem key={reseller.id} value={reseller.id}>
                  {reseller.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-full xl:w-[220px]">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {visibleCustomers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleApplyFilters}>Apply</Button>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Reseller</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.resellerName}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{invoice.planName}</TableCell>
                  <TableCell className="font-medium">
                    {invoice.currency} {invoice.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusStyles[invoice.status]}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.issuedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSingleDownload(invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!loading && items.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No invoices found for the current filters.
            </div>
          ) : null}
        </div>

        <Modal
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          title="Invoice Details"
        >
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-mono">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusStyles[selectedInvoice.status]}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reseller</p>
                  <p>{selectedInvoice.resellerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p>{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p>{selectedInvoice.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold">
                    {selectedInvoice.currency} {selectedInvoice.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commission</p>
                  <p>
                    {selectedInvoice.commissionRate}% • {selectedInvoice.currency}{" "}
                    {selectedInvoice.commissionAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issued At</p>
                  <p>{new Date(selectedInvoice.issuedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleSingleDownload(selectedInvoice)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
