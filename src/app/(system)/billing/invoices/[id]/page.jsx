"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { accountingService } from "@/services/accountingService";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Printer, ArrowLeft, Download, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ViewInvoicePage() {
    const { id } = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const data = await accountingService.getInvoiceById(id);
                setInvoice(data);
            } catch (error) {
                console.error("Failed to fetch invoice", error);
                toast.error("Failed to load invoice details");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchInvoice();
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold text-slate-900">Invoice Not Found</h2>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 print:p-0 print:bg-white">
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between print:hidden">
                    <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Invoices
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint} className="gap-2">
                            <Printer className="h-4 w-4" /> Print
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                </div>

                {/* Invoice Card */}
                <Card className="overflow-hidden border-slate-200 shadow-sm print:shadow-none print:border-none">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-8 print:bg-white print:p-0 print:pb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">INVOICE</h1>
                                <p className="text-sm text-slate-500">#{invoice.invoiceNo}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="font-bold text-slate-900">Al-Manar Grand Mosque</h2>
                                <p className="text-sm text-slate-500">123 Main Street, Kandy</p>
                                <p className="text-sm text-slate-500">+94 77 123 4567</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 print:p-0 print:pt-4">
                        {/* Bill To & Details */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Bill To</h3>
                                <p className="font-bold text-slate-900">{invoice.member.name}</p>
                                <p className="text-sm text-slate-600">{invoice.member.address || "No Address Provided"}</p>
                                <p className="text-sm text-slate-600">{invoice.member.contact}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Invoice Date:</span>
                                    <span className="text-sm font-medium text-slate-900">{format(new Date(invoice.createdAt), "MMM dd, yyyy")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Due Date:</span>
                                    <span className="text-sm font-medium text-slate-900">{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Status:</span>
                                    <Badge variant="outline" className={
                                        invoice.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                        invoice.status === "overdue" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                        "bg-amber-50 text-amber-700 border-amber-200"
                                    }>
                                        {invoice.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="mb-8">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 text-left font-semibold text-slate-900">Description</th>
                                        <th className="py-3 text-right font-semibold text-slate-900">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="py-4 text-slate-700">
                                            Monthly Subscription (Sanda) - {format(new Date(invoice.period + "-01"), "MMMM yyyy")}
                                        </td>
                                        <td className="py-4 text-right font-medium text-slate-900">
                                            Rs. {invoice.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mb-8">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-medium text-slate-900">Rs. {invoice.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Paid Amount</span>
                                    <span className="font-medium text-emerald-600">- Rs. {invoice.paidAmount.toLocaleString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-base font-bold">
                                    <span className="text-slate-900">Balance Due</span>
                                    <span className="text-slate-900">Rs. {(invoice.amount - invoice.paidAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment History */}
                        {invoice.payments && invoice.payments.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-100 print:hidden">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Payment History</h3>
                                <div className="space-y-3">
                                    {invoice.payments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <span className="text-xs font-bold">P</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">Payment Received</p>
                                                    <p className="text-xs text-slate-500">{format(new Date(payment.date), "MMM dd, yyyy • hh:mm a")}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900">Rs. {payment.amount.toLocaleString()}</p>
                                                <p className="text-xs text-slate-500">{payment.method}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-12 text-center text-xs text-slate-400 print:mt-auto print:pt-8">
                            <p>Thank you for your contribution. May Allah accept your deeds.</p>
                            <p className="mt-1">This is a computer-generated invoice.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
