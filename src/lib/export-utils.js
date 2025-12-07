// lib/export-utils.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// --- CONFIGURATION ---
const COMPANY_INFO = {
    name: "Masjidhul Haadhi",
    address: "123 ALhilal South Road, Sainthamruthu 14, Sri Lanka",
    contact: "+94 77 123 4567 | admin@masjidhulhaadhi.org",
    regNo: "Reg No: MQ/2023/885",
    themeColor: "#059669", // Emerald-600
};

// --- 1. CSV EXPORT ---
export function exportToCSV(data, filename = "export.csv") {
    if (!data || data.length === 0) return;

    // 1. Extract Headers
    const headers = Object.keys(data[0]);

    // 2. Convert Data to CSV String
    const csvContent = [
        headers.join(","), // Header Row
        ...data.map((row) =>
            headers
                .map((fieldName) => {
                    const value = row[fieldName];
                    // Escape quotes and wrap in quotes if it contains comma
                    const stringValue = value === null || value === undefined ? "" : String(value);
                    return `"${stringValue.replace(/"/g, '""')}"`;
                })
                .join(",")
        ),
    ].join("\n");

    // 3. Trigger Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- 2. PDF EXPORT (With Letterhead) ---
export function exportToPDF(
    columns,
    data,
    title = "Report",
    filename = "document.pdf"
) {
    const doc = new jsPDF();

    // --- A. LETTERHEAD FUNCTION ---
    const drawLetterhead = (doc) => {
        const pageWidth = doc.internal.pageSize.width;

        // 1. Top Bar (Theme Color)
        doc.setFillColor(COMPANY_INFO.themeColor);
        doc.rect(0, 0, pageWidth, 5, "F"); // 5mm top bar

        // 2. Mosque Name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(COMPANY_INFO.themeColor);
        doc.text(COMPANY_INFO.name, pageWidth / 2, 20, { align: "center" });

        // 3. Address & Contact (Subtitle)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100); // Grey
        doc.text(COMPANY_INFO.address, pageWidth / 2, 26, { align: "center" });
        doc.text(COMPANY_INFO.contact, pageWidth / 2, 31, { align: "center" });

        // 4. Registration Number
        doc.setFontSize(8);
        doc.text(COMPANY_INFO.regNo, pageWidth - 15, 15, { align: "right" });

        // 5. Divider Line
        doc.setDrawColor(200);
        doc.line(15, 36, pageWidth - 15, 36);

        // Optional: Add Logo Image here if you have base64 string
        // doc.addImage(base64Logo, 'PNG', 15, 10, 25, 25);
    };

    // --- B. DRAW CONTENT ---

    // Draw Letterhead on first page
    drawLetterhead(doc);

    // Document Title & Date
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(title.toUpperCase(), 15, 48);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), "MMM dd, yyyy HH:mm")}`, 195, 48, { align: "right" });

    // Draw Table
    autoTable(doc, {
        startY: 55,
        head: [columns.map((c) => c.header)],
        body: data.map((row) => columns.map((c) => row[c.dataKey])),
        theme: "grid",
        headStyles: {
            fillColor: COMPANY_INFO.themeColor,
            textColor: 255,
            fontStyle: "bold",
        },
        alternateRowStyles: {
            fillColor: [240, 253, 244], // Light Emerald tint
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        // Add letterhead to subsequent pages if table overflows
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                drawLetterhead(doc);
                // Reset margin for next page
                data.settings.margin.top = 40;
            }
        }
    });

    // Footer (Page Numbers)
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" }
        );
    }

    doc.save(filename);
}