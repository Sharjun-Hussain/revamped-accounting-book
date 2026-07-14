"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api";
import { motion } from "framer-motion";
import {
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  FileText,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Landmark,
  Printer,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parse } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Import Shared PDF Utility
import { generateFinancialPDF } from "@/lib/report-generator";
import { FinancialReportSkeleton } from "@/components/reports/FinancialReportSkeleton";

// --- DATA & THEME ---
const THEME = {
  emerald: "#059669",
  slate: "#0f172a",
  teal: "#14b8a6",
  red: "#ef4444",
  gold: "#f59e0b",
};

// --- MOCK DATA REMOVED ---

export default function FinancialReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  // Generate last 12 months for the dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return format(d, "MMMM yyyy");
  });
  const [reportMonth, setReportMonth] = useState(monthOptions[0]);

  const handleMonthChange = (value) => {
      setReportMonth(value);
      const date = parse(value, "MMMM yyyy", new Date());
      setDateRange({
          from: startOfMonth(date),
          to: endOfMonth(date),
      });
  };
  
  // Data Fetching with SWR
  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from.toISOString());
    if (dateRange?.to) params.append('to', dateRange.to.toISOString());
    return `/accounting/reports/financial?${params.toString()}`;
  }, [dateRange]);

  const { data: reportData, isLoading: loading } = useSWR(swrKey, apiFetcher);
  const { data: appSettings } = useSWR('/settings/app', apiFetcher);


  // Derived Data
  const financialSummary = reportData?.summary || { totalIncome: 0, totalExpense: 0, netSurplus: 0, cashOnHand: 0, bankBalance: 0, pendingBills: 0 };
  const incomeStatementData = reportData?.incomeStatement || { income: [], expenses: [] };
  const balanceSheetData = reportData?.balanceSheet || { assets: [], liabilities: [], equity: [] };
  const monthlyPerformance = reportData?.monthlyPerformance || [];

  const expenseBreakdown = useMemo(() => {
    if (!reportData?.incomeStatement?.expenses) return [];
    return reportData.incomeStatement.expenses.map((e, i) => ({
        name: e.category,
        value: e.amount,
        color: Object.values(THEME)[i % Object.values(THEME).length]
    }));
  }, [reportData]);



  // --- EXPORT HANDLERS ---

  const downloadIncomeStatement = () => {
    const totalIncome = incomeStatementData.income.reduce(
      (a, b) => a + b.amount,
      0
    );
    const totalExpense = incomeStatementData.expenses.reduce(
      (a, b) => a + b.amount,
      0
    );

    generateFinancialPDF({
      title: "Statement of Income & Expenditure",
      period: `${format(dateRange.from, "MMM dd")} - ${format(
        dateRange.to,
        "MMM dd, yyyy"
      )}`,
      tables: [
        {
          title: "Income / Revenue",
          headers: ["Category", "Amount (LKR)"],
          data: incomeStatementData.income.map((i) => [
            i.category,
            i.amount.toLocaleString(),
          ]),
          color: THEME.emerald,
        },
        {
          title: "Operating Expenses",
          headers: ["Category", "Amount (LKR)"],
          data: incomeStatementData.expenses.map((i) => [
            i.category,
            i.amount.toLocaleString(),
          ]),
          color: "#be123c",
        },
      ],
      summary: [
        {
          label: "Total Revenue",
          value: totalIncome.toLocaleString(),
          isBold: false,
        },
        {
          label: "Total Expenses",
          value: `(${totalExpense.toLocaleString()})`,
          isBold: false,
        },
        {
          label: "NET SURPLUS / (DEFICIT)",
          value: (totalIncome - totalExpense).toLocaleString(),
          isBold: true,
        },
      ],
      settings: appSettings,
    });
  };

  const downloadBalanceSheet = () => {
    const totalAssets = balanceSheetData.assets.reduce(
      (a, b) => a + b.value,
      0
    );
    const totalLiab = balanceSheetData.liabilities.reduce(
      (a, b) => a + b.value,
      0
    );
    const totalEquity = balanceSheetData.equity.reduce(
      (a, b) => a + b.value,
      0
    );

    generateFinancialPDF({
      title: "Statement of Financial Position",
      period: `As of ${format(new Date(), "MMMM dd, yyyy")}`,
      tables: [
        {
          title: "Assets",
          headers: ["Item", "Value (LKR)"],
          data: balanceSheetData.assets.map((i) => [
            i.name,
            i.value.toLocaleString(),
          ]),
          color: "#0f172a",
        },
        {
          title: "Liabilities",
          headers: ["Item", "Value (LKR)"],
          data: balanceSheetData.liabilities.map((i) => [
            i.name,
            i.value.toLocaleString(),
          ]),
          color: "#be123c",
        },
        {
          title: "Equity",
          headers: ["Item", "Value (LKR)"],
          data: balanceSheetData.equity.map((i) => [
            i.name,
            i.value.toLocaleString(),
          ]),
          color: THEME.emerald,
        },
      ],
      summary: [
        {
          label: "Total Assets",
          value: totalAssets.toLocaleString(),
          isBold: true,
        },
        {
          label: "Total Liabilities & Equity",
          value: (totalLiab + totalEquity).toLocaleString(),
          isBold: true,
        },
      ],
      settings: appSettings,
    });
  };

  // --- 3. Export Monthly Report (4-Column Ledger Format) ---
  const downloadMonthlyReport = () => {
    // 1. Prepare Data
    let rowCount = 1;
    const tableData = [];
    let totalIncome = 0;
    let totalExpense = 0;

    // Add Income Rows
    incomeStatementData.income.forEach((item) => {
      tableData.push([
        rowCount++,
        item.category,
        item.amount.toLocaleString(),
        "-",
      ]);
      totalIncome += item.amount;
    });

    // Add Expense Rows
    incomeStatementData.expenses.forEach((item) => {
      tableData.push([
        rowCount++,
        item.category,
        "-",
        item.amount.toLocaleString(),
      ]);
      totalExpense += item.amount;
    });

    // Add Final Totals Row (Bold in logic)
    // Note: The report generator will render this as a standard row,
    // but the summary section below handles the Net Result nicely.
    tableData.push([
      "",
      "TOTALS",
      totalIncome.toLocaleString(),
      totalExpense.toLocaleString(),
    ]);

    // 2. Generate PDF
    generateFinancialPDF({
      title: "Monthly Financial Report",
      period: reportMonth,
      tables: [
        {
          title: "Transaction Summary",
          headers: ["No", "Description", "Income (LKR)", "Expense (LKR)"],
          data: tableData,
          color: "#0f172a", // Slate Header for neutral look
        },
      ],
      summary: [
        {
          label: "Total Monthly Income",
          value: totalIncome.toLocaleString(),
          isBold: false,
        },
        {
          label: "Total Monthly Expenses",
          value: `(${totalExpense.toLocaleString()})`,
          isBold: false,
        },
        {
          label: "NET BALANCE CARRIED FORWARD",
          value: (totalIncome - totalExpense).toLocaleString(),
          isBold: true,
        },
      ],
      settings: appSettings,
    });
  };

  if (loading) {
    return <FinancialReportSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col space-y-6 px-6 pb-6 pt-8 max-w-7xl mx-auto"
      >
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <BarChartIcon className="h-8 w-8 text-emerald-600" />
              Financial Reports
            </h1>
            <p className="text-slate-500">
              Analytics, Profit & Loss, and Balance Sheet overview.
            </p>
          </div>

          {/* MONTHLY REPORT CENTER */}
          <div className="flex items-center gap-2 bg-white p-1 pl-3 pr-1 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Monthly Report:
            </span>
            <Select value={reportMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-8 border-none shadow-none w-[160px] focus:ring-0 text-slate-700 font-medium bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <Button
              size="sm"
              className="h-8 text-white rounded-lg shadow-sm"
              onClick={downloadMonthlyReport}
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print PDF
            </Button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <Tabs
          defaultValue="dashboard"
          className="space-y-6"
          onValueChange={setActiveTab}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="">
              <TabsTrigger
                value="dashboard"
                className=" py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
              >
                <PieChartIcon className="w-4 h-4 mr-2" /> Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="statement"
                className=" py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
              >
                <FileText className="w-4 h-4 mr-2" /> Income Statement
              </TabsTrigger>
              <TabsTrigger
                value="balance"
                className=" py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
              >
                <Landmark className="w-4 h-4 mr-2" /> Balance Sheet
              </TabsTrigger>
            </TabsList>

            {/* Contextual Action Button */}
            {activeTab !== "dashboard" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button
                  variant="outline"
                  className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm"
                  onClick={
                    activeTab === "statement"
                      ? downloadIncomeStatement
                      : downloadBalanceSheet
                  }
                >
                  <Download className="w-4 h-4 mr-2" /> Download Report
                </Button>
              </motion.div>
            )}
          </div>

          {/* --- TAB 1: DASHBOARD --- */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Date Filter for Dashboard */}
            <div className="flex justify-end">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal bg-white border-slate-200"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "MMM dd")} -{" "}
                    {format(dateRange.to, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Net Surplus"
                value={financialSummary.netSurplus}
                trend="up"
                change="Net Profit"
                icon={TrendingUp}
                bg="bg-emerald-100"
                color="text-emerald-600"
                index={0}
              />
              <MetricCard
                title="Total Income"
                value={financialSummary.totalIncome}
                trend="neutral"
                icon={DollarSign}
                bg="bg-blue-100"
                color="text-blue-600"
                index={1}
              />
              <MetricCard
                title="Total Expense"
                value={financialSummary.totalExpense}
                trend="down"
                change="Outflow"
                icon={TrendingDown}
                bg="bg-rose-100"
                color="text-rose-600"
                index={2}
              />
              <MetricCard
                title="Cash on Hand"
                value={financialSummary.cashOnHand}
                trend="neutral"
                icon={Landmark}
                bg="bg-amber-100"
                color="text-amber-600"
                index={3}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    Financial Performance
                  </h3>
                  <p className="text-sm text-slate-500">Income vs Expense over time</p>
                </div>
                <div className="p-6 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyPerformance}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorIncome"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={THEME.emerald}
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor={THEME.emerald}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={THEME.red}
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor={THEME.red}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickFormatter={(value) => `Rs ${value / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value) => [`Rs. ${value.toLocaleString()}`]}
                      />
                      <Area
                        type="monotone"
                        dataKey="Income"
                        stroke={THEME.emerald}
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Expense"
                        stroke={THEME.red}
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    Expense Allocation
                  </h3>
                  <p className="text-sm text-slate-500">Breakdown by category</p>
                </div>
                <div className="p-6 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            strokeWidth={0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value) => [`Rs. ${value.toLocaleString()}`]}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* --- TAB 2: INCOME STATEMENT --- */}
          <TabsContent value="statement">
            <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    Statement of Income & Expenditure
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-white px-3 py-1 text-slate-600 font-normal"
                  >
                    {format(dateRange.from, "MMM yyyy")} -{" "}
                    {format(dateRange.to, "MMM yyyy")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 md:p-8 space-y-8">
                  {/* Revenue */}
                  <div>
                    <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3 border-b border-emerald-100 pb-2">
                      Revenue
                    </h3>
                    <div className="space-y-3">
                      {incomeStatementData.income.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-600">
                            {item.category}
                          </span>
                          <span className="font-medium text-slate-900">
                            {item.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider mb-3 border-b border-rose-100 pb-2">
                      Expenses
                    </h3>
                    <div className="space-y-3">
                      {incomeStatementData.expenses.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-600">
                            {item.category}
                          </span>
                          <span className="font-medium text-slate-900">
                            ({item.amount.toLocaleString()})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Net */}
                  <div className="flex justify-between items-center pt-6 border-t-2 border-slate-100">
                    <span className="text-lg font-bold text-slate-900">
                      Net Surplus
                    </span>
                    <span className="text-xl font-bold text-emerald-600">
                      Rs. {financialSummary.netSurplus.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- TAB 3: BALANCE SHEET --- */}
          <TabsContent value="balance">
            <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg">Balance Sheet</CardTitle>
                <CardDescription>
                  As of {format(dateRange.to, "MMMM dd, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Assets */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                      Assets
                    </h3>
                    {balanceSheetData.assets.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between py-2 border-b border-slate-50 text-sm"
                      >
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-bold text-slate-900">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-4 mt-2 font-bold text-slate-900">
                      <span>Total Assets</span>
                      <span>
                        {balanceSheetData.assets
                          .reduce((a, b) => a + b.value, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Liab & Equity */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                      Liabilities & Equity
                    </h3>
                    <div className="mb-6">
                      {balanceSheetData.liabilities.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between py-2 border-b border-slate-50 text-sm"
                        >
                          <span className="text-slate-600">{item.name}</span>
                          <span className="font-bold text-slate-900">
                            {item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      {balanceSheetData.equity.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between py-2 border-b border-slate-50 text-sm"
                        >
                          <span className="text-slate-600">{item.name}</span>
                          <span className="font-bold text-emerald-700">
                            {item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-4 mt-2 font-bold text-slate-900 border-t border-slate-200">
                      <span>Total Liab. & Equity</span>
                      <span>
                        {balanceSheetData.assets
                          .reduce((a, b) => a + b.value, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

// Helper for Dashboard Cards
const MetricCard = ({ title, value, icon: Icon, trend, change, bg, color, index = 0 }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group"
  >
    {/* Subtle background glow effect on hover */}
    <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl ${bg}`}></div>
    
    <div className="relative z-10 flex items-center justify-between mb-6">
      <div className={`p-3.5 rounded-xl ${bg} ${color} flex items-center justify-center ring-4 ring-slate-50`}>
        <Icon className="h-6 w-6" strokeWidth={2.5} />
      </div>
      {trend !== "neutral" && change && (
        <div className={`flex items-center text-xs font-bold ${trend === "up" ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"} px-2.5 py-1.5 rounded-full shadow-sm`}>
          {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5 mr-1" strokeWidth={3} /> : <ArrowDownRight className="h-3.5 w-3.5 mr-1" strokeWidth={3} />}
          {change}
        </div>
      )}
    </div>
    
    <div className="relative z-10">
      <h3 className="text-slate-500 text-sm font-semibold mb-1">{title}</h3>
      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Rs. {value.toLocaleString()}</p>
    </div>
  </motion.div>
);
