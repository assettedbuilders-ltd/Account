import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Storage } from '../utils/storage';

interface BackupRestoreViewProps {
  onRefreshData: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ onRefreshData }) => {
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleExport = () => {
    Storage.exportFullBackup();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = Storage.importBackup(content);
      setImportStatus(result);
      if (result.success) {
        onRefreshData();
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    Storage.resetToDefaults();
    setIsResetConfirmOpen(false);
    setImportStatus({
      success: true,
      message: 'System database successfully reset to factory historical defaults!'
    });
    onRefreshData();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-500" /> Database Backup, Restore & Reset
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Safeguard accounting ledgers, bill vouchers, and client payment records via JSON persistence
        </p>
      </div>

      {importStatus && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 font-semibold ${
            importStatus.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          {importStatus.message}
        </div>
      )}

      {/* 3 Action Cards */}
      <div className="grid grid-cols-1 gap-5">
        {/* Export Backup */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" /> Download Full Database Backup (.json)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Exports all projects, bill vouchers, customer installments, VR-01 to VR-09 ledger, and contractor bills into a single portable JSON file.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Download Backup
          </button>
        </div>

        {/* Restore Backup */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" /> Restore Database from Backup File
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload a previously exported `.json` file to restore all company records into your browser storage.
            </p>
          </div>
          <label className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
            <Upload className="w-3.5 h-3.5" /> Upload File
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Reset to Factory Defaults */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-rose-700 text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" /> Reset to Historical Demo Dataset
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Restores initial historical records for Assetted Master Tower, 13 Eight Roof Costs, VR-01 through VR-09 statements, and sample bill vouchers.
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Database
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-base font-bold text-slate-900">Confirm Database Reset</h2>
            </div>
            <p className="text-slate-600 mb-4">
              Are you sure you want to reset all data back to the default historical state? Any custom entries created during this session will be replaced with initial Assetted Builders records.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
