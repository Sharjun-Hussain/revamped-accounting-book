"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { accountingService } from "@/services/accountingService";

export const ExpenseBulkActions = ({ table, onSuccess }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const numSelected = selectedRows.length;

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${numSelected} expenses? This action cannot be undone.`)) {
      return;
    }

    const ids = selectedRows.map((row) => row.original.id);

    try {
      await accountingService.deleteExpenses(ids);
      toast.success(`Successfully deleted ${numSelected} expenses`);
      table.resetRowSelection();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to delete expenses:", error);
      toast.error("Failed to delete expenses");
    }
  };

  if (numSelected === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          Bulk Actions ({numSelected})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDelete} className="text-rose-600 focus:text-rose-700 focus:bg-rose-50">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
