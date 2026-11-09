import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Printer,
  FileText,
  Layers,
  Building2,
  X,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Eye,
  Calendar,
  DollarSign,
  Download
} from 'lucide-react';
import { VRLedgerRow, Project, CompanySettings, UserRole, VoucherSummarySheet, VoucherSummaryItem } from '../types';
import { formatBDT, convertAmountToWords } from '../utils/numberToWords';
import {
  exportToExcel,
  exportToWord,
  triggerPrint,
  exportMasterLedgerPDF,
  exportVoucherSummaryPDF
} from '../utils/exportUtils';
import { Storage } from '../utils/storage';
import { DEFAULT_VR_LEDGER, DEFAULT_VOUCHER_SUMMARIES } from '../data/defaultData';

interface VRLedgerViewProps {
  vrLedger: VRLedgerRow[];
  projects: Project[];
  settings: CompanySettings;
  userRole: UserRole;
  selectedProjectId: string;
  onSaveVRLedgerRow: (row: VRLedgerRow) => void;
  onDeleteVRLedgerRow: (id: string) => void;
}

export const VRLedgerView: React.FC<VRLedgerViewProps> = ({
  vrLedger,
  projects,
  settings,
  userRole,
  selectedProjectId,
  onSaveVRLedgerRow,
  onDeleteVRLedgerRow
}) => {
  // Tab Switcher: 'master_ledger' (Image 1) vs 'voucher_summary' (Image 2)
  const [activeTab, setActiveTab] = useState<'master_ledger' | 'voucher_summary'>('master_ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<VRLedgerRow | null>(null);

  // Voucher Summary Sheet State (Image 2)
  const [voucherSummaries, setVoucherSummaries] = useState<Record<string, VoucherSummarySheet>>(() => {
    return Storage.getVoucherSummaries();
  });
  const [selectedVoucherNo, setSelectedVoucherNo] = useState<string>('VR-07');
  const [isEditingHeaderInfo, setIsEditingHeaderInfo] = useState(false);

  // Inline Cell Editing State for Master Ledger
  const [inlineEditingCell, setInlineEditingCell] = useState<{ rowId: string; field: keyof VRLedgerRow } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');

  // Inline Cell Editing State for Voucher Summary
  const [summaryInlineCell, setSummaryInlineCell] = useState<{ itemId: string; field: keyof VoucherSummaryItem } | null>(null);
  const [summaryCellValue, setSummaryCellValue] = useState<string>('');

  const activeProject = projects.find(
    p => p.id === (selectedProjectId === 'ALL' ? 'PRJ-AMT-01' : selectedProjectId)
  ) || projects[0];

  // Sync voucherSummaries to storage when changed
  const updateVoucherSheet = (updatedSheet: VoucherSummarySheet) => {
    const updated = {
      ...voucherSummaries,
      [updatedSheet.vrNo]: updatedSheet
    };
    setVoucherSummaries(updated);
    Storage.setVoucherSummaries(updated);
  };

  // Form State for Adding / Editing Master Ledger Row
  const [formData, setFormData] = useState<Partial<VRLedgerRow>>({
    id: '',
    sl: 1,
    vrNo: 'VR-10',
    date: '',
    projectId: activeProject.id,
    landOwnerInvestor: '',
    rajLabour: '',
    contractorJamal: '',
    bricks: '',
    sand: '',
    cement: '',
    rod: '',
    stone: '',
    sanitary: '',
    staffSalary: '',
    electric: '',
    utilityBill: '',
    engineerPailing: '',
    othersPayment: '',
    officeExpense: '',
    totalAmount: '',
    comments: '',
    status: 'Audited'
  });

  const filteredRows = vrLedger.filter(row => {
    const matchesProject = selectedProjectId === 'ALL' || row.projectId === selectedProjectId;
    const matchesSearch =
      row.vrNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (row.comments && row.comments.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesProject && matchesSearch;
  });

  // Calculate sum totals across all 15 numerical columns
  const parseNum = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val || val === '-') return 0;
    const clean = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const columnTotals = {
    landOwnerInvestor: filteredRows.reduce((s, r) => s + parseNum(r.landOwnerInvestor), 0),
    rajLabour: filteredRows.reduce((s, r) => s + parseNum(r.rajLabour), 0),
    contractorJamal: filteredRows.reduce((s, r) => s + parseNum(r.contractorJamal), 0),
    bricks: filteredRows.reduce((s, r) => s + parseNum(r.bricks), 0),
    sand: filteredRows.reduce((s, r) => s + parseNum(r.sand), 0),
    cement: filteredRows.reduce((s, r) => s + parseNum(r.cement), 0),
    rod: filteredRows.reduce((s, r) => s + parseNum(r.rod), 0),
    stone: filteredRows.reduce((s, r) => s + parseNum(r.stone), 0),
    sanitary: filteredRows.reduce((s, r) => s + parseNum(r.sanitary), 0),
    staffSalary: filteredRows.reduce((s, r) => s + parseNum(r.staffSalary), 0),
    electric: filteredRows.reduce((s, r) => s + parseNum(r.electric), 0),
    utilityBill: filteredRows.reduce((s, r) => s + parseNum(r.utilityBill), 0),
    engineerPailing: filteredRows.reduce((s, r) => s + parseNum(r.engineerPailing), 0),
    othersPayment: filteredRows.reduce((s, r) => s + parseNum(r.othersPayment), 0),
    officeExpense: filteredRows.reduce((s, r) => s + parseNum(r.officeExpense), 0),
    grandTotal: filteredRows.reduce((s, r) => s + parseNum(r.totalAmount), 0)
  };

  // Open modal for Adding a new row
  const handleOpenAdd = () => {
    const nextSl = vrLedger.length + 1;
    const nextVrNo = `VR-${String(nextSl).padStart(2, '0')}`;
    setEditingRow(null);
    setFormData({
      id: `VR-ROW-${Date.now()}`,
      sl: nextSl,
      vrNo: nextVrNo,
      date: '',
      projectId: activeProject.id,
      landOwnerInvestor: '',
      rajLabour: '',
      contractorJamal: '',
      bricks: '',
      sand: '',
      cement: '',
      rod: '',
      stone: '',
      sanitary: '',
      staffSalary: '',
      electric: '',
      utilityBill: '',
      engineerPailing: '',
      othersPayment: '',
      officeExpense: '',
      totalAmount: '',
      comments: '',
      status: 'Audited'
    });
    setIsModalOpen(true);
  };

  // Open modal for Editing a row
  const handleOpenEdit = (row: VRLedgerRow) => {
    setEditingRow(row);
    setFormData({ ...row });
    setIsModalOpen(true);
  };

  // Calculate row total from form inputs
  const calculateFormTotal = () => {
    return (
      parseNum(formData.landOwnerInvestor) +
      parseNum(formData.rajLabour) +
      parseNum(formData.contractorJamal) +
      parseNum(formData.bricks) +
      parseNum(formData.sand) +
      parseNum(formData.cement) +
      parseNum(formData.rod) +
      parseNum(formData.stone) +
      parseNum(formData.sanitary) +
      parseNum(formData.staffSalary) +
      parseNum(formData.electric) +
      parseNum(formData.utilityBill) +
      parseNum(formData.engineerPailing) +
      parseNum(formData.othersPayment) +
      parseNum(formData.officeExpense)
    );
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vrNo) {
      alert('Please enter VR No');
      return;
    }

    const calculatedSum = calculateFormTotal();
    const finalTotal = formData.totalAmount !== '' && formData.totalAmount !== undefined
      ? formData.totalAmount
      : calculatedSum > 0 ? calculatedSum : '-';

    const rowToSave: VRLedgerRow = {
      id: formData.id || `VR-ROW-${Date.now()}`,
      sl: Number(formData.sl) || filteredRows.length + 1,
      vrNo: formData.vrNo,
      date: formData.date || '',
      projectId: formData.projectId || activeProject.id,
      landOwnerInvestor: formData.landOwnerInvestor || '',
      rajLabour: formData.rajLabour || '',
      contractorJamal: formData.contractorJamal || '',
      bricks: formData.bricks || '',
      sand: formData.sand || '',
      cement: formData.cement || '',
      rod: formData.rod || '',
      stone: formData.stone || '',
      sanitary: formData.sanitary || '',
      staffSalary: formData.staffSalary || '',
      electric: formData.electric || '',
      utilityBill: formData.utilityBill || '',
      engineerPailing: formData.engineerPailing || '',
      othersPayment: formData.othersPayment || '',
      officeExpense: formData.officeExpense || '',
      totalAmount: finalTotal,
      comments: formData.comments || '',
      status: formData.status || 'Audited'
    };

    onSaveVRLedgerRow(rowToSave);
    setIsModalOpen(false);
  };

  // Inline Cell Save for Master Ledger
  const handleCommitInlineCell = (row: VRLedgerRow, field: keyof VRLedgerRow) => {
    if (!inlineEditingCell) return;
    const updatedRow = { ...row, [field]: cellValue };
    
    // Auto re-calculate total if one of the cost fields is edited
    const costFields: (keyof VRLedgerRow)[] = [
      'landOwnerInvestor', 'rajLabour', 'contractorJamal', 'bricks', 'sand', 'cement',
      'rod', 'stone', 'sanitary', 'staffSalary', 'electric', 'utilityBill', 'engineerPailing',
      'othersPayment', 'officeExpense'
    ];
    if (costFields.includes(field) && field !== 'totalAmount') {
      const sum = costFields.reduce((s, f) => s + parseNum(updatedRow[f]), 0);
      if (sum > 0) {
        updatedRow.totalAmount = sum;
      }
    }

    onSaveVRLedgerRow(updatedRow);
    setInlineEditingCell(null);
  };

  // Start inline cell edit
  const handleStartInlineEdit = (row: VRLedgerRow, field: keyof VRLedgerRow) => {
    if (userRole === 'project_manager') return;
    setInlineEditingCell({ rowId: row.id, field });
    setCellValue(String(row[field] ?? ''));
  };

  // Reset to original exact table from Image 1
  const handleResetToImage1Default = () => {
    if (confirm('Reset Master 19-Column Ledger back to the exact original data from Image 1?')) {
      Storage.setVRLedger(DEFAULT_VR_LEDGER);
      Storage.setVoucherSummaries(DEFAULT_VOUCHER_SUMMARIES);
      window.location.reload();
    }
  };

  // Master Ledger Excel Export
  const handleExportMasterExcel = () => {
    const exportData = filteredRows.map(r => ({
      'Date': r.date,
      'VR NO': r.vrNo,
      'Land woner+ Investor': r.landOwnerInvestor,
      'Raj & Labour contractor(Manik+Munna+Rofiq)': r.rajLabour,
      'Contrator (Jamal)': r.contractorJamal,
      'Bricks': r.bricks,
      'Sand': r.sand,
      'Cement': r.cement,
      'Rod': r.rod,
      'Stone': r.stone,
      'Sanitary items/Cotractor\'s bill': r.sanitary,
      'Staff salary': r.staffSalary,
      'Electric Items/cotractor\'s bill': r.electric,
      'Utility bill': r.utilityBill,
      'Engineer+ Pailing con.': r.engineerPailing,
      'Others Payment Etc.': r.othersPayment,
      'Office Expense': r.officeExpense,
      'TOTAL': r.totalAmount,
      'Comments': r.comments || ''
    }));

    // Add Grand Total row
    exportData.push({
      'Date': '',
      'VR NO': 'Grand Total',
      'Land woner+ Investor': columnTotals.landOwnerInvestor,
      'Raj & Labour contractor(Manik+Munna+Rofiq)': columnTotals.rajLabour,
      'Contrator (Jamal)': columnTotals.contractorJamal || '',
      'Bricks': columnTotals.bricks,
      'Sand': columnTotals.sand,
      'Cement': columnTotals.cement,
      'Rod': columnTotals.rod,
      'Stone': columnTotals.stone,
      'Sanitary items/Cotractor\'s bill': columnTotals.sanitary,
      'Staff salary': columnTotals.staffSalary,
      'Electric Items/cotractor\'s bill': columnTotals.electric,
      'Utility bill': columnTotals.utilityBill,
      'Engineer+ Pailing con.': columnTotals.engineerPailing,
      'Others Payment Etc.': columnTotals.othersPayment,
      'Office Expense': columnTotals.officeExpense || '-',
      'TOTAL': columnTotals.grandTotal,
      'Comments': ''
    });

    exportToExcel(`Assetted_Builders_Master_VR_Ledger_19Columns`, 'VR Master Ledger', exportData);
  };

  // Master Ledger Word Export
  const handleExportMasterWord = () => {
    const title = `${settings.name} — 19-Column Project Expense Ledger (VR-01 to VR-18)`;
    const rowsHtml = filteredRows
      .map(
        r => `
        <tr>
          <td>${r.date}</td>
          <td class="font-bold text-center">${r.vrNo}</td>
          <td class="text-right">${typeof r.landOwnerInvestor === 'number' ? formatBDT(r.landOwnerInvestor) : r.landOwnerInvestor}</td>
          <td class="text-right">${typeof r.rajLabour === 'number' ? formatBDT(r.rajLabour) : r.rajLabour}</td>
          <td class="text-right">${typeof r.contractorJamal === 'number' ? formatBDT(r.contractorJamal) : r.contractorJamal}</td>
          <td class="text-right">${typeof r.bricks === 'number' ? formatBDT(r.bricks) : r.bricks}</td>
          <td class="text-right">${typeof r.sand === 'number' ? formatBDT(r.sand) : r.sand}</td>
          <td class="text-right">${typeof r.cement === 'number' ? formatBDT(r.cement) : r.cement}</td>
          <td class="text-right">${typeof r.rod === 'number' ? formatBDT(r.rod) : r.rod}</td>
          <td class="text-right">${typeof r.stone === 'number' ? formatBDT(r.stone) : r.stone}</td>
          <td class="text-right">${typeof r.sanitary === 'number' ? formatBDT(r.sanitary) : r.sanitary}</td>
          <td class="text-right">${typeof r.staffSalary === 'number' ? formatBDT(r.staffSalary) : r.staffSalary}</td>
          <td class="text-right">${typeof r.electric === 'number' ? formatBDT(r.electric) : r.electric}</td>
          <td class="text-right">${typeof r.utilityBill === 'number' ? formatBDT(r.utilityBill) : r.utilityBill}</td>
          <td class="text-right">${typeof r.engineerPailing === 'number' ? formatBDT(r.engineerPailing) : r.engineerPailing}</td>
          <td class="text-right">${typeof r.othersPayment === 'number' ? formatBDT(r.othersPayment) : r.othersPayment}</td>
          <td class="text-right">${typeof r.officeExpense === 'number' ? formatBDT(r.officeExpense) : r.officeExpense}</td>
          <td class="text-right font-bold">${typeof r.totalAmount === 'number' ? formatBDT(r.totalAmount) : r.totalAmount}</td>
          <td>${r.comments || ''}</td>
        </tr>
      `
      )
      .join('');

    const contentHtml = `
      <table border="1" cellpadding="4" style="border-collapse: collapse; font-size: 8pt; width: 100%;">
        <thead>
          <tr style="color: #008000; font-weight: bold; background: #f8fafc;">
            <th>Date</th>
            <th>VR NO</th>
            <th>Land woner+ Investor</th>
            <th>Raj & Labour contractor</th>
            <th>Contrator (Jamal)</th>
            <th>Bricks</th>
            <th>Sand</th>
            <th>Cement</th>
            <th>Rod</th>
            <th>Stone</th>
            <th>Sanitary items</th>
            <th>Staff salary</th>
            <th>Electric Items</th>
            <th>Utility bill</th>
            <th>Engineer+ Pailing</th>
            <th>Others Payment</th>
            <th>Office Expense</th>
            <th>TOTAL</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="font-weight: bold; color: #dc2626; background: #fee2e2;">
            <td></td>
            <td>Grand Total</td>
            <td class="text-right">${formatBDT(columnTotals.landOwnerInvestor)}</td>
            <td class="text-right">${formatBDT(columnTotals.rajLabour)}</td>
            <td></td>
            <td class="text-right">${formatBDT(columnTotals.bricks)}</td>
            <td class="text-right">${formatBDT(columnTotals.sand)}</td>
            <td class="text-right">${formatBDT(columnTotals.cement)}</td>
            <td class="text-right">${formatBDT(columnTotals.rod)}</td>
            <td class="text-right">${formatBDT(columnTotals.stone)}</td>
            <td class="text-right">${formatBDT(columnTotals.sanitary)}</td>
            <td class="text-right">${formatBDT(columnTotals.staffSalary)}</td>
            <td class="text-right">${formatBDT(columnTotals.electric)}</td>
            <td class="text-right">${formatBDT(columnTotals.utilityBill)}</td>
            <td class="text-right">${formatBDT(columnTotals.engineerPailing)}</td>
            <td class="text-right">${formatBDT(columnTotals.othersPayment)}</td>
            <td class="text-center">-</td>
            <td class="text-right">${formatBDT(columnTotals.grandTotal)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 20px; font-weight: bold;">
        Grand Total In Words: ${convertAmountToWords(columnTotals.grandTotal)}
      </div>
    `;

    exportToWord('Assetted_Builders_19Columns_VR_Ledger', title, contentHtml, settings.name);
  };

  // --- VOUCHER SUMMARY / DEBIT SHEET (IMAGE 2) LOGIC ---
  const currentVoucherSheet: VoucherSummarySheet = voucherSummaries[selectedVoucherNo] || {
    id: `VS-${selectedVoucherNo}`,
    vrNo: selectedVoucherNo,
    voucherTitle: `ASSETED MASTER TOWER (${selectedVoucherNo.replace('VR-0', 'Voucher ').replace('VR-', 'Voucher ')})`,
    subtitle: 'Summary Sheet Debit',
    dateRange: 'As per milestone',
    items: [],
    totalAmount: 0
  };

  const handleUpdateCurrentVoucherItem = (itemId: string, field: keyof VoucherSummaryItem, value: any) => {
    const updatedItems = currentVoucherSheet.items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'totalAmount') {
          updated.totalAmount = Number(value) || 0;
        }
        return updated;
      }
      return item;
    });

    const newTotal = updatedItems.reduce((s, it) => s + (Number(it.totalAmount) || 0), 0);
    const updatedSheet: VoucherSummarySheet = {
      ...currentVoucherSheet,
      items: updatedItems,
      totalAmount: newTotal
    };

    updateVoucherSheet(updatedSheet);
  };

  const handleAddVoucherItem = () => {
    const nextSl = currentVoucherSheet.items.length + 1;
    const newItem: VoucherSummaryItem = {
      id: `vs-item-${Date.now()}`,
      sl: nextSl,
      details: '',
      quantity: '',
      totalAmount: 0,
      comments: ''
    };
    const updatedSheet = {
      ...currentVoucherSheet,
      items: [...currentVoucherSheet.items, newItem]
    };
    updateVoucherSheet(updatedSheet);
  };

  const handleDeleteVoucherItem = (itemId: string) => {
    const updatedItems = currentVoucherSheet.items
      .filter(it => it.id !== itemId)
      .map((it, idx) => ({ ...it, sl: idx + 1 }));
    const newTotal = updatedItems.reduce((s, it) => s + (Number(it.totalAmount) || 0), 0);
    updateVoucherSheet({
      ...currentVoucherSheet,
      items: updatedItems,
      totalAmount: newTotal
    });
  };

  const handleExportVoucherSummaryExcel = () => {
    const exportData = currentVoucherSheet.items.map(it => ({
      'Sl': it.sl,
      'Details(Item Purchase & Payment)': it.details,
      'Quantity': it.quantity || '',
      'Total Amount': it.totalAmount,
      'Comments': it.comments || ''
    }));

    exportData.push({
      'Sl': '' as any,
      'Details(Item Purchase & Payment)': 'Total',
      'Quantity': '0',
      'Total Amount': currentVoucherSheet.totalAmount,
      'Comments': ''
    });

    exportToExcel(
      `${currentVoucherSheet.voucherTitle.replace(/\s+/g, '_')}_Summary_Debit`,
      'Voucher Debit Sheet',
      exportData
    );
  };

  // Jump from row in master ledger directly to breakdown voucher sheet
  const handleJumpToVoucher = (vrNo: string) => {
    setSelectedVoucherNo(vrNo.trim());
    setActiveTab('voucher_summary');
  };

  // Format cell value helper
  const renderCellValue = (val: any, isRedText = false) => {
    if (val === undefined || val === '') return '';
    if (val === '-') return '-';
    if (typeof val === 'number') {
      return formatBDT(val);
    }
    // If it's a numeric string like "1000000" or "6046100"
    const parsed = Number(val);
    if (!isNaN(parsed) && String(val).trim() !== '') {
      return formatBDT(parsed);
    }
    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Main Navigation Header & Tab Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Official Financial Books & Debit Breakdown Sheets
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {activeTab === 'master_ledger'
              ? '19-Column Master Project Ledger (Image 1)'
              : `Voucher Breakdown Debit Sheet — ${currentVoucherSheet.vrNo} (Image 2)`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Assetted Builders Ltd. — 100% matched to original audited accounting documents. Click any cell to edit directly.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('master_ledger')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'master_ledger'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            19-Column Master Ledger (Sheet 1)
          </button>
          <button
            onClick={() => setActiveTab('voucher_summary')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'voucher_summary'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Voucher Summary Debit (Sheet 2)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 19-COLUMN MASTER EXCEL SHEET (EXACT REPLICA OF IMAGE 1)            */}
      {/* ========================================================================= */}
      {activeTab === 'master_ledger' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter rows by VR No, Date, or comments..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportMasterLedgerPDF(filteredRows, columnTotals, activeProject.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow-2xs"
                title="Download 19-Column Master Project Ledger as Landscape PDF"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" /> Download PDF (Landscape)
              </button>
              <button
                onClick={triggerPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Table
              </button>
              <button
                onClick={handleExportMasterExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 text-xs font-bold rounded-lg transition border border-emerald-300 shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel (.xlsx)
              </button>
              <button
                onClick={handleExportMasterWord}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 text-xs font-bold rounded-lg transition border border-indigo-200 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" /> Export Word
              </button>
              {userRole !== 'project_manager' && (
                <>
                  <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add VR Row
                  </button>
                  <button
                    onClick={handleResetToImage1Default}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition border border-slate-300"
                    title="Reset to original Image 1 values"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" /> Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Informational Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-950 p-2.5 rounded-lg text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-800 uppercase tracking-wide text-[10px] px-1.5 py-0.5 bg-emerald-200/70 rounded">
                Interactive Grid
              </span>
              <span>
                Double-click or click any cell to edit directly in-place. Click{' '}
                <strong className="underline">VR-01 through VR-09</strong> to view its individual debit voucher sheet.
              </span>
            </div>
            <div className="text-[11px] font-mono font-bold text-red-600">
              Grand Total: ৳ {formatBDT(columnTotals.grandTotal)}
            </div>
          </div>

          {/* EXACT IMAGE 1 TABLE (19 COLUMNS, GREEN HEADERS, BORDER-COLLAPSE, RED TEXT, RED GRAND TOTAL) */}
          <div className="bg-white rounded-xl border-2 border-slate-400 shadow-md overflow-hidden print-full-width">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-[11px] text-center whitespace-nowrap border-collapse min-w-[2200px] font-sans">
                {/* 19-Column Header with Exact Green Font Color matching Image 1 */}
                <thead className="bg-white border-b-2 border-black">
                  <tr className="text-[#008000] font-bold text-[12px] h-14">
                    <th className="border border-black px-2 py-2 w-32 sticky left-0 bg-white z-20">Date</th>
                    <th className="border border-black px-2 py-2 w-20 sticky left-32 bg-white z-20">VR NO</th>
                    <th className="border border-black px-2 py-2 min-w-[130px]">Land woner+ Investor</th>
                    <th className="border border-black px-2 py-2 min-w-[160px]">
                      Raj & Labour contractor<br />(Manik+Munna+Rofiq)
                    </th>
                    <th className="border border-black px-2 py-2 min-w-[120px]">Contrator<br />(Jamal)</th>
                    <th className="border border-black px-2 py-2 min-w-[100px]">Bricks</th>
                    <th className="border border-black px-2 py-2 min-w-[100px]">Sand</th>
                    <th className="border border-black px-2 py-2 min-w-[100px]">Cement</th>
                    <th className="border border-black px-2 py-2 min-w-[110px]">Rod</th>
                    <th className="border border-black px-2 py-2 min-w-[100px]">Stone</th>
                    <th className="border border-black px-2 py-2 min-w-[140px]">Sanitary items/Cotractor's bill</th>
                    <th className="border border-black px-2 py-2 min-w-[110px]">Staff salary</th>
                    <th className="border border-black px-2 py-2 min-w-[130px]">Electric Items/cotractor's bill</th>
                    <th className="border border-black px-2 py-2 min-w-[100px]">Utility bill</th>
                    <th className="border border-black px-2 py-2 min-w-[120px]">Engineer+ Pailing con.</th>
                    <th className="border border-black px-2 py-2 min-w-[120px]">Others Payment Etc.</th>
                    <th className="border border-black px-2 py-2 min-w-[100px]">Office Expense</th>
                    <th className="border border-black px-2 py-2 min-w-[120px] bg-slate-50 font-black">TOTAL</th>
                    <th className="border border-black px-2 py-2 min-w-[120px]">Comments</th>
                    <th className="border border-black px-2 py-2 w-16 no-print bg-slate-100 text-slate-700">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row, rIdx) => {
                    const isVR1 = row.vrNo.trim() === 'VR-01';
                    return (
                      <tr key={row.id} className="hover:bg-amber-50/50 transition-colors h-9">
                        {/* 1. Date */}
                        <td
                          className="border border-black px-2 py-1 text-slate-900 sticky left-0 bg-white z-10 cursor-pointer font-mono text-[11px]"
                          onClick={() => handleStartInlineEdit(row, 'date')}
                        >
                          {inlineEditingCell?.rowId === row.id && inlineEditingCell?.field === 'date' ? (
                            <input
                              autoFocus
                              type="text"
                              value={cellValue}
                              onChange={e => setCellValue(e.target.value)}
                              onBlur={() => handleCommitInlineCell(row, 'date')}
                              onKeyDown={e => e.key === 'Enter' && handleCommitInlineCell(row, 'date')}
                              className="w-full text-center px-1 py-0.5 border border-emerald-500 rounded bg-amber-50 font-mono text-xs"
                            />
                          ) : (
                            row.date || ''
                          )}
                        </td>

                        {/* 2. VR NO with Jump to Breakdown button */}
                        <td className="border border-black px-2 py-1 sticky left-32 bg-white z-10 font-bold text-slate-900">
                          <button
                            onClick={() => handleJumpToVoucher(row.vrNo)}
                            className="text-blue-700 hover:text-blue-900 underline font-bold flex items-center justify-center gap-1 mx-auto group"
                            title={`Click to view Breakdown Debit Sheet for ${row.vrNo}`}
                          >
                            <span>{row.vrNo}</span>
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </td>

                        {/* Helper cell renderer */}
                        {(
                          [
                            { field: 'landOwnerInvestor', label: 'Land woner' },
                            { field: 'rajLabour', label: 'Media' },
                            { field: 'contractorJamal', label: '' },
                            { field: 'bricks', label: 'Land Vhorat' },
                            { field: 'sand', label: 'Fast Advance' },
                            { field: 'cement', label: 'Rajuk' },
                            { field: 'rod', label: 'Drawing' },
                            { field: 'stone', label: 'Soilt test' },
                            { field: 'sanitary', label: 'Plan Pash' },
                            { field: 'staffSalary', label: 'Engener Shohel' },
                            { field: 'electric', label: 'Surest Line' },
                            { field: 'utilityBill', label: 'Etc.' },
                            { field: 'engineerPailing', label: 'Etc.Total=' },
                            { field: 'othersPayment', label: '' },
                            { field: 'officeExpense', label: '' }
                          ] as { field: keyof VRLedgerRow; label: string }[]
                        ).map(col => {
                          const isInline =
                            inlineEditingCell?.rowId === row.id && inlineEditingCell?.field === col.field;
                          const rawVal = row[col.field];
                          const isRedRow1Label = isVR1 && col.label !== '';

                          return (
                            <td
                              key={col.field}
                              onClick={() => handleStartInlineEdit(row, col.field)}
                              className={`border border-black px-2 py-1 text-right font-mono cursor-pointer relative ${
                                isRedRow1Label ? 'text-red-600 font-semibold' : 'text-slate-900'
                              } ${isInline ? 'bg-amber-100 ring-2 ring-emerald-500' : ''}`}
                            >
                              {isInline ? (
                                <input
                                  autoFocus
                                  type="text"
                                  value={cellValue}
                                  onChange={e => setCellValue(e.target.value)}
                                  onBlur={() => handleCommitInlineCell(row, col.field)}
                                  onKeyDown={e => e.key === 'Enter' && handleCommitInlineCell(row, col.field)}
                                  className="w-full text-right px-1 py-0.5 border border-emerald-500 rounded bg-white text-xs"
                                />
                              ) : isRedRow1Label ? (
                                <span className="text-red-600 font-bold">{col.label}</span>
                              ) : (
                                renderCellValue(rawVal)
                              )}
                            </td>
                          );
                        })}

                        {/* TOTAL */}
                        <td
                          onClick={() => handleStartInlineEdit(row, 'totalAmount')}
                          className="border border-black px-2 py-1 text-right font-mono font-bold bg-slate-50 text-slate-900 cursor-pointer"
                        >
                          {inlineEditingCell?.rowId === row.id && inlineEditingCell?.field === 'totalAmount' ? (
                            <input
                              autoFocus
                              type="text"
                              value={cellValue}
                              onChange={e => setCellValue(e.target.value)}
                              onBlur={() => handleCommitInlineCell(row, 'totalAmount')}
                              onKeyDown={e => e.key === 'Enter' && handleCommitInlineCell(row, 'totalAmount')}
                              className="w-full text-right px-1 py-0.5 border border-emerald-500 rounded bg-white text-xs font-bold"
                            />
                          ) : (
                            renderCellValue(row.totalAmount)
                          )}
                        </td>

                        {/* Comments */}
                        <td
                          onClick={() => handleStartInlineEdit(row, 'comments')}
                          className="border border-black px-2 py-1 text-left text-[10px] text-slate-600 cursor-pointer max-w-xs truncate"
                        >
                          {inlineEditingCell?.rowId === row.id && inlineEditingCell?.field === 'comments' ? (
                            <input
                              autoFocus
                              type="text"
                              value={cellValue}
                              onChange={e => setCellValue(e.target.value)}
                              onBlur={() => handleCommitInlineCell(row, 'comments')}
                              onKeyDown={e => e.key === 'Enter' && handleCommitInlineCell(row, 'comments')}
                              className="w-full px-1 py-0.5 border border-emerald-500 rounded bg-white text-xs"
                            />
                          ) : (
                            row.comments || ''
                          )}
                        </td>

                        {/* Row Actions */}
                        <td className="border border-black px-1 py-1 text-center no-print bg-slate-50">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="p-1 text-slate-400 hover:text-emerald-700 rounded"
                              title="Full Edit Row"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {userRole !== 'project_manager' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete ${row.vrNo}?`)) onDeleteVRLedgerRow(row.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* EXACT GRAND TOTAL FOOTER ROW FROM IMAGE 1 (RED BOLD FONT) */}
                <tfoot className="border-t-2 border-black bg-white">
                  <tr className="h-10 text-red-600 font-bold text-[12px]">
                    <td className="border border-black px-2 py-2 text-center sticky left-0 bg-white z-20">
                      Grand Total
                    </td>
                    <td className="border border-black px-2 py-2 text-center sticky left-32 bg-white z-20"></td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.landOwnerInvestor)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.rajLabour)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {columnTotals.contractorJamal > 0 ? formatBDT(columnTotals.contractorJamal) : ''}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.bricks)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.sand)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.cement)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.rod)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.stone)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.sanitary)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.staffSalary)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.electric)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.utilityBill)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.engineerPailing)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-mono">
                      {formatBDT(columnTotals.othersPayment)}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-mono">-</td>
                    <td className="border border-black px-2 py-2 text-right font-mono font-black text-[13px] bg-red-50">
                      {formatBDT(columnTotals.grandTotal)}
                    </td>
                    <td className="border border-black px-2 py-2"></td>
                    <td className="border border-black px-2 py-2 no-print bg-slate-50"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* In Words Reconciled Banner */}
            <div className="p-4 bg-slate-50 border-t-2 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-700">Grand Total In Words: </span>
                <span className="italic font-bold text-red-600">
                  {convertAmountToWords(columnTotals.grandTotal)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Assetted Builders Ltd. Master Project Ledger • Exactly matches Image 1
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VOUCHER BREAKDOWN DEBIT SHEET (EXACT REPLICA OF IMAGE 2 - VOUCHER 7) */}
      {/* ========================================================================= */}
      {activeTab === 'voucher_summary' && (
        <div className="space-y-4">
          {/* Voucher Selector and Actions Strip */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Select Voucher Sheet:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['VR-01', 'VR-02', 'VR-03', 'VR-04', 'VR-05', 'VR-06', 'VR-07', 'VR-08', 'VR-09'].map(vr => (
                  <button
                    key={vr}
                    onClick={() => setSelectedVoucherNo(vr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                      selectedVoucherNo === vr
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {vr}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportVoucherSummaryPDF(currentVoucherSheet)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg transition shadow-2xs"
                title={`Download ${currentVoucherSheet.vrNo} Debit Breakdown as PDF`}
              >
                <Download className="w-3.5 h-3.5 text-amber-300" /> Download PDF
              </button>
              <button
                onClick={triggerPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Sheet
              </button>
              <button
                onClick={handleExportVoucherSummaryExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-sky-700 text-xs font-bold rounded-lg transition border border-sky-300 shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
              </button>
              {userRole !== 'project_manager' && (
                <button
                  onClick={handleAddVoucherItem}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item Row
                </button>
              )}
            </div>
          </div>

          {/* EXACT IMAGE 2 CANVAS (CONTAINER WITH EXCEL SHEET LAYOUT) */}
          <div className="bg-white p-6 sm:p-10 rounded-2xl border-2 border-slate-300 shadow-lg max-w-5xl mx-auto print-full-width">
            {/* Header Title: "ASSETED MASTER TOWER (Voucher 7)" */}
            <div className="text-center pb-4">
              <div className="inline-block relative">
                {isEditingHeaderInfo ? (
                  <input
                    type="text"
                    value={currentVoucherSheet.voucherTitle}
                    onChange={e =>
                      updateVoucherSheet({ ...currentVoucherSheet, voucherTitle: e.target.value })
                    }
                    className="text-center font-bold text-xl md:text-2xl text-black border-b-2 border-sky-500 outline-hidden px-2 py-0.5"
                  />
                ) : (
                  <h2 className="text-xl md:text-2xl font-bold text-black tracking-wide uppercase">
                    {currentVoucherSheet.voucherTitle}
                  </h2>
                )}
              </div>
            </div>

            {/* Subheaders: "5th floor Summary Sheet Debit-2026" on Left, Date on Right */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-3 pt-2 text-sm text-black">
              <div>
                {isEditingHeaderInfo ? (
                  <input
                    type="text"
                    value={currentVoucherSheet.subtitle}
                    onChange={e =>
                      updateVoucherSheet({ ...currentVoucherSheet, subtitle: e.target.value })
                    }
                    className="font-bold italic text-base border-b border-sky-500 outline-hidden"
                  />
                ) : (
                  <span className="font-bold italic text-base">{currentVoucherSheet.subtitle}</span>
                )}
              </div>

              <div className="text-right mt-2 sm:mt-0 font-medium text-xs sm:text-sm">
                <span>Date: </span>
                {isEditingHeaderInfo ? (
                  <input
                    type="text"
                    value={currentVoucherSheet.dateRange}
                    onChange={e =>
                      updateVoucherSheet({ ...currentVoucherSheet, dateRange: e.target.value })
                    }
                    className="font-medium text-xs sm:text-sm border-b border-sky-500 outline-hidden"
                  />
                ) : (
                  <span className="font-mono">{currentVoucherSheet.dateRange}</span>
                )}
              </div>
            </div>

            {/* Toggle Header Edit Button */}
            <div className="no-print flex justify-end pb-2">
              <button
                onClick={() => setIsEditingHeaderInfo(!isEditingHeaderInfo)}
                className="text-[11px] text-sky-700 hover:underline font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                {isEditingHeaderInfo ? 'Done Editing Header' : 'Edit Title / Date'}
              </button>
            </div>

            {/* THE DEBIT SHEET TABLE (MATCHING IMAGE 2 EXACTLY) */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border-2 border-black font-sans">
                {/* Blue header text matching Image 2 */}
                <thead>
                  <tr className="text-[#0284c7] font-bold text-center h-8 bg-white">
                    <th className="border border-black px-2 py-1.5 w-12 text-[#0284c7]">Sl</th>
                    <th className="border border-black px-3 py-1.5 text-center text-[#0284c7] min-w-[320px]">
                      Details(Item Purchase & Payment)
                    </th>
                    <th className="border border-black px-3 py-1.5 w-36 text-center text-[#0284c7]">Quantity</th>
                    <th className="border border-black px-3 py-1.5 w-36 text-center text-[#0284c7]">Total Amount</th>
                    <th className="border border-black px-3 py-1.5 w-36 text-center text-[#0284c7]">Comments</th>
                    <th className="border border-black px-2 py-1.5 w-14 no-print text-slate-500">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Items 1 to 16 matching Image 2 */}
                  {Array.from({ length: Math.max(16, currentVoucherSheet.items.length) }).map((_, index) => {
                    const item = currentVoucherSheet.items[index];
                    const slNumber = index + 1;

                    return (
                      <tr key={item?.id || `blank-${index}`} className="h-7 hover:bg-sky-50/40">
                        {/* Sl */}
                        <td className="border border-black px-2 py-1 text-center font-bold text-black">
                          {slNumber}
                        </td>

                        {/* Details */}
                        <td className="border border-black px-3 py-1 text-left font-medium text-black">
                          {item ? (
                            <input
                              type="text"
                              value={item.details}
                              onChange={e =>
                                handleUpdateCurrentVoucherItem(item.id, 'details', e.target.value)
                              }
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 px-1 py-0.5 rounded text-xs"
                              placeholder="Enter item details..."
                            />
                          ) : (
                            <span className="text-slate-300"></span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="border border-black px-2 py-1 text-center text-black">
                          {item ? (
                            <input
                              type="text"
                              value={item.quantity || ''}
                              onChange={e =>
                                handleUpdateCurrentVoucherItem(item.id, 'quantity', e.target.value)
                              }
                              className="w-full bg-transparent text-center border-0 focus:ring-1 focus:ring-sky-500 px-1 py-0.5 rounded text-xs"
                              placeholder=""
                            />
                          ) : null}
                        </td>

                        {/* Total Amount */}
                        <td className="border border-black px-3 py-1 text-right font-mono font-medium text-black">
                          {item ? (
                            <input
                              type="number"
                              value={item.totalAmount || ''}
                              onChange={e =>
                                handleUpdateCurrentVoucherItem(item.id, 'totalAmount', e.target.value)
                              }
                              className="w-full bg-transparent text-right border-0 focus:ring-1 focus:ring-sky-500 px-1 py-0.5 rounded text-xs font-mono font-semibold"
                              placeholder="0"
                            />
                          ) : null}
                        </td>

                        {/* Comments */}
                        <td className="border border-black px-2 py-1 text-left text-black">
                          {item ? (
                            <input
                              type="text"
                              value={item.comments || ''}
                              onChange={e =>
                                handleUpdateCurrentVoucherItem(item.id, 'comments', e.target.value)
                              }
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-sky-500 px-1 py-0.5 rounded text-xs"
                              placeholder=""
                            />
                          ) : null}
                        </td>

                        {/* Actions */}
                        <td className="border border-black px-1 py-1 text-center no-print">
                          {item && userRole !== 'project_manager' && (
                            <button
                              onClick={() => handleDeleteVoucherItem(item.id)}
                              className="text-slate-300 hover:text-rose-600 transition p-0.5"
                              title="Delete Item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Total Footer Row matching Image 2 */}
                <tfoot>
                  <tr className="h-8 font-bold text-black border-t-2 border-black">
                    <td colSpan={2} className="border border-black px-4 py-1.5 text-center font-bold text-sm">
                      Total
                    </td>
                    <td className="border border-black px-2 py-1.5 text-center font-bold text-sm">
                      0
                    </td>
                    <td className="border border-black px-3 py-1.5 text-right font-mono font-bold text-sm">
                      {formatBDT(currentVoucherSheet.totalAmount)}
                    </td>
                    <td className="border border-black px-2 py-1.5"></td>
                    <td className="border border-black px-1 py-1.5 no-print"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom In Words and Auditor Signature line */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-700 gap-4">
              <div>
                <span className="font-bold">Total In Words: </span>
                <span className="italic font-semibold text-slate-900">
                  {convertAmountToWords(currentVoucherSheet.totalAmount)}
                </span>
              </div>
              <div className="flex gap-10 pt-6 sm:pt-0">
                <div className="text-center">
                  <div className="w-32 border-b border-black mb-1"></div>
                  <span className="text-[11px] font-semibold text-slate-600">Prepared By</span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-black mb-1"></div>
                  <span className="text-[11px] font-semibold text-slate-600">Approved By</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FOR ADDING / EDITING MASTER LEDGER ROW                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                {editingRow ? `Edit Master Ledger Row — ${editingRow.vrNo}` : 'Add Master Ledger Row'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">VR NO *</label>
                  <input
                    type="text"
                    required
                    value={formData.vrNo}
                    onChange={e => setFormData({ ...formData, vrNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                    placeholder="VR-01"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date Range *</label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="e.g. 10.12.2025 to 20.02.2026"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Comments</label>
                  <input
                    type="text"
                    value={formData.comments}
                    onChange={e => setFormData({ ...formData, comments: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Remarks / Note"
                  />
                </div>
              </div>

              {/* 15 Numerical Cost Columns */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Enter Amounts Across 15 Ledger Columns (BDT):
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Land woner+ Investor</label>
                    <input
                      type="text"
                      value={formData.landOwnerInvestor ?? ''}
                      onChange={e => setFormData({ ...formData, landOwnerInvestor: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Raj & Labour contractor</label>
                    <input
                      type="text"
                      value={formData.rajLabour ?? ''}
                      onChange={e => setFormData({ ...formData, rajLabour: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Contrator (Jamal)</label>
                    <input
                      type="text"
                      value={formData.contractorJamal ?? ''}
                      onChange={e => setFormData({ ...formData, contractorJamal: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate font-semibold text-slate-900">
                      Bricks
                    </label>
                    <input
                      type="text"
                      value={formData.bricks ?? ''}
                      onChange={e => setFormData({ ...formData, bricks: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Sand</label>
                    <input
                      type="text"
                      value={formData.sand ?? ''}
                      onChange={e => setFormData({ ...formData, sand: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate font-semibold text-slate-900">
                      Cement
                    </label>
                    <input
                      type="text"
                      value={formData.cement ?? ''}
                      onChange={e => setFormData({ ...formData, cement: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate font-bold text-slate-900">
                      Rod
                    </label>
                    <input
                      type="text"
                      value={formData.rod ?? ''}
                      onChange={e => setFormData({ ...formData, rod: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Stone</label>
                    <input
                      type="text"
                      value={formData.stone ?? ''}
                      onChange={e => setFormData({ ...formData, stone: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Sanitary items</label>
                    <input
                      type="text"
                      value={formData.sanitary ?? ''}
                      onChange={e => setFormData({ ...formData, sanitary: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Staff salary</label>
                    <input
                      type="text"
                      value={formData.staffSalary ?? ''}
                      onChange={e => setFormData({ ...formData, staffSalary: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Electric Items</label>
                    <input
                      type="text"
                      value={formData.electric ?? ''}
                      onChange={e => setFormData({ ...formData, electric: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Utility bill</label>
                    <input
                      type="text"
                      value={formData.utilityBill ?? ''}
                      onChange={e => setFormData({ ...formData, utilityBill: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Engineer+ Pailing con.</label>
                    <input
                      type="text"
                      value={formData.engineerPailing ?? ''}
                      onChange={e => setFormData({ ...formData, engineerPailing: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Others Payment</label>
                    <input
                      type="text"
                      value={formData.othersPayment ?? ''}
                      onChange={e => setFormData({ ...formData, othersPayment: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[11px] truncate">Office Expense</label>
                    <input
                      type="text"
                      value={formData.officeExpense ?? ''}
                      onChange={e => setFormData({ ...formData, officeExpense: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-700">Calculated Sum: ৳ {formatBDT(calculateFormTotal())}</span>
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-900">Total (BDT):</label>
                    <input
                      type="text"
                      value={formData.totalAmount ?? ''}
                      onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder={`Calculated: ${calculateFormTotal()}`}
                      className="w-40 px-3 py-1.5 border border-emerald-500 rounded font-bold font-mono text-emerald-800 bg-emerald-50 text-right text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition"
                >
                  {editingRow ? 'Update Row' : 'Save Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
