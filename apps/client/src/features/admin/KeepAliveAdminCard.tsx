import { useCallback, useEffect, useState } from 'react';
import { Activity, Loader2, Radio, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

interface KeepAliveState {
  enabled: boolean; intervalMinutes: number; lastPingAt: string | null;
  lastPingOk: boolean; lastPingError: string | null; pingCount: number; pingUrl: string;
}
interface PingResult { ok: boolean; error: string | null; }

export default function KeepAliveAdminCard() {
  const [state, setState] = useState<KeepAliveState | null>(null);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setState((await api.get<KeepAliveState>('/health/keep-alive')).data); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load keep-alive status'); }
  }, []);
  useEffect(() => { void refresh(); const id = window.setInterval(() => void refresh(), 30000); return () => window.clearInterval(id); }, [refresh]);

  const action = async (path: string, isToggle: boolean) => {
    setBusy(true); setError(''); setPingResult(null);
    try {
      const response = await api.post(path);
      if (isToggle) setState(response.data as KeepAliveState);
      else { setPingResult(response.data as PingResult); await refresh(); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Keep-alive action failed'); }
    finally { setBusy(false); }
  };

  return <section className="rounded-3xl border border-base-content/10 bg-base-100 p-5 shadow-sm sm:p-6">
    <h4 className="text-sm font-semibold text-base-content/70 flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-primary" /> Service Keep-Alive</h4>
    {!state && !error && <p className="text-sm opacity-60">Loading keep-alive status…</p>}
    {state && <><div className="space-y-1 text-sm">
      <p className="font-semibold"><span className={`inline-block size-2 rounded-full mr-2 ${state.enabled ? 'bg-success' : 'bg-base-content/30'}`} />{state.enabled ? `Enabled · every ${state.intervalMinutes} minutes` : 'Disabled'}</p>
      <p className="text-xs opacity-60">{state.pingCount} pings · {state.pingUrl}</p>
      <p className="text-xs opacity-60">{state.lastPingAt ? `Last ping ${new Date(state.lastPingAt).toLocaleString()} · ${state.lastPingOk ? 'successful' : state.lastPingError ?? 'failed'}` : 'No ping recorded yet'}</p>
    </div><div className="flex gap-2 mt-4 flex-wrap">
      <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => void action('/health/ping', false)}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Radio className="size-4" />}Ping now</button>
      <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void action('/health/keep-alive/toggle', true)}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}{state.enabled ? 'Turn off' : 'Turn on'}</button>
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void refresh()} aria-label="Refresh keep-alive status"><RefreshCw className="size-4" /></button>
    </div></>}
    {error && <p role="alert" className="text-sm text-error mt-3">{error}</p>}
    {pingResult && <p className={`text-xs mt-3 ${pingResult.ok ? 'text-success' : 'text-error'}`}>{pingResult.ok ? 'Ping succeeded' : `Ping failed: ${pingResult.error}`}</p>}
  </section>;
}
