"use client";

import {
  AlertCircle,
  Check,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  hasNameColumn,
  isValidImportRow,
  parseImportRow,
  SANDHA_PLAN_OPTIONS,
} from "@/lib/member-import-utils";

export function BulkUploadModal({ open, onOpenChange, onSuccess }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setData([]);
    setParseError(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!open) {
      setFile(null);
      setData([]);
      setParseError(null);
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      parseFile(selectedFile);
    }
  };

  const parseFile = (selectedFile) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (parsedData.length === 0) {
          setParseError("The uploaded file is empty.");
          setFile(null);
        } else if (!hasNameColumn(parsedData)) {
          setParseError("Missing 'Name' column. Please check the template.");
          setFile(null);
        } else {
          const validRows = parsedData
            .map(parseImportRow)
            .filter(isValidImportRow);

          if (validRows.length === 0) {
            setParseError(
              "No valid member rows found. Each row needs a Name and Contact.",
            );
            setFile(null);
          } else {
            setData(validRows);
          }
        }
      } catch (err) {
        console.error(err);
        setParseError(
          "Failed to parse file. Please ensure it is a valid Excel or CSV file.",
        );
        setFile(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleUpload = async () => {
    if (!data.length) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const response = await fetch("/api/members/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: data }),
      });

      const result = await response.json();

      if (response.ok) {
        const failed = result.failed || 0;
        if (failed > 0) {
          toast.warning(
            `Imported ${result.count} member(s). ${failed} row(s) skipped or failed.`,
          );
        } else {
          toast.success(`Successfully imported ${result.count} member(s).`);
        }
        onSuccess?.();
        onOpenChange(false);
      } else {
        const detail =
          result.messages?.length > 0
            ? result.messages.slice(0, 3).join(" ")
            : result.error || "Failed to upload members.";
        setUploadError(detail);
        toast.error(result.error || "Upload failed");
      }
    } catch {
      setUploadError("Network error. Please try again.");
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "Member ID",
        "Name",
        "Contact",
        "Email",
        "Address",
        "Sandha Plan",
        "Amount",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Member_Upload_Template.xlsx");
  };

  const displayError = parseError || uploadError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Import Members</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to add multiple members at once. Sandha
            Plan: {SANDHA_PLAN_OPTIONS.join(", ")} (e.g. Monthly, Yearly, or
            Semi-Annual for twice a year).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!file ? (
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="bg-emerald-50 p-4 rounded-full mb-4">
                <Upload className="w-8 h-8 text-emerald-600" />
              </div>
              <span className="text-lg font-medium text-slate-900">
                Click to upload or drag and drop
              </span>
              <p className="text-sm text-slate-500 mt-1">
                Excel (.xlsx) or CSV files up to 5MB
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-6"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  downloadTemplate();
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Download Template
              </Button>
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-900">{file.name}</p>
                    <p className="text-xs text-emerald-600">
                      {(file.size / 1024).toFixed(1)} KB • {data.length} rows
                      found
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetState}>
                  <X className="w-4 h-4 text-emerald-700" />
                </Button>
              </div>

              {displayError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}

              {data.length > 0 && (
                <div className="border border-slate-200 rounded-md">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-medium text-slate-500">
                    Previewing first 5 of {data.length} records
                  </div>
                  <ScrollArea className="h-[200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Sandha Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Member ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 5).map((row) => (
                          <TableRow
                            key={`${row.name}-${row.contact}-${row.memberNo ?? "auto"}`}
                          >
                            <TableCell className="font-medium">
                              {row.name}
                            </TableCell>
                            <TableCell>{row.contact}</TableCell>
                            <TableCell>{row.paymentFrequency}</TableCell>
                            <TableCell>{row.amountPerCycle || "-"}</TableCell>
                            <TableCell>{row.memberNo || "(auto)"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              !file ||
              isParsing ||
              isUploading ||
              !!parseError ||
              data.length === 0
            }
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" /> Import{" "}
                {data.length > 0 ? `${data.length} Members` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
