import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AdminCard, AdminSectionTitle } from "./admin/-admin-ui";
import { UserPlus, X, Check } from "lucide-react";

export const Route = createFileRoute("/admin/team")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Team" },
      { name: "description", content: "Team venditori Falcon Agency." },
    ],
  }),
  component: TeamPage,
});

interface Venditore {
  id: string;
  full_name: string | null;
  email?: string;
  percentuale_commissione: number;
  lead_gestiti: number;
  chiusi: number;
}

// ── Animated SVG connector ──────────────────────────────────────────
function OrgLine({ count }: { count: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
      duration: 900,
      easing: "ease-out",
      fill: "forwards",
      delay: 200,
    });
  }, [count]);

  // trunk goes down 60px, then branches fan out to `count` children
  const W = Math.max(count * 140, 140);
  const H = 80;
  const cx = W / 2;
  const trunkY = 40;
  const branchY = H - 4;

  const branches = Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? cx : (W / (count - 1 || 1)) * i;
    return `M ${cx} ${trunkY} L ${cx} ${trunkY + 20} L ${x} ${branchY}`;
  });

  return (
    <svg width={W} height={H} className="overflow-visible" style={{ maxWidth: "100%" }}>
      {/* trunk */}
      <line x1={cx} y1={0} x2={cx} y2={trunkY} stroke="rgba(0,212,255,0.5)" strokeWidth={2} strokeDasharray="4 4" />
      {/* branches */}
      {branches.map((d, i) => (
        <path key={i} ref={i === 0 ? pathRef : undefined} d={d} fill="none" stroke="rgba(0,212,255,0.4)" strokeWidth={1.5} strokeLinecap="round" />
      ))}
      {/* glow dots at branch ends */}
      {Array.from({ length: count }, (_, i) => {
        const x = count === 1 ? cx : (W / (count - 1 || 1)) * i;
        return <circle key={i} cx={x} cy={branchY} r={4} fill="#00d4ff" opacity={0.7} />;
      })}
    </svg>
  );
}

