"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  ChartPie,
  Frame,
  Settings2,
  Users,
  LayoutDashboard,
  Receipt,
  HandCoins,
  Wallet,
  FileText,
  AlertCircle,
  ShieldCheck,
  Landmark,
  CreditCard,
  Tags,
  MessageSquare,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";

export function AppSidebar({ ...props }) {
  const { data: session } = useSession();
  const [branding, setBranding] = React.useState({
    name: "Masjid Admin",
    logo: Landmark, // Default icon
  });

  React.useEffect(() => {
    fetch('/api/settings/app')
      .then(res => res.json())
      .then(data => {
        if (data.mosqueName) {
          setBranding({
            name: data.mosqueName,
            logo: data.logo ? () => <img src={data.logo} alt="Logo" className="h-8 w-8 object-contain rounded-md" /> : Landmark
          });
        }
      })
      .catch(err => console.error("Failed to load branding", err));
  }, []);

  const data = {
    user: {
      name: session?.user?.name,
      email: session?.user?.email,
      avatar: session?.user?.image,
    },
    teams: [
      {
        name: branding.name,
        logo: branding.logo,
        plan: "Accounting",
      },
    ],
    // Collapsible Sections
    navMain: [
      {
        title: "Sanda Management",
        url: "#",
        icon: CreditCard,
        items: [
          {
            title: "Collect Payment", // Quick link to record a payment
            url: "/billing/create",
          },
          {
            title: "Bulk Collection",
            url: "/billing/bulk-collection",
          },
          {
            title: "Payment History",
            url: "/billing/history",
          },
          {
            title: "Monthly Bills", // Generated bills view
            url: "/billing/invoices",
          },
          {
            title: "Outstanding / Arrears", // Who hasn't paid
            url: "/billing/outstanding",
          },
        ],
      },
      {
        title: "Accounting",
        url: "#",
        icon: Wallet,
        items: [
          {
            title: "Expenses",
            url: "/accounting/expenses",
          },
          {
            title: "Income & Expense Categories", // Building Fund, Iftar Fund, Electricity, Salary, Maintenance
            url: "/accounting/categories",
            icon: Tags,
          },
          {
            title: "Income Summary",
            url: "/accounting/income",
          },
          {
            title: "Other Income",
            url: "/accounting/other-income",
          },
          {
            title: "Bank Accounts", // Optional: If managing bank deposits
            url: "/accounting/bank",
          },
        ],
      },
    ],
    // Flat Lists for High-Frequency Access
    Core: [
      {
        name: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Members Registry",
        url: "/members",
        icon: Users,
      },
    ],
    Donations: [
      {
        name: "Donations List",
        url: "/donations",
        icon: HandCoins,
      },
      {
        name: "Donors",
        url: "/donations/donors",
        icon: Bot,
      },
    ],
    Reports: [
      {
        name: "Financial Reports", // Income vs Expense
        url: "/reports/financial",
        icon: ChartPie,
      },
      {
        name: "Member Statements",
        url: "/reports/members",
        icon: FileText,
      },
      {
        name: "Audit Logs",
        url: "/audit-logs",
        icon: ShieldCheck,
      },
    ],
    Communication: [
      {
        name: "Text.lk SMS",
        url: "/sms",
        icon: MessageSquare,
      },
    ],
    Settings: [
      {
        name: "System Settings",
        url: "/settings",
        icon: Settings2,
      },
      // {
      //   name: "User Roles (RBAC)",
      //   url: "/users",
      //   icon: Frame,
      // },
    ],
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.Core} label="Overview" />

        <NavMain items={data.navMain} />

        <NavProjects projects={data.Donations} label="Donations" />

        <NavProjects projects={data.Reports} label="Reporting" />
        <NavProjects projects={data.Communication} label="Communication" />
        <NavProjects projects={data.Settings} label="Administration" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
