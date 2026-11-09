import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  PieChart,
  BarChart3,
  DollarSign,
  Download
} from 'lucide-react';
import { Project, Customer, CustomerPayment, VRLedgerRow, RoofExpense, Contractor, CompanySettings } from '../types';
import { formatBDT, convertAmountToWords } from '../utils/numberToWords';
import { exportToExcel, exportToWord, triggerPrint, exportFinancialReportPDF } from '../utils/exportUtils';

interface ReportsViewProps {
  projects: Project[];
  customers: Customer[];
  customerPayments: CustomerPayment[];
  vrLedger: VRLedgerRow[];
  roofExpenses: RoofExpense[];
  contractors: Contractor[];
  settings: CompanySettings;
  selectedProjectId: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  projects,
  customers,
  customerPayments,
  vrLedger,
  roofExpenses,
  contractors,
  settings,
  selectedProjectId
}) => {
  const [reportType, setReportType] = useState<'project_summary' | 'customer_collection' | 'category_breakdown'>('project_summary');

  const filteredProjects = selectedProjectId === 'ALL'
    ? projects
    : projects.filter(p => p.id === selectedProjectId);

  // Grand aggregates
  const totalContractorValue = contractors.reduce((s, c) => s + c.totalContractValue, 0);
  const totalContractorPaid = contractors.reduce((s, c) => s + c.totalPaid, 0);

  const totalAgreedSales = customers.reduce((s, c) => s + c.agreedPrice, 0);
  const totalSalesCollected = customerPayments.reduce((s, p) => s + p.amount, 0);
  const totalSalesDue = Math.max(0, totalAgreedSales - totalSalesCollected);

  const parseNum = (val: number | string | undefined): number => {
    if (typeof val === 'number') return val;
    if (!val || val === '-') return 0;
    const clean = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalVRExpenses = vrLedger.reduce((s, v) => s + parseNum(v.totalAmount), 0);

  // Category totals across VR Statements (19-Column Master Ledger)
  const categoryTotals = {
    'Land Owner & Investor': vrLedger.reduce((s, r) => s + parseNum(r.landOwnerInvestor), 0),
    'Raj & Labour Contractor (Manik+Munna+Rofiq)': vrLedger.reduce((s, r) => s + parseNum(r.rajLabour), 0),
    'Contractor (Jamal)': vrLedger.reduce((s, r) => s + parseNum(r.contractorJamal), 0),
    'Bricks': vrLedger.reduce((s, r) => s + parseNum(r.bricks), 0),
    'Sand': vrLedger.reduce((s, r) => s + parseNum(r.sand), 0),
    'Cement': vrLedger.reduce((s, r) => s + parseNum(r.cement), 0),
    'Rod & Steel Rebar': vrLedger.reduce((s, r) => s + parseNum(r.rod), 0),
    'Stone Aggregate': vrLedger.reduce((s, r) => s + parseNum(r.stone), 0),
    'Sanitary Items / Contractor': vrLedger.reduce((s, r) => s + parseNum(r.sanitary), 0),
    'Staff Salary': vrLedger.reduce((s, r) => s + parseNum(r.staffSalary), 0),
    'Electric Items / Contractor': vrLedger.reduce((s, r) => s + parseNum(r.electric), 0),
    'Utility Bill': vrLedger.reduce((s, r) => s + parseNum(r.utilityBill), 0),
    'Engineer + Pailing Contractor': vrLedger.reduce((s, r) => s + parseNum(r.engineerPailing), 0),
    'Others Payment Etc.': vrLedger.reduce((s, r) => s + parseNum(r.othersPayment), 0),
    'Office Expense': vrLedger.reduce((s, r) => s + parseNum(r.officeExpense), 0)
  };

  const handleExportExcel = () => {
    if (reportType === 'project_summary') {
      const data = filteredProjects.map(p => {
        const pExp = vrLedger.filter(v => v.projectId === p.id).reduce((s, v) => s + parseNum(v.totalAmount), 0);
        const pCust = customers.filter(c => c.projectId === p.id);
        const pSales = pCust.reduce((s, c) => s + c.agreedPrice, 0);
        const pRecv = customerPayments.filter(cp => cp.projectId === p.id).reduce((s, cp) => s + cp.amount, 0);
        const pDue = Math.max(0, pSales - pRecv);

        return {
          'Project ID': p.id,
          'Project Name': p.name,
          'Approved Budget (BDT)': p.budget,
          'Actual Construction Expenses (BDT)': pExp,
          'Budget Variance (BDT)': p.budget - pExp,
          'Total Sold Flat Value (BDT)': pSales,
          'Total Collections Received (BDT)': pRecv,
          'Outstanding Buyer Receivables (BDT)': pDue,
          'Net Cashflow (Received - Expense)': pRecv - pExp
        };
      });
      exportToExcel('Assetted_Builders_Project_Financial_Report', 'Projects Summary', data);
    } else {
      const data = Object.entries(categoryTotals).map(([cat, val]) => ({
        'Cost Category': cat,
        'Expenditure Amount (BDT)': val,
        'Percentage of Total Expense': `${((val / totalVRExpenses) * 100).toFixed(1)}%`
      }));
      exportToExcel('Assetted_Builders_Expense_Breakdown', 'Category Breakdown', data);
    }
  };

  const handleExportWord = () => {
    const title = 'Assetted Builders Ltd. — Executive Financial Audit Report';
    const contentHtml = `
      <div style="background-color: #f1f5f9; padding: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
        <p><strong>Total Projects Budget:</strong> ৳ ${formatBDT(projects.reduce((s, p) => s + p.budget, 0))}</p>
        <p><strong>Total Audited Expenses (VR-01 to VR-09):</strong> ৳ ${formatBDT(totalVRExpenses)}</p>
        <p><strong>Total Collections Received:</strong> ৳ ${formatBDT(totalSalesCollected)}</p>
        <p><strong>Total Buyer Receivables Due:</strong> ৳ ${formatBDT(totalSalesDue)}</p>
      </div>

      <h3>Project-wise Financial Performance</h3>
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th class="text-right">Budget</th>
            <th class="text-right">Actual Expense</th>
            <th class="text-right">Total Sales</th>
            <th class="text-right">Collected</th>
            <th class="text-right">Due</th>
          </tr>
        </thead>
        <tbody>
          ${filteredProjects
            .map(p => {
              const pExp = vrLedger.filter(v => v.projectId === p.id).reduce((s, v) => s + parseNum(v.totalAmount), 0);
              const pCust = customers.filter(c => c.projectId === p.id);
              const pSales = pCust.reduce((s, c) => s + c.agreedPrice, 0);
              const pRecv = customerPayments.filter(cp => cp.projectId === p.id).reduce((s, cp) => s + cp.amount, 0);
              const pDue = Math.max(0, pSales - pRecv);
              return `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td class="text-right">৳ ${formatBDT(p.budget)}</td>
                <td class="text-right">৳ ${formatBDT(pExp)}</td>
                <td class="text-right">৳ ${formatBDT(pSales)}</td>
                <td class="text-right font-bold" style="color: #047857;">৳ ${formatBDT(pRecv)}</td>
                <td class="text-right font-bold" style="color: #b45309;">৳ ${formatBDT(pDue)}</td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>

      <div class="footer-signatures" style="margin-top: 60px;">
        <div class="signature-box">Chief Financial Officer</div>
        <div class="signature-box">Managing Director</div>
      </div>
    `;

    exportToWord('Executive_Financial_Report', title, contentHtml, settings.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" /> Executive Financial & Audit Statements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated project profitability, customer collection rates, and 11-category cost breakdown
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => exportFinancialReportPDF(filteredProjects, vrLedger, customers, customerPayments)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
            title="Download Comprehensive Financial Audit Report as PDF"
          >
            <Download className="w-4 h-4 text-white" /> Download PDF
          </button>
          <button
            onClick={triggerPrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Print Report
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
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 no-print">
        <button
          onClick={() => setReportType('project_summary')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            reportType === 'project_summary'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Project Financial Summaries
        </button>
        <button
          onClick={() => setReportType('category_breakdown')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            reportType === 'category_breakdown'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4" /> 11-Category Expense Analysis
        </button>
      </div>

      {/* Main Report Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs print-full-width">
        {/* Printable Document Title */}
        <div className="text-center pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-xl font-black text-slate-950 uppercase">{settings.name}</h2>
          <p className="text-xs text-slate-600">{settings.address}</p>
          <div className="mt-2 text-sm font-bold text-amber-700 uppercase tracking-wider">
            {reportType === 'project_summary'
              ? 'Consolidated Real Estate Project Financial Statement'
              : 'Audited Construction Cost Breakdown by Category'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Report Generated On: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {reportType === 'project_summary' ? (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Project Name & ID</th>
                    <th className="py-3 px-3 text-right">Budget</th>
                    <th className="py-3 px-3 text-right">Construction Cost</th>
                    <th className="py-3 px-3 text-right">Committed Sales</th>
                    <th className="py-3 px-3 text-right">Collections</th>
                    <th className="py-3 px-3 text-right">Outstanding Dues</th>
                    <th className="py-3 px-3 text-right">Net Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map(proj => {
                    const pExp = vrLedger.filter(v => v.projectId === proj.id).reduce((s, v) => s + parseNum(v.totalAmount), 0);
                    const pCust = customers.filter(c => c.projectId === proj.id);
                    const pSales = pCust.reduce((s, c) => s + c.agreedPrice, 0);
                    const pRecv = customerPayments.filter(cp => cp.projectId === proj.id).reduce((s, cp) => s + cp.amount, 0);
                    const pDue = Math.max(0, pSales - pRecv);
                    const netCash = pRecv - pExp;

                    return (
                      <tr key={proj.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{proj.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{proj.id} &bull; {proj.landArea}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-numbers text-slate-700">
                          ৳ {formatBDT(proj.budget)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-rose-700">
                          ৳ {formatBDT(pExp)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-numbers text-slate-800">
                          ৳ {formatBDT(pSales)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-numbers font-bold text-emerald-600">
                          ৳ {formatBDT(pRecv)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono-numbers font-bold text-amber-600">
                          ৳ {formatBDT(pDue)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono-numbers font-extrabold ${netCash >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ৳ {formatBDT(netCash)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visual Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-xs font-semibold block">Total Sales Bookings</span>
                <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1">
                  ৳ {formatBDT(totalAgreedSales)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Across all registered apartments</div>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 text-xs font-semibold block">Total Cash Collected</span>
                <div className="text-xl font-bold font-mono-numbers text-emerald-700 mt-1">
                  ৳ {formatBDT(totalSalesCollected)}
                </div>
                <div className="text-[11px] text-emerald-800/80 mt-1">Realized bank and cash inflow</div>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                <span className="text-amber-800 text-xs font-semibold block">Total Customer Due</span>
                <div className="text-xl font-bold font-mono-numbers text-amber-800 mt-1">
                  ৳ {formatBDT(totalSalesDue)}
                </div>
                <div className="text-[11px] text-amber-800/80 mt-1">Receivables over construction stages</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Cost Category</th>
                    <th className="py-3 px-4 text-right">Disbursed Amount (BDT)</th>
                    <th className="py-3 px-4 text-right w-44">Percentage Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(categoryTotals).map(([cat, amount]) => {
                    const pct = totalVRExpenses > 0 ? ((amount / totalVRExpenses) * 100).toFixed(1) : '0';
                    return (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-800">{cat}</td>
                        <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-950">
                          ৳ {formatBDT(amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono font-medium text-slate-600">{pct}%</span>
                            <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-500 h-1.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <tr>
                    <td className="py-3.5 px-4 uppercase text-xs">Total Audited VR Expenses:</td>
                    <td className="py-3.5 px-4 text-right font-black font-mono-numbers text-base text-slate-950">
                      ৳ {formatBDT(totalVRExpenses)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Printable Signatures */}
        <div className="hidden print-only pt-16">
          <div className="grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold">Chief Accountant</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold">External Auditor</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-semibold">Managing Director</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
