"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { accountingService } from "@/services/accountingService";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Coins } from "lucide-react";
import { AccountingSkeleton } from "@/components/accounting/AccountingSkeleton";

// Schema
const incomeSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
});

export default function OtherIncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  const form = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      description: "",
      amount: "",
      categoryId: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incomeData, categoryData] = await Promise.all([
        accountingService.getOtherIncomes(),
        accountingService.getCategories(),
      ]);
      setIncomes(incomeData);
      setCategories(categoryData);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (editingIncome) {
        await accountingService.updateOtherIncome(editingIncome.id, data);
        toast.success("Income updated successfully");
      } else {
        await accountingService.createOtherIncome(data);
        toast.success("Income recorded successfully");
      }
      setIsDialogOpen(false);
      setEditingIncome(null);
      form.reset();
      fetchData();
    } catch (error) {
      console.error("Failed to save income", error);
      toast.error("Failed to save income");
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    form.reset({
      description: income.description || "",
      amount: income.amount.toString(),
      categoryId: income.categoryId,
      date: format(new Date(income.date), "yyyy-MM-dd"),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        await accountingService.deleteOtherIncome(id);
        toast.success("Record deleted");
        fetchData();
      } catch (error) {
        console.error("Failed to delete", error);
        toast.error("Failed to delete record");
      }
    }
  };

  const handleAddNew = () => {
    setEditingIncome(null);
    form.reset({
      description: "",
      amount: "",
      categoryId: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <AccountingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Coins className="h-8 w-8 text-emerald-600" />
              Other Income
            </h1>
            <p className="text-slate-500">Manage rents, land income, and other revenue sources.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4" /> Record Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingIncome ? "Edit Income" : "Record New Income"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description / Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Shop Rent - Jan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (LKR)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {editingIncome ? "Update Record" : "Save Record"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : incomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    No income records found.
                  </TableCell>
                </TableRow>
              ) : (
                incomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>{format(new Date(income.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-medium text-slate-900">{income.description}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {income.category?.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      Rs. {income.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-emerald-600"
                          onClick={() => handleEdit(income)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-rose-600"
                          onClick={() => handleDelete(income.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
