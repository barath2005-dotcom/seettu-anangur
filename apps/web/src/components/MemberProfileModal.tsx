import React, { useState } from 'react';
import { SupportedLanguage } from '@seettu/shared';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  X,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';
import { api } from '../services/api';

interface MemberProfileModalProps {
  user: any;
  lang: SupportedLanguage;
  onClose: () => void;
  onSaveSuccess: (updatedUser: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  user,
  lang,
  onClose,
  onSaveSuccess,
  showToast,
}) => {
  const isTa = lang === 'ta';

  // Extract initial values from user and user.member
  const member = user?.member || {};
  const [phone, setPhone] = useState(member?.phone || user?.phone || '');
  const [email, setEmail] = useState(
    member?.email || (user?.email && !user.email.endsWith('@seettu.local') ? user.email : '')
  );
  const [address, setAddress] = useState(member?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initial display name and initials
  const fullName = member?.fullName || user?.name || '-';
  const memberNumber = member?.memberNumber || (user?.memberId ? 'MEMBER' : 'STAFF/ADMIN');
  const initials = fullName
    .split('/')
    .map((p: string) => p.trim())[0]
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanAddress = address.trim();

    if (!cleanPhone) {
      showToast(isTa ? 'கைபேசி எண் கட்டாயம் தேவை' : 'Mobile number is required', 'error');
      return;
    }

    if (cleanPhone.replace(/[^0-9]/g, '').length < 10) {
      showToast(
        isTa
          ? 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்'
          : 'Please enter a valid 10-digit mobile number',
        'error'
      );
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        phone: cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
      };

      const res = await api.updateProfile(payload);

      if (res.success && res.data) {
        setSaveSuccess(true);
        showToast(
          isTa
            ? 'சுயவிவரம் (கைபேசி எண், மின்னஞ்சல், முகவரி) தரவுத்தளத்தில் வெற்றிகரமாக சேமிக்கப்பட்டது!'
            : 'Profile (phone, email, address) saved to database successfully!'
        );
        onSaveSuccess(res.data);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        showToast(res.message || 'Failed to update profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#111C2E] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Royal Temple Blue Theme */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1D4ED8] p-6 text-white relative flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/50 text-white font-black text-xl flex items-center justify-center shadow-inner shrink-0">
              {initials}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  {memberNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase">
                  {user.role === 'ADMIN'
                    ? (isTa ? 'நிர்வாகி (Admin)' : 'Admin')
                    : user.role === 'STAFF'
                    ? (isTa ? 'பணியாளர் (Staff)' : 'Staff')
                    : (isTa ? 'உறுப்பினர் (Member)' : 'Member')}
                </span>
              </div>
              <h3 className="text-lg font-black text-white leading-snug truncate max-w-[280px]">
                {fullName}
              </h3>
              <p className="text-[11px] text-blue-100">
                {isTa
                  ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு'
                  : 'Sri Pattanathu Mariamman Anangur Chit Fund'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-3 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <p>
              {isTa
                ? 'உங்கள் கைபேசி எண், மின்னஞ்சல் மற்றும் வசிப்பிட முகவரியை திருத்தி கீழே உள்ள "சேமிக்கவும்" பொத்தானை அழுத்தவும். இது தரவுத்தளத்தில் நேரடியாக பதியப்படும்.'
                : 'Edit your mobile number, email address, and home address below. Changes will be saved directly into the live database.'}
            </p>
          </div>

          {/* 1. Mobile Number Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>{isTa ? 'கைபேசி எண் (Mobile Number) *' : 'Mobile Number (WhatsApp/SMS) *'}</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={15}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9840100001"
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              {isTa
                ? 'மாதாந்திர சீட்டு தவணை மற்றும் ரசீது வாட்ஸ்அப் அறிவிப்புகள் இந்த எண்ணிற்கு அனுப்பப்படும்.'
                : 'Used for chit due reminders and instant WhatsApp payment receipts.'}
            </span>
          </div>

          {/* 2. Email Address Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>{isTa ? 'மின்னஞ்சல் முகவரி (Email Address)' : 'Email Address'}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({isTa ? 'விருப்பத்தேர்வு' : 'Optional'})
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="palanisamy.blr@seettu.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400 block">
              {isTa
                ? 'மின்னஞ்சல் இருந்தால் உள்ளிடவும்; இல்லாதவர்கள் காலியாக விடலாம்.'
                : 'Enter your email if available; optional for village members.'}
            </span>
          </div>

          {/* 3. Residential Address Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{isTa ? 'வசிப்பிட முகவரி / ஊர் (Address) *' : 'Residential Address *'}</span>
            </label>
            <textarea
              rows={3}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={
                isTa
                  ? 'எ.கா: பி எல் ஆர், 12 பிள்ளையார் கோவில் தெரு, ஆனங்கூர் - 637004'
                  : 'e.g. 12 Pillaiyar Kovil St, Anangur, Namakkal - 637004'
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all leading-relaxed"
            />
            <span className="text-[10px] text-slate-400 block">
              {isTa
                ? 'சீட்டு பட்டுவாடா மற்றும் நேரடி வசூல் கணக்கீட்டுக்கான இருப்பிட முகவரி.'
                : 'Official address for chit disbursements and village records.'}
            </span>
          </div>

          {/* Chit Scheme Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isTa ? 'இணைந்துள்ள சீட்டுத் திட்டம்' : 'Enrolled Chit Scheme'}
            </span>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு எண்: 08
                </span>
                <span className="text-[11px] text-slate-500">SCH-CHIT-08 • 78 உறுப்பினர்கள்</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              {isTa ? 'ரத்து' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isTa ? 'சேமிக்கப்படுகிறது...' : 'Saving to Database...'}</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{isTa ? 'சேமிக்கப்பட்டது!' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isTa ? 'தரவுத்தளத்தில் சேமிக்கவும்' : 'Save to Database'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
