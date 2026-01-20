"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, X, Check, AlertCircle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function BulkUploadModal({ open, onOpenChange, onSuccess }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      parseFile(selectedFile);
    }
  };

  const parseFile = (file) => {
    setFile(file);
    setIsParsing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);

        if (parsedData.length === 0) {
          setError("The uploaded file is empty.");
          setFile(null);
        } else {
          // Validate required columns (basic check)
          const firstRow = parsedData[0];
          if (!firstRow.Name && !firstRow.name) {
             setError("Missing 'Name' column. Please check the template.");
          } else {
             setData(parsedData);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to parse file. Please ensure it is a valid Excel or CSV file.");
        setFile(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (!data.length) return;

    setIsUploading(true);
    try {
      const response = await fetch("/api/members/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: data }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully imported ${result.count} members.`);
        onSuccess?.();
        onOpenChange(false);
        setFile(null);
        setData([]);
      } else {
        setError(result.error || "Failed to upload members.");
        toast.error("Upload failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Member ID": "MEM-001 (Optional)",
        "Name": "John Doe",
        "Contact": "0771234567",
        "Email": "john@example.com",
        "Address": "123 Main St, City",
        "Amount": 1000
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Member_Upload_Template.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Import Members</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to add multiple members at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Drop / Selection Area */}
          {!file ? (
            <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-emerald-50 p-4 rounded-full mb-4">
                <Upload className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Click to upload or drag and drop</h3>
              <p className="text-sm text-slate-500 mt-1">Excel (.xlsx) or CSV files up to 5MB</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleFileChange} 
              />
              <Button variant="outline" size="sm" className="mt-6" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                <Download className="w-4 h-4 mr-2" /> Download Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                        <div>
                            <p className="font-medium text-emerald-900">{file.name}</p>
                            <p className="text-xs text-emerald-600">{(file.size / 1024).toFixed(1)} KB • {data.length} rows found</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setFile(null); setData([]); setError(null); }}>
                        <X className="w-4 h-4 text-emerald-700" />
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Preview Table */}
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
                                        <TableHead>Address</TableHead>
                                        <TableHead>Member ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.slice(0, 5).map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{row.Name || row.name}</TableCell>
                                            <TableCell>{row.Contact || row.contact}</TableCell>
                                            <TableCell>{row.Address || row.address}</TableCell>
                                            <TableCell>{row['Member ID'] || row.memberNo || '-'}</TableCell>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isParsing || isUploading || !!error}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isUploading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...
                </>
            ) : (
                <>
                    <Check className="w-4 h-4 mr-2" /> Import {data.length > 0 ? `${data.length} Members` : ''}
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
