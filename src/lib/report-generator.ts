// lib/report-generator.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const COMPANY_INFO = {
    name: "Masjidhul Haadhi",
    address: "123 ALhilal South Road, Sainthamruthu 14, Sri Lanka",
    contact: "+94 77 123 4567 | admin@masjidhulhaadhi.org",
    regNo: "Reg No: MQ/2023/885",
    themeColor: "#059669", // Emerald-600
};

// --- HELPER: DRAW LETTERHEAD ---
const drawLetterhead = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.width;

    // Top Bar
    doc.setFillColor(COMPANY_INFO.themeColor);
    doc.rect(0, 0, pageWidth, 5, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(COMPANY_INFO.themeColor);
    doc.text(COMPANY_INFO.name, pageWidth / 2, 20, { align: "center" });

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(COMPANY_INFO.address, pageWidth / 2, 26, { align: "center" });
    doc.text(COMPANY_INFO.contact, pageWidth / 2, 31, { align: "center" });

    // Reg No
    doc.setFontSize(8);
    doc.text(COMPANY_INFO.regNo, pageWidth - 15, 15, { align: "right" });

    // Line
    doc.setDrawColor(200);
    doc.line(15, 36, pageWidth - 15, 36);
};

// --- HELPER: DRAW FOOTER ---
const drawFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    doc.setPage(pageNumber);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
        `Generated on: ${format(new Date(), "MMM dd, yyyy HH:mm")} - Page ${pageNumber} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
    );
};

// --- MAIN GENERATOR FUNCTION ---
export const generateFinancialPDF = ({
    title,
    period,
    tables,
    summary
}: {
    title: string,
    period: string,
    tables: any[],
    summary?: any[]
}) => {
    const doc = new jsPDF();
    let currentY = 45; // Start below letterhead

    // 1. Draw Header
    drawLetterhead(doc);

    // 2. Report Title & Period
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(title.toUpperCase(), 15, currentY);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Period: ${period}`, 15, currentY + 6);

    currentY += 15;

    // 3. Loop through Tables (Income Section, Expense Section, etc.)
    tables.forEach((table) => {
        // Table Title
        if (table.title) {
            doc.setFontSize(12);
            doc.setTextColor(COMPANY_INFO.themeColor);
            doc.setFont("helvetica", "bold");
            doc.text(table.title, 15, currentY);
            currentY += 2;
        }

        // Generate Table
        autoTable(doc, {
            startY: currentY + 3,
            head: [table.headers],
            body: table.data,
            theme: "grid",
            headStyles: { fillColor: table.color || COMPANY_INFO.themeColor, textColor: 255, fontStyle: "bold" },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 40, halign: 'right' }, // Amount column usually right-aligned
            },
            // Update currentY for next table
            didDrawPage: (data) => {
                // Add letterhead if new page is added
                if (data.pageNumber > 1) {
                    drawLetterhead(doc);
                    data.settings.margin.top = 40;
                }
            },
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 10; // Add spacing
    });

    // 4. Summary / Totals Section (Net Surplus, Total Assets)
    if (summary) {
        // Check if space exists, else add page
        if (currentY > 250) {
            doc.addPage();
            drawLetterhead(doc);
            currentY = 45;
        }

        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(200);
        doc.roundedRect(15, currentY, 180, (summary.length * 8) + 10, 3, 3, "FD");

        currentY += 8;

        summary.forEach((item) => {
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.setFont("helvetica", item.isBold ? "bold" : "normal");

            doc.text(item.label, 20, currentY);
            doc.text(item.value, 190, currentY, { align: "right" });

            currentY += 8;
        });
    }

    // 5. Signature Area
    const pageHeight = doc.internal.pageSize.height;
    if (currentY + 40 < pageHeight) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0);

        doc.line(15, pageHeight - 35, 65, pageHeight - 35);
        doc.text("Prepared By", 25, pageHeight - 30);

        doc.line(145, pageHeight - 35, 195, pageHeight - 35);
        doc.text("Approved By", 155, pageHeight - 30);
    }

    // 6. Page Numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        drawFooter(doc, i, totalPages);
    }

    doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`);
};