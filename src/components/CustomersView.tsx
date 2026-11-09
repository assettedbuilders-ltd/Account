import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Phone,
  Mail,
  Home,
  CreditCard,
  X
} from 'lucide-react';
import { Customer, Project, CustomerPayment, UserRole } from '../types';
import { formatBDT } from '../utils/numberToWords';
import { exportToExcel } from '../utils/exportUtils';

interface CustomersViewProps {
  customers: Customer[];
  projects: Project[];
  customerPayments: CustomerPayment[];
  userRole: UserRole;
  selectedProjectId: string;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onViewPayments: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  projects,
  customerPayments,
  userRole,
  selectedProjectId,
  onSaveCustomer,
  onDeleteCustomer,
  onViewPayments
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeProjectFilter, setActiveProjectFilter] = useState<string>(selectedProjectId || 'ALL');

  const [formData, setFormData] = useState<Partial<Customer>>({
    id: '',
    name: '',
    phone: '',
    email: '',
    nidOrPassport: '',
    address: '',
    projectId: projects[0]?.id || 'PRJ-AMT-01',
    unitNo: 'Flat-1A',
    floorNo: '2nd Floor',
    sizeSqFt: 1350,
    agreedPrice: 6500000,
    bookingDate: new Date().toISOString().slice(0, 10),
    handoverDate: '2027-12-31',
    notes: ''
  });

  // Sync if global selectedProjectId changes and is not ALL
  React.useEffect(() => {
    if (selectedProjectId && selectedProjectId !== 'ALL') {
      setActiveProjectFilter(selectedProjectId);
    }
  }, [selectedProjectId]);

  const filteredCustomers = customers.filter(c => {
    const matchesProject = activeProjectFilter === 'ALL' || c.projectId === activeProjectFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.unitNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const getNextCustomerId = () => {
    const existingNums = customers
      .map(c => {
        const match = c.id.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    const nextNum = maxNum + 1;
    return `CUST-2026-${String(nextNum).padStart(3, '0')}`;
  };

  const handleOpenAdd = () => {
    const newId = getNextCustomerId();
    const defaultProject = activeProjectFilter !== 'ALL' 
      ? activeProjectFilter 
      : (selectedProjectId !== 'ALL' ? selectedProjectId : (projects[0]?.id || 'PRJ-AMT-01'));

    setEditingCustomer(null);
    setFormData({
      id: newId,
      name: '',
      phone: '',
      email: '',
      nidOrPassport: '',
      address: '',
      projectId: defaultProject,
      unitNo: 'Flat-',
      floorNo: '2nd Floor',
      sizeSqFt: 1350,
      agreedPrice: 6500000,
      bookingDate: new Date().toISOString().slice(0, 10),
      handoverDate: '2027-12-31',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (!formData.id?.trim()) {
      alert('Customer ID is required');
      return;
    }

    // Ensure fixed ID uniqueness when adding new customer
    if (!editingCustomer) {
      const idExists = customers.some(c => c.id.toLowerCase() === formData.id?.trim().toLowerCase());
      if (idExists) {
        alert(`Customer ID "${formData.id}" already exists! Customer ID must be unique and fixed for each customer.`);
        return;
      }
    }

    const assignedProjectId = formData.projectId || projects[0]?.id || 'PRJ-AMT-01';

    const customerToSave: Customer = {
      id: editingCustomer ? editingCustomer.id : formData.id.trim(), // Immutable permanent ID
      name: formData.name.trim(),
      phone: formData.phone?.trim() || '',
      email: formData.email?.trim() || '',
      nidOrPassport: formData.nidOrPassport?.trim() || '',
      address: formData.address?.trim() || '',
      projectId: assignedProjectId,
      unitNo: formData.unitNo?.trim() || '',
      floorNo: formData.floorNo?.trim() || '',
      sizeSqFt: Number(formData.sizeSqFt) || 0,
      agreedPrice: Number(formData.agreedPrice) || 0,
      bookingDate: formData.bookingDate || '',
      handoverDate: formData.handoverDate || '',
      notes: formData.notes?.trim() || ''
    };

    onSaveCustomer(customerToSave);
    setIsModalOpen(false);
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete customer ${customer.name} (ID: ${customer.id})?`)) {
      onDeleteCustomer(customer.id);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredCustomers.map(c => {
      const proj = projects.find(p => p.id === c.projectId);
      const paid = customerPayments
        .filter(p => p.customerId === c.id)
        .reduce((sum, p) => sum + p.amount, 0);
      const due = Math.max(0, c.agreedPrice - paid);

      return {
        'Customer ID': c.id,
        'Customer Name': c.name,
        'Project Name': proj?.name || c.projectId,
        'Apartment / Unit': c.unitNo,
        'Floor Level': c.floorNo,
        'Size (Sq.Ft)': c.sizeSqFt,
        'Agreed Price (BDT)': c.agreedPrice,
        'Total Paid (BDT)': paid,
        'Outstanding Due (BDT)': due,
        'Phone Number': c.phone,
        'Email Address': c.email,
        'Booking Date': c.bookingDate
      };
    });
    exportToExcel('Assetted_Builders_Customers_Directory', 'Customers', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" /> Customer Profiles & Flat Allotment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered flat buyers with fixed unique IDs, strictly linked to their respective projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </button>
          {userRole !== 'project_manager' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add New Customer
            </button>
          )}
        </div>
      </div>

      {/* Project Selector Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
          <Home className="w-3.5 h-3.5 text-amber-500" /> Filter by Project:
        </span>
        <button
          onClick={() => setActiveProjectFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeProjectFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          All Projects ({customers.length})
        </button>
        {projects.map(p => {
          const count = customers.filter(c => c.projectId === p.id).length;
          return (
            <button
              key={p.id}
              onClick={() => setActiveProjectFilter(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeProjectFilter === p.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{p.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeProjectFilter === p.id ? 'bg-amber-600/30 text-slate-950' : 'bg-slate-200 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search customers by name, phone, unit (e.g. Flat-3A), or fixed ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer ID / Name</th>
                <th className="py-3 px-4">Project & Unit</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-right">Agreed Price</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Outstanding Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(customer => {
                const proj = projects.find(p => p.id === customer.projectId);
                const payments = customerPayments.filter(p => p.customerId === customer.id);
                const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                const outstandingDue = Math.max(0, customer.agreedPrice - totalPaid);
                const percentPaid = Math.round((totalPaid / customer.agreedPrice) * 100) || 0;

                return (
                  <tr key={customer.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[11px] rounded border border-slate-200 font-bold">
                          ID: {customer.id}
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          🔒 Fixed ID
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Booking: {customer.bookingDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {proj?.name || customer.projectId}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-[10px]">
                          {customer.unitNo}
                        </span>
                        <span className="text-[11px] text-slate-500">{customer.sizeSqFt} Sq.Ft</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{customer.floorNo}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {customer.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono-numbers">
                      ৳ {formatBDT(customer.agreedPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono-numbers">
                      ৳ {formatBDT(totalPaid)}
                      <div className="text-[10px] font-medium text-slate-400">{percentPaid}% settled</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600 font-mono-numbers">
                      ৳ {formatBDT(outstandingDue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewPayments(customer.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold border border-emerald-200 transition"
                          title="View Payment Ledger"
                        >
                          <CreditCard className="w-3 h-3" /> Ledger
                        </button>
                        {userRole !== 'project_manager' && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(customer)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded"
                              title="Edit Customer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(customer)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            {customers.length === 0 ? (
              <>
                <h3 className="text-sm font-bold text-slate-900">All Previous Customers Deleted</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  The customer database has been completely cleared. You can now register new real buyers. Each customer will have a permanent fixed ID strictly tied to their project.
                </p>
                {userRole !== 'project_manager' && (
                  <button
                    onClick={handleOpenAdd}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Add First Customer
                  </button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-slate-900">No Customers Found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  No customers found in this project or matching your search filter.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingCustomer ? 'Edit Customer Details' : 'Add New Flat Buyer'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {editingCustomer 
                    ? `Fixed Customer ID: ${editingCustomer.id}` 
                    : 'Customer ID is permanent and strictly linked to the chosen project.'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Customer ID * {editingCustomer && <span className="text-amber-700 text-[10px] font-bold">(Locked Permanent)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCustomer}
                    value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg font-mono font-bold ${
                      editingCustomer 
                        ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed' 
                        : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  />
                  <div className="text-[10px] mt-1">
                    {editingCustomer ? (
                      <span className="text-amber-700 font-semibold">🔒 Fixed ID: Immutable for this customer</span>
                    ) : (
                      <span className="text-slate-500">Auto-generated unique ID (Permanent once registered)</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="e.g. Mohammad Ali"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    placeholder="017xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Assigned Project * <span className="text-[10px] text-amber-700 font-bold">(Strict Link)</span>
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Customer & payments will belong exclusively to this project
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Apartment / Unit No *</label>
                  <input
                    type="text"
                    required
                    value={formData.unitNo}
                    onChange={e => setFormData({ ...formData, unitNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                    placeholder="e.g. Flat-3A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Floor Level</label>
                  <input
                    type="text"
                    value={formData.floorNo}
                    onChange={e => setFormData({ ...formData, floorNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="e.g. 4th Floor"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit Size (Sq.Ft)</label>
                  <input
                    type="number"
                    value={formData.sizeSqFt}
                    onChange={e => setFormData({ ...formData, sizeSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    placeholder="1350"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Agreed Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={formData.agreedPrice}
                    onChange={e => setFormData({ ...formData, agreedPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                    placeholder="6450000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Booking Date</label>
                  <input
                    type="date"
                    value={formData.bookingDate}
                    onChange={e => setFormData({ ...formData, bookingDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expected Handover Date</label>
                  <input
                    type="date"
                    value={formData.handoverDate}
                    onChange={e => setFormData({ ...formData, handoverDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Permanent / Present Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
