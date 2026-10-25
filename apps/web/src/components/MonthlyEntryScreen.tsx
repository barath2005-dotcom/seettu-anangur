import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Printer,
  Calendar,
  Layers,
  Coins,
  CheckCircle2,
  Clock,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, SupportedLanguage } from '@seettu/shared';

interface MonthlyEntry {
  sno: number;
  sheetNumber: number;
  chitNo: string;
  date: string;
  memberNumber: string;
  memberName: string;
  amount: number;
  commission: number;
  status: string;
  paymentMethod: string;
  notes?: string;
}

export function MonthlyEntryScreen({
  user,
  lang,
  showToast,
}: {
  user: any;
  lang: SupportedLanguage;
  showToast: any;
}) {
  const [chitNo, setChitNo] = useState('08');
  const [date, setDate] = useState('25.10.26');
  const [selectedSheet, setSelectedSheet] = useState<number | 'ALL'>('ALL');
  const [entries, setEntries] = useState<MonthlyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedReportsList, setSavedReportsList] = useState<any[]>([]);

  // Bulk edit state
  const [bulkCommission, setBulkCommission] = useState('');

  const loadReport = (targetChit = chitNo, targetDate = date) => {
    setLoading(true);
    api.getMonthlyReport({ chitNo: targetChit, date: targetDate })
      .then((res) => {
        if (res.success && res.data) {
          setEntries(res.data.entries || []);
          setIsSaved(Boolean(res.data.isSaved));
        }
      })
      .catch((err) => {
        showToast(err.message || 'Failed to load report', 'error');
      })
      .finally(() => setLoading(false));
  };

  const loadSavedDates = () => {
    api.getMonthlyReportDates()
      .then((res) => {
        if (res.success && res.data) {
          setSavedReportsList(res.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadReport(chitNo, date);
    loadSavedDates();
  }, []);

  const handleFieldChange = (index: number, field: keyof MonthlyEntry, value: any) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const applyBulkCommission = () => {
    const val = Number(bulkCommission) || 0;
    setEntries((prev) =>
      prev.map((e) => {
        if (selectedSheet === 'ALL' || e.sheetNumber === selectedSheet) {
          return { ...e, commission: val };
        }
        return e;
      })
    );
    showToast(
      lang === 'ta'
        ? `அனைத்து உறுப்பினர்களுக்கும் கமிஷன் ₹${val} அமைக்கப்பட்டது`
        : `Applied ₹${val} commission to current view`
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.saveMonthlyReport({
        chitNo,
        date,
        entries,
      });
      if (res.success) {
        setIsSaved(true);
        showToast(
          lang === 'ta'
            ? `சீட்டு எண் ${chitNo} (${date}) மாதாந்திர அறிக்கை வெற்றிகரமாகச் சேமிக்கப்பட்டது!`
            : res.message
        );
        loadSavedDates();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save monthly report', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter entries by Sheet
  const displayedEntries =
    selectedSheet === 'ALL'
      ? entries
      : entries.filter((e) => e.sheetNumber === selectedSheet);

  // Totals
  const totalAmount = entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalCommission = entries.reduce((sum, e) => sum + (Number(e.commission) || 0), 0);
  const netPool = totalAmount - totalCommission;

  return (
    <div className="space-y-6">
      {/* Top Header & Chit / Date Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {lang === 'ta' ? 'மாதாந்திர அறிக்கை பதிவு (நிர்வாகம்)' : 'Monthly Report Entry (Admin)'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              isSaved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isSaved
                ? lang === 'ta' ? 'சேமிக்கப்பட்டது' : 'Saved'
                : lang === 'ta' ? 'சேமிக்கப்படவில்லை' : 'Draft / Unsaved'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ta'
              ? 'தேதி, சீட்டு எண், உறுப்பினர் தொகை மற்றும் கமிஷன் விவரங்களைப் பதிவுசெய்க.'
              : 'Enter monthly collections, member contributions, and commissions per Chit & Date.'}
          </p>
        </div>

        {/* Date & Chit No Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 font-mono uppercase">
              {lang === 'ta' ? 'சீட்டு எண்:' : 'Chit No:'}
            </span>
            <input
              type="text"
              value={chitNo}
              onChange={(e) => setChitNo(e.target.value)}
              className="w-16 px-2 py-1 rounded bg-white border border-slate-300 text-xs font-mono font-bold text-center focus:ring-1 focus:ring-[#2F7BFF]"
              placeholder="08"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-600 font-mono uppercase">
              {lang === 'ta' ? 'தேதி:' : 'Date:'}
            </span>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-24 px-2 py-1 rounded bg-white border border-slate-300 text-xs font-mono font-bold text-center focus:ring-1 focus:ring-[#2F7BFF]"
              placeholder="25.10.26"
            />
          </div>

          <button
            onClick={() => loadReport(chitNo, date)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'புதுப்பி' : 'Load'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#2F7BFF] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (lang === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (lang === 'ta' ? 'அறிக்கையைச் சேமிக்க' : 'Save Report')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
            title="Print Official Sheet"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{lang === 'ta' ? 'அச்சிடு' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'ta' ? 'மொத்த உறுப்பினர்கள்' : 'Total Members'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-slate-800">{entries.length}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold font-mono">
              6 {lang === 'ta' ? 'தாள்கள்' : 'Sheets'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'ta' ? 'மொத்த வசூல் தொகை' : 'Total Amount (Collected)'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-600 font-mono">
              ₹{(totalAmount).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">₹10k x 78</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'ta' ? 'மொத்த கமிஷன்' : 'Total Commission'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-purple-600 font-mono">
              ₹{(totalCommission).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-purple-600 font-bold">
              {totalAmount > 0 ? `${((totalCommission / totalAmount) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'ta' ? 'நிகர சீட்டு நிதி' : 'Net Chit Pool'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-blue-600 font-mono">
              ₹{(netPool).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>
          </div>
        </div>
      </div>

      {/* Sheet Tabs & Quick Fill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        {/* Sheet Tabs: All, Sheet 1 to 6 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedSheet('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSheet === 'ALL'
                ? 'bg-[#2F7BFF] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {lang === 'ta' ? 'அனைத்தும் (1-78)' : 'All (1-78)'}
          </button>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSheet(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedSheet === s
                  ? 'bg-[#2F7BFF] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sheet {s} ({(s - 1) * 13 + 1}-{s * 13})
            </button>
          ))}
        </div>

        {/* Bulk Commission Setter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {lang === 'ta' ? 'கமிஷன் நிரப்ப:' : 'Set Commission:'}
          </span>
          <input
            type="number"
            value={bulkCommission}
            onChange={(e) => setBulkCommission(e.target.value)}
            placeholder="₹ 500"
            className="w-20 px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold focus:ring-1 focus:ring-[#2F7BFF]"
          />
          <button
            onClick={applyBulkCommission}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold transition-colors"
          >
            {lang === 'ta' ? 'நிரப்பு' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Main Table: S.No | Sheet / Name | Amount | Commission */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Printable Official Header matching PDF */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-sm font-extrabold text-slate-900">
          <div>
            <span className="text-slate-500 font-normal">தேதி : </span>
            <span className="font-mono">{date}</span>
          </div>
          <div className="text-center font-bold text-xs uppercase tracking-wide text-slate-700">
            {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு' : 'Sri Pattanathu Mariamman Anangur Seettu'}
          </div>
          <div>
            <span className="text-slate-500 font-normal">சீட்டு எண் : </span>
            <span className="font-mono">{chitNo}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="py-3 px-4 w-16 text-center border-r border-slate-200">S.no</th>
                <th className="py-3 px-4 border-r border-slate-200">
                  {selectedSheet === 'ALL' ? 'Sheet / Name' : `Sheet ${selectedSheet}`}
                </th>
                <th className="py-3 px-4 w-36 text-center border-r border-slate-200">Amount</th>
                <th className="py-3 px-4 w-36 text-center border-r border-slate-200">Commission</th>
                <th className="py-3 px-4 w-32 text-center border-r border-slate-200">Payment Mode</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    {lang === 'ta' ? 'மாதாந்திர விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading monthly report entries...'}
                  </td>
                </tr>
              ) : displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    {lang === 'ta' ? 'பதிவுகள் எதுவும் இல்லை' : 'No records found'}
                  </td>
                </tr>
              ) : (
                displayedEntries.map((e, idx) => {
                  const globalIndex = entries.findIndex((item) => item.sno === e.sno);
                  return (
                    <tr
                      key={e.sno}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      {/* S.No */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 border-r border-slate-200 bg-slate-50/50">
                        {e.sno}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 border-r border-slate-200">
                        <div className="font-bold text-slate-900 text-sm">{e.memberName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{e.memberNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            Sheet {e.sheetNumber}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        <input
                          type="number"
                          value={e.amount}
                          onChange={(ev) =>
                            handleFieldChange(globalIndex, 'amount', Number(ev.target.value))
                          }
                          className="w-full text-center font-mono font-bold text-slate-800 px-2 py-1.5 rounded border border-slate-200 focus:ring-2 focus:ring-[#2F7BFF] focus:border-transparent text-xs"
                        />
                      </td>

                      {/* Commission */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 bg-purple-50/20">
                        <input
                          type="number"
                          value={e.commission}
                          onChange={(ev) =>
                            handleFieldChange(globalIndex, 'commission', Number(ev.target.value))
                          }
                          placeholder="0"
                          className="w-full text-center font-mono font-bold text-purple-700 px-2 py-1.5 rounded border border-purple-200 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent text-xs"
                        />
                      </td>

                      {/* Payment Method */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        <select
                          value={e.paymentMethod}
                          onChange={(ev) =>
                            handleFieldChange(globalIndex, 'paymentMethod', ev.target.value)
                          }
                          className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-[#2F7BFF]"
                        >
                          <option value="CASH">💵 Cash (ரொக்கம்)</option>
                          <option value="UPI">📱 GPay / UPI</option>
                          <option value="BANK_TRANSFER">🏦 Bank</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleFieldChange(
                              globalIndex,
                              'status',
                              e.status === 'PAID' ? 'PENDING' : 'PAID'
                            )
                          }
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            e.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {e.status === 'PAID' ? '✓ Paid' : '⏳ Pending'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Totals */}
            <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td className="py-3 px-4 text-center font-mono border-r border-slate-300">
                  {displayedEntries.length}
                </td>
                <td className="py-3 px-4 border-r border-slate-300 uppercase tracking-wider text-xs">
                  {lang === 'ta' ? 'மொத்தம் (Total)' : 'Total'}
                </td>
                <td className="py-3 px-4 text-center font-mono text-emerald-700 border-r border-slate-300 text-sm">
                  ₹{displayedEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-center font-mono text-purple-700 border-r border-slate-300 text-sm">
                  ₹{displayedEntries.reduce((s, e) => s + (Number(e.commission) || 0), 0).toLocaleString('en-IN')}
                </td>
                <td colSpan={2} className="py-3 px-4 text-center font-mono text-blue-700 text-xs">
                  Net Pool: ₹{displayedEntries.reduce((s, e) => s + (Number(e.amount) - Number(e.commission)), 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Floating / Sticky Bottom Bar for Quick Save */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-40">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="font-bold text-slate-800">
            {lang === 'ta' ? 'தேதி:' : 'Date:'} <span className="font-mono">{date}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-slate-800">
            {lang === 'ta' ? 'சீட்டு எண்:' : 'Chit No:'} <span className="font-mono">{chitNo}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            {lang === 'ta' ? 'உறுப்பினர்கள்:' : 'Members:'} <span className="font-bold font-mono">{entries.length}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ta' ? 'அச்சிடு / PDF' : 'Print / PDF'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#2F7BFF] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>
              {saving
                ? lang === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...'
                : lang === 'ta' ? 'மாதாந்திர அறிக்கையைச் சேமிக்க' : 'Save Monthly Report'}
            </span>
          </button>
        </div>
      </div>

      {/* Saved Reports History Drawer */}
      {savedReportsList.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {lang === 'ta' ? 'ஏற்கனவே சேமிக்கப்பட்ட மாதாந்திர அறிக்கைகள்' : 'Previously Saved Monthly Reports'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {savedReportsList.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  setChitNo(r.chitNo);
                  setDate(r.date);
                  loadReport(r.chitNo, r.date);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2 ${
                  chitNo === r.chitNo && date === r.date
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {r.date} (Chit {r.chitNo})
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {r.count} members • ₹{(r.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
