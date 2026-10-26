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
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] border-blue-100 dark:border-blue-900/50',
      waveFill: 'rgba(37, 99, 235, 0.07)',
      waveStroke: '#3B82F6',
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-100 dark:border-emerald-900/50',
      waveFill: 'rgba(16, 185, 129, 0.08)',
      waveStroke: '#10B981',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 border-amber-100 dark:border-amber-900/50',
      waveFill: 'rgba(245, 158, 11, 0.08)',
      waveStroke: '#F59E0B',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 border-purple-100 dark:border-purple-900/50',
      waveFill: 'rgba(168, 85, 247, 0.08)',
      waveStroke: '#A855F7',
    },
    red: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-100 dark:border-rose-900/50',
      waveFill: 'rgba(244, 63, 94, 0.08)',
      waveStroke: '#F43F5E',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white dark:bg-[#0E192D] rounded-2xl p-5 shadow-xs hover:shadow-xl hover:-translate-y-0.5 border border-slate-200/80 dark:border-blue-900/40 hover:border-blue-500/40 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group">
      <div className="flex items-start gap-3.5 relative z-10">
        <div className={`p-3 rounded-2xl border ${scheme.bg} shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-400 truncate block">
            {title}
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {value}
          </h3>
          {(subtitle || trend) && (
            <div className="mt-1 flex items-center text-[11px] text-slate-400 dark:text-slate-400 gap-1 truncate">
              {trend && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  {trend}
                </span>
              )}
              {subtitle && <span>{subtitle}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Decorative Wave Sparkline at bottom-right */}
      <div className="absolute right-0 bottom-0 w-28 h-12 pointer-events-none opacity-85 group-hover:scale-105 transition-transform">
        <svg viewBox="0 0 100 50" className="w-full h-full" fill="none" preserveAspectRatio="none">
          <path
            d="M0 45 C 25 45, 35 25, 55 30 C 75 35, 82 12, 100 15 L 100 50 L 0 50 Z"
            fill={scheme.waveFill}
          />
          <path
            d="M0 45 C 25 45, 35 25, 55 30 C 75 35, 82 12, 100 15"
            stroke={scheme.waveStroke}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
