import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Plus, type LucideIcon } from 'lucide-react';

interface BannerAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

interface BannerMeta {
  label: string;
  value: string;
  icon?: LucideIcon;
}

const DashboardBannerActionContext = createContext<{
  action: BannerAction | null;
  setAction: (action: BannerAction | null) => void;
  meta: BannerMeta | null;
  setMeta: (meta: BannerMeta | null) => void;
}>({
  action: null,
  setAction: () => undefined,
  meta: null,
  setMeta: () => undefined,
});

export function DashboardBannerActionProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<BannerAction | null>(null);
  const [meta, setMeta] = useState<BannerMeta | null>(null);

  return (
    <DashboardBannerActionContext.Provider value={{ action, setAction, meta, setMeta }}>
      {children}
    </DashboardBannerActionContext.Provider>
  );
}

export function useDashboardBannerAction(
  label: string,
  onClick: () => void,
  icon?: LucideIcon,
) {
  const { setAction } = useContext(DashboardBannerActionContext);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    const action = { label, icon, onClick: () => onClickRef.current() };
    setAction(action);
    return () => setAction(null);
  }, [icon, label, setAction]);
}

export function useDashboardBannerMeta(label: string, value: string, icon?: LucideIcon) {
  const { setMeta } = useContext(DashboardBannerActionContext);

  useEffect(() => {
    const meta = { label, value, icon };
    setMeta(meta);
    return () => setMeta(null);
  }, [icon, label, setMeta, value]);
}

export function DashboardBannerActionButton() {
  const { action } = useContext(DashboardBannerActionContext);
  if (!action) return null;

  return (
    <button onClick={action.onClick} className="btn btn-warning btn-sm mt-4 shrink-0 gap-2 sm:mt-0">
      {action.icon ? <action.icon className="size-4" /> : <Plus className="size-4" />}
      {action.label}
    </button>
  );
}

export function DashboardBannerMeta() {
  const { meta } = useContext(DashboardBannerActionContext);
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <div className="mt-4 flex shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white sm:mt-0">
      {Icon && <Icon className="size-4 text-warning" />}
      <span className="text-xs text-white/65">{meta.label}</span>
      <span className="text-lg font-semibold tabular-nums text-warning">{meta.value}</span>
    </div>
  );
}
