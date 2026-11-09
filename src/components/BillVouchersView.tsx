import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Printer,
  FileSpreadsheet,
  Download,
  Eye,
  PlusCircle,
  X,
  CheckCircle,
  Building
} from 'lucide-react';
import { BillVoucher, VoucherItem, Project, CompanySettings, UserRole } from '../types';
import { formatBDT, convertAmountToWords } from '../utils/numberToWords';
import { exportToExcel, exportToWord, triggerPrint, exportBillVoucherPDF } from '../utils/exportUtils';

interface BillVouchersViewProps {
  vouchers: BillVoucher[];
  projects: Project[];
  settings: CompanySettings;
  userRole: UserRole;
  selectedProjectId: string;
  onSaveVoucher: (voucher: BillVoucher) => void;
  onDeleteVoucher: (voucherId: string) => void;
}

export const BillVouchersView: React.FC<BillVouchersViewProps> = ({
  vouchers,
  projects,
  settings,
  userRole,
  selectedProjectId,
  onSaveVoucher,
  onDeleteVoucher
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVoucherForPreview, setActiveVoucherForPreview] = useState<BillVoucher | null>(
    vouchers[0] || null
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<BillVoucher | null>(null);

  // Form State
  const [formVoucherNo, setFormVoucherNo] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formName, setFormName] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formProjectId, setFormProjectId] = useState(projects[0]?.id || 'PRJ-AMT-01');
  const [formContactNumber, setFormContactNumber] = useState('');
  const [formReceivedBy, setFormReceivedBy] = useState('');
  const [formApprovedBy, setFormApprovedBy] = useState('Managing Director');
  const [formIsLandOwner, setFormIsLandOwner] = useState(false);
  const [formTotalLandPrice, setFormTotalLandPrice] = useState<number | undefined>(undefined);
  const [formRemarks, setFormRemarks] = useState('');
  const [formItems, setFormItems] = useState<VoucherItem[]>([
    {
      id: 'vi-1',
      sl: 1,
      date: new Date().toISOString().slice(0, 10),
      particulars: '',
      amount: 0
    }
  ]);

  const filteredVouchers = vouchers.filter(v => {
    const matchesProject = selectedProjectId === 'ALL' || v.projectId === selectedProjectId;
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.items.some(i => i.particulars.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesProject && matchesSearch;
  });

  const handleOpenCreate = () => {
    const nextIndex = vouchers.length + 1;
    const nextVoucherNo = `BV-2026-${String(nextIndex).padStart(4, '0')}`;
    setEditingVoucher(null);
    setFormVoucherNo(nextVoucherNo);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormName('');
    setFormDesignation('');
    setFormProjectId(selectedProjectId !== 'ALL' ? selectedProjectId : (projects[0]?.id || ''));
    setFormContactNumber('');
    setFormReceivedBy('');
    setFormApprovedBy('Managing Director');
    setFormIsLandOwner(false);
    setFormTotalLandPrice(undefined);
    setFormRemarks('');
    setFormItems([
      {
        id: `vi-${Date.now()}-1`,
        sl: 1,
        date: new Date().toISOString().slice(0, 10),
        particulars: '',
        amount: 0
      }
    ]);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (voucher: BillVoucher) => {
    setEditingVoucher(voucher);
    setFormVoucherNo(voucher.voucherNo);
    setFormDate(voucher.date);
    setFormName(voucher.name);
    setFormDesignation(voucher.designation);
    setFormProjectId(voucher.projectId);
    setFormContactNumber(voucher.contactNumber);
    setFormReceivedBy(voucher.receivedBy);
    setFormApprovedBy(voucher.approvedBy);
    setFormIsLandOwner(voucher.isLandOwnerVoucher);
    setFormTotalLandPrice(voucher.totalLandPrice);
    setFormRemarks(voucher.remarks || '');
    setFormItems(voucher.items.length > 0 ? [...voucher.items] : [
      {
        id: `vi-${Date.now()}`,
        sl: 1,
        date: voucher.date,
        particulars: '',
        amount: 0
      }
    ]);
    setIsEditorOpen(true);
  };

  const handleAddItemRow = () => {
    setFormItems([
      ...formItems,
      {
        id: `vi-${Date.now()}-${formItems.length + 1}`,
        sl: formItems.length + 1,
        date: formDate,
        particulars: '',
        amount: 0
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length === 1) return;
    const updated = formItems.filter((_, idx) => idx !== index).map((item, idx) => ({
      ...item,
      sl: idx + 1
    }));
    setFormItems(updated);
  };

  const handleItemChange = (index: number, field: keyof VoucherItem, value: any) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      [field]: field === 'amount' ? Number(value) || 0 : value
    };
    setFormItems(updated);
  };

  const calculatedTotal = formItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const calculatedDue = formIsLandOwner && formTotalLandPrice
    ? Math.max(0, formTotalLandPrice - calculatedTotal)
    : undefined;

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formVoucherNo) {
      alert('Please fill in Voucher No and Recipient Name');
      return;
    }

    const totalAmt = calculatedTotal;
    const words = convertAmountToWords(totalAmt);

    const savedVoucher: BillVoucher = {
      id: editingVoucher ? editingVoucher.id : `VOUCHER-${Date.now()}`,
      voucherNo: formVoucherNo,
      date: formDate,
      name: formName,
      designation: formDesignation,
      projectId: formProjectId,
      contactNumber: formContactNumber,
      items: formItems,
      totalAmount: totalAmt,
      amountInWords: words,
      receivedBy: formReceivedBy || formName,
      approvedBy: formApprovedBy || 'Managing Director',
      isLandOwnerVoucher: formIsLandOwner,
      totalLandPrice: formIsLandOwner ? formTotalLandPrice : undefined,
      totalPaymentReceived: formIsLandOwner ? totalAmt : undefined,
      outstandingDue: calculatedDue,
      remarks: formRemarks
    };

    onSaveVoucher(savedVoucher);
    setActiveVoucherForPreview(savedVoucher);
    setIsEditorOpen(false);
  };

  const handleDelete = (voucher: BillVoucher) => {
    if (confirm(`Are you sure you want to delete Voucher ${voucher.voucherNo} for ${voucher.name}?`)) {
      onDeleteVoucher(voucher.id);
      if (activeVoucherForPreview?.id === voucher.id) {
        const remaining = vouchers.filter(v => v.id !== voucher.id);
        setActiveVoucherForPreview(remaining[0] || null);
      }
    }
  };

  // Export functions
  const handleExportExcel = (voucher: BillVoucher) => {
    const proj = projects.find(p => p.id === voucher.projectId);
    const exportRows = voucher.items.map((item, idx) => ({
      'Voucher No': voucher.voucherNo,
      'Date': voucher.date,
      'Recipient Name': voucher.name,
      'Designation': voucher.designation,
      'Project': proj?.name || voucher.projectId,
      'Contact': voucher.contactNumber,
      'SL': idx + 1,
      'Particulars': item.particulars,
      'Amount (BDT)': item.amount,
      'Total Amount': voucher.totalAmount,
      'Amount In Words': voucher.amountInWords,
      'Received By': voucher.receivedBy,
      'Approved By': voucher.approvedBy,
      'Total Land Price': voucher.totalLandPrice || '-',
      'Outstanding Due': voucher.outstandingDue || '-'
    }));

    exportToExcel(`Voucher_${voucher.voucherNo}`, 'Bill Voucher', exportRows);
  };

  const handleExportWord = (voucher: BillVoucher) => {
    const proj = projects.find(p => p.id === voucher.projectId);
    const itemsHtml = voucher.items
      .map(
        item => `
        <tr>
          <td class="text-center">${item.sl}</td>
          <td>${item.date}</td>
          <td>${item.particulars}</td>
          <td class="text-right font-bold">৳ ${formatBDT(item.amount)}</td>
        </tr>
      `
      )
      .join('');

    const landOwnerSummary = voucher.isLandOwnerVoucher
      ? `
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; margin-top: 15px; font-size: 10pt;">
        <div><strong>Total Land Price:</strong> ৳ ${formatBDT(voucher.totalLandPrice || 0)}</div>
        <div><strong>Total Payment Received:</strong> ৳ ${formatBDT(voucher.totalPaymentReceived || 0)}</div>
        <div style="color: #b91c1c; font-weight: bold; margin-top: 4px;">Outstanding Due: ৳ ${formatBDT(voucher.outstandingDue || 0)}</div>
      </div>
    `
      : '';

    const contentHtml = `
      <div style="margin-bottom: 20px; font-size: 10pt;">
        <table style="border: none; margin: 0; width: 100%;">
          <tr>
            <td style="border: none; width: 50%;"><strong>Voucher No:</strong> ${voucher.voucherNo}</td>
            <td style="border: none; width: 50%; text-align: right;"><strong>Date:</strong> ${voucher.date}</td>
          </tr>
          <tr>
            <td style="border: none;"><strong>Name:</strong> ${voucher.name}</td>
            <td style="border: none; text-align: right;"><strong>Designation:</strong> ${voucher.designation}</td>
          </tr>
          <tr>
            <td style="border: none;"><strong>Project:</strong> ${proj?.name || ''}</td>
            <td style="border: none; text-align: right;"><strong>Contact Number:</strong> ${voucher.contactNumber}</td>
          </tr>
        </table>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">SL</th>
            <th style="width: 15%;">Date</th>
            <th>Particulars / Description</th>
            <th style="width: 20%; text-align: right;">Amount (BDT)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td colspan="3" class="text-right font-bold" style="background-color: #f1f5f9;">TOTAL AMOUNT:</td>
            <td class="text-right font-bold" style="background-color: #f1f5f9;">৳ ${formatBDT(voucher.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 15px; font-size: 10pt; background-color: #f8fafc; padding: 8px; border: 1px solid #cbd5e1;">
        <strong>In Words:</strong> ${voucher.amountInWords}
      </div>

      ${landOwnerSummary}

      <div class="footer-signatures" style="margin-top: 60px;">
        <div class="signature-box">
          ${voucher.receivedBy}<br>
          <span style="font-size: 8pt; color: #64748b; font-weight: normal;">Received By</span>
        </div>
        <div class="signature-box">
          ${voucher.approvedBy}<br>
          <span style="font-size: 8pt; color: #64748b; font-weight: normal;">Approved By</span>
        </div>
      </div>
    `;

    exportToWord(`Voucher_${voucher.voucherNo}`, `BILL VOUCHER - ${voucher.voucherNo}`, contentHtml, settings.name);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" /> Corporate Bill Voucher Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Produce official real estate payment vouchers matching company legal & audit standards
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {userRole !== 'project_manager' && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create Voucher
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Vouchers Explorer on Left, Live A4 Document on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Voucher Browser */}
        <div className="lg:col-span-4 space-y-3 no-print">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>All Vouchers ({filteredVouchers.length})</span>
              <span className="text-[11px] text-slate-400">Select to preview</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher #, name, particulars..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredVouchers.map(v => {
              const isSelected = activeVoucherForPreview?.id === v.id;
              const proj = projects.find(p => p.id === v.projectId);

              return (
                <div
                  key={v.id}
                  onClick={() => setActiveVoucherForPreview(v)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {v.voucherNo}
                    </span>
                    <span className="text-slate-400 text-[11px] font-medium">{v.date}</span>
                  </div>

                  <div className="mt-2 font-bold text-slate-900 text-sm">{v.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                    <span>{v.designation || 'Staff / Vendor'}</span>
                    <span className="font-semibold text-slate-700">{proj?.name || v.projectId}</span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">
                      {v.items.length} {v.items.length === 1 ? 'item' : 'items'}
                    </span>
                    <span className="font-extrabold text-slate-900 font-mono-numbers text-sm">
                      ৳ {formatBDT(v.totalAmount)}
                    </span>
                  </div>

                  {v.isLandOwnerVoucher && (
                    <div className="mt-1.5 text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200 flex justify-between">
                      <span>Landowner Due:</span>
                      <span>৳ {formatBDT(v.outstandingDue || 0)}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredVouchers.length === 0 && (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                No bill vouchers found. Click "Create Voucher" to make a new one.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Professional A4 Corporate Document Preview */}
        <div className="lg:col-span-8">
          {activeVoucherForPreview ? (
            <div className="space-y-4">
              {/* Document Action Toolbar */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-2 no-print">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Viewing: <span className="font-mono font-bold text-slate-900">{activeVoucherForPreview.voucherNo}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const proj = projects.find(p => p.id === activeVoucherForPreview.projectId);
                      exportBillVoucherPDF(activeVoucherForPreview, proj?.name);
                    }}
                    className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    title="Download Official Bill Voucher PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-white" /> Download PDF
                  </button>
                  <button
                    onClick={triggerPrint}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" /> Print A4 Voucher
                  </button>
                  <button
                    onClick={() => handleExportExcel(activeVoucherForPreview)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                  </button>
                  <button
                    onClick={() => handleExportWord(activeVoucherForPreview)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" /> Word (.doc)
                  </button>
                  {userRole !== 'project_manager' && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(activeVoucherForPreview)}
                        className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(activeVoucherForPreview)}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold"
                        title="Delete Voucher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* The Printed Voucher Canvas (Standard A4 Corporate Specification) */}
              <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-300 print-full-width text-slate-900 font-sans">
                {/* Company Branding Top Header */}
                <div className="border-b-2 border-slate-900 pb-5 mb-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={settings.logoUrl}
                        alt="Assetted Builders Logo"
                        className="h-16 w-auto object-contain"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-tight">
                          {settings.name}
                        </h1>
                        <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                          {settings.address}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Phone: {settings.phone} &nbsp;|&nbsp; Email: {settings.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Centered Document Banner */}
                  <div className="text-center mt-4">
                    <div className="inline-block px-8 py-1 bg-slate-900 text-amber-400 font-extrabold text-sm tracking-widest uppercase rounded-sm border border-slate-800">
                      BILL VOUCHER
                    </div>
                  </div>
                </div>

                {/* Voucher Meta Grid (Matching exact layout from reference PDF) */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mb-6 bg-slate-50/80 p-4 rounded-lg border border-slate-200">
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      Voucher No:
                    </span>
                    <span className="font-mono font-extrabold text-slate-950 text-sm">
                      {activeVoucherForPreview.voucherNo}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mr-2">
                      Date:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {activeVoucherForPreview.date}
                    </span>
                  </div>

                  <div className="flex">
                    <span className="w-28 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      Name:
                    </span>
                    <span className="font-bold text-slate-950 text-sm">
                      {activeVoucherForPreview.name}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mr-2">
                      Designation:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeVoucherForPreview.designation || '-'}
                    </span>
                  </div>

                  <div className="flex">
                    <span className="w-28 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      Project Name:
                    </span>
                    <span className="font-bold text-slate-900">
                      {projects.find(p => p.id === activeVoucherForPreview.projectId)?.name || activeVoucherForPreview.projectId}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mr-2">
                      Contact Number:
                    </span>
                    <span className="font-mono text-slate-800">
                      {activeVoucherForPreview.contactNumber || '-'}
                    </span>
                  </div>
                </div>

                {/* Particulars Transaction Table */}
                <table className="w-full text-xs border border-slate-300 mb-5">
                  <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 border border-slate-700 w-12 text-center">SL</th>
                      <th className="py-2.5 px-3 border border-slate-700 w-28 text-center">Date</th>
                      <th className="py-2.5 px-3 border border-slate-700 text-left">Particulars / Description</th>
                      <th className="py-2.5 px-3 border border-slate-700 w-36 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeVoucherForPreview.items.map((item, index) => (
                      <tr key={item.id} className="border-b border-slate-200">
                        <td className="py-2.5 px-3 border border-slate-200 text-center font-mono font-medium">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 border border-slate-200 text-center text-slate-600 font-mono">
                          {item.date || activeVoucherForPreview.date}
                        </td>
                        <td className="py-2.5 px-3 border border-slate-200 text-slate-900 font-medium">
                          {item.particulars}
                        </td>
                        <td className="py-2.5 px-3 border border-slate-200 text-right font-bold font-mono-numbers text-slate-950">
                          {formatBDT(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-800 font-bold">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-900">
                        Total Amount:
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold font-mono-numbers text-sm text-slate-950 border border-slate-300">
                        ৳ {formatBDT(activeVoucherForPreview.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Amount in Words */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs mb-6">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                    Amount in Words:
                  </span>
                  <span className="italic font-semibold text-slate-950">
                    {activeVoucherForPreview.amountInWords || convertAmountToWords(activeVoucherForPreview.totalAmount)}
                  </span>
                </div>

                {/* Landowner Specific Section if applicable (formula: Outstanding Due = Land Price - Payment Received) */}
                {activeVoucherForPreview.isLandOwnerVoucher && (
                  <div className="bg-amber-50/80 border border-amber-300 p-4 rounded-lg mb-8 text-xs">
                    <div className="font-bold text-amber-900 uppercase text-[10px] tracking-wider mb-2">
                      Land-Owner Account Reconciliation
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-slate-600 block text-[11px]">Total Land Price:</span>
                        <span className="font-bold text-slate-900 font-mono-numbers text-sm">
                          ৳ {formatBDT(activeVoucherForPreview.totalLandPrice || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[11px]">Total Payment Received:</span>
                        <span className="font-bold text-emerald-700 font-mono-numbers text-sm">
                          ৳ {formatBDT(activeVoucherForPreview.totalPaymentReceived || activeVoucherForPreview.totalAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[11px]">Outstanding Due:</span>
                        <span className="font-extrabold text-rose-700 font-mono-numbers text-sm">
                          ৳ {formatBDT(activeVoucherForPreview.outstandingDue || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signatures Footer */}
                <div className="grid grid-cols-2 gap-12 pt-16 text-xs text-center">
                  <div>
                    <div className="border-t border-slate-400 pt-1.5">
                      <div className="font-bold text-slate-950">{activeVoucherForPreview.receivedBy}</div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider">Received By (Signature)</div>
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 pt-1.5">
                      <div className="font-bold text-slate-950">{activeVoucherForPreview.approvedBy}</div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider">Approved By (Director)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a voucher from the list or create a new voucher.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Bill Voucher Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingVoucher ? 'Edit Bill Voucher' : 'Create New Bill Voucher'}
              </h2>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Voucher Number *</label>
                  <input
                    type="text"
                    required
                    value={formVoucherNo}
                    onChange={e => setFormVoucherNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Voucher Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
                  <select
                    value={formProjectId}
                    onChange={e => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                    placeholder="e.g. Babul / The Barik Brothers"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={e => setFormDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Care-Taker / Supplier / Land-Owner"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={formContactNumber}
                    onChange={e => setFormContactNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    placeholder="01700000000"
                  />
                </div>
              </div>

              {/* Dynamic Transaction Table Rows */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-800 text-xs">Voucher Particulars / Items:</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {formItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                      <span className="font-mono text-slate-400 w-6 text-center">{idx + 1}</span>
                      <input
                        type="date"
                        value={item.date}
                        onChange={e => handleItemChange(idx, 'date', e.target.value)}
                        className="px-2 py-1.5 border border-slate-200 rounded text-xs w-32"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Particulars / Description (e.g. August Salary-26)"
                        value={item.particulars}
                        onChange={e => handleItemChange(idx, 'particulars', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs"
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="Amount"
                        value={item.amount || ''}
                        onChange={e => handleItemChange(idx, 'amount', e.target.value)}
                        className="px-2 py-1.5 border border-slate-200 rounded text-xs w-28 font-mono font-bold text-right"
                      />
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Preview */}
                <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg font-bold">
                  <span className="text-slate-700">Calculated Grand Total:</span>
                  <span className="text-base text-slate-950 font-mono-numbers">
                    ৳ {formatBDT(calculatedTotal)}
                  </span>
                </div>

                <div className="text-[11px] italic text-slate-600 bg-amber-50/60 p-2 rounded border border-amber-200">
                  <strong>In Words:</strong> {convertAmountToWords(calculatedTotal)}
                </div>
              </div>

              {/* Land Owner Formula Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formIsLandOwner}
                    onChange={e => setFormIsLandOwner(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  Is this a Landowner Payment Voucher? (Calculates Outstanding Due = Total Land Price - Total Received)
                </label>

                {formIsLandOwner && (
                  <div className="grid grid-cols-2 gap-3 mt-3 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Total Agreed Land Price (BDT) *</label>
                      <input
                        type="number"
                        min="0"
                        value={formTotalLandPrice || ''}
                        onChange={e => setFormTotalLandPrice(Number(e.target.value) || undefined)}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg font-mono font-bold"
                        placeholder="e.g. 4558000"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Calculated Outstanding Due</label>
                      <div className="px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono font-extrabold text-rose-700 text-sm">
                        ৳ {formatBDT(calculatedDue || 0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Received By Name</label>
                  <input
                    type="text"
                    value={formReceivedBy}
                    onChange={e => setFormReceivedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Defaults to recipient name"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Approved By Name</label>
                  <input
                    type="text"
                    value={formApprovedBy}
                    onChange={e => setFormApprovedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Managing Director"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition"
                >
                  {editingVoucher ? 'Save Voucher Changes' : 'Generate Bill Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
