"use client";

import { ArrowUpDown, MoreHorizontal, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

// Helper to format currency (LKR)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Reusable component for sortable column headers
const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-2 h-1 w-1 text-gray-700 opacity-60" />
    </Button>
  );
};

export const columns = [
  // 1. Select Checkbox
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // 2. Member Identity (Name + ID + Avatar)
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Member Name" />
    ),
    cell: ({ row }) => {
      const member = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {/* Optional: Add member photo URL if available later */}
            <AvatarImage src="" alt={member.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{member.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="font-mono bg-gray-100 px-1 rounded">
                {member.member_id}
              </span>
            </div>
          </div>
        </div>
      );
    },
  },

  // 3. Sanda Configuration (Frequency + Amount)
  {
    accessorKey: "payment_frequency",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sanda Plan" />
    ),
    cell: ({ row }) => {
      const freq = row.original.payment_frequency;
      const amount = row.original.amount_per_cycle;

      return (
        <div className="flex flex-col">
          <span className="font-medium">{freq}</span>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(amount)} / cycle
          </span>
        </div>
      );
    },
  },

  // 4. Contact Info
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-3 w-3" />
          {row.getValue("contact")}
        </div>
      );
    },
  },

  // 5. Status (Active, Deceased, Moved, etc.)
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      
      // Determine badge color based on status
      let variant = "secondary";
      if (status === "active") variant = "default"; // Black/Primary
      if (status === "inactive") variant = "secondary"; // Gray
      if (status === "deceased") variant = "destructive"; // Red
      if (status === "moved") variant = "outline"; // White/Border

      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },

  // 6. Actions
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            
            <Link href={`/members/${member.id}`} passHref>
              <DropdownMenuItem>View Profile</DropdownMenuItem>
            </Link>
            
            <Link href={`/members/${member.id}/edit`} passHref>
              <DropdownMenuItem>Edit Details</DropdownMenuItem>
            </Link>
            
            <Link href={`/billing/create?member_id=${member.id}`} passHref>
              <DropdownMenuItem>Record Payment</DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="text-red-500">
              Deactivate / Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];