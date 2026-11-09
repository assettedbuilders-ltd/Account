import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatBDT, convertAmountToWords } from './numberToWords';
import {
  BillVoucher,
  VRLedgerRow,
  VoucherSummarySheet,
  RoofExpense,
  Customer,
  CustomerPayment,
  Contractor,
  ContractorPayment,
  Project
} from '../types';

const COMPANY_NAME = 'ASSETTED BUILDERS LTD.';
const COMPANY_ADDRESS = 'Notun Panir pamp Road, Block# B, Sayednagar, Vatara, Gulshan, Dhaka-1212';
const COMPANY_CONTACT = 'Phone: 01706664962 / 01717080916 | Email: assettedbuilders@gmail.com';

/**
 * Universal PDF Generator using jsPDF and AutoTable
 */
export interface TablePDFOptions {
  filename: string;
  title: string;
  subtitle?: string;
  project?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3';
  columns: { header: string; dataKey: string; halign?: 'left' | 'center' | 'right'; width?: number }[];
  data: Record<string, any>[];
  footRows?: string[][];
  amountInWords?: string;
  signatures?: string[];
  themeColor?: [number, number, number]; // [r, g, b]
}

export function exportTableToPDF(options: TablePDFOptions) {
  try {
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor: [number, number, number] = options.themeColor || [15, 23, 42]; // Navy default

    // Header Band
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Golden Accent Bar
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 4, pageWidth, 1.5, 'F');

    let currentY = 13;

    // Company Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(COMPANY_NAME, pageWidth / 2, currentY, { align: 'center' });

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(COMPANY_ADDRESS, pageWidth / 2, currentY, { align: 'center' });

    currentY += 4;
    doc.text(COMPANY_CONTACT, pageWidth / 2, currentY, { align: 'center' });

    // Document Title Banner
    currentY += 7;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(options.title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

    if (options.subtitle) {
      currentY += 5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(options.subtitle, pageWidth / 2, currentY, { align: 'center' });
    }

    if (options.project) {
      currentY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9);
      doc.text(`PROJECT: ${options.project.toUpperCase()}`, pageWidth / 2, currentY, { align: 'center' });
    }

    currentY += 4;

    // Table Data preparation
    const headRow = options.columns.map(c => c.header);
    const bodyRows = options.data.map(row => options.columns.map(c => row[c.dataKey] ?? ''));

    const columnStylesConfig: Record<number, any> = {};
    options.columns.forEach((col, idx) => {
      columnStylesConfig[idx] = {
        halign: col.halign || 'left',
        ...(col.width ? { cellWidth: col.width } : {})
      };
    });

    autoTable(doc, {
      startY: currentY,
      head: [headRow],
      body: bodyRows,
      foot: options.footRows || undefined,
      theme: 'grid',
      styles: {
        fontSize: options.columns.length > 10 ? 6.5 : 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [203, 213, 225],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold'
      },
      columnStyles: columnStylesConfig,
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 10, right: 10, top: 10, bottom: 20 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 50;

    // Amount In Words Box
    let nextY = finalY + 6;
    if (options.amountInWords) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(10, nextY, pageWidth - 20, 8, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('AMOUNT IN WORDS: ', 13, nextY + 5.5);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(180, 83, 9);
      doc.text(options.amountInWords, 48, nextY + 5.5);

      nextY += 14;
    } else {
      nextY += 10;
    }

    // Signatures
    const signatures = options.signatures || ['Prepared By', 'Audited / Verified By', 'Managing Director'];
    const sigCount = signatures.length;
    const availableWidth = pageWidth - 20;
    const colWidth = availableWidth / sigCount;

    // Check if we need a new page for signatures
    if (nextY + 25 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      nextY = 25;
    }

    signatures.forEach((sigTitle, index) => {
      const centerX = 10 + index * colWidth + colWidth / 2;
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.4);
      doc.line(centerX - 25, nextY + 12, centerX + 25, nextY + 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(sigTitle, centerX, nextY + 16, { align: 'center' });
    });

    // Page Numbers Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Assetted Builders Ltd. • Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      );
    }

    doc.save(`${options.filename}.pdf`);
  } catch (err) {
    console.error('PDF generation error:', err);
    alert('Failed to generate PDF. Please try again.');
  }
}

/**
 * 1. Exact 19-Column Master Project Ledger PDF (Image 1)
 */
export function exportMasterLedgerPDF(
  filteredRows: VRLedgerRow[],
  columnTotals: any,
  projectName: string = 'Assetted Master Tower'
) {
  const columns = [
    { header: 'Date', dataKey: 'date', halign: 'center' as const, width: 22 },
    { header: 'VR NO', dataKey: 'vrNo', halign: 'center' as const, width: 14 },
    { header: 'Land woner+ Investor', dataKey: 'land', halign: 'right' as const },
    { header: 'Raj & Labour (Manik+Munna+Rofiq)', dataKey: 'raj', halign: 'right' as const },
    { header: 'Contrator (Jamal)', dataKey: 'jamal', halign: 'right' as const },
    { header: 'Bricks', dataKey: 'bricks', halign: 'right' as const },
    { header: 'Sand', dataKey: 'sand', halign: 'right' as const },
    { header: 'Cement', dataKey: 'cement', halign: 'right' as const },
    { header: 'Rod', dataKey: 'rod', halign: 'right' as const },
    { header: 'Stone', dataKey: 'stone', halign: 'right' as const },
    { header: 'Sanitary/Contractor', dataKey: 'sanitary', halign: 'right' as const },
    { header: 'Staff salary', dataKey: 'salary', halign: 'right' as const },
    { header: 'Electric Items', dataKey: 'electric', halign: 'right' as const },
    { header: 'Utility bill', dataKey: 'utility', halign: 'right' as const },
    { header: 'Engineer+ Pailing', dataKey: 'engineer', halign: 'right' as const },
    { header: 'Others Payment', dataKey: 'others', halign: 'right' as const },
    { header: 'Office Exp.', dataKey: 'office', halign: 'right' as const },
    { header: 'TOTAL', dataKey: 'total', halign: 'right' as const },
    { header: 'Comments', dataKey: 'comments', halign: 'left' as const }
  ];

  const formatCell = (val: any) => {
    if (val === undefined || val === '') return '';
    if (val === '-') return '-';
    if (typeof val === 'number') return formatBDT(val);
    const parsed = Number(val);
    if (!isNaN(parsed) && String(val).trim() !== '') return formatBDT(parsed);
    return String(val);
  };

  const tableData = filteredRows.map(r => ({
    date: r.date || '',
    vrNo: r.vrNo || '',
    land: formatCell(r.landOwnerInvestor),
    raj: formatCell(r.rajLabour),
    jamal: formatCell(r.contractorJamal),
    bricks: formatCell(r.bricks),
    sand: formatCell(r.sand),
    cement: formatCell(r.cement),
    rod: formatCell(r.rod),
    stone: formatCell(r.stone),
    sanitary: formatCell(r.sanitary),
    salary: formatCell(r.staffSalary),
    electric: formatCell(r.electric),
    utility: formatCell(r.utilityBill),
    engineer: formatCell(r.engineerPailing),
    others: formatCell(r.othersPayment),
    office: formatCell(r.officeExpense),
    total: formatCell(r.totalAmount),
    comments: r.comments || ''
  }));

  const footRow = [
    'Grand Total',
    '',
    formatBDT(columnTotals.landOwnerInvestor),
    formatBDT(columnTotals.rajLabour),
    columnTotals.contractorJamal ? formatBDT(columnTotals.contractorJamal) : '',
    formatBDT(columnTotals.bricks),
    formatBDT(columnTotals.sand),
    formatBDT(columnTotals.cement),
    formatBDT(columnTotals.rod),
    formatBDT(columnTotals.stone),
    formatBDT(columnTotals.sanitary),
    formatBDT(columnTotals.staffSalary),
    formatBDT(columnTotals.electric),
    formatBDT(columnTotals.utilityBill),
    formatBDT(columnTotals.engineerPailing),
    formatBDT(columnTotals.othersPayment),
    '-',
    formatBDT(columnTotals.grandTotal),
    ''
  ];

  exportTableToPDF({
    filename: `Assetted_Builders_19Columns_Master_Ledger_${new Date().toISOString().slice(0, 10)}`,
    title: '19-Column Master Project Expense Ledger (VR-01 to VR-18)',
    subtitle: 'Consolidated Milestones & Materials Account • Strictly Audited & Reconciled',
    project: projectName,
    orientation: 'landscape',
    format: 'a4',
    themeColor: [22, 101, 52], // Deep Emerald matching Excel green
    columns,
    data: tableData,
    footRows: [footRow],
    amountInWords: convertAmountToWords(columnTotals.grandTotal),
    signatures: ['Site Accounts Officer', 'Senior Project Engineer', 'Internal Auditor', 'Managing Director']
  });
}

/**
 * 2. Exact Voucher Summary Debit Sheet PDF (Image 2 - Voucher 7)
 */
export function exportVoucherSummaryPDF(sheet: VoucherSummarySheet) {
  const columns = [
    { header: 'Sl', dataKey: 'sl', halign: 'center' as const, width: 14 },
    { header: 'Details (Item Purchase & Payment)', dataKey: 'details', halign: 'left' as const },
    { header: 'Quantity', dataKey: 'quantity', halign: 'center' as const, width: 35 },
    { header: 'Total Amount (BDT)', dataKey: 'totalAmount', halign: 'right' as const, width: 45 },
    { header: 'Comments', dataKey: 'comments', halign: 'left' as const, width: 35 }
  ];

  const tableData = sheet.items.map(it => ({
    sl: it.sl,
    details: it.details,
    quantity: it.quantity || '',
    totalAmount: formatBDT(it.totalAmount),
    comments: it.comments || ''
  }));

  const footRow = ['Total', '', '0', formatBDT(sheet.totalAmount), ''];

  exportTableToPDF({
    filename: `${sheet.vrNo}_Debit_Summary_Sheet`,
    title: sheet.voucherTitle,
    subtitle: `${sheet.subtitle} • Date: ${sheet.dateRange}`,
    orientation: 'portrait',
    format: 'a4',
    themeColor: [2, 132, 199], // Sky Blue matching Image 2
    columns,
    data: tableData,
    footRows: [footRow],
    amountInWords: convertAmountToWords(sheet.totalAmount),
    signatures: ['Prepared By', 'Audited By', 'Approved By']
  });
}

/**
 * 3. Official Bill Voucher PDF (Individual Bill Voucher)
 */
export function exportBillVoucherPDF(voucher: BillVoucher, projectName?: string) {
  const columns = [
    { header: 'SL', dataKey: 'sl', halign: 'center' as const, width: 14 },
    { header: 'Date', dataKey: 'date', halign: 'center' as const, width: 30 },
    { header: 'Particulars / Description', dataKey: 'particulars', halign: 'left' as const },
    { header: 'Amount (BDT)', dataKey: 'amount', halign: 'right' as const, width: 45 }
  ];

  const tableData = voucher.items.map(it => ({
    sl: it.sl,
    date: it.date,
    particulars: it.particulars,
    amount: formatBDT(it.amount)
  }));

  const footRows = [
    ['TOTAL AMOUNT:', '', '', `BDT ${formatBDT(voucher.totalAmount)}`]
  ];

  if (voucher.isLandOwnerVoucher) {
    footRows.push(['Total Land Price:', '', '', formatBDT(voucher.totalLandPrice || 0)]);
    footRows.push(['Total Payment Received:', '', '', formatBDT(voucher.totalPaymentReceived || 0)]);
    footRows.push(['Outstanding Due:', '', '', formatBDT(voucher.outstandingDue || 0)]);
  }

  exportTableToPDF({
    filename: `Bill_Voucher_${voucher.voucherNo}`,
    title: 'OFFICIAL BILL VOUCHER',
    subtitle: `Voucher No: ${voucher.voucherNo} | Date: ${voucher.date} | Recipient: ${voucher.name} (${voucher.designation}) | Contact: ${voucher.contactNumber}`,
    project: projectName || voucher.projectId,
    orientation: 'portrait',
    format: 'a4',
    themeColor: [15, 23, 42],
    columns,
    data: tableData,
    footRows,
    amountInWords: voucher.amountInWords,
    signatures: [
      `Received By: ${voucher.receivedBy || 'Payee'}`,
      `Approved By: ${voucher.approvedBy || 'Managing Director'}`
    ]
  });
}

/**
 * 4. Eight Roof Costs Expense Statement PDF
 */
export function exportRoofExpensesPDF(expenses: RoofExpense[], projectName: string = 'Assetted Master Tower') {
  const grandTotal = expenses.reduce((s, e) => s + e.total, 0);

  const columns = [
    { header: 'SL', dataKey: 'sl', halign: 'center' as const, width: 14 },
    { header: 'Date', dataKey: 'date', halign: 'center' as const, width: 25 },
    { header: 'Name / Payee', dataKey: 'name', halign: 'left' as const, width: 40 },
    { header: 'Description / Particulars', dataKey: 'description', halign: 'left' as const },
    { header: 'Category', dataKey: 'category', halign: 'center' as const, width: 25 },
    { header: 'Total (BDT)', dataKey: 'total', halign: 'right' as const, width: 35 }
  ];

  const tableData = expenses.map(e => ({
    sl: e.sl,
    date: e.date,
    name: e.name,
    description: e.description,
    category: e.category,
    total: formatBDT(e.total)
  }));

  const footRow = ['TOTAL EXPENSES', '', '', '', '', `BDT ${formatBDT(grandTotal)}`];

  exportTableToPDF({
    filename: `Assetted_Master_Tower_Eight_Roof_Costs_${new Date().toISOString().slice(0, 10)}`,
    title: 'Statement of Expenses — Eight Roof Costs',
    subtitle: 'Detailed Itemized Construction Expenditure Statement',
    project: projectName,
    orientation: 'portrait',
    format: 'a4',
    themeColor: [180, 83, 9], // Amber tone
    columns,
    data: tableData,
    footRows: [footRow],
    amountInWords: convertAmountToWords(grandTotal),
    signatures: ['Site Supervisor', 'Accounts Officer', 'Managing Director']
  });
}

/**
 * 5. Customer Payments & Collection Ledger PDF
 */
export function exportCustomerPaymentsPDF(
  payments: CustomerPayment[],
  customers: Customer[],
  projects: Project[],
  selectedCustomer?: Customer | null
) {
  const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);

  const columns = [
    { header: 'MR No', dataKey: 'mrNo', halign: 'center' as const, width: 22 },
    { header: 'Date', dataKey: 'date', halign: 'center' as const, width: 24 },
    { header: 'Customer Name', dataKey: 'customerName', halign: 'left' as const },
    { header: 'Flat / Unit', dataKey: 'unit', halign: 'center' as const, width: 22 },
    { header: 'Installment Name', dataKey: 'installment', halign: 'left' as const },
    { header: 'Payment Method', dataKey: 'method', halign: 'center' as const, width: 24 },
    { header: 'Amount (BDT)', dataKey: 'amount', halign: 'right' as const, width: 34 }
  ];

  const tableData = payments.map(p => {
    const cust = customers.find(c => c.id === p.customerId);
    return {
      mrNo: p.mrNo,
      date: p.date,
      customerName: cust?.name || 'Customer',
      unit: cust ? `Unit ${cust.unitNo}` : '-',
      installment: p.installmentName,
      method: p.paymentMethod,
      amount: formatBDT(p.amount)
    };
  });

  const footRow = ['TOTAL COLLECTIONS RECEIVED', '', '', '', '', '', `BDT ${formatBDT(totalCollected)}`];

  exportTableToPDF({
    filename: selectedCustomer
      ? `Customer_Collection_Statement_${selectedCustomer.name.replace(/\s+/g, '_')}`
      : `Assetted_Builders_Customer_Payments_${new Date().toISOString().slice(0, 10)}`,
    title: selectedCustomer
      ? `Customer Payment Collection Ledger — ${selectedCustomer.name}`
      : 'Customer Sales & Installment Collection Statement',
    subtitle: selectedCustomer
      ? `Flat / Unit: ${selectedCustomer.unitNo} • Floor: ${selectedCustomer.floorNo} • Agreed Price: BDT ${formatBDT(selectedCustomer.agreedPrice)}`
      : 'All Customer Money Receipts & Down Payments Reconciled',
    orientation: 'portrait',
    format: 'a4',
    themeColor: [15, 23, 42],
    columns,
    data: tableData,
    footRows: [footRow],
    amountInWords: convertAmountToWords(totalCollected),
    signatures: ['Accounts Officer', 'Chief Financial Officer', 'Managing Director']
  });
}

/**
 * 6. Contractor Accounts Ledger PDF
 */
export function exportContractorPaymentsPDF(
  contractors: Contractor[],
  payments: ContractorPayment[],
  projects: Project[]
) {
  const totalContract = contractors.reduce((s, c) => s + c.totalContractValue, 0);
  const totalPaid = contractors.reduce((s, c) => s + c.totalPaid, 0);
  const totalDue = contractors.reduce((s, c) => s + c.balanceDue, 0);

  const columns = [
    { header: 'Contractor Name', dataKey: 'name', halign: 'left' as const },
    { header: 'Work Scope / Trade', dataKey: 'type', halign: 'left' as const, width: 35 },
    { header: 'Contact Person & Phone', dataKey: 'contact', halign: 'left' as const, width: 45 },
    { header: 'Contract (BDT)', dataKey: 'contract', halign: 'right' as const, width: 30 },
    { header: 'Total Paid (BDT)', dataKey: 'paid', halign: 'right' as const, width: 30 },
    { header: 'Balance Due (BDT)', dataKey: 'due', halign: 'right' as const, width: 30 }
  ];

  const tableData = contractors.map(c => ({
    name: c.name,
    type: c.type,
    contact: `${c.contactPerson} (${c.phone})`,
    contract: formatBDT(c.totalContractValue),
    paid: formatBDT(c.totalPaid),
    due: formatBDT(c.balanceDue)
  }));

  const footRow = [
    'TOTALS',
    '',
    '',
    formatBDT(totalContract),
    formatBDT(totalPaid),
    formatBDT(totalDue)
  ];

  exportTableToPDF({
    filename: `Assetted_Builders_Contractor_Ledger_${new Date().toISOString().slice(0, 10)}`,
    title: 'Contractor & Vendor Accounts Statement',
    subtitle: 'Civil, Masons, Rod, Electrical & MEP Contractor Running Bills',
    orientation: 'portrait',
    format: 'a4',
    themeColor: [15, 23, 42],
    columns,
    data: tableData,
    footRows: [footRow],
    amountInWords: convertAmountToWords(totalPaid),
    signatures: ['Project Engineer', 'Internal Auditor', 'Managing Director']
  });
}

/**
 * 7. Executive Financial Audit Report PDF
 */
