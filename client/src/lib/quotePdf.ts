import { jsPDF } from "jspdf";

export type QuotePdfRecord = {
  title: string;
  summary: string;
  createdAt: Date | string;
  lead: { referenceNumber: string; fullName: string; phone: string; email: string | null; requestedService: string | null; vehicleYear: string | null; vehicleMake: string | null; vehicleModel: string | null };
};

export function downloadServiceSummaryPdf(record: QuotePdfRecord) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const vehicle = [record.lead.vehicleYear, record.lead.vehicleMake, record.lead.vehicleModel].filter(Boolean).join(" ") || "Not provided";
  let y = 58;
  pdf.setFillColor(249, 115, 22);
  pdf.rect(0, 0, 612, 18, "F");
  pdf.setTextColor(39, 28, 24);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text("__BUSINESS_NAME__", 48, y);
  y += 28;
  pdf.setFontSize(14);
  pdf.text("Service Summary", 48, y);
  y += 34;
  pdf.setDrawColor(230, 225, 220);
  pdf.line(48, y, 564, y);
  y += 26;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 85, 78);
  pdf.text(`Reference: ${record.lead.referenceNumber}`, 48, y);
  pdf.text(`Prepared: ${new Date(record.createdAt).toLocaleDateString()}`, 360, y);
  y += 26;
  pdf.setTextColor(39, 28, 24);
  pdf.setFont("helvetica", "bold");
  pdf.text("Customer", 48, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${record.lead.fullName} · ${record.lead.phone}${record.lead.email ? ` · ${record.lead.email}` : ""}`, 48, y + 16);
  y += 54;
  pdf.setFont("helvetica", "bold");
  pdf.text("Vehicle & requested service", 48, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${vehicle} · ${record.lead.requestedService || "Service request"}`, 48, y + 16);
  y += 54;
  pdf.setFont("helvetica", "bold");
  pdf.text(record.title, 48, y);
  y += 22;
  pdf.setFont("helvetica", "normal");
  const lines = pdf.splitTextToSize(record.summary, 516);
  pdf.text(lines, 48, y);
  y += lines.length * 14 + 34;
  pdf.setFontSize(9);
  pdf.setTextColor(100, 85, 78);
  pdf.text("This summary is for service planning. Final scope and pricing are discussed directly with the customer.", 48, Math.min(y, 742));
  pdf.save(`service-summary-${record.lead.referenceNumber}.pdf`);
}
