import {
  CompanySettings,
  Project,
  Customer,
  CustomerPayment,
  BillVoucher,
  RoofExpense,
  VRLedgerRow,
  VoucherSummarySheet,
  Contractor,
  ContractorPayment,
  UserRole
} from '../types';

import {
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_PROJECTS,
  DEFAULT_CUSTOMERS,
  DEFAULT_CUSTOMER_PAYMENTS,
  DEFAULT_ROOF_EXPENSES,
  DEFAULT_VR_LEDGER,
  DEFAULT_VOUCHER_SUMMARIES,
  DEFAULT_VOUCHERS,
  DEFAULT_CONTRACTORS,
  DEFAULT_CONTRACTOR_PAYMENTS
} from '../data/defaultData';

const KEYS = {
  SETTINGS: 'assetted_settings',
  PROJECTS: 'assetted_projects',
  CUSTOMERS: 'assetted_customers',
  CUSTOMER_PAYMENTS: 'assetted_customer_payments',
  ROOF_EXPENSES: 'assetted_roof_expenses',
  VR_LEDGER: 'assetted_vr_ledger',
  VOUCHER_SUMMARIES: 'assetted_voucher_summaries',
  VOUCHERS: 'assetted_vouchers',
  CONTRACTORS: 'assetted_contractors',
  CONTRACTOR_PAYMENTS: 'assetted_contractor_payments',
  USER_ROLE: 'assetted_user_role',
  SELECTED_PROJECT_ID: 'assetted_selected_project_id'
};

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

