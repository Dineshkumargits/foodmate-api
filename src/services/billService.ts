import PDFDocument from "pdfkit";
import { getConsumerReportService } from "./reportService";
import { User } from "../models";

interface BillGenerationOptions {
  consumerId: number;
  month: string; // Format: "January", "February", etc.
  sellerId: number;
}

export const generateBillPDF = async (
  options: BillGenerationOptions
): Promise<Buffer> => {
  const { consumerId, month, sellerId } = options;

  // Get month number from month name
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthIndex = monthNames.indexOf(month);
  const year = new Date().getFullYear();
  const monthStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  // Fetch consumer details
  const consumer = await User.findByPk(consumerId);
  if (!consumer) {
    throw new Error("Consumer not found");
  }

  // Fetch seller details
  const seller = await User.findByPk(sellerId);
  if (!seller) {
    throw new Error("Seller not found");
  }

  // Fetch report data
  const reportData = await getConsumerReportService(consumerId, monthStr);

  // Create PDF document
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", chunk => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fontSize(24)
      .fillColor("#22c55e")
      .text("FoodMate Bill", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor("#64748b")
      .text(`Generated on: ${new Date().toLocaleDateString()}`, {
        align: "center",
      })
      .moveDown(1.5);

    // Seller Information
    doc
      .fontSize(12)
      .fillColor("#1a1a1a")
      .text("From:", { continued: false })
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(seller.name || "Seller", { continued: false })
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(seller.email || "", { continued: false })
      .text(seller.phone || "", { continued: false })
      .moveDown(1);

    // Consumer Information
    doc
      .fontSize(12)
      .fillColor("#1a1a1a")
      .text("To:", { continued: false })
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(consumer.name || "Consumer", { continued: false })
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(consumer.email || "", { continued: false })
      .text(consumer.phone || "", { continued: false })
      .moveDown(1);

    // Bill Period
    doc
      .fontSize(12)
      .fillColor("#1a1a1a")
      .font("Helvetica-Bold")
      .text(`Billing Period: ${month} ${year}`, { align: "center" })
      .moveDown(1.5);

    // Food Entries Table
    if (reportData.entries && reportData.entries.length > 0) {
      doc
        .fontSize(14)
        .fillColor("#1a1a1a")
        .font("Helvetica-Bold")
        .text("Food Entries", { underline: true })
        .moveDown(0.5);

      // Table Header
      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 200;
      const col3X = 350;
      const col4X = 450;

      doc
        .fontSize(10)
        .fillColor("#ffffff")
        .rect(col1X, tableTop, 500, 25)
        .fill("#22c55e");

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .text("Date", col1X + 5, tableTop + 8, { width: 140 })
        .text("Item", col2X + 5, tableTop + 8, { width: 140 })
        .text("Type", col3X + 5, tableTop + 8, { width: 90 })
        .text("Amount", col4X + 5, tableTop + 8, { width: 90, align: "right" });

      let yPosition = tableTop + 30;
      doc.font("Helvetica").fillColor("#1a1a1a");

      reportData.entries.forEach((entry, index: number) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        const bgColor = index % 2 === 0 ? "#f0fdf4" : "#ffffff";
        doc.rect(col1X, yPosition - 5, 500, 20).fill(bgColor);

        doc
          .fillColor("#1a1a1a")
          .fontSize(9)
          .text(
            new Date(entry.date).toLocaleDateString(),
            col1X + 5,
            yPosition,
            { width: 140 }
          )
          .text(entry.food_name, col2X + 5, yPosition, { width: 140 })
          .text(entry.meal_type, col3X + 5, yPosition, { width: 90 })
          .text(`₹${Number(entry.amount).toFixed(2)}`, col4X + 5, yPosition, {
            width: 90,
            align: "right",
          });

        yPosition += 20;
      });

      doc.moveDown(2);
    }

    // Payments Table
    if (reportData.payments && reportData.payments.length > 0) {
      if (doc.y > 600) {
        doc.addPage();
      }

      doc
        .fontSize(14)
        .fillColor("#1a1a1a")
        .font("Helvetica-Bold")
        .text("Payments Received", { underline: true })
        .moveDown(0.5);

      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 300;

      doc
        .fontSize(10)
        .fillColor("#ffffff")
        .rect(col1X, tableTop, 500, 25)
        .fill("#3b82f6");

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .text("Date", col1X + 5, tableTop + 8, { width: 240 })
        .text("Amount", col2X + 5, tableTop + 8, {
          width: 240,
          align: "right",
        });

      let yPosition = tableTop + 30;
      doc.font("Helvetica").fillColor("#1a1a1a");

      reportData.payments.forEach((payment, index: number) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        const bgColor = index % 2 === 0 ? "#eff6ff" : "#ffffff";
        doc.rect(col1X, yPosition - 5, 500, 20).fill(bgColor);

        doc
          .fillColor("#1a1a1a")
          .fontSize(9)
          .text(
            new Date(payment.date).toLocaleDateString(),
            col1X + 5,
            yPosition,
            { width: 240 }
          )
          .text(`₹${Number(payment.amount).toFixed(2)}`, col2X + 5, yPosition, {
            width: 240,
            align: "right",
          });

        yPosition += 20;
      });

      doc.moveDown(2);
    }

    // Summary Section
    if (doc.y > 650) {
      doc.addPage();
    }

    const summaryY = doc.y + 20;
    doc.rect(50, summaryY, 500, 100).fill("#f8fdf9").stroke("#22c55e");

    doc
      .fontSize(12)
      .fillColor("#1a1a1a")
      .font("Helvetica-Bold")
      .text("Summary", 70, summaryY + 15)
      .moveDown(0.5);

    const summaryX = 70;
    let summaryYPos = summaryY + 40;

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("Total Due:", summaryX, summaryYPos, { continued: true })
      .fillColor("#22c55e")
      .font("Helvetica-Bold")
      .text(`₹${reportData.totalDue.toFixed(2)}`, { align: "right" });

    summaryYPos += 20;
    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .text("Total Paid:", summaryX, summaryYPos, { continued: true })
      .fillColor("#3b82f6")
      .font("Helvetica-Bold")
      .text(`₹${reportData.totalPaid.toFixed(2)}`, { align: "right" });

    summaryYPos += 20;
    const balance = reportData.balance;
    const balanceColor = balance > 0 ? "#f97316" : "#22c55e";
    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .text("Balance:", summaryX, summaryYPos, { continued: true })
      .fillColor(balanceColor)
      .font("Helvetica-Bold")
      .text(`₹${balance.toFixed(2)}`, { align: "right" });

    // Footer
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text("Thank you for your business!", 50, doc.page.height - 50, {
        align: "center",
        width: 500,
      });

    doc.end();
  });
};
