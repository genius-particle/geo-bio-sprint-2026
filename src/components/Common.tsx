import React from 'react';
import type { Subject } from '../types';
import { SUBJECT_LABELS } from '../types';

export function PageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-2 md:px-8 md:py-6 lg:px-10 w-full h-full ${className}`}>
      {children}
    </div>
  );
}

/** 自适应网格：每卡最小 280px，避免 Pad 上被压成竖条 */
export function ListGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`grid gap-3 [&>*]:mb-0 ${className}`}
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 mt-2 md:mb-6">
      <h1 className="text-xl md:text-2xl font-bold text-[#0F172A]">{title}</h1>
      {subtitle && <p className="text-xs md:text-sm text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

/** 首页蓝色渐变 Hero：进度条 + 三格统计 */
export function HeroCard({ analyzed, total, pending, mistakes }: {
  analyzed: number; total: number; pending: number; mistakes: number;
}) {
  const pct = total > 0 ? Math.round((analyzed / total) * 100) : 0;
  return (
    <div className="rounded-2xl p-5 md:p-6 text-white mb-4 mt-2"
      style={{ background: 'linear-gradient(135deg, #0077B6 0%, #38BDF8 100%)' }}>
      <h2 className="text-lg font-bold mb-3 md:hidden">地生冲刺</h2>
      <div className="md:flex md:items-center md:gap-8">
        <div className="flex-1 mb-3 md:mb-0">
          <p className="hidden md:block text-sm font-semibold opacity-90 mb-2">学习进度</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 md:h-3 bg-white/30 rounded overflow-hidden">
              <div className="h-full bg-[#FFB703] rounded transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs md:text-sm font-semibold whitespace-nowrap">{analyzed}/{total} 已分析</span>
          </div>
        </div>
        <div className="flex gap-2 md:gap-3 md:shrink-0">
          {[
            { label: '总录入', value: total },
            { label: '待分析', value: pending },
            { label: '错题', value: mistakes },
          ].map(s => (
            <div key={s.label} className="flex-1 md:flex-none md:w-24 bg-white/20 rounded-lg py-2 px-3 text-center">
              <div className="text-lg md:text-xl font-bold tabular-nums">{s.value}</div>
              <div className="text-[10px] md:text-xs opacity-90">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BackLink({ onClick, label = '← 返回' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="text-sm text-brand font-semibold mb-3 block active:opacity-60">
      {label}
    </button>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = '' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-[#58CC02] text-white py-4 text-base font-bold rounded-2xl disabled:opacity-40 active:translate-y-0.5 transition-transform ${className}`}
      style={{ boxShadow: disabled ? 'none' : '0 4px 0 #46A302' }}
    >
      {children}
    </button>
  );
}

/** 六边形学科标 */
export function HexSubjectBadge({ subject, size = 44 }: { subject: Subject; size?: number }) {
  const isGeo = subject === 'geography';
  return (
    <div
      className={`hex-badge flex items-center justify-center text-white font-bold flex-shrink-0 ${isGeo ? 'bg-[#0077B6]' : 'bg-[#10B981]'}`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {isGeo ? '地' : '生'}
    </div>
  );
}

/** 圆形进度环（错题复习次数） */
export function ProgressRing({ value, max = 5, color = '#E63946', size = 44 }: {
  value: number; max?: number; color?: string; size?: number;
}) {
  const r = size / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circumference;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">{value}</span>
    </div>
  );
}

export function ListCard({ leading, title, meta, onClick }: {
  leading: React.ReactNode;
  title: string;
  meta?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3.5 p-3.5 bg-[#F8FAFC] rounded-[14px] mb-2 min-w-0 ${onClick ? 'cursor-pointer active:opacity-70' : ''}`}
    >
      {leading}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm md:text-base leading-snug">{title}</div>
        {meta && <div className="text-xs md:text-sm text-muted mt-0.5">{meta}</div>}
      </div>
    </div>
  );
}

/** 兼容旧用法：带学科六边形的列表卡 */
export function ListRow({ subject, title, meta, onClick, leading }: {
  subject?: Subject;
  title: string;
  meta?: string;
  onClick?: () => void;
  leading?: React.ReactNode;
}) {
  const icon = leading ?? (subject ? <HexSubjectBadge subject={subject} /> : null);
  return <ListCard leading={icon} title={title} meta={meta} onClick={onClick} />;
}

export function SegmentedControl<T extends string>({ options, value, onChange, variant = 'default', className = '' }: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  variant?: 'default' | 'warn';
  className?: string;
}) {
  const activeColor = variant === 'warn' ? 'text-[#E63946]' : 'text-brand';
  return (
    <div className={`flex bg-[#F1F5F9] rounded-xl p-1 mb-3 ${className}`}>
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all ${
            value === opt.id
              ? `bg-white ${activeColor} shadow-sm`
              : 'text-muted bg-transparent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = '搜索知识点…' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative mb-3">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 border-2 border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] outline-none focus:border-brand placeholder:text-[#94A3B8]"
      />
    </div>
  );
}

export function StatusBadge({ children, variant = 'default' }: {
  children: React.ReactNode;
  variant?: 'default' | 'geo' | 'bio' | 'warn' | 'ok' | 'err';
}) {
  const styles = {
    default: 'bg-[#F1F5F9] text-[#64748B]',
    geo: 'bg-[#DBEAFE] text-[#1D4ED8]',
    bio: 'bg-[#D1FAE5] text-[#047857]',
    warn: 'bg-[#FEF3C7] text-[#B45309]',
    ok: 'bg-[#D1FAE5] text-[#047857]',
    err: 'bg-[#FEE2E2] text-[#B91C1C]',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold mr-1.5 mb-1.5 ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function SubjectLabel({ subject }: { subject: Subject }) {
  return <StatusBadge variant={subject === 'geography' ? 'geo' : 'bio'}>{SUBJECT_LABELS[subject]}</StatusBadge>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted mb-3">{children}</p>
  );
}

export function LoadingSpinner({ text, className = '' }: { text?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="w-8 h-8 border-2 border-[#E2E8F0] border-t-brand rounded-full animate-spin mb-3" />
      {text && <p className="text-muted text-sm">{text}</p>}
    </div>
  );
}

export function EmptyState({ message, subMessage }: { message: string; subMessage?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <p className="text-base font-bold text-muted">{message}</p>
      {subMessage && <p className="text-sm text-[#94A3B8] mt-2">{subMessage}</p>}
    </div>
  );
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-muted mb-2">{children}</label>;
}

export function FormInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border-2 border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFC] outline-none focus:border-brand placeholder:text-[#94A3B8] mb-4 ${className}`}
    />
  );
}

export function FormSelect({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border-2 border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFC] outline-none focus:border-brand mb-4 ${className}`}
    >
      {children}
    </select>
  );
}

/** 解析区块（题目详情用） */
export function ParseBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F0FDF4] border-l-4 border-[#10B981] pl-3 py-3 rounded-r-lg text-sm leading-relaxed">
      {children}
    </div>
  );
}