export const Storage = {
  getSettings: (): CompanySettings => getStorageItem(KEYS.SETTINGS, DEFAULT_COMPANY_SETTINGS),
  setSettings: (settings: CompanySettings) => setStorageItem(KEYS.SETTINGS, settings),

  getProjects: (): Project[] => getStorageItem(KEYS.PROJECTS, DEFAULT_PROJECTS),
  setProjects: (projects: Project[]) => setStorageItem(KEYS.PROJECTS, projects),

  getCustomers: (): Customer[] => {
    const SYNC_FLAG = 'assetted_payments_sync_v5';
    if (!localStorage.getItem(SYNC_FLAG)) {
      localStorage.setItem(SYNC_FLAG, 'true');
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
      localStorage.setItem(KEYS.CUSTOMER_PAYMENTS, JSON.stringify(DEFAULT_CUSTOMER_PAYMENTS));
      return DEFAULT_CUSTOMERS;
    }
    return getStorageItem(KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  },
  setCustomers: (customers: Customer[]) => setStorageItem(KEYS.CUSTOMERS, customers),

  getCustomerPayments: (): CustomerPayment[] => {
    const SYNC_FLAG = 'assetted_payments_sync_v5';
    if (!localStorage.getItem(SYNC_FLAG)) {
      localStorage.setItem(SYNC_FLAG, 'true');
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
      localStorage.setItem(KEYS.CUSTOMER_PAYMENTS, JSON.stringify(DEFAULT_CUSTOMER_PAYMENTS));
      return DEFAULT_CUSTOMER_PAYMENTS;
    }
    return getStorageItem(KEYS.CUSTOMER_PAYMENTS, DEFAULT_CUSTOMER_PAYMENTS);
  },
  setCustomerPayments: (payments: CustomerPayment[]) => setStorageItem(KEYS.CUSTOMER_PAYMENTS, payments),

  getRoofExpenses: (): RoofExpense[] => getStorageItem(KEYS.ROOF_EXPENSES, DEFAULT_ROOF_EXPENSES),
  setRoofExpenses: (expenses: RoofExpense[]) => setStorageItem(KEYS.ROOF_EXPENSES, expenses),

  getVRLedger: (): VRLedgerRow[] => getStorageItem(KEYS.VR_LEDGER, DEFAULT_VR_LEDGER),
  setVRLedger: (ledger: VRLedgerRow[]) => setStorageItem(KEYS.VR_LEDGER, ledger),

  getVoucherSummaries: (): Record<string, VoucherSummarySheet> => getStorageItem(KEYS.VOUCHER_SUMMARIES, DEFAULT_VOUCHER_SUMMARIES),
  setVoucherSummaries: (summaries: Record<string, VoucherSummarySheet>) => setStorageItem(KEYS.VOUCHER_SUMMARIES, summaries),

  getVouchers: (): BillVoucher[] => getStorageItem(KEYS.VOUCHERS, DEFAULT_VOUCHERS),
  setVouchers: (vouchers: BillVoucher[]) => setStorageItem(KEYS.VOUCHERS, vouchers),

  getContractors: (): Contractor[] => getStorageItem(KEYS.CONTRACTORS, DEFAULT_CONTRACTORS),
  setContractors: (contractors: Contractor[]) => setStorageItem(KEYS.CONTRACTORS, contractors),

  getContractorPayments: (): ContractorPayment[] => getStorageItem(KEYS.CONTRACTOR_PAYMENTS, DEFAULT_CONTRACTOR_PAYMENTS),
  setContractorPayments: (payments: ContractorPayment[]) => setStorageItem(KEYS.CONTRACTOR_PAYMENTS, payments),

  getUserRole: (): UserRole => {
    const role = localStorage.getItem(KEYS.USER_ROLE);
    return (role as UserRole) || 'admin';
  },
  setUserRole: (role: UserRole) => localStorage.setItem(KEYS.USER_ROLE, role),

  getSelectedProjectId: (): string => {
    return localStorage.getItem(KEYS.SELECTED_PROJECT_ID) || 'ALL';
  },
  setSelectedProjectId: (id: string) => localStorage.setItem(KEYS.SELECTED_PROJECT_ID, id),

  exportFullBackup: () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      companyName: 'ASSETTED BUILDERS LTD.',
      settings: Storage.getSettings(),
      projects: Storage.getProjects(),
      customers: Storage.getCustomers(),
      customerPayments: Storage.getCustomerPayments(),
      roofExpenses: Storage.getRoofExpenses(),
      vrLedger: Storage.getVRLedger(),
      vouchers: Storage.getVouchers(),
      contractors: Storage.getContractors(),
      contractorPayments: Storage.getContractorPayments()
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assetted_builders_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importBackup: (jsonContent: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonContent);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid JSON file format.' };
      }

      if (data.settings) Storage.setSettings(data.settings);
      if (Array.isArray(data.projects)) Storage.setProjects(data.projects);
      if (Array.isArray(data.customers)) Storage.setCustomers(data.customers);
      if (Array.isArray(data.customerPayments)) Storage.setCustomerPayments(data.customerPayments);
      if (Array.isArray(data.roofExpenses)) Storage.setRoofExpenses(data.roofExpenses);
      if (Array.isArray(data.vrLedger)) Storage.setVRLedger(data.vrLedger);
      if (Array.isArray(data.vouchers)) Storage.setVouchers(data.vouchers);
      if (Array.isArray(data.contractors)) Storage.setContractors(data.contractors);
      if (Array.isArray(data.contractorPayments)) Storage.setContractorPayments(data.contractorPayments);

      return { success: true, message: 'Backup restored successfully! All data updated.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown parsing error';
      return { success: false, message: `Failed to parse backup file: ${msg}` };
    }
  },

  resetToDefaults: () => {
    Storage.setSettings(DEFAULT_COMPANY_SETTINGS);
    Storage.setProjects(DEFAULT_PROJECTS);
    Storage.setCustomers(DEFAULT_CUSTOMERS);
    Storage.setCustomerPayments(DEFAULT_CUSTOMER_PAYMENTS);
    Storage.setRoofExpenses(DEFAULT_ROOF_EXPENSES);
    Storage.setVRLedger(DEFAULT_VR_LEDGER);
    Storage.setVouchers(DEFAULT_VOUCHERS);
    Storage.setContractors(DEFAULT_CONTRACTORS);
    Storage.setContractorPayments(DEFAULT_CONTRACTOR_PAYMENTS);
    Storage.setSelectedProjectId('ALL');
  }
};
