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
  avatar_url: string | null;
  percentuale_commissione: number;
  lead_gestiti: number;
  chiusi: number;
}

// ── Vital-connection SVG ─────────────────────────────────────────────
function OrgLine({ count }: { count: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = svg.querySelectorAll<SVGPathElement>("[data-branch]");
    paths.forEach((path, i) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      path.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: 1000, easing: "cubic-bezier(0.4,0,0.2,1)", fill: "forwards", delay: 150 + i * 120 }
      );
    });
  }, [count]);

  const W = Math.max(count * 150, 150);
  const H = 90;
  const cx = W / 2;
  const trunkY = 44;
  const branchY = H - 4;

  const branches = Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? cx : (W / (count - 1 || 1)) * i;
    return { d: `M ${cx} ${trunkY} L ${cx} ${trunkY + 22} L ${x} ${branchY}`, x };
  });

  return (
    <svg ref={svgRef} width={W} height={H} className="overflow-visible" style={{ maxWidth: "100%" }}>
      <defs>
        <filter id="org-packet-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="org-dot-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Trunk — dashed with slow pulse */}
      <line x1={cx} y1={0} x2={cx} y2={trunkY} stroke="rgba(0,212,255,0.35)" strokeWidth={2} strokeDasharray="5 4" />
      <line x1={cx} y1={0} x2={cx} y2={trunkY} stroke="rgba(0,212,255,0.9)" strokeWidth={1.5}>
        <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2s" repeatCount="indefinite" />
      </line>

      {branches.map(({ d, x }, i) => {
        const dur = `${2.4 + i * 0.5}s`;
        const begin = `${i * 0.8}s`;
        return (
          <g key={i}>
            {/* Soft glow halo behind the line */}
            <path d={d} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth={7} strokeLinecap="round" />
            {/* Main branch — draws in on mount */}
            <path data-branch d={d} fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth={1.5} strokeLinecap="round" />

            {/* Traveling data-packet */}
            <circle r={3.5} fill="#00d4ff" filter="url(#org-packet-glow)">
              <animateMotion dur={dur} repeatCount="indefinite" begin={begin} path={d} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.88;1" dur={dur} repeatCount="indefinite" begin={begin} />
              <animate attributeName="r" values="2;3.5;2" keyTimes="0;0.5;1" dur={dur} repeatCount="indefinite" begin={begin} />
            </circle>

            {/* Endpoint pulse ring */}
            <circle cx={x} cy={branchY} r={6} fill="none" stroke="#00d4ff">
              <animate attributeName="r" values="5;13;5" dur="2.8s" repeatCount="indefinite" begin={begin} />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2.8s" repeatCount="indefinite" begin={begin} />
            </circle>
            {/* Endpoint solid dot */}
            <circle cx={x} cy={branchY} r={4} fill="#00d4ff" filter="url(#org-dot-glow)">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" begin={`${i * 0.4}s`} />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

// ── Invite modal ────────────────────────────────────────────────────
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [commissione, setCommissione] = useState("10");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-venditore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email, percentuale_commissione: parseFloat(commissione) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore nell'invio");
      setSent(true);
      onSuccess();
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

        {sent ? (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex w-16 h-16 items-center justify-center rounded-full" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)" }}>
              <Check className="w-8 h-8" style={{ color: "#00d4ff" }} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Invito inviato!</h2>
            <p className="text-sm" style={{ color: "#6677aa" }}>Il venditore riceverà un'email con il link per completare il profilo e impostare la password.</p>
            <button onClick={onClose} className="btn-primary mx-auto flex items-center gap-2">Chiudi</button>
          </div>
        ) : (
          <>
            <div>
              <p className="label-section">Team</p>
              <h2 className="mt-2 text-xl font-bold text-foreground">Invita venditore</h2>
              <p className="mt-1 text-sm" style={{ color: "#6677aa" }}>Riceverà un'email per completare il profilo autonomamente.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-section block mb-2">Email</label>
                <input className="input-premium" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mario@esempio.com" required />
              </div>
              <div>
                <label className="label-section block mb-2">Commissione %</label>
                <input className="input-premium" type="number" min="0" max="100" step="0.5" value={commissione} onChange={e => setCommissione(e.target.value)} required />
              </div>
              {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2">
                {loading ? "Invio…" : "Invia invito →"}
              </button>
            </form>
          </>
        )}
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
      .select("id, full_name, avatar_url, percentuale_commissione")
      .eq("role", "venditore");

    // venditore vede solo se stesso
    if (role === "venditore" && user) q = q.eq("id", user.id);

    const { data: profiles } = await q;
    if (!profiles) { setLoading(false); return; }

    // Fetch real lead stats per venditore
    let stats: { venditore_id: string; pipeline_stage: string | null }[] = [];
    if (profiles.length > 0) {
      const ids = profiles.map((p) => p.id);
      const { data: statsData } = await supabase!
        .from("leads")
        .select("venditore_id, pipeline_stage")
        .in("venditore_id", ids);
      stats = (statsData ?? []) as typeof stats;
    }

    const withStats = profiles.map((p) => {
      const myLeads = stats.filter((s) => s.venditore_id === p.id);
      return {
        ...p,
        lead_gestiti: myLeads.length,
        chiusi: myLeads.filter((s) => s.pipeline_stage === "chiuso_vinto").length,
      };
    });

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
                className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-[0_0_48px_rgba(0,212,255,0.45)]"
                style={{ background: "rgba(0,212,255,0.12)", border: "2px solid rgba(0,212,255,0.55)" }}
              >
                <img
                  src="https://tpzpydnvcbcdkuthyweh.supabase.co/storage/v1/object/public/assets/falcon-wings-closed.png"
                  alt="Falcon"
                  style={{ width: 46, height: 46, objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(0,212,255,0.75))" }}
                />
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
                    style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.18)", minWidth: 130 }}
                  >
                    {/* Avatar: photo o initials fallback */}
                    <div
                      className="relative flex h-14 w-14 items-center justify-center rounded-full overflow-hidden text-sm font-black shrink-0"
                      style={{ border: "2px solid rgba(0,212,255,0.45)", color: "#00d4ff", boxShadow: "0 0 18px rgba(0,212,255,0.25)", background: v.avatar_url ? "transparent" : "rgba(0,212,255,0.12)" }}
                    >
                      {v.avatar_url ? (
                        <img src={v.avatar_url} alt={v.full_name ?? ""} className="w-full h-full object-cover" />
                      ) : (
                        initials(v.full_name)
                      )}
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