// ── Invite modal ────────────────────────────────────────────────────
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [commissione, setCommissione] = useState("10");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-venditore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, full_name: nome, password, percentuale_commissione: parseFloat(commissione) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore nella creazione");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="relative w-full max-w-md rounded-2xl p-8 space-y-6" style={{ background: "rgba(7,11,20,0.98)", border: "1px solid rgba(0,212,255,0.2)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        <div>
          <p className="label-section">Team</p>
          <h2 className="mt-2 text-xl font-bold text-foreground">Aggiungi venditore</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-section block mb-2">Nome completo</label>
            <input className="input-premium" value={nome} onChange={e => setNome(e.target.value)} placeholder="Mario Rossi" required />
          </div>
          <div>
            <label className="label-section block mb-2">Email</label>
            <input className="input-premium" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mario@falconagencyai.com" required />
          </div>
          <div>
            <label className="label-section block mb-2">Password temporanea</label>
            <input className="input-premium" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
          </div>
          <div>
            <label className="label-section block mb-2">Commissione %</label>
            <input className="input-premium" type="number" min="0" max="100" step="0.5" value={commissione} onChange={e => setCommissione(e.target.value)} required />
          </div>
          {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2">
            {loading ? "Creazione…" : <><Check className="w-4 h-4" /> Crea account</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────
function TeamPage() {
  const { role, user } = useAuth();
  const [venditori, setVenditori] = useState<Venditore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const loadVenditori = async () => {
    if (!supabase) return;
    setLoading(true);

    // Base query: venditori dal profilo
    let q = supabase
      .from("profiles")
      .select("id, full_name, percentuale_commissione")
      .eq("role", "venditore");

    // venditore vede solo se stesso
    if (role === "venditore" && user) q = q.eq("id", user.id);

    const { data: profiles } = await q;
    if (!profiles) { setLoading(false); return; }

    // venditore_id sarà aggiunto ai leads in uno step successivo — per ora 0
    const withStats = profiles.map((p) => ({
      ...p,
      lead_gestiti: 0,
      chiusi: 0,
    }));

    setVenditori(withStats);
    setLoading(false);
  };

  useEffect(() => { loadVenditori(); }, [role, user]);

  const initials = (name: string | null) =>
    (name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const convRate = (v: Venditore) =>
    v.lead_gestiti > 0 ? `${Math.round((v.chiusi / v.lead_gestiti) * 100)}%` : "—";

  return (
    <>
      {showInvite && role === "admin" && (
        <InviteModal onClose={() => setShowInvite(false)} onSuccess={loadVenditori} />
      )}

      <div className="space-y-10">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="label-section">Sales engine</p>
            <h1 className="mt-3 text-4xl font-black text-foreground">
              Performance <span className="text-primary text-glow">Team</span>
            </h1>
          </div>
          {role === "admin" && (
            <button onClick={() => setShowInvite(true)} className="btn-primary inline-flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Aggiungi venditore
            </button>
          )}
        </header>

        {/* ── Org chart "blueprint" ── */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 md:p-12"
          style={{
            background: "linear-gradient(135deg, #060c1e 0%, #0a1428 60%, #061020 100%)",
            border: "1px solid rgba(0,212,255,0.15)",
            boxShadow: "inset 0 0 80px rgba(0,212,255,0.04)",
          }}
        >
          {/* Blueprint grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "linear-gradient(rgba(0,212,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.6) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Corner decorations */}
          {[["top-4 left-4", "border-t border-l"], ["top-4 right-4", "border-t border-r"], ["bottom-4 left-4", "border-b border-l"], ["bottom-4 right-4", "border-b border-r"]].map(([pos, border]) => (
            <div key={pos} className={`absolute ${pos} h-5 w-5 ${border} border-[rgba(0,212,255,0.4)]`} />
          ))}

          <div className="relative flex flex-col items-center gap-0">
            {/* Root — Falcon Agency */}
            <div className="flex flex-col items-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black shadow-[0_0_40px_rgba(0,212,255,0.35)]"
                style={{ background: "rgba(0,212,255,0.12)", border: "2px solid rgba(0,212,255,0.5)", color: "#00d4ff" }}
              >
                F
              </div>
              <p className="mt-3 text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: "#00d4ff" }}>Falcon Agency</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Admin</p>
            </div>

            {/* Connector SVG */}
            <div className="w-full flex justify-center py-2">
              {venditori.length > 0 ? (
                <OrgLine count={venditori.length} />
              ) : (
                <div className="h-16 w-px" style={{ background: "linear-gradient(to bottom, rgba(0,212,255,0.4), rgba(0,212,255,0.1))" }} />
              )}
            </div>

            {/* Venditori cards */}
            {loading ? (
              <div className="flex gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="h-32 w-32 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                ))}
              </div>
            ) : venditori.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                Nessun venditore ancora. Clicca "Aggiungi venditore" per iniziare.
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                {venditori.map((v) => (
                  <div
                    key={v.id}
                    className="flex flex-col items-center gap-2 rounded-2xl px-5 py-4 text-center"
                    style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.18)", minWidth: 120 }}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-black"
                      style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.35)", color: "#00d4ff" }}
                    >
                      {initials(v.full_name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{v.full_name ?? "—"}</p>
                      <p className="text-[11px] text-muted-foreground">Venditore</p>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}
                    >
                      {v.percentuale_commissione}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Performance table ── */}
        <AdminCard className="p-5">
          <AdminSectionTitle eyebrow="Performance" title="Statistiche venditori" />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <tr className="border-b border-[rgba(0,212,255,0.1)]">
                  <th className="py-4">Venditore</th>
                  <th>Lead gestiti</th>
                  <th>Clienti chiusi</th>
                  <th>Tasso conv.</th>
                  <th>Commissione %</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Caricamento…</td></tr>
                ) : venditori.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nessun venditore</td></tr>
                ) : venditori.map((v) => (
                  <tr key={v.id} className="border-b border-[rgba(255,255,255,0.06)]">
                    <td className="py-4 font-semibold text-foreground">{v.full_name ?? "—"}</td>
                    <td className="text-foreground/80">{v.lead_gestiti}</td>
                    <td className="font-bold text-primary">{v.chiusi}</td>
                    <td className="text-foreground/80">{convRate(v)}</td>
                    <td>
                      <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>
                        {v.percentuale_commissione}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </>
  );
}
