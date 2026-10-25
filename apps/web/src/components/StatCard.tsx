import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-lg border ${colorMap[color]} dark:bg-opacity-20`}>{icon}</div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5">
            {trend && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{trend}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
