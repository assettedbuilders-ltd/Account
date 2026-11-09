import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Printer,
  FileText,
  ArrowUpDown,
  Calendar,
  X,
  Check,
  Layers,
  Building2,
  Download
} from 'lucide-react';
import { RoofExpense, Project, CompanySettings, UserRole } from '../types';
import { formatBDT, convertAmountToWords } from '../utils/numberToWords';
import { exportToExcel, exportToWord, triggerPrint, exportRoofExpensesPDF } from '../utils/exportUtils';

interface RoofExpensesViewProps {
  roofExpenses: RoofExpense[];
  projects: Project[];
  settings: CompanySettings;
  userRole: UserRole;
  selectedProjectId: string;
  onSaveExpense: (expense: RoofExpense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const RoofExpensesView: React.FC<RoofExpensesViewProps> = ({
  roofExpenses,
  projects,
  settings,
  userRole,
  selectedProjectId,
  onSaveExpense,
  onDeleteExpense
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'sl' | 'date' | 'total'>('sl');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RoofExpense | null>(null);

  // Editable Statement Header State
  const [statementTitle, setStatementTitle] = useState<string>(() => {
    return localStorage.getItem(`assetted_statement_title_${selectedProjectId}`) || 'Statement of Expenses';
  });
  const [statementSubtitle, setStatementSubtitle] = useState<string>(() => {
    return localStorage.getItem(`assetted_statement_subtitle_${selectedProjectId}`) || 'Eight Roof Costs';
  });
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [tempStatementTitle, setTempStatementTitle] = useState(statementTitle);
  const [tempStatementSubtitle, setTempStatementSubtitle] = useState(statementSubtitle);

  useEffect(() => {
    const savedTitle = localStorage.getItem(`assetted_statement_title_${selectedProjectId}`) || 'Statement of Expenses';
    const savedSubtitle = localStorage.getItem(`assetted_statement_subtitle_${selectedProjectId}`) || 'Eight Roof Costs';
    setStatementTitle(savedTitle);
    setStatementSubtitle(savedSubtitle);
    setTempStatementTitle(savedTitle);
    setTempStatementSubtitle(savedSubtitle);
  }, [selectedProjectId]);

  const handleSaveStatementMeta = () => {
    const newTitle = tempStatementTitle.trim() || 'Statement of Expenses';
    const newSubtitle = tempStatementSubtitle.trim() || 'Eight Roof Costs';
    setStatementTitle(newTitle);
    setStatementSubtitle(newSubtitle);
    localStorage.setItem(`assetted_statement_title_${selectedProjectId}`, newTitle);
    localStorage.setItem(`assetted_statement_subtitle_${selectedProjectId}`, newSubtitle);
    setIsEditingStatement(false);
  };

  // Form State
  const [formData, setFormData] = useState<Partial<RoofExpense>>({
    id: '',
    sl: 1,
    date: new Date().toISOString().slice(0, 10),
    name: '',
    description: '',
    total: 0,
    projectId: selectedProjectId !== 'ALL' ? selectedProjectId : 'PRJ-AMT-01',
    category: 'Materials'
  });

  const activeProject = projects.find(
    p => p.id === (selectedProjectId === 'ALL' ? 'PRJ-AMT-01' : selectedProjectId)
  ) || projects[0];

  // Filtering
  const filteredExpenses = roofExpenses.filter(e => {
    const matchesProject = selectedProjectId === 'ALL' || e.projectId === selectedProjectId;
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());

    const expenseDate = new Date(e.date).getTime();
    const afterStart = !startDateFilter || expenseDate >= new Date(startDateFilter).getTime();
    const beforeEnd = !endDateFilter || expenseDate <= new Date(endDateFilter).getTime();

    return matchesProject && matchesSearch && afterStart && beforeEnd;
  });

  // Sorting
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'sl') comparison = a.sl - b.sl;
    else if (sortBy === 'date') comparison = a.date.localeCompare(b.date);
    else if (sortBy === 'total') comparison = a.total - b.total;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const grandTotal = sortedExpenses.reduce((sum, item) => sum + item.total, 0);

  const handleOpenAdd = () => {
    const nextSl = roofExpenses.length + 1;
    setEditingExpense(null);
    setFormData({
      id: `ROOF-${Date.now()}`,
      sl: nextSl,
      date: new Date().toISOString().slice(0, 10),
      name: '',
      description: '',
      total: 0,
      projectId: activeProject.id,
      category: 'Materials'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: RoofExpense) => {
    setEditingExpense(expense);
    setFormData({ ...expense });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      alert('Please fill in Name and Description');
      return;
    }

    const expenseToSave: RoofExpense = {
      id: formData.id || `ROOF-${Date.now()}`,
      sl: Number(formData.sl) || sortedExpenses.length + 1,
      date: formData.date || new Date().toISOString().slice(0, 10),
      name: formData.name,
      description: formData.description,
      total: Number(formData.total) || 0,
      projectId: formData.projectId || activeProject.id,
      category: (formData.category as RoofExpense['category']) || 'Materials'
    };

    onSaveExpense(expenseToSave);
    setIsModalOpen(false);
  };

  const handleDelete = (expense: RoofExpense) => {
    if (confirm(`Delete expense line #${expense.sl}: ${expense.name} (${expense.description}) for ৳ ${formatBDT(expense.total)}?`)) {
      onDeleteExpense(expense.id);
    }
  };

  const handleExportExcel = () => {
    const exportData = sortedExpenses.map((e, idx) => ({
      'SL': idx + 1,
      'Date': e.date,
      'Name / Payee': e.name,
      'Description / Particulars': e.description,
      'Category': e.category,
      'Total Amount (BDT)': e.total
    }));

    const cleanSubtitle = statementSubtitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    exportToExcel(`${activeProject.name}_${cleanSubtitle}_Statement`, statementSubtitle, exportData);
  };

  const handleExportWord = () => {
    const title = `${activeProject.name} — ${statementTitle} — ${statementSubtitle}`;
    const rowsHtml = sortedExpenses
      .map(
        (e, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${e.date}</td>
          <td><strong>${e.name}</strong></td>
          <td>${e.description}</td>
          <td class="text-right font-bold">৳ ${formatBDT(e.total)}</td>
        </tr>
      `
      )
      .join('');

    const contentHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">SL</th>
            <th style="width: 15%;">Date</th>
            <th style="width: 25%;">Name</th>
            <th>Description</th>
            <th style="width: 20%; text-align: right;">Total (BDT)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr>
            <td colspan="4" class="text-right font-bold" style="background-color: #f1f5f9;">GRAND TOTAL:</td>
            <td class="text-right font-bold" style="background-color: #f1f5f9; font-size: 11pt;">৳ ${formatBDT(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 15px; font-size: 10pt; background-color: #f8fafc; padding: 10px; border: 1px solid #cbd5e1;">
        <strong>Total Amount in Words:</strong> ${convertAmountToWords(grandTotal)}
      </div>
      <div class="footer-signatures" style="margin-top: 50px;">
        <div class="signature-box">Site Engineer</div>
        <div class="signature-box">Chief Accounts Officer</div>
        <div class="signature-box">Managing Director</div>
      </div>
    `;

    const cleanSubtitle = statementSubtitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    exportToWord(`Statement_${cleanSubtitle}`, title, contentHtml, settings.name);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" /> Milestone Construction Cost Ledger
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {activeProject.name}
          </h1>
          <div className="text-sm font-semibold text-slate-700 flex items-center gap-2 mt-0.5">
            <span>{statementTitle}</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-700 font-bold">{statementSubtitle}</span>
            <button
              onClick={() => {
                setTempStatementTitle(statementTitle);
                setTempStatementSubtitle(statementSubtitle);
                setIsEditingStatement(true);
              }}
              className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded transition flex items-center gap-1 text-xs"
              title="Edit Statement Title"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold text-amber-800">Edit Title</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportRoofExpensesPDF(sortedExpenses, activeProject.name)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
            title="Download Eight Roof Costs Expense Statement as PDF"
          >
            <Download className="w-4 h-4 text-white" /> Download PDF
          </button>
          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
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
              <Plus className="w-4 h-4" /> Add Row
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by payee name (DESCO, Barik, Babul) or particulars..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Date Range:</span>
          <input
            type="date"
            value={startDateFilter}
            onChange={e => setStartDateFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDateFilter}
            onChange={e => setEndDateFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
          />
          {(startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
          >
            <option value="sl">Original SL</option>
            <option value="date">Date</option>
            <option value="total">Amount</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 border border-slate-200 rounded bg-slate-50 text-slate-600"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Expense Table (Printable A4 Corporate Format) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print-full-width">
        {/* Printable Header */}
        <div className="p-6 pb-2 text-center border-b border-slate-200">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src={settings.logoUrl}
              alt="Assetted Builders"
              className="h-12 w-auto object-contain"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="text-left">
              <h2 className="text-xl font-black text-slate-950 uppercase">{settings.name}</h2>
              <p className="text-[11px] text-slate-600">{settings.address}</p>
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 uppercase tracking-wide">
            {activeProject.name} — {statementTitle}
          </div>
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center justify-center gap-1.5 group">
            {isEditingStatement ? (
              <div
                className="flex items-center gap-2 bg-amber-50 p-1.5 rounded-lg border border-amber-300 no-print shadow-xs"
                onClick={e => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={tempStatementSubtitle}
                  onChange={e => setTempStatementSubtitle(e.target.value)}
                  className="text-xs font-bold text-amber-900 uppercase tracking-wider bg-white px-2.5 py-1 rounded border border-amber-400 focus:outline-hidden"
                  placeholder="e.g. Eight Roof Costs"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveStatementMeta();
                    if (e.key === 'Escape') setIsEditingStatement(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveStatementMeta}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded flex items-center gap-1 shadow-xs"
                  title="Save Title"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingStatement(false)}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <span>{statementSubtitle}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTempStatementTitle(statementTitle);
                    setTempStatementSubtitle(statementSubtitle);
                    setIsEditingStatement(true);
                  }}
                  className="no-print opacity-80 group-hover:opacity-100 hover:text-amber-950 transition px-1.5 py-0.5 hover:bg-amber-100/80 rounded cursor-pointer flex items-center gap-1 text-[11px] font-semibold text-amber-800"
                  title="Edit Statement Title (Click to edit)"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="underline decoration-dotted">Edit</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">SL</th>
                <th className="py-3 px-4 w-28 text-center">Date</th>
                <th className="py-3 px-4 w-48">Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-40 text-right">Total (BDT)</th>
                <th className="py-3 px-4 w-24 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedExpenses.map((expense, idx) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-center font-mono font-medium text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {expense.date}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {expense.name}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {expense.description}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono-numbers text-sm whitespace-nowrap">
                    ৳ {formatBDT(expense.total)}
                  </td>
                  <td className="py-3 px-4 text-center no-print whitespace-nowrap">
                    {userRole !== 'project_manager' && (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(expense)}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded"
                          title="Edit Row"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
              <tr>
                <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs">
                  Grand Total ({sortedExpenses.length} Records):
                </td>
                <td className="py-3.5 px-4 text-right font-black font-mono-numbers text-base text-slate-950">
                  ৳ {formatBDT(grandTotal)}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in words footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs flex justify-between items-center">
          <div>
            <span className="font-bold text-slate-700">Total in Words: </span>
            <span className="italic font-semibold text-slate-950">{convertAmountToWords(grandTotal)}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium no-print">
            Includes Rod, Stone Trucks, Sand, Power & Caretaker Wages
          </div>
        </div>

        {/* Print Signatures */}
        <div className="hidden print-only p-8 pt-16">
          <div className="grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold">Site Supervisor / Engineer</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold">Chief Accounts Officer</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold">Managing Director</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Expense Row Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingExpense ? 'Edit Expense Record' : 'Add Construction Expense Row'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expense Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Materials">Materials (Rod, Cement, Stone)</option>
                    <option value="Labor">Labor (Raj Mistry, Casting)</option>
                    <option value="Salary">Salary & Remuneration</option>
                    <option value="Utilities">Utilities (DESCO, WASA)</option>
                    <option value="Equipment">Equipment & Motors</option>
                    <option value="Transport">Transport & Conveyance</option>
                    <option value="Other">Other Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Name / Payee / Supplier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Barik Brothers / DESCO / Babul"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Particulars *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rod (2505.20 kg) / August Salary-26"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Total Amount (BDT) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 209931"
                  value={formData.total || ''}
                  onChange={e => setFormData({ ...formData, total: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                />
                <div className="text-[10px] text-slate-500 mt-1 italic">
                  {convertAmountToWords(Number(formData.total) || 0)}
                </div>
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
                  {editingExpense ? 'Save Changes' : 'Add Statement Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Statement Header & Milestone Title Modal */}
      {isHeaderModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" /> Edit Statement & Milestone Title
              </h2>
              <button
                onClick={() => setIsHeaderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  disabled
                  value={activeProject.name}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Statement Title</label>
                <input
                  type="text"
                  value={tempStatementTitle}
                  onChange={e => setTempStatementTitle(e.target.value)}
                  placeholder="e.g. Statement of Expenses"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Milestone / Floor Cost Subtitle *</label>
                <input
                  type="text"
                  required
                  value={tempStatementSubtitle}
                  onChange={e => setTempStatementSubtitle(e.target.value)}
                  placeholder="e.g. Eight Roof Costs / 7th floor Costs"
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg font-bold text-amber-900 bg-amber-50/50 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <span className="block text-slate-500 font-medium text-[11px] mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Eight Roof Costs',
                    '7th floor Costs',
                    '6th floor Costs',
                    '5th floor Costs',
                    '4th floor Costs',
                    'Basement Costs',
                    'Foundation & Piling Costs'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTempStatementSubtitle(preset)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                        tempStatementSubtitle === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHeaderModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveStatementMeta();
                    setIsHeaderModalOpen(false);
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition"
                >
                  Save Title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
