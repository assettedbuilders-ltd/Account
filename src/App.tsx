import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  FileText,
  FileSpreadsheet,
  Layers,
  HardHat,
  BarChart3,
  Settings,
  Database,
  Menu,
  X,
  ChevronDown,
  Printer,
  Download,
  Shield,
  Building,
  CheckCircle2
} from 'lucide-react';

import {
  CompanySettings,
  Project,
  Customer,
  CustomerPayment,
  BillVoucher,
  RoofExpense,
  VRLedgerRow,
  Contractor,
  ContractorPayment,
  UserRole
} from './types';

import { Storage } from './utils/storage';
import { triggerPrint } from './utils/exportUtils';

import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { CustomersView } from './components/CustomersView';
import { CustomerPaymentsView } from './components/CustomerPaymentsView';
import { BillVouchersView } from './components/BillVouchersView';
import { RoofExpensesView } from './components/RoofExpensesView';
import { VRLedgerView } from './components/VRLedgerView';
import { ContractorsView } from './components/ContractorsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { PrintPDFCenterModal } from './components/PrintPDFCenterModal';

export default function App() {
  // Navigation & State
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrintCenterOpen, setIsPrintCenterOpen] = useState(false);

  // Core Data State from LocalStorage
  const [settings, setSettings] = useState<CompanySettings>(Storage.getSettings());
  const [projects, setProjects] = useState<Project[]>(Storage.getProjects());
  const [customers, setCustomers] = useState<Customer[]>(Storage.getCustomers());
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(Storage.getCustomerPayments());
  const [roofExpenses, setRoofExpenses] = useState<RoofExpense[]>(Storage.getRoofExpenses());
  const [vrLedger, setVRLedger] = useState<VRLedgerRow[]>(Storage.getVRLedger());
  const [vouchers, setVouchers] = useState<BillVoucher[]>(Storage.getVouchers());
  const [contractors, setContractors] = useState<Contractor[]>(Storage.getContractors());
  const [contractorPayments, setContractorPayments] = useState<ContractorPayment[]>(Storage.getContractorPayments());

  // Global Context Filters
  const [userRole, setUserRole] = useState<UserRole>(Storage.getUserRole());
  const [selectedProjectId, setSelectedProjectId] = useState<string>(Storage.getSelectedProjectId());
  const [selectedCustomerIdForPayments, setSelectedCustomerIdForPayments] = useState<string | null>(null);

  // Sync to Storage when state changes
  const reloadAllFromStorage = () => {
    setSettings(Storage.getSettings());
    setProjects(Storage.getProjects());
    setCustomers(Storage.getCustomers());
    setCustomerPayments(Storage.getCustomerPayments());
    setRoofExpenses(Storage.getRoofExpenses());
    setVRLedger(Storage.getVRLedger());
    setVouchers(Storage.getVouchers());
    setContractors(Storage.getContractors());
    setContractorPayments(Storage.getContractorPayments());
  };

  // Handlers for Projects
  const handleSaveProject = (project: Project) => {
    const exists = projects.some(p => p.id === project.id);
    const updated = exists
      ? projects.map(p => (p.id === project.id ? project : p))
      : [project, ...projects];
    setProjects(updated);
    Storage.setProjects(updated);
  };

  const handleDeleteProject = (projectId: string) => {
    const updated = projects.filter(p => p.id !== projectId);
    setProjects(updated);
    Storage.setProjects(updated);
    if (selectedProjectId === projectId) {
      setSelectedProjectId('ALL');
      Storage.setSelectedProjectId('ALL');
    }
  };

  // Handlers for Customers
  const handleSaveCustomer = (customer: Customer) => {
    const exists = customers.some(c => c.id === customer.id);
    const updated = exists
      ? customers.map(c => (c.id === customer.id ? customer : c))
      : [customer, ...customers];
    setCustomers(updated);
    Storage.setCustomers(updated);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updated = customers.filter(c => c.id !== customerId);
    setCustomers(updated);
    Storage.setCustomers(updated);
  };

  // Handlers for Customer Payments
  const handleSaveCustomerPayment = (payment: CustomerPayment) => {
    const exists = customerPayments.some(p => p.id === payment.id);
    const updated = exists
      ? customerPayments.map(p => (p.id === payment.id ? payment : p))
      : [payment, ...customerPayments];
    setCustomerPayments(updated);
    Storage.setCustomerPayments(updated);
  };

  const handleDeleteCustomerPayment = (paymentId: string) => {
    const updated = customerPayments.filter(p => p.id !== paymentId);
    setCustomerPayments(updated);
    Storage.setCustomerPayments(updated);
  };

  // Handlers for Bill Vouchers
  const handleSaveVoucher = (voucher: BillVoucher) => {
    const exists = vouchers.some(v => v.id === voucher.id);
    const updated = exists
      ? vouchers.map(v => (v.id === voucher.id ? voucher : v))
      : [voucher, ...vouchers];
    setVouchers(updated);
    Storage.setVouchers(updated);
  };

  const handleDeleteVoucher = (voucherId: string) => {
    const updated = vouchers.filter(v => v.id !== voucherId);
    setVouchers(updated);
    Storage.setVouchers(updated);
  };

  // Handlers for Roof Expenses
  const handleSaveRoofExpense = (expense: RoofExpense) => {
    const exists = roofExpenses.some(e => e.id === expense.id);
    const updated = exists
      ? roofExpenses.map(e => (e.id === expense.id ? expense : e))
      : [...roofExpenses, expense];
    setRoofExpenses(updated);
    Storage.setRoofExpenses(updated);
  };

  const handleDeleteRoofExpense = (expenseId: string) => {
    const updated = roofExpenses.filter(e => e.id !== expenseId);
    setRoofExpenses(updated);
    Storage.setRoofExpenses(updated);
  };

  // Handlers for VR Ledger
  const handleSaveVRLedgerRow = (row: VRLedgerRow) => {
    const exists = vrLedger.some(r => r.id === row.id);
    const updated = exists
      ? vrLedger.map(r => (r.id === row.id ? row : r))
      : [...vrLedger, row];
    setVRLedger(updated);
    Storage.setVRLedger(updated);
  };

  const handleDeleteVRLedgerRow = (rowId: string) => {
    const updated = vrLedger.filter(r => r.id !== rowId);
    setVRLedger(updated);
    Storage.setVRLedger(updated);
  };

  // Handlers for Contractors
  const handleSaveContractor = (contractor: Contractor) => {
    const exists = contractors.some(c => c.id === contractor.id);
    const updated = exists
      ? contractors.map(c => (c.id === contractor.id ? contractor : c))
      : [contractor, ...contractors];
    setContractors(updated);
    Storage.setContractors(updated);
  };

  const handleDeleteContractor = (contractorId: string) => {
    const updated = contractors.filter(c => c.id !== contractorId);
    setContractors(updated);
    Storage.setContractors(updated);
  };

  const handleSaveContractorPayment = (payment: ContractorPayment) => {
    const updated = [payment, ...contractorPayments];
    setContractorPayments(updated);
    Storage.setContractorPayments(updated);
  };

  const handleDeleteContractorPayment = (paymentId: string) => {
    const updated = contractorPayments.filter(p => p.id !== paymentId);
    setContractorPayments(updated);
    Storage.setContractorPayments(updated);
  };

  // Handlers for Settings
  const handleSaveSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    Storage.setSettings(newSettings);
  };

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects Management', icon: Building2 },
    { id: 'customers', label: 'Customer Directory', icon: Users },
    { id: 'customer_payments', label: 'Customer Payments', icon: Wallet },
    { id: 'vouchers', label: 'Bill Vouchers', icon: FileText, badge: vouchers.length },
    { id: 'roof_expenses', label: 'Eight Roof Costs', icon: FileSpreadsheet, badge: '13 Items' },
    { id: 'vr_ledger', label: 'VR Expense Ledger', icon: Layers, badge: 'VR-01 to 09' },
    { id: 'contractors', label: 'Contractors & Suppliers', icon: HardHat },
    { id: 'reports', label: 'Financial Statements', icon: BarChart3 },
    { id: 'settings', label: 'Company Settings', icon: Settings },
    { id: 'backup', label: 'Backup & Restore', icon: Database }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md no-print">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition lg:block hidden"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition lg:hidden"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <img
                src={settings.logoUrl}
                alt="Assetted Builders Logo"
                className="h-10 w-auto object-contain bg-white/5 p-1 rounded-md"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block leading-tight">
                  {settings.name}
                </span>
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                  Real Estate ERP & Accounting Suite
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Project Filter */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold text-slate-300">Active Project:</span>
            <select
              value={selectedProjectId}
              onChange={e => {
                setSelectedProjectId(e.target.value);
                Storage.setSelectedProjectId(e.target.value);
              }}
              className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Projects ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Role Switcher & Print Button */}
          <div className="flex items-center gap-3">
            {/* Role indicator / Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={userRole}
                onChange={e => {
                  const role = e.target.value as UserRole;
                  setUserRole(role);
                  Storage.setUserRole(role);
                }}
                className="bg-transparent text-[11px] font-semibold text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="admin" className="bg-slate-900">Admin (Director)</option>
                <option value="accounts" className="bg-slate-900">Accounts Officer</option>
                <option value="project_manager" className="bg-slate-900">Project Manager</option>
              </select>
            </div>

            <button
              onClick={() => setIsPrintCenterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
              title="Download All Files as PDF or Print"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print & PDF Center</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              onClick={triggerPrint}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Print Current Screen / Document"
            >
              <Printer className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 select-none no-print hidden lg:flex flex-col justify-between shrink-0 ${
            isSidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          <div className="py-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    if (item.id !== 'customer_payments') {
                      setSelectedCustomerIdForPayments(null);
                    }
                  }}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  {isSidebarOpen && (
                    <div className="flex-1 flex justify-between items-center text-left">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            isActive
                              ? 'bg-slate-950 text-amber-400'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer info */}
          {isSidebarOpen && (
            <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
              <div className="font-bold text-slate-400">Assetted Builders Ltd.</div>
              <div className="text-[10px] truncate">{settings.address}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-500 font-mono">
                <CheckCircle2 className="w-3 h-3" /> System Operational
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative bg-slate-900 w-72 max-w-[80vw] h-full flex flex-col justify-between p-4 text-slate-300 z-10 shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto" />
                    <span className="font-bold text-white text-sm">{settings.name}</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveView(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
                <p className="font-bold text-slate-400">{settings.name}</p>
                <p className="text-[11px]">{settings.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeView === 'dashboard' && (
            <DashboardView
              projects={projects}
              customers={customers}
              customerPayments={customerPayments}
              roofExpenses={roofExpenses}
              vrLedger={vrLedger}
              vouchers={vouchers}
              contractors={contractors}
              selectedProjectId={selectedProjectId}
              onNavigate={setActiveView}
              onSelectProject={id => {
                setSelectedProjectId(id);
                Storage.setSelectedProjectId(id);
              }}
            />
          )}

          {activeView === 'projects' && (
            <ProjectsView
              projects={projects}
              userRole={userRole}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onSelectProject={id => {
                setSelectedProjectId(id);
                Storage.setSelectedProjectId(id);
              }}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'customers' && (
            <CustomersView
              customers={customers}
              projects={projects}
              customerPayments={customerPayments}
              userRole={userRole}
              selectedProjectId={selectedProjectId}
              onSaveCustomer={handleSaveCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onViewPayments={customerId => {
                setSelectedCustomerIdForPayments(customerId);
                setActiveView('customer_payments');
              }}
            />
          )}

          {activeView === 'customer_payments' && (
            <CustomerPaymentsView
              payments={customerPayments}
              customers={customers}
              projects={projects}
              settings={settings}
              userRole={userRole}
              selectedCustomerId={selectedCustomerIdForPayments}
              selectedProjectId={selectedProjectId}
              onSavePayment={handleSaveCustomerPayment}
              onDeletePayment={handleDeleteCustomerPayment}
              onSelectCustomer={setSelectedCustomerIdForPayments}
            />
          )}

          {activeView === 'vouchers' && (
            <BillVouchersView
              vouchers={vouchers}
              projects={projects}
              settings={settings}
              userRole={userRole}
              selectedProjectId={selectedProjectId}
              onSaveVoucher={handleSaveVoucher}
              onDeleteVoucher={handleDeleteVoucher}
            />
          )}

          {activeView === 'roof_expenses' && (
            <RoofExpensesView
              roofExpenses={roofExpenses}
              projects={projects}
              settings={settings}
              userRole={userRole}
              selectedProjectId={selectedProjectId}
              onSaveExpense={handleSaveRoofExpense}
              onDeleteExpense={handleDeleteRoofExpense}
            />
          )}

          {activeView === 'vr_ledger' && (
            <VRLedgerView
              vrLedger={vrLedger}
              projects={projects}
              settings={settings}
              userRole={userRole}
              selectedProjectId={selectedProjectId}
              onSaveVRLedgerRow={handleSaveVRLedgerRow}
              onDeleteVRLedgerRow={handleDeleteVRLedgerRow}
            />
          )}

          {activeView === 'contractors' && (
            <ContractorsView
              contractors={contractors}
              contractorPayments={contractorPayments}
              projects={projects}
              settings={settings}
              userRole={userRole}
              selectedProjectId={selectedProjectId}
              onSaveContractor={handleSaveContractor}
              onDeleteContractor={handleDeleteContractor}
              onSaveContractorPayment={handleSaveContractorPayment}
              onDeleteContractorPayment={handleDeleteContractorPayment}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView
              projects={projects}
              customers={customers}
              customerPayments={customerPayments}
              vrLedger={vrLedger}
              roofExpenses={roofExpenses}
              contractors={contractors}
              settings={settings}
              selectedProjectId={selectedProjectId}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              settings={settings}
              userRole={userRole}
              onSaveSettings={handleSaveSettings}
            />
          )}

          {activeView === 'backup' && (
            <BackupRestoreView onRefreshData={reloadAllFromStorage} />
          )}
        </main>
      </div>

      {/* Global Print & PDF Center Modal */}
      <PrintPDFCenterModal
        isOpen={isPrintCenterOpen}
        onClose={() => setIsPrintCenterOpen(false)}
        vrLedger={vrLedger}
        vouchers={vouchers}
        roofExpenses={roofExpenses}
        customers={customers}
        customerPayments={customerPayments}
        contractors={contractors}
        contractorPayments={contractorPayments}
        projects={projects}
        settings={settings}
        selectedProjectId={selectedProjectId}
        onNavigate={viewId => {
          setActiveView(viewId);
        }}
      />
    </div>
  );
}
