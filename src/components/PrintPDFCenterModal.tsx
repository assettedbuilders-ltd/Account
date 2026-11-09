import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileSpreadsheet,
  FileText,
  Layers,
  Building2,
  Users,
  Wallet,
  CheckCircle2,
  HardHat,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import {
  Project,
  Customer,
  CustomerPayment,
  BillVoucher,
  RoofExpense,
  VRLedgerRow,
  Contractor,
  ContractorPayment,
  CompanySettings
} from '../types';
import { formatBDT } from '../utils/numberToWords';
import {
  exportMasterLedgerPDF,
  exportVoucherSummaryPDF,
  exportBillVoucherPDF,
  exportRoofExpensesPDF,
  exportCustomerPaymentsPDF,
  exportContractorPaymentsPDF,
  exportFinancialReportPDF,
  triggerPrint
} from '../utils/exportUtils';
import { Storage } from '../utils/storage';

interface PrintPDFCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  vrLedger: VRLedgerRow[];
  vouchers: BillVoucher[];
  roofExpenses: RoofExpense[];
  customers: Customer[];
  customerPayments: CustomerPayment[];
  contractors: Contractor[];
  contractorPayments: ContractorPayment[];
  projects: Project[];
  settings: CompanySettings;
  selectedProjectId: string;
  onNavigate: (viewId: string) => void;
}

