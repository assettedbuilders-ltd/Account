import React from 'react';
import {
  Building2,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Users,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  FileText
} from 'lucide-react';
import { Project, Customer, CustomerPayment, RoofExpense, VRLedgerRow, BillVoucher, Contractor } from '../types';
import { formatBDT } from '../utils/numberToWords';

interface DashboardProps {
  projects: Project[];
  customers: Customer[];
  customerPayments: CustomerPayment[];
  roofExpenses: RoofExpense[];
  vrLedger: VRLedgerRow[];
  vouchers: BillVoucher[];
  contractors: Contractor[];
  selectedProjectId: string;
  onNavigate: (view: string) => void;
  onSelectProject: (id: string) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({
  projects,
  customers,
  customerPayments,
  roofExpenses,
  vrLedger,
  vouchers,
  contractors,
  selectedProjectId,
  onNavigate,
  onSelectProject
}) => {
  // Filter by selected project if not 'ALL'
  const filteredProjects = selectedProjectId === 'ALL'
    ? projects
    : projects.filter(p => p.id === selectedProjectId);

  const filteredCustomerPayments = selectedProjectId === 'ALL'
    ? customerPayments
    : customerPayments.filter(p => p.projectId === selectedProjectId);

  const filteredCustomers = selectedProjectId === 'ALL'
    ? customers
    : customers.filter(c => c.projectId === selectedProjectId);

  const filteredRoofExpenses = selectedProjectId === 'ALL'
    ? roofExpenses
    : roofExpenses.filter(e => e.projectId === selectedProjectId);

  const filteredVRLedger = selectedProjectId === 'ALL'
    ? vrLedger
    : vrLedger.filter(v => v.projectId === selectedProjectId);

  const filteredVouchers = selectedProjectId === 'ALL'
    ? vouchers
    : vouchers.filter(v => v.projectId === selectedProjectId);

  const filteredContractors = selectedProjectId === 'ALL'
    ? contractors
    : contractors.filter(c => c.projectId === selectedProjectId);

  // Totals calculations
  const totalAgreedCustomerValue = filteredCustomers.reduce((sum, c) => sum + (c.agreedPrice || 0), 0);
  const totalCustomerReceived = filteredCustomerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalCustomerDue = Math.max(0, totalAgreedCustomerValue - totalCustomerReceived);

  const totalVRExpenses = filteredVRLedger.reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);
  const totalRoofExpenses = filteredRoofExpenses.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalProjectExpenses = totalVRExpenses; // VR is the consolidated ledger

  const totalContractorValue = filteredContractors.reduce((sum, c) => sum + (c.totalContractValue || 0), 0);
  const totalContractorPaid = filteredContractors.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
  const totalContractorBalance = filteredContractors.reduce((sum, c) => sum + (c.balanceDue || 0), 0);

  const totalVouchersSum = filteredVouchers.reduce((sum, v) => sum + (v.totalAmount || 0), 0);

