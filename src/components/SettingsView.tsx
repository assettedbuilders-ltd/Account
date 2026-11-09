import React, { useState } from 'react';
import {
  Settings,
  Building2,
  MapPin,
  Phone,
  Mail,
  Save,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';
import { CompanySettings, UserRole } from '../types';

interface SettingsViewProps {
  settings: CompanySettings;
  userRole: UserRole;
  onSaveSettings: (settings: CompanySettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  userRole,
  onSaveSettings
}) => {
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500" /> Company Settings & Legal Branding
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure official company letterhead information, address, phones, and voucher defaults
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-fade-in font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Company settings successfully updated and saved to LocalStorage!
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Logo Preview & Branding */}
          <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-20 w-20 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xs">
              <img
                src={formData.logoUrl}
                alt="Assetted Builders Logo"
                className="max-h-full max-w-full object-contain"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-slate-700 font-bold mb-1">Company Logo Path / URL</label>
              <input
                type="text"
                value={formData.logoUrl}
                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Official logo renders on Bill Vouchers, Customer Statements, and Excel/PDF reports.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Official Registered Office Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Initial Reference: Notun Panir pamp Road, Block# B, Sayednagar, Vatara, Gulshan, Dhaka-1212
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Telephone / Hotline Numbers *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Official Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Default Currency Unit</label>
              <input
                type="text"
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg font-bold"
                placeholder="BDT"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition shadow-xs text-xs"
            >
              <Save className="w-4 h-4" /> Save Company Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
