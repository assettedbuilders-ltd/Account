import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  CreditCard,
  Building,
  UserCheck,
  Calendar,
  Download
} from 'lucide-react';
import { CustomerPayment, Customer, Project, CompanySettings, UserRole } from '../types';
import { formatBDT, convertAmountToWords } from '../utils/numberToWords';
import { exportToExcel, exportToWord, triggerPrint, exportCustomerPaymentsPDF } from '../utils/exportUtils';
import { formatDateDDMMYYYY, toISODateInput } from '../utils/dateUtils';

interface CustomerPaymentsViewProps {
  payments: CustomerPayment[];
  customers: Customer[];
  projects: Project[];
  settings: CompanySettings;
  userRole: UserRole;
  selectedCustomerId: string | null;
  selectedProjectId: string;
  onSavePayment: (payment: CustomerPayment) => void;
  onDeletePayment: (paymentId: string) => void;
  onSelectCustomer: (customerId: string | null) => void;
}

export const CustomerPaymentsView: React.FC<CustomerPaymentsViewProps> = ({
  payments,
  customers,
  projects,
  settings,
  userRole,
  selectedCustomerId,
  selectedProjectId,
  onSavePayment,
  onDeletePayment,
  onSelectCustomer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CustomerPayment | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeMoneyReceipt, setActiveMoneyReceipt] = useState<CustomerPayment | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<CustomerPayment>>({
    id: '',
    customerId: selectedCustomerId || customers[0]?.id || '',
    projectId: selectedProjectId !== 'ALL' ? selectedProjectId : (projects[0]?.id || ''),
    mrNo: 'MR-2026-007',
    date: new Date().toISOString().slice(0, 10),
    installmentName: 'Monthly Installment',
    paymentMethod: 'Cheque',
    bankName: 'Eastern Bank Ltd.',
    chequeNo: '',
    chequeDate: '',
    amount: 500000,
    receivedBy: 'Chief Accounts Officer',
    remarks: ''
  });

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesProject = selectedProjectId === 'ALL' || p.projectId === selectedProjectId;
    const matchesCustomer = !selectedCustomerId || p.customerId === selectedCustomerId;
    const cust = customers.find(c => c.id === p.customerId);
    const matchesSearch =
      p.mrNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.installmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.chequeNo && p.chequeNo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesProject && matchesCustomer && matchesSearch;
  });

  // Filter customers by selected project ("J project coustomer oi project coustmer hobe")
  const projectCustomers = selectedProjectId === 'ALL'
    ? customers
    : customers.filter(c => c.projectId === selectedProjectId);

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);
  const activeProject = activeCustomer ? projects.find(p => p.id === activeCustomer.projectId) : null;

  // Selected customer statistics
  const customerPaymentsList = activeCustomer
    ? payments.filter(p => p.customerId === activeCustomer.id).sort((a, b) => (a.date > b.date ? 1 : -1))
    : [];

  const customerTotalPaid = customerPaymentsList.reduce((sum, p) => sum + p.amount, 0);
  const customerOutstanding = activeCustomer ? Math.max(0, activeCustomer.agreedPrice - customerTotalPaid) : 0;
  const customerPercentage = activeCustomer ? Math.min(100, Math.round((customerTotalPaid / activeCustomer.agreedPrice) * 100)) : 0;

  const handleOpenAdd = () => {
    const nextNum = payments.length + 1;
    const newMr = `MR-2026-${String(nextNum).padStart(3, '0')}`;
    const defaultCust = projectCustomers.find(c => c.id === selectedCustomerId) || projectCustomers[0] || customers[0];

    setEditingPayment(null);
    setFormData({
      id: `CPAY-${Date.now()}`,
      customerId: defaultCust?.id || '',
      projectId: defaultCust ? defaultCust.projectId : (selectedProjectId !== 'ALL' ? selectedProjectId : projects[0]?.id || 'PRJ-AMT-01'),
      mrNo: newMr,
      date: new Date().toISOString().slice(0, 10),
      installmentName: 'Installment Payment',
      paymentMethod: 'Cheque',
      bankName: 'City Bank Ltd.',
      chequeNo: '',
      chequeDate: new Date().toISOString().slice(0, 10),
      amount: 500000,
      receivedBy: 'Chief Accounts Officer',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (payment: CustomerPayment) => {
    setEditingPayment(payment);
    setFormData({ ...payment });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.mrNo || !formData.amount) {
      alert('Please fill in required fields (Customer, MR No, Amount)');
      return;
    }

    const custObj = customers.find(c => c.id === formData.customerId);

    const paymentToSave: CustomerPayment = {
      id: formData.id || `CPAY-${Date.now()}`,
      customerId: formData.customerId,
      projectId: custObj ? custObj.projectId : (formData.projectId || projects[0]?.id || ''),
      mrNo: formData.mrNo,
      date: formData.date || new Date().toISOString().slice(0, 10),
      installmentName: formData.installmentName || 'Installment Payment',
      paymentMethod: formData.paymentMethod as CustomerPayment['paymentMethod'] || 'Cash',
      bankName: formData.bankName || '',
      chequeNo: formData.chequeNo || '',
      chequeDate: formData.chequeDate || '',
      amount: Number(formData.amount) || 0,
      receivedBy: formData.receivedBy || 'Accounts Officer',
      remarks: formData.remarks || ''
    };

    onSavePayment(paymentToSave);
    setIsModalOpen(false);
  };

  const handleDelete = (payment: CustomerPayment) => {
    if (confirm(`Delete payment receipt ${payment.mrNo} for ৳ ${formatBDT(payment.amount)}?`)) {
      onDeletePayment(payment.id);
    }
  };

  const handleExportExcel = () => {
    let runningTotal = 0;
    const exportData = filteredPayments.map((p, idx) => {
      const cust = customers.find(c => c.id === p.customerId);
      const proj = projects.find(pr => pr.id === p.projectId);
      runningTotal += p.amount;

      return {
        'SL': idx + 1,
        'Date': p.date,
        'MR No': p.mrNo,
        'Customer Name': cust?.name || 'N/A',
        'Unit No': cust?.unitNo || 'N/A',
        'Project Name': proj?.name || 'N/A',
        'Particulars / Installment': p.installmentName,
        'Payment Method': p.paymentMethod,
        'Bank Name': p.bankName || '-',
        'Cheque No': p.chequeNo || '-',
        'Amount Paid (BDT)': p.amount,
        'Cumulative Paid (BDT)': runningTotal,
        'Received By': p.receivedBy,
        'Remarks': p.remarks || ''
      };
    });

    const filename = activeCustomer
      ? `Payment_Statement_${activeCustomer.name.replace(/\s+/g, '_')}`
      : 'Assetted_Builders_Customer_Payments_Ledger';

    exportToExcel(filename, 'Customer Payments', exportData);
  };

  const handleExportWord = () => {
    const title = activeCustomer
      ? `Customer Payment Statement - ${activeCustomer.name} (${activeCustomer.unitNo})`
      : 'Customer Payments & Money Receipts Summary';

    let runningTotal = 0;
    const rowsHtml = filteredPayments
      .map((p, idx) => {
        const cust = customers.find(c => c.id === p.customerId);
        runningTotal += p.amount;
        return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td>${p.date}</td>
            <td><strong>${p.mrNo}</strong></td>
            <td>${cust?.name || ''} (${cust?.unitNo || ''})</td>
            <td>${p.installmentName}</td>
            <td>${p.paymentMethod} ${p.chequeNo ? `(${p.chequeNo})` : ''}</td>
            <td class="text-right font-bold">৳ ${formatBDT(p.amount)}</td>
            <td class="text-right">৳ ${formatBDT(runningTotal)}</td>
          </tr>
        `;
      })
      .join('');

    const customerSummaryHeader = activeCustomer
      ? `
      <div style="background-color: #f1f5f9; padding: 12px; border: 1px solid #cbd5e1; margin-bottom: 15px;">
        <p><strong>Customer Name:</strong> ${activeCustomer.name} &nbsp;|&nbsp; <strong>Cell:</strong> ${activeCustomer.phone}</p>
        <p><strong>Project:</strong> ${activeProject?.name || ''} &nbsp;|&nbsp; <strong>Apartment:</strong> ${activeCustomer.unitNo} (${activeCustomer.sizeSqFt} Sq.Ft)</p>
        <p><strong>Total Agreed Price:</strong> ৳ ${formatBDT(activeCustomer.agreedPrice)} &nbsp;|&nbsp; <strong>Total Received:</strong> ৳ ${formatBDT(customerTotalPaid)} &nbsp;|&nbsp; <strong>Outstanding Due:</strong> ৳ ${formatBDT(customerOutstanding)}</p>
      </div>
      `
      : '';

    const contentHtml = `
      ${customerSummaryHeader}
      <table>
        <thead>
          <tr>
            <th>SL</th>
            <th>Date</th>
            <th>MR No</th>
            <th>Customer / Unit</th>
            <th>Installment Particulars</th>
            <th>Method</th>
            <th class="text-right">Amount</th>
            <th class="text-right">Cumulative</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="footer-signatures">
        <div class="signature-box">Prepared By (Accounts)</div>
        <div class="signature-box">Approved By (Director)</div>
      </div>
    `;

    exportToWord('Customer_Payment_Statement', title, contentHtml, settings.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" /> Customer Payment Ledger & Receipts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track flat booking advances, construction milestones, Money Receipts (MR), and balance dues
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => exportCustomerPaymentsPDF(filteredPayments, customers, projects, activeCustomer)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
            title="Download Customer Payments Statement as PDF"
          >
            <Download className="w-4 h-4 text-white" /> Download PDF
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Print Statement
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
          </button>
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-300"
          >
            <FileText className="w-4 h-4 text-indigo-600" /> Word
          </button>
          {userRole !== 'project_manager' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Payment
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector / Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700">Filter By Customer:</label>
          <select
            value={selectedCustomerId || 'ALL'}
            onChange={e => onSelectCustomer(e.target.value === 'ALL' ? null : e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">
              {selectedProjectId === 'ALL'
                ? `All Customers (${customers.length})`
                : `All Customers in ${projects.find(p => p.id === selectedProjectId)?.name || 'Project'} (${projectCustomers.length})`}
            </option>
            {projectCustomers.length === 0 ? (
              <option value="" disabled>No customers registered in this project</option>
            ) : (
              projectCustomers.map(c => {
                const proj = projects.find(p => p.id === c.projectId);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} — Unit {c.unitNo} [{proj?.name || c.projectId}] (ID: {c.id})
                  </option>
                );
              })
            )}
          </select>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search MR No, installment, cheque..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
          />
        </div>
      </div>

      {/* Active Customer Financial Balance Card (When a customer is filtered) */}
      {activeCustomer && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl p-5 text-white shadow-md border border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-700/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  {activeCustomer.id}
                </span>
                <h2 className="text-lg font-bold">{activeCustomer.name}</h2>
                <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-300 border border-slate-600">
                  Unit: {activeCustomer.unitNo} ({activeCustomer.sizeSqFt} Sq.Ft)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Project: {activeProject?.name} | Cell: {activeCustomer.phone} | Booking Date: {activeCustomer.bookingDate}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Printable Customer Statement
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400">Total Agreed Flat Price</span>
              <div className="text-xl font-bold font-mono-numbers text-white mt-1">
                ৳ {formatBDT(activeCustomer.agreedPrice)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Sale Agreement Value</div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400">Total Payments Received</span>
              <div className="text-xl font-bold font-mono-numbers text-emerald-400 mt-1">
                ৳ {formatBDT(customerTotalPaid)}
              </div>
              <div className="text-[11px] text-emerald-400/90 mt-0.5">{customerPercentage}% settled</div>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400">Current Outstanding Due</span>
              <div className="text-xl font-bold font-mono-numbers text-amber-400 mt-1">
                ৳ {formatBDT(customerOutstanding)}
              </div>
              <div className="text-[11px] text-amber-300/90 mt-0.5">Remaining to collect</div>
            </div>
          </div>

          {/* Progress meter */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Collection Progress</span>
              <span className="font-bold text-amber-400">{customerPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${customerPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">SL</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">MR No</th>
                <th className="py-3 px-4">Customer & Unit</th>
                <th className="py-3 px-4">Milestone / Installment</th>
                <th className="py-3 px-4">Method & Details</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-4">Received By</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((payment, idx) => {
                const cust = customers.find(c => c.id === payment.customerId);
                return (
                  <tr key={payment.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{payment.date}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {payment.mrNo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{cust?.name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-500">
                        {cust?.unitNo} ({cust?.floorNo})
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{payment.installmentName}</div>
                      {payment.remarks && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">{payment.remarks}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {payment.paymentMethod}
                      </span>
                      {payment.chequeNo && (
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                          {payment.bankName} - {payment.chequeNo}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600 font-mono-numbers text-sm whitespace-nowrap">
                      ৳ {formatBDT(payment.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{payment.receivedBy}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {userRole !== 'project_manager' && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(payment)}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded"
                            title="Edit Payment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(payment)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredPayments.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-right uppercase text-[11px] tracking-wider">
                    Total Filtered Collections:
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-mono-numbers text-sm">
                    ৳ {formatBDT(filteredPayments.reduce((s, p) => s + p.amount, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No customer payment records found matching your filters.
          </div>
        )}
      </div>

      {/* Add / Edit Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingPayment ? 'Edit Payment Receipt' : 'Record New Customer Payment'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Customer *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={e => {
                      const c = customers.find(item => item.id === e.target.value);
                      setFormData({
                        ...formData,
                        customerId: e.target.value,
                        projectId: c ? c.projectId : formData.projectId
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">-- Choose Customer --</option>
                    {(projectCustomers.length > 0 ? projectCustomers : customers).map(c => {
                      const p = projects.find(pr => pr.id === c.projectId);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} — Unit {c.unitNo} (ID: {c.id} | {p?.name || 'Project'})
                        </option>
                      );
                    })}
                  </select>
                  {formData.customerId && (
                    <div className="mt-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      Project: <strong>{projects.find(p => p.id === formData.projectId)?.name || formData.projectId}</strong>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Money Receipt (MR No) *</label>
                  <input
                    type="text"
                    required
                    value={formData.mrNo}
                    onChange={e => setFormData({ ...formData, mrNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                    placeholder="MR-2026-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as CustomerPayment['paymentMethod'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Pay Order">Pay Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Installment / Milestone Name *</label>
                <input
                  type="text"
                  required
                  value={formData.installmentName}
                  onChange={e => setFormData({ ...formData, installmentName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Booking Money / 1st Installment (Piling)"
                />
              </div>

              {formData.paymentMethod !== 'Cash' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                      placeholder="e.g. Dutch Bangla Bank Ltd."
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Cheque / TT No</label>
                    <input
                      type="text"
                      value={formData.chequeNo}
                      onChange={e => setFormData({ ...formData, chequeNo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono"
                      placeholder="DBBL-778891"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount (BDT) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700 text-sm"
                    placeholder="500000"
                  />
                  <div className="text-[10px] text-slate-500 mt-1 italic">
                    {convertAmountToWords(Number(formData.amount) || 0)}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Received By</label>
                  <input
                    type="text"
                    value={formData.receivedBy}
                    onChange={e => setFormData({ ...formData, receivedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Managing Director / Chief Accounts Officer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="Optional notes or milestone conditions"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                >
                  {editingPayment ? 'Update Payment' : 'Save Money Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Customer Payment Statement Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-slate-300 max-h-[92vh] overflow-y-auto print-full-width">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 no-print mb-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Print Preview: Official Customer Statement
              </span>
              <div className="flex gap-2">
                <button
                  onClick={triggerPrint}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Now
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img
                  src={settings.logoUrl}
                  alt="Assetted Builders"
                  className="h-14 w-auto object-contain"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="text-left">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {settings.name}
                  </h1>
                  <p className="text-xs text-slate-600 max-w-xl">
                    {settings.address}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    Phone: {settings.phone} | Email: {settings.email}
                  </p>
                </div>
              </div>
              <div className="inline-block mt-3 px-6 py-1 bg-slate-900 text-white font-bold text-sm tracking-wider uppercase rounded-full">
                Customer Payment & Balance Statement
              </div>
            </div>

            {/* Customer & Apartment Details */}
            {activeCustomer ? (
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-6">
                <div>
                  <div className="mb-1"><span className="text-slate-500 font-medium">Customer Name:</span> <strong className="text-slate-900">{activeCustomer.name}</strong></div>
                  <div className="mb-1"><span className="text-slate-500 font-medium">Customer ID:</span> <strong className="font-mono text-slate-900">{activeCustomer.id}</strong></div>
                  <div className="mb-1"><span className="text-slate-500 font-medium">Contact Phone:</span> {activeCustomer.phone}</div>
                  <div><span className="text-slate-500 font-medium">Present Address:</span> {activeCustomer.address}</div>
                </div>
                <div>
                  <div className="mb-1"><span className="text-slate-500 font-medium">Project Name:</span> <strong className="text-slate-900">{activeProject?.name}</strong></div>
                  <div className="mb-1"><span className="text-slate-500 font-medium">Apartment Unit:</span> <strong className="text-amber-700">{activeCustomer.unitNo}</strong> ({activeCustomer.sizeSqFt} Sq.Ft)</div>
                  <div className="mb-1"><span className="text-slate-500 font-medium">Floor Level:</span> {activeCustomer.floorNo}</div>
                  <div><span className="text-slate-500 font-medium">Agreement Date:</span> {activeCustomer.bookingDate}</div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded text-center text-xs text-slate-600 mb-6">
                Consolidated Customer Receipts Statement (All Active Buyers)
              </div>
            )}

            {/* Statement Table */}
            <table className="w-full text-xs text-left border border-slate-300 mb-6">
              <thead className="bg-slate-900 text-white uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border border-slate-700">SL</th>
                  <th className="py-2.5 px-3 border border-slate-700">Date</th>
                  <th className="py-2.5 px-3 border border-slate-700">MR No</th>
                  <th className="py-2.5 px-3 border border-slate-700">Particulars</th>
                  <th className="py-2.5 px-3 border border-slate-700">Method / Details</th>
                  <th className="py-2.5 px-3 border border-slate-700 text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, index) => (
                  <tr key={p.id} className="border-b border-slate-200">
                    <td className="py-2 px-3 border border-slate-200 text-center font-mono">{index + 1}</td>
                    <td className="py-2 px-3 border border-slate-200 font-medium">{p.date}</td>
                    <td className="py-2 px-3 border border-slate-200 font-bold font-mono">{p.mrNo}</td>
                    <td className="py-2 px-3 border border-slate-200">{p.installmentName}</td>
                    <td className="py-2 px-3 border border-slate-200">
                      {p.paymentMethod} {p.chequeNo ? `(${p.bankName} - ${p.chequeNo})` : ''}
                    </td>
                    <td className="py-2 px-3 border border-slate-200 text-right font-bold font-mono-numbers">
                      {formatBDT(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-bold bg-slate-100">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 border border-slate-300 text-right uppercase">
                    Total Payment Received:
                  </td>
                  <td className="py-2.5 px-3 border border-slate-300 text-right font-mono-numbers text-sm text-emerald-700">
                    ৳ {formatBDT(filteredPayments.reduce((s, p) => s + p.amount, 0))}
                  </td>
                </tr>
                {activeCustomer && (
                  <>
                    <tr>
                      <td colSpan={5} className="py-2 px-3 border border-slate-300 text-right uppercase text-slate-600">
                        Total Agreed Price:
                      </td>
                      <td className="py-2 px-3 border border-slate-300 text-right font-mono-numbers text-slate-900">
                        ৳ {formatBDT(activeCustomer.agreedPrice)}
                      </td>
                    </tr>
                    <tr className="bg-amber-50">
                      <td colSpan={5} className="py-2.5 px-3 border border-slate-300 text-right uppercase text-amber-900">
                        Outstanding Balance Due:
                      </td>
                      <td className="py-2.5 px-3 border border-slate-300 text-right font-mono-numbers text-sm text-amber-800">
                        ৳ {formatBDT(customerOutstanding)}
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>

            {/* Amount In Words */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs mb-10">
              <span className="font-bold text-slate-700">Total In Words: </span>
              <span className="italic text-slate-900">
                {convertAmountToWords(filteredPayments.reduce((s, p) => s + p.amount, 0))}
              </span>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                  Customer Signature
                </div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                  Accounts Department
                </div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                  Managing Director
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
