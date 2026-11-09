import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  Printer,
  Download,
  X
} from 'lucide-react';
import { Contractor, ContractorPayment, Project, UserRole, CompanySettings } from '../types';
import { formatBDT, convertAmountToWords } from '../utils/numberToWords';
import { exportToExcel, exportToWord, triggerPrint, exportContractorPaymentsPDF } from '../utils/exportUtils';

interface ContractorsViewProps {
  contractors: Contractor[];
  contractorPayments: ContractorPayment[];
  projects: Project[];
  settings: CompanySettings;
  userRole: UserRole;
  selectedProjectId: string;
  onSaveContractor: (contractor: Contractor) => void;
  onDeleteContractor: (id: string) => void;
  onSaveContractorPayment: (payment: ContractorPayment) => void;
  onDeleteContractorPayment: (id: string) => void;
}

export const ContractorsView: React.FC<ContractorsViewProps> = ({
  contractors,
  contractorPayments,
  projects,
  settings,
  userRole,
  selectedProjectId,
  onSaveContractor,
  onDeleteContractor,
  onSaveContractorPayment,
  onDeleteContractorPayment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);

  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Contractor Form State
  const [cFormData, setCFormData] = useState<Partial<Contractor>>({
    id: '',
    name: '',
    type: 'Civil Work',
    contactPerson: '',
    phone: '',
    address: '',
    projectId: selectedProjectId !== 'ALL' ? selectedProjectId : (projects[0]?.id || 'PRJ-AMT-01'),
    totalContractValue: 0,
    totalPaid: 0,
    balanceDue: 0,
    status: 'Active'
  });

  // Payment Form State
  const [pFormData, setPFormData] = useState<Partial<ContractorPayment>>({
    id: '',
    contractorId: '',
    projectId: selectedProjectId !== 'ALL' ? selectedProjectId : (projects[0]?.id || 'PRJ-AMT-01'),
    voucherNo: 'CPV-2026-04',
    date: new Date().toISOString().slice(0, 10),
    billParticulars: '',
    paymentMethod: 'Cheque',
    amount: 0,
    paidBy: 'Managing Director',
    notes: ''
  });

  const filteredContractors = contractors.filter(c => {
    const matchesProject = selectedProjectId === 'ALL' || c.projectId === selectedProjectId;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const activeContractor = contractors.find(c => c.id === selectedContractorId);
  const activeContractorBills = contractorPayments.filter(p => p.contractorId === selectedContractorId);

  const handleOpenAddContractor = () => {
    setEditingContractor(null);
    setCFormData({
      id: `CONT-${Date.now()}`,
      name: '',
      type: 'Rod & Steel',
      contactPerson: '',
      phone: '',
      address: '',
      projectId: selectedProjectId !== 'ALL' ? selectedProjectId : (projects[0]?.id || 'PRJ-AMT-01'),
      totalContractValue: 2000000,
      totalPaid: 0,
      balanceDue: 2000000,
      status: 'Active'
    });
    setIsContractorModalOpen(true);
  };

  const handleOpenEditContractor = (c: Contractor) => {
    setEditingContractor(c);
    setCFormData({ ...c });
    setIsContractorModalOpen(true);
  };

  const handleContractorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cFormData.name) {
      alert('Please fill in contractor company name');
      return;
    }

    const val = Number(cFormData.totalContractValue) || 0;
    const paid = Number(cFormData.totalPaid) || 0;
    const balance = Math.max(0, val - paid);

    const saved: Contractor = {
      id: editingContractor ? editingContractor.id : `CONT-${Date.now()}`,
      name: cFormData.name,
      type: (cFormData.type as any) || 'Civil Work',
      contactPerson: cFormData.contactPerson || '',
      phone: cFormData.phone || '',
      address: cFormData.address || '',
      projectId: cFormData.projectId || projects[0]?.id || 'PRJ-AMT-01',
      totalContractValue: val,
      totalPaid: paid,
      balanceDue: balance,
      status: (cFormData.status as any) || 'Active'
    };

    onSaveContractor(saved);
    setIsContractorModalOpen(false);
  };

  const handleOpenAddPayment = (contractor: Contractor) => {
    setSelectedContractorId(contractor.id);
    const nextNum = contractorPayments.length + 1;
    setPFormData({
      id: `CP-${Date.now()}`,
      contractorId: contractor.id,
      projectId: contractor.projectId,
      voucherNo: `CPV-2026-${String(nextNum).padStart(2, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      billParticulars: '',
      paymentMethod: 'Cheque',
      amount: 100000,
      paidBy: 'Managing Director',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pFormData.contractorId || !pFormData.amount) {
      alert('Please fill in required fields');
      return;
    }

    const payment: ContractorPayment = {
      id: pFormData.id || `CP-${Date.now()}`,
      contractorId: pFormData.contractorId,
      projectId: pFormData.projectId || projects[0]?.id || 'PRJ-AMT-01',
      voucherNo: pFormData.voucherNo || `CPV-${Date.now()}`,
      date: pFormData.date || new Date().toISOString().slice(0, 10),
      billParticulars: pFormData.billParticulars || 'Running Bill Settlement',
      paymentMethod: (pFormData.paymentMethod as any) || 'Cheque',
      amount: Number(pFormData.amount) || 0,
      paidBy: pFormData.paidBy || 'Managing Director',
      notes: pFormData.notes || ''
    };

    onSaveContractorPayment(payment);

    // Update contractor totalPaid and balanceDue automatically
    const targetContractor = contractors.find(c => c.id === payment.contractorId);
    if (targetContractor) {
      const newTotalPaid = targetContractor.totalPaid + payment.amount;
      const newBalance = Math.max(0, targetContractor.totalContractValue - newTotalPaid);
      onSaveContractor({
        ...targetContractor,
        totalPaid: newTotalPaid,
        balanceDue: newBalance
      });
    }

    setIsPaymentModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredContractors.map(c => {
      const proj = projects.find(p => p.id === c.projectId);
      return {
        'Contractor Name': c.name,
        'Trade / Specialty': c.type,
        'Project Name': proj?.name || c.projectId,
        'Contact Person': c.contactPerson,
        'Phone Number': c.phone,
        'Address': c.address,
        'Contract Value (BDT)': c.totalContractValue,
        'Total Paid (BDT)': c.totalPaid,
        'Balance Due (BDT)': c.balanceDue,
        'Status': c.status
      };
    });

    exportToExcel('Assetted_Builders_Contractors_Ledger', 'Contractors', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Contractors & Material Suppliers Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage head raj mistry, rod/cement suppliers, sanitary, electrical, and stone contracts
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportContractorPaymentsPDF(filteredContractors, contractorPayments, projects)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
            title="Download Contractor Accounts Ledger as PDF"
          >
            <Download className="w-4 h-4 text-white" /> Download PDF
          </button>
          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Print
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </button>
          {userRole !== 'project_manager' && (
            <button
              onClick={handleOpenAddContractor}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Contractor
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search contractors (e.g. Barik Brothers, Badsha, Manik, Jamal)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContractors.map(contractor => {
          const proj = projects.find(p => p.id === contractor.projectId);
          const percentSettled = Math.round((contractor.totalPaid / contractor.totalContractValue) * 100) || 0;

          return (
            <div
              key={contractor.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-400 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {contractor.type}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{contractor.name}</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    {contractor.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Contact: {contractor.contactPerson}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {contractor.phone}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {contractor.address}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Work Order:</span>
                    <span className="font-bold text-slate-900 font-mono-numbers">
                      ৳ {formatBDT(contractor.totalContractValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Paid:</span>
                    <span className="font-bold text-emerald-600 font-mono-numbers">
                      ৳ {formatBDT(contractor.totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-700 font-bold">Outstanding Balance:</span>
                    <span className="font-extrabold text-amber-700 font-mono-numbers">
                      ৳ {formatBDT(contractor.balanceDue)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${percentSettled}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedContractorId(contractor.id)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" /> View Bills History
                </button>

                <div className="flex items-center gap-1">
                  {userRole !== 'project_manager' && (
                    <>
                      <button
                        onClick={() => handleOpenAddPayment(contractor)}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px]"
                      >
                        Disburse Bill
                      </button>
                      <button
                        onClick={() => handleOpenEditContractor(contractor)}
                        className="p-1 text-slate-400 hover:text-indigo-600"
                        title="Edit Contractor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete contractor ${contractor.name}?`)) {
                            onDeleteContractor(contractor.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete Contractor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contractor Bill History Modal / Drawer */}
      {activeContractor && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-bold text-indigo-700">{activeContractor.type}</span>
                <h2 className="text-lg font-bold text-slate-900">{activeContractor.name}</h2>
                <p className="text-xs text-slate-500">Contact: {activeContractor.contactPerson} ({activeContractor.phone})</p>
              </div>
              <button onClick={() => setSelectedContractorId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-xs mb-4">
              <div>
                <span className="text-slate-500 block">Contract:</span>
                <span className="font-bold text-slate-900 font-mono-numbers">৳ {formatBDT(activeContractor.totalContractValue)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Disbursed:</span>
                <span className="font-bold text-emerald-600 font-mono-numbers">৳ {formatBDT(activeContractor.totalPaid)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Remaining Due:</span>
                <span className="font-extrabold text-amber-700 font-mono-numbers">৳ {formatBDT(activeContractor.balanceDue)}</span>
              </div>
            </div>

            <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
              Disbursed Running Bills & Payment Receipts
            </h3>

            {activeContractorBills.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                {activeContractorBills.map(bill => (
                  <div key={bill.id} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{bill.voucherNo} &bull; {bill.date}</div>
                      <div className="text-slate-600 mt-0.5">{bill.billParticulars}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{bill.paymentMethod} &bull; Paid By: {bill.paidBy}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono-numbers">৳ {formatBDT(bill.amount)}</div>
                      {userRole !== 'project_manager' && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this payment record?')) {
                              onDeleteContractorPayment(bill.id);
                            }
                          }}
                          className="text-[10px] text-rose-500 hover:underline mt-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                No payment disbursements recorded yet for this contractor.
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => handleOpenAddPayment(activeContractor)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
              >
                Record New Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Contractor Profile Modal */}
      {isContractorModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingContractor ? 'Edit Contractor' : 'Add New Contractor / Supplier'}
              </h2>
              <button onClick={() => setIsContractorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContractorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company / Contractor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Barik Brothers / Manik Raj Mistry"
                  value={cFormData.name}
                  onChange={e => setCFormData({ ...cFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Trade / Specialty</label>
                  <select
                    value={cFormData.type}
                    onChange={e => setCFormData({ ...cFormData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Rod & Steel">Rod & Steel</option>
                    <option value="Stone & Sand">Stone & Sand</option>
                    <option value="Civil Work">Civil Work & Masonry</option>
                    <option value="Electrical">Electrical Works</option>
                    <option value="Sanitary">Sanitary & Plumbing</option>
                    <option value="Paint & Tiles">Paint & Tiles</option>
                    <option value="Other">Other Supply</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Project</label>
                  <select
                    value={cFormData.projectId}
                    onChange={e => setCFormData({ ...cFormData, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={cFormData.contactPerson}
                    onChange={e => setCFormData({ ...cFormData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={cFormData.phone}
                    onChange={e => setCFormData({ ...cFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Address / Office Location</label>
                <input
                  type="text"
                  value={cFormData.address}
                  onChange={e => setCFormData({ ...cFormData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Contract Value (BDT) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={cFormData.totalContractValue || ''}
                    onChange={e => setCFormData({ ...cFormData, totalContractValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Paid Amount (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={cFormData.totalPaid || ''}
                    onChange={e => setCFormData({ ...cFormData, totalPaid: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsContractorModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition"
                >
                  {editingContractor ? 'Update Contractor' : 'Save Contractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Bill Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Disburse Contractor Running Bill
              </h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Voucher No</label>
                  <input
                    type="text"
                    required
                    value={pFormData.voucherNo}
                    onChange={e => setPFormData({ ...pFormData, voucherNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={pFormData.date}
                    onChange={e => setPFormData({ ...pFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bill Particulars / Scope *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8th floor roof casting rebar supply"
                  value={pFormData.billParticulars}
                  onChange={e => setPFormData({ ...pFormData, billParticulars: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Disbursed Amount (BDT) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pFormData.amount || ''}
                    onChange={e => setPFormData({ ...pFormData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={pFormData.paymentMethod}
                    onChange={e => setPFormData({ ...pFormData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                >
                  Disburse Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