export function exportFinancialReportPDF(
  projects: Project[],
  vrLedger: VRLedgerRow[],
  customers: Customer[],
  customerPayments: CustomerPayment[]
) {
  const parseNum = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val || val === '-') return 0;
    const clean = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalExpense = vrLedger.reduce((s, v) => s + parseNum(v.totalAmount), 0);
  const totalSales = customers.reduce((s, c) => s + c.agreedPrice, 0);
  const totalCollected = customerPayments.reduce((s, cp) => s + cp.amount, 0);
  const totalDue = Math.max(0, totalSales - totalCollected);

  const columns = [
    { header: 'Project Name', dataKey: 'name', halign: 'left' as const },
    { header: 'Land / Floors', dataKey: 'specs', halign: 'center' as const, width: 28 },
    { header: 'Budget (BDT)', dataKey: 'budget', halign: 'right' as const, width: 32 },
    { header: 'VR Expenses (BDT)', dataKey: 'expenses', halign: 'right' as const, width: 34 },
    { header: 'Committed Sales (BDT)', dataKey: 'sales', halign: 'right' as const, width: 34 },
    { header: 'Collections (BDT)', dataKey: 'collected', halign: 'right' as const, width: 34 },
    { header: 'Outstanding Due', dataKey: 'due', halign: 'right' as const, width: 30 }
  ];

  const tableData = projects.map(p => {
    const pExp = vrLedger.filter(v => v.projectId === p.id).reduce((s, v) => s + parseNum(v.totalAmount), 0);
    const pCust = customers.filter(c => c.projectId === p.id);
    const pSales = pCust.reduce((s, c) => s + c.agreedPrice, 0);
    const pRecv = customerPayments.filter(cp => cp.projectId === p.id).reduce((s, cp) => s + cp.amount, 0);
    const pDue = Math.max(0, pSales - pRecv);

    return {
      name: p.name,
      specs: `${p.landArea} • ${p.floors} Fl.`,
      budget: formatBDT(p.budget),
      expenses: formatBDT(pExp),
      sales: formatBDT(pSales),
      collected: formatBDT(pRecv),
      due: formatBDT(pDue)
    };
  });

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const footRow = [
    'CONSOLIDATED TOTALS',
    '',
    formatBDT(totalBudget),
    formatBDT(totalExpense),
    formatBDT(totalSales),
    formatBDT(totalCollected),
    formatBDT(totalDue)
  ];

  exportTableToPDF({
    filename: `Assetted_Builders_Executive_Audit_Report_${new Date().toISOString().slice(0, 10)}`,
    title: 'Executive Financial & Construction Audit Report',
    subtitle: 'Consolidated Statement of Construction Expenses, Sales Contracts & Net Cash Flow',
    orientation: 'landscape',
    format: 'a4',
    themeColor: [15, 23, 42],
    columns,
    data: tableData,
    footRows: [footRow],
    amountInWords: convertAmountToWords(totalExpense),
    signatures: ['Head of Accounts', 'Chief Executive Officer', 'Managing Director']
  });
}

/**
 * 8. General Export to Excel (.xlsx) using SheetJS
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  data: Record<string, string | number | boolean | null | undefined>[]
) {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (err) {
    console.error('Excel export error:', err);
    alert('Failed to export Excel file. Please try again.');
  }
}

/**
 * 6. Export to Word (.doc)
 */
export function exportToWord(
  filename: string,
  title: string,
  contentHtml: string,
  companyName: string = COMPANY_NAME
) {
  const headerHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.4; }
        h1, h2, h3 { color: #0f172a; margin-bottom: 4px; }
        .company-header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
        .company-name { font-size: 20pt; font-weight: bold; color: #0f172a; letter-spacing: 0.5px; }
        .company-address { font-size: 9pt; color: #475569; }
        .doc-title { font-size: 14pt; font-weight: bold; text-align: center; margin: 15px 0; text-transform: uppercase; letter-spacing: 1px; color: #b45309; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; font-size: 10pt; }
        th { background-color: #0f172a; color: white; padding: 8px; text-align: left; border: 1px solid #334155; }
        td { padding: 6px 8px; border: 1px solid #cbd5e1; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .footer-signatures { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { border-top: 1px solid #475569; width: 200px; text-align: center; padding-top: 6px; font-size: 10pt; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="company-header">
        <div class="company-name">${companyName}</div>
        <div class="company-address">${COMPANY_ADDRESS} | ${COMPANY_CONTACT}</div>
        <div class="doc-title">${title}</div>
      </div>
      ${contentHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', headerHtml], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 7. Browser Print
 */
export function triggerPrint() {
  window.print();
}
