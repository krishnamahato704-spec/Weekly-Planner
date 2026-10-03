import React, { useEffect, useState } from 'react';
import { Calendar, Check, X, RefreshCw, Shield, AlertCircle, ExternalLink } from 'lucide-react';
import { GoogleCalendarIntegrationConfig } from '../types';
import { useTimeout } from '../hooks/useTimeout';

interface GoogleCalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleCalendarIntegrationConfig;
  onSaveConfig: (updated: GoogleCalendarIntegrationConfig) => void;
  onShowToast: (msg: string) => void;
}

export const GoogleCalendarSettingsModal: React.FC<GoogleCalendarSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onShowToast,
}) => {
  const [localConfig, setLocalConfig] = useState<GoogleCalendarIntegrationConfig>(config);
  const [isSimulatingConnect, setIsSimulatingConnect] = useState(false);
  const { schedule, cancel } = useTimeout();
  useEffect(() => {
    if (!isOpen) {
      cancel();
      setIsSimulatingConnect(false);
    }
  }, [isOpen, cancel]);

  if (!isOpen) return null;

  const handleToggleConnect = () => {
    if (localConfig.connected) {
      const updated: GoogleCalendarIntegrationConfig = {
        ...localConfig,
        connected: false,
        status: 'not_connected',
        accountEmail: undefined,
      };
      setLocalConfig(updated);
      onSaveConfig(updated);
      onShowToast('Google Calendar disconnected.');
    } else {
      setIsSimulatingConnect(true);
      schedule(() => {
        setIsSimulatingConnect(false);
        const updated: GoogleCalendarIntegrationConfig = {
          ...localConfig,
          connected: true,
          status: 'connected',
          accountEmail: 'user.academic@gmail.com',
          lastSyncedAt: new Date().toISOString(),
        };
        setLocalConfig(updated);
        onSaveConfig(updated);
        onShowToast('Google Calendar connected successfully!');
      }, 700);
    }
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onShowToast('Calendar sync preferences updated.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/50">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Google Calendar Integration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sync scheduled study blocks with your Google Calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Connection Status Box */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  localConfig.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Status: {localConfig.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {localConfig.connected && localConfig.accountEmail && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Linked account: <strong>{localConfig.accountEmail}</strong>
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={isSimulatingConnect}
            onClick={handleToggleConnect}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all min-h-[38px] ${
              localConfig.connected
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            {isSimulatingConnect ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </span>
            ) : localConfig.connected ? (
              'Disconnect'
            ) : (
              'Connect Google Calendar'
            )}
          </button>
        </div>

        {/* Sync Settings */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Sync Planner Tasks to Google Calendar
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'off', label: 'Off' },
                { value: 'timed_only', label: 'Timed Only' },
                { value: 'all', label: 'All Scheduled' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      syncPlannerToGoogle: opt.value as any,
                    }))
                  }
                  className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                    localConfig.syncPlannerToGoogle === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Sync Direction
            </label>
            <select
              value={localConfig.syncDirection}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  syncDirection: e.target.value as any,
                }))
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
            >
              <option value="planner_to_google">Planner → Google Calendar (One-way export)</option>
              <option value="google_to_planner">Google Calendar → Planner (One-way import)</option>
              <option value="two_way">Two-way Sync (Explicit conflict resolution)</option>
            </select>
          </div>

          {/* Privacy & Safety Note (P3.13) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 space-y-1 text-[11px] leading-relaxed">
            <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Privacy & Architecture Guarantee</span>
            </p>
            <p>
              Your planner operates completely standalone offline. No authentication secrets are ever stored in export files, and external failures never delete local study tasks.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[40px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[40px]"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