export const PrintPDFCenterModal: React.FC<PrintPDFCenterModalProps> = ({
  isOpen,
  onClose,
  vrLedger,
  vouchers,
  roofExpenses,
  customers,
  customerPayments,
  contractors,
  contractorPayments,
  projects,
  settings,
  selectedProjectId,
  onNavigate
}) => {
  if (!isOpen) return null;

  const activeProject = projects.find(
    p => p.id === (selectedProjectId === 'ALL' ? 'PRJ-AMT-01' : selectedProjectId)
  ) || projects[0];

  // Helper calculation for 19-column columnTotals
  const parseNum = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val || val === '-') return 0;
    const clean = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const columnTotals = {
    landOwnerInvestor: vrLedger.reduce((s, r) => s + parseNum(r.landOwnerInvestor), 0),
    rajLabour: vrLedger.reduce((s, r) => s + parseNum(r.rajLabour), 0),
    contractorJamal: vrLedger.reduce((s, r) => s + parseNum(r.contractorJamal), 0),
    bricks: vrLedger.reduce((s, r) => s + parseNum(r.bricks), 0),
    sand: vrLedger.reduce((s, r) => s + parseNum(r.sand), 0),
    cement: vrLedger.reduce((s, r) => s + parseNum(r.cement), 0),
    rod: vrLedger.reduce((s, r) => s + parseNum(r.rod), 0),
    stone: vrLedger.reduce((s, r) => s + parseNum(r.stone), 0),
    sanitary: vrLedger.reduce((s, r) => s + parseNum(r.sanitary), 0),
    staffSalary: vrLedger.reduce((s, r) => s + parseNum(r.staffSalary), 0),
    electric: vrLedger.reduce((s, r) => s + parseNum(r.electric), 0),
    utilityBill: vrLedger.reduce((s, r) => s + parseNum(r.utilityBill), 0),
    engineerPailing: vrLedger.reduce((s, r) => s + parseNum(r.engineerPailing), 0),
    othersPayment: vrLedger.reduce((s, r) => s + parseNum(r.othersPayment), 0),
    officeExpense: vrLedger.reduce((s, r) => s + parseNum(r.officeExpense), 0),
    grandTotal: vrLedger.reduce((s, r) => s + parseNum(r.totalAmount), 0)
  };

  const voucherSummaries = Storage.getVoucherSummaries();
  const voucher7Sheet = voucherSummaries['VR-07'] || Object.values(voucherSummaries)[0];

  const handlePrintDocument = (viewId: string) => {
    onNavigate(viewId);
    onClose();
    setTimeout(() => {
      triggerPrint();
    }, 300);
  };

  const printCards = [
    {
      id: 'master_ledger',
      title: '19-Column Master Project Ledger (Image 1)',
      description: 'Audited ledger with VR-01 to VR-18, Land, Materials, Raj Mistry, and Red Grand Total (৳ 38,719,014).',
      badge: 'Landscape A4/A3',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Layers,
      color: 'text-emerald-700',
      onDownloadPDF: () => exportMasterLedgerPDF(vrLedger, columnTotals, activeProject.name),
      onPrint: () => handlePrintDocument('vr_ledger')
    },
    {
      id: 'voucher_summary',
      title: 'Voucher Breakdown & Debit Sheet (Image 2 - Voucher 7)',
      description: '5th floor Summary Sheet Debit (10/12/2025 to 20/02/2026) with all 8 items totaling ৳ 2,661,578.',
      badge: 'Debit Breakdown',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      icon: FileText,
      color: 'text-sky-700',
      onDownloadPDF: () => exportVoucherSummaryPDF(voucher7Sheet),
      onPrint: () => handlePrintDocument('vr_ledger')
    },
    {
      id: 'bill_voucher',
      title: 'Official Bill Voucher (BV-2026-0001)',
      description: 'Corporate bill voucher with company header, contact, transaction table, in words, and authorized signatures.',
      badge: 'Single Voucher',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: FileSpreadsheet,
      color: 'text-slate-800',
      onDownloadPDF: () => {
        const v = vouchers[0];
        if (v) exportBillVoucherPDF(v, activeProject.name);
      },
      onPrint: () => handlePrintDocument('vouchers')
    },
    {
      id: 'roof_expenses',
      title: 'Statement of Expenses — Eight Roof Costs',
      description: 'Itemized 40+ line construction costs for roof casting (Materials, DESCO, Labor, Transport, Salary).',
      badge: 'Milestone Expenses',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: HardHat,
      color: 'text-amber-700',
      onDownloadPDF: () => exportRoofExpensesPDF(roofExpenses, activeProject.name),
      onPrint: () => handlePrintDocument('roof_expenses')
    },
    {
      id: 'customer_payments',
      title: 'Customer Sales & Payment Collection Statement',
      description: 'Customer bookings, down payments, installments, and outstanding receivables tracking.',
      badge: 'Accounts Receivable',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Wallet,
      color: 'text-emerald-700',
      onDownloadPDF: () => exportCustomerPaymentsPDF(customerPayments, customers, projects),
      onPrint: () => handlePrintDocument('customer_payments')
    },
    {
      id: 'contractors',
      title: 'Contractor & Vendor Accounts Ledger',
      description: 'Civil contractor, Jamal, Manik, Steel & electrical vendors, running bills, payments, and balances.',
      badge: 'Accounts Payable',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      icon: Users,
      color: 'text-indigo-700',
      onDownloadPDF: () => exportContractorPaymentsPDF(contractors, contractorPayments, projects),
      onPrint: () => handlePrintDocument('contractors')
    },
    {
      id: 'executive_report',
      title: 'Executive Financial & Construction Audit Report',
      description: 'Multi-project overview: Approved budgets, actual expenses, flat sales, cash collected, and net position.',
      badge: 'Executive Summary',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: BarChart3,
      color: 'text-purple-700',
      onDownloadPDF: () => exportFinancialReportPDF(projects, vrLedger, customers, customerPayments),
      onPrint: () => handlePrintDocument('reports')
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              <Printer className="w-4 h-4 text-amber-500" />
              Print & PDF Center • Assetted Builders Ltd.
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Download All Files as PDF or Print
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any file to download as vector PDF with official company header and authorized signatures, or trigger direct browser print.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Document Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {printCards.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">{card.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xl">{card.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={card.onDownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" /> Download PDF
                  </button>
                  <button
                    onClick={card.onPrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" /> Print
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info banner */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            All PDFs include official letterhead, address, phone numbers, and signature blocks.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
