export type UserRole = 'admin' | 'accounts' | 'project_manager';

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  logoUrl: string;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  landArea: string;
  floors: number;
  startDate: string;
  expectedCompletionDate: string;
  status: 'Planning' | 'In Progress' | 'Near Completion' | 'Completed' | 'On Hold';
  budget: number;
  description: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  nidOrPassport: string;
  address: string;
  projectId: string;
  unitNo: string;
  floorNo: string;
  sizeSqFt: number;
  agreedPrice: number;
  bookingDate: string;
  handoverDate: string;
  notes?: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  projectId: string;
  mrNo: string; // Money Receipt Number
  date: string;
  installmentName: string; // e.g. Booking Money, Down Payment, 1st Installment
  paymentMethod: 'Cash' | 'Cheque' | 'Bank Transfer' | 'Pay Order';
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  amount: number;
  receivedBy: string;
  remarks?: string;
}

export interface VoucherItem {
  id: string;
  sl: number;
  date: string;
  particulars: string;
  amount: number;
}

export interface BillVoucher {
  id: string;
  voucherNo: string; // BV-2026-0001
  date: string;
  name: string;
  designation: string;
  projectId: string;
  contactNumber: string;
  items: VoucherItem[];
  totalAmount: number;
  amountInWords: string;
  receivedBy: string;
  approvedBy: string;
  isLandOwnerVoucher: boolean;
  totalLandPrice?: number;
  totalPaymentReceived?: number;
  outstandingDue?: number;
  remarks?: string;
}

export interface RoofExpense {
  id: string;
  sl: number;
  date: string;
  name: string;
  description: string;
  total: number;
  projectId: string;
  category: 'Materials' | 'Labor' | 'Salary' | 'Utilities' | 'Equipment' | 'Transport' | 'Other';
}

export interface VRLedgerRow {
  id: string;
  sl: number;
  vrNo: string; // VR-01 to VR-18
  date: string;
  projectId: string;
  isHeaderRow?: boolean;
  landOwnerInvestor: number | string;
  rajLabour: number | string;
  contractorJamal: number | string;
  bricks: number | string;
  sand: number | string;
  cement: number | string;
  rod: number | string;
  stone: number | string;
  sanitary: number | string;
  staffSalary: number | string;
  electric: number | string;
  utilityBill: number | string;
  engineerPailing: number | string;
  othersPayment: number | string;
  officeExpense: number | string;
  totalAmount: number | string;
  comments?: string;
  // Legacy / convenience fields
  paymentType?: 'Cash' | 'Cheque' | 'Mixed';
  chequeNo?: string;
  particulars?: string;
  status?: 'Audited' | 'Pending' | 'Verified';
  remarks?: string;
}

export interface VoucherSummaryItem {
  id: string;
  sl: number;
  details: string;
  quantity?: string;
  totalAmount: number;
  comments?: string;
}

export interface VoucherSummarySheet {
  id: string;
  vrNo: string; // e.g. "VR-07"
  voucherTitle: string; // e.g. "ASSETED MASTER TOWER (Voucher 7)"
  subtitle: string; // e.g. "5th floor Summary Sheet Debit-2026"
  dateRange: string; // e.g. "10/12/2025 to 20/02/2026"
  items: VoucherSummaryItem[];
  totalAmount: number;
}

export interface Contractor {
  id: string;
  name: string;
  type: 'Civil Work' | 'Rod & Steel' | 'Stone & Sand' | 'Electrical' | 'Sanitary' | 'Paint & Tiles' | 'Other';
  contactPerson: string;
  phone: string;
  address: string;
  projectId: string;
  totalContractValue: number;
  totalPaid: number;
  balanceDue: number;
  status: 'Active' | 'Completed' | 'Suspended';
}

export interface ContractorPayment {
  id: string;
  contractorId: string;
  projectId: string;
  voucherNo: string;
  date: string;
  billParticulars: string;
  paymentMethod: 'Cash' | 'Cheque' | 'Bank Transfer';
  amount: number;
  paidBy: string;
  notes?: string;
}
