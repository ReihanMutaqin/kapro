import { LayoutDashboard, FileBarChart2, Activity, ClipboardCheck, RotateCcw, ChevronRight } from 'lucide-react';

export type Page = 'dashboard' | 'report' | 'monitoring' | 'evaluasi';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
  { id: 'report', label: 'Report', icon: FileBarChart2, color: 'text-violet-500' },
  { id: 'monitoring', label: 'Monitoring', icon: Activity, color: 'text-emerald-500' },
  { id: 'evaluasi', label: 'Evaluasi', icon: ClipboardCheck, color: 'text-amber-500' },
];

export function Header({ onReset, hasData, activePage, onNavigate }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-[56px] px-5 bg-white border-b border-[#E5E5E5] flex-shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
          <LayoutDashboard className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-[14px] font-bold text-[#111827] tracking-tight leading-none">KPRO</h1>
          <p className="text-[10px] text-[#9CA3AF] font-medium leading-none mt-0.5">Dashboard Analytics</p>
        </div>
      </div>

      {/* Nav Menu — only visible when data is loaded */}
      {hasData && (
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : item.color}`} />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
              </button>
            );
          })}
        </nav>
      )}

      {/* Actions */}
      {hasData && (
        <button
          onClick={onReset}
          id="btn-new-file"
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151] transition-colors duration-150"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New File
        </button>
      )}
    </header>
  );
}