  // Recent lists
  const recentPayments = [...filteredCustomerPayments].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5);
  const recentExpenses = [...filteredRoofExpenses].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold tracking-wider uppercase mb-1">
            <Building2 className="w-4 h-4" /> Real Estate Financial Executive Dashboard
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Assetted Builders Ltd.
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            {selectedProjectId === 'ALL'
              ? 'Consolidated view across all ongoing real estate development projects'
              : `Active Project: ${projects.find(p => p.id === selectedProjectId)?.name || 'Selected Project'}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('vouchers')}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-xl transition shadow-md hover:shadow-lg"
          >
            <PlusCircle className="w-4 h-4" /> Create Bill Voucher
          </button>
          <button
            onClick={() => onNavigate('customer_payments')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-xl transition border border-slate-600"
          >
            <Wallet className="w-4 h-4 text-emerald-400" /> Record Customer Payment
          </button>
          <button
            onClick={() => onNavigate('roof_expenses')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-xl transition border border-slate-600"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" /> Eight Roof Statement
          </button>
        </div>
      </div>

      {/* 6 Key Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Projects */}
        <div
          onClick={() => onNavigate('projects')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Projects</span>
            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono-numbers">
            {filteredProjects.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Active sites</span>
            <span className="text-amber-600 font-medium flex items-center">
              View <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Total Project Expenses */}
        <div
          onClick={() => onNavigate('vr_ledger')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Project Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono-numbers">
            ৳ {formatBDT(totalProjectExpenses)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>VR-01 to VR-09</span>
            <span className="text-rose-600 font-medium flex items-center">
              Audited <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Customer Collections Received */}
        <div
          onClick={() => onNavigate('customer_payments')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Collections Received</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-600 font-mono-numbers">
            ৳ {formatBDT(totalCustomerReceived)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{filteredCustomerPayments.length} Receipts</span>
            <span className="text-emerald-600 font-medium flex items-center">
              Ledger <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Outstanding Customer Dues */}
        <div
          onClick={() => onNavigate('customer_payments')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Customer Dues</span>
            <Wallet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-amber-600 font-mono-numbers">
            ৳ {formatBDT(totalCustomerDue)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Agreed Flat Sales</span>
            <span className="text-amber-600 font-medium flex items-center">
              Pending <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Contractor Payables */}
        <div
          onClick={() => onNavigate('contractors')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Contractor Payables</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono-numbers">
            ৳ {formatBDT(totalContractorBalance)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Paid: ৳ {formatBDT(totalContractorPaid)}</span>
            <span className="text-indigo-600 font-medium flex items-center">
              Vendors <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Bill Vouchers Total */}
        <div
          onClick={() => onNavigate('vouchers')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Vouchers</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono-numbers">
            ৳ {formatBDT(totalVouchersSum)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{filteredVouchers.length} issued</span>
            <span className="text-slate-600 font-medium flex items-center">
              Browse <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Project-wise Expense & Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Project-wise Budget vs. Actual Expenditure</h2>
              <p className="text-xs text-slate-500">Live monitoring of construction funds against approved project budget</p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              All Projects <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {projects.map(proj => {
              // Calculate project specific expenses
              const projExpenses = vrLedger
                .filter(v => v.projectId === proj.id)
                .reduce((s, v) => s + (Number(v.totalAmount) || 0), 0);
              const percentage = Math.min(100, Math.round((projExpenses / proj.budget) * 100));

              return (
                <div key={proj.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {proj.name}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                          proj.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                          proj.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {proj.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {proj.landArea} | {proj.floors} Floors | {proj.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">Spent / Budget</div>
                      <div className="text-sm font-bold text-slate-900 font-mono-numbers">
                        ৳ {formatBDT(projExpenses)} <span className="text-slate-400 font-normal">/ ৳ {formatBDT(proj.budget)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        percentage > 85 ? 'bg-rose-500' : percentage > 60 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Utilization: {percentage}%</span>
                    <span>Remaining Budget: ৳ {formatBDT(Math.max(0, proj.budget - projExpenses))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Summary Card: Eight Roof Costs Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Eight Roof Costs</h3>
                <p className="text-xs text-slate-500">Assetted Master Tower</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                13 Items
              </span>
            </div>

            <div className="bg-gradient-to-br from-amber-50/70 to-slate-50 p-3.5 rounded-lg border border-amber-100 mb-4">
              <div className="text-xs text-slate-600 font-medium">Statement Total Amount</div>
              <div className="text-2xl font-extrabold text-amber-800 font-mono-numbers mt-0.5">
                ৳ {formatBDT(totalRoofExpenses)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Rod (The Barik Brothers), Stone, Sand, Electricity & Site Salaries
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
                <span>The Barik Brothers (Rod 3,861 kg)</span>
                <span className="font-semibold text-slate-900 font-mono-numbers">৳ 328,347</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
                <span>Stone & Sand Supply (Trucks)</span>
                <span className="font-semibold text-slate-900 font-mono-numbers">৳ 178,400</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
                <span>Caretaker & Staff Salaries</span>
                <span className="font-semibold text-slate-900 font-mono-numbers">৳ 15,500</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-600">
                <span>Electricity & Maintenance</span>
                <span className="font-semibold text-slate-900 font-mono-numbers">৳ 8,000</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('roof_expenses')}
            className="w-full mt-4 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
          >
            Open Eight Roof Statement <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Transactions & Customer Receipts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customer Receipts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Receipts (Money Receipts)</h3>
              <p className="text-xs text-slate-500">Latest installment payments verified by accounts</p>
            </div>
            <button
              onClick={() => onNavigate('customer_payments')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Full Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPayments.map(p => {
              const cust = customers.find(c => c.id === p.customerId);
              return (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{p.mrNo}</span>
                      <span className="text-slate-500 font-normal">| {cust?.name || 'Customer'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                        {cust?.unitNo}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {p.installmentName} ({p.paymentMethod})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 font-mono-numbers">
                      ৳ {formatBDT(p.amount)}
                    </div>
                    <div className="text-[11px] text-slate-400">{p.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Site Expenses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Construction Expenses</h3>
              <p className="text-xs text-slate-500">Live disbursements against site bills & materials</p>
            </div>
            <button
              onClick={() => onNavigate('roof_expenses')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentExpenses.map(e => (
              <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{e.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                      {e.category}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-0.5">{e.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 font-mono-numbers">
                    ৳ {formatBDT(e.total)}
                  </div>
                  <div className="text-[11px] text-slate-400">{e.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
