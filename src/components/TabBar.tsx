import type { ViewMode } from '../types';

const TABS: { id: ViewMode; label: string; Icon: React.FC<{ active?: boolean; inline?: boolean }> }[] = [
  { id: 'home', label: '首页', Icon: IconHome },
  { id: 'mistakes', label: '错题本', Icon: IconMistakes },
  { id: 'knowledge', label: '知识库', Icon: IconKnowledge },
  { id: 'practice', label: '练习', Icon: IconPractice },
];

const ACTIVE = '#0077B6';
const INACTIVE = '#94A3B8';

/** 手机底部 Tab（md 以下） */
export default function TabBar({ active, onChange }: { active: ViewMode; onChange: (id: ViewMode) => void }) {
  return (
    <div className="md:hidden border-t-2 border-[#F1F5F9] bg-white safe-area-bottom">
      <div className="flex w-full">
        {TABS.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 py-2 text-center transition-colors ${isActive ? 'text-brand' : 'text-[#94A3B8]'}`}
            >
              <tab.Icon active={isActive} />
              <div className="text-[10px] mt-1 font-semibold">{tab.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Pad 侧边栏（md 及以上） */
export function SideNav({ active, onChange, onCapture }: {
  active: ViewMode;
  onChange: (id: ViewMode) => void;
  onCapture?: () => void;
}) {
  return (
    <aside className="hidden md:flex flex-col w-[220px] lg:w-[240px] shrink-0 border-r border-[#E2E8F0] bg-white h-full">
      <div className="p-5" style={{ background: 'linear-gradient(135deg, #0077B6 0%, #38BDF8 100%)' }}>
        <h1 className="text-white font-bold text-lg">地生冲刺</h1>
        <p className="text-white/80 text-xs mt-1">八年级地生会考</p>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {TABS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold text-sm transition-colors ${
                isActive ? 'bg-[#E8F4FC] text-brand' : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              <item.Icon active={isActive} inline />
              {item.label}
            </button>
          );
        })}
      </nav>
      {onCapture && (
        <div className="p-4 border-t border-[#E2E8F0]">
          <button
            onClick={onCapture}
            className="w-full bg-[#58CC02] text-white py-3.5 text-sm font-bold rounded-xl active:translate-y-0.5"
            style={{ boxShadow: '0 3px 0 #46A302' }}
          >
            拍照录入
          </button>
        </div>
      )}
    </aside>
  );
}

function IconHome({ active, inline }: { active?: boolean; inline?: boolean }) {
  const stroke = active ? ACTIVE : INACTIVE;
  return (
    <svg className={inline ? undefined : 'mx-auto'} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}

function IconMistakes({ active, inline }: { active?: boolean; inline?: boolean }) {
  const stroke = active ? ACTIVE : INACTIVE;
  return (
    <svg className={inline ? undefined : 'mx-auto'} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function IconKnowledge({ active, inline }: { active?: boolean; inline?: boolean }) {
  const stroke = active ? ACTIVE : INACTIVE;
  return (
    <svg className={inline ? undefined : 'mx-auto'} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function IconPractice({ active, inline }: { active?: boolean; inline?: boolean }) {
  const stroke = active ? ACTIVE : INACTIVE;
  return (
    <svg className={inline ? undefined : 'mx-auto'} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
