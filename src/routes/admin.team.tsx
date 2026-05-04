import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AdminCard, AdminSectionTitle } from "./admin/-admin-ui";
import { UserPlus, X, Check, Video, Phone } from "lucide-react";

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

// ── Types for drawer ────────────────────────────────────────────────
interface VendLead {
  id: string;
  full_name: string | null;
  service_interest: string | null;
  budget_range: string | null;
  pipeline_stage: string | null;
}

interface VendQuote {
  id: string;
  lead_id: string;
  amount: number | null;
  status: string | null;
  service: string | null;
}

interface VendBooking {
  id: string;
  invitee_name: string | null;
  invitee_email: string | null;
  start_time: string;
  status: string;
  meeting_link: string | null;
}

const STAGE_LABEL: Record<string, string> = {
  form_compilato: "Form",
  contattato: "Contattato",
  call_schedulata: "Call sched.",
  call_effettuata: "Call fatta",
  no_show: "No show",
  preventivo_inviato: "Preventivo",
  chiuso_vinto: "Vinto ✓",
  chiuso_perso: "Perso ✗",
};

const STAGE_COLOR: Record<string, string> = {
  chiuso_vinto: "#4ade80",
  chiuso_perso: "#f87171",
  preventivo_inviato: "#f59e0b",
  call_effettuata: "#34d399",
  call_schedulata: "#60a5fa",
  contattato: "#00d4ff",
};

// ── Venditore Detail Drawer ─────────────────────────────────────────
function VenditoreDrawer({
  v,
  onClose,
  initials: ini,
  onCommissioneUpdated,
  onRemoved,
}: {
  v: Venditore;
  onClose: () => void;
  initials: (n: string | null) => string;
  onCommissioneUpdated: (id: string, pct: number) => void;
  onRemoved: (id: string) => void;
}) {
  const { role } = useAuth();
  const [leads, setLeads] = useState<VendLead[]>([]);
  const [bookings, setBookings] = useState<VendBooking[]>([]);
  const [quotes, setQuotes] = useState<VendQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingComm, setEditingComm] = useState(false);
  const [commDraft, setCommDraft] = useState(String(v.percentuale_commissione));
  const [commSaving, setCommSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!supabase) return;
    setRemoving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/remove-venditore`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ venditore_id: v.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore nella rimozione");
      onRemoved(v.id);
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  };

  useEffect(() => {
    if (!supabase) return;
    setLoading(true);
    (async () => {
      const { data: leadsData } = await supabase!
        .from("leads")
        .select("id, full_name, service_interest, budget_range, pipeline_stage")
        .eq("venditore_id", v.id)
        .order("created_at", { ascending: false });
      const myLeads = (leadsData ?? []) as VendLead[];
      setLeads(myLeads);

      if (myLeads.length > 0) {
        const ids = myLeads.map(l => l.id);
        const [bookRes, quoteRes] = await Promise.all([
          supabase!
            .from("bookings")
            .select("id, invitee_name, invitee_email, start_time, status, meeting_link")
            .in("lead_id", ids)
            .order("start_time", { ascending: true }),
          supabase!
            .from("quotes")
            .select("id, lead_id, amount, status, service")
            .in("lead_id", ids)
            .in("status", ["Accettata", "Pagato"]),
        ]);
        setBookings((bookRes.data ?? []) as VendBooking[]);
        setQuotes((quoteRes.data ?? []) as VendQuote[]);
      }
      setLoading(false);
    })();
  }, [v.id]);

  const activeLeads = leads.filter(l => l.pipeline_stage !== "chiuso_vinto" && l.pipeline_stage !== "chiuso_perso");
  const closedWon = leads.filter(l => l.pipeline_stage === "chiuso_vinto");
  const upcomingCalls = bookings.filter(b => b.status === "active" && new Date(b.start_time) > new Date());
  const convRate = leads.length > 0 ? Math.round((closedWon.length / leads.length) * 100) : 0;

  const saveCommissione = async () => {
    if (!supabase) return;
    const pct = parseFloat(commDraft);
    if (isNaN(pct) || pct < 0 || pct > 100) return;
    setCommSaving(true);
    const { error } = await supabase.from("profiles").update({ percentuale_commissione: pct }).eq("id", v.id);
    setCommSaving(false);
    if (error) {
      alert(`Errore: ${error.message}`);
    } else {
      setEditingComm(false);
      onCommissioneUpdated(v.id, pct);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative h-full w-full max-w-lg overflow-y-auto"
        style={{ background: "rgba(7,11,20,0.98)", borderLeft: "1px solid rgba(0,212,255,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Remove confirmation overlay */}
        {confirmRemove && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6" style={{ background: "rgba(7,11,20,0.92)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(248,113,113,0.3)" }}>
              <div className="text-3xl">⚠️</div>
              <h3 className="text-lg font-bold text-white">Rimuovere {v.full_name ?? "questo venditore"}?</h3>
              <p className="text-sm" style={{ color: "#6677aa" }}>
                Il venditore perderà immediatamente l'accesso al pannello. Lead e dati storici rimarranno invariati.
              </p>
              <div className="flex gap-3 justify-center pt-1">
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Annulla
                </button>
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="rounded-xl px-4 py-2 text-sm font-bold transition-all"
                  style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.4)" }}
                >
                  {removing ? "Rimozione…" : "Sì, rimuovi accesso"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-7">
          {/* Profile header */}
          <div className="flex items-center gap-4 pt-2">
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full overflow-hidden text-lg font-black shrink-0"
              style={{
                border: "2px solid rgba(0,212,255,0.45)",
                color: "#00d4ff",
                background: v.avatar_url ? "transparent" : "rgba(0,212,255,0.12)",
                boxShadow: "0 0 24px rgba(0,212,255,0.2)",
              }}
            >
              {v.avatar_url
                ? <img src={v.avatar_url} alt={v.full_name ?? ""} className="w-full h-full object-cover" />
                : ini(v.full_name)
              }
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground">{v.full_name ?? "—"}</h2>
              <p className="text-sm text-muted-foreground">Venditore</p>
              {/* Commissione — editabile solo da admin */}
              {role === "admin" && !editingComm && (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all"
                  style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}
                >
                  Rimuovi accesso
                </button>
              )}
              {role === "admin" && editingComm ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={commDraft}
                    onChange={e => setCommDraft(e.target.value)}
                    className="w-20 rounded-xl border px-2 py-1 text-sm font-bold outline-none"
                    style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.4)", color: "#00d4ff" }}
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") saveCommissione(); if (e.key === "Escape") setEditingComm(false); }}
                  />
                  <span className="text-sm font-bold" style={{ color: "#00d4ff" }}>%</span>
                  <button onClick={saveCommissione} disabled={commSaving}
                    className="rounded-lg px-2 py-1 text-xs font-semibold transition-colors"
                    style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}>
                    {commSaving ? "…" : "✓"}
                  </button>
                  <button onClick={() => setEditingComm(false)}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => role === "admin" ? setEditingComm(true) : undefined}
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all"
                  style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)", cursor: role === "admin" ? "pointer" : "default" }}
                  title={role === "admin" ? "Clicca per modificare" : undefined}
                >
                  {v.percentuale_commissione}% commissione
                  {role === "admin" && <span className="opacity-50 text-[10px]">✎</span>}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <>
              {/* KPIs */}
              {(() => {
                const totalFatturato = quotes.reduce((s, q) => s + (q.amount ?? 0), 0);
                const commissione = totalFatturato * (v.percentuale_commissione / 100);
                const fmtEuro = (n: number) =>
                  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Lead totali", value: leads.length, color: "#7dd9ff" },
                        { label: "Clienti chiusi", value: closedWon.length, color: "#4ade80" },
                        { label: "Tasso conv.", value: `${convRate}%`, color: "#a78bfa" },
                      ].map(k => (
                        <div key={k.label} className="rounded-2xl p-4 text-center"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{k.label}</p>
                        </div>
                      ))}
                    </div>
                    {totalFatturato > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl p-4 text-center"
                          style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)" }}>
                          <p className="text-xl font-black" style={{ color: "#4ade80" }}>{fmtEuro(totalFatturato)}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Fatturato chiuso</p>
                        </div>
                        <div className="rounded-2xl p-4 text-center"
                          style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.15)" }}>
                          <p className="text-xl font-black" style={{ color: "#a78bfa" }}>{fmtEuro(commissione)}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Commissione dovuta</p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Lead attivi */}
              <section>
                <p className="label-section mb-3 flex items-center gap-1.5">
                  Lead in carico <span className="text-foreground font-bold">({activeLeads.length})</span>
                </p>
                {activeLeads.length === 0
                  ? <p className="text-sm text-muted-foreground">Nessun lead attivo.</p>
                  : <div className="space-y-2">
                    {activeLeads.slice(0, 10).map(l => (
                      <div key={l.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-semibold text-foreground truncate">{l.full_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{l.service_interest ?? "—"} · {l.budget_range ?? "—"}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold rounded-full px-2.5 py-1"
                          style={{ background: "rgba(0,0,0,0.3)", color: STAGE_COLOR[l.pipeline_stage ?? ""] ?? "#6677aa", border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>
                          {STAGE_LABEL[l.pipeline_stage ?? "form_compilato"] ?? l.pipeline_stage}
                        </span>
                      </div>
                    ))}
                  </div>
                }
              </section>

              {/* Clienti chiusi */}
              <section>
                <p className="label-section mb-3 flex items-center gap-1.5">
                  Clienti chiusi <span className="text-foreground font-bold">({closedWon.length})</span>
                </p>
                {closedWon.length === 0
                  ? <p className="text-sm text-muted-foreground">Nessun cliente chiuso ancora.</p>
                  : <div className="space-y-2">
                    {closedWon.slice(0, 8).map(l => {
                      const q = quotes.find(q => q.lead_id === l.id);
                      const euro = q?.amount
                        ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(q.amount)
                        : null;
                      return (
                        <div key={l.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)" }}>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{l.full_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{l.service_interest ?? "—"}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {euro && (
                              <p className="text-sm font-bold" style={{ color: q?.status === "Pagato" ? "#a78bfa" : "#4ade80" }}>{euro}</p>
                            )}
                            <p className="text-xs font-semibold" style={{ color: q?.status === "Pagato" ? "#a78bfa" : "#4ade80" }}>
                              {q?.status === "Pagato" ? "🔒 Pagato" : "Vinto ✓"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                }
              </section>

              {/* Call in programma */}
              <section>
                <p className="label-section mb-3 flex items-center gap-1.5">
                  Call in programma <span className="text-foreground font-bold">({upcomingCalls.length})</span>
                </p>
                {upcomingCalls.length === 0
                  ? <p className="text-sm text-muted-foreground">Nessuna call in programma.</p>
                  : <div className="space-y-2">
                    {upcomingCalls.slice(0, 6).map(b => (
                      <div key={b.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{b.invitee_name ?? b.invitee_email ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(b.start_time).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                            {" — "}
                            {new Date(b.start_time).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {b.meeting_link ? (
                          <a href={b.meeting_link} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all"
                            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.25)" }}>
                            <Video className="w-3 h-3" /> Entra
                          </a>
                        ) : (
                          <Phone className="w-4 h-4 shrink-0" style={{ color: "#4a5568" }} />
                        )}
                      </div>
                    ))}
                  </div>
                }
              </section>
            </>
          )}
        </div>
      </div>
    </div>
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
  const [selectedVenditore, setSelectedVenditore] = useState<Venditore | null>(null);

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

  useEffect(() => {
    loadVenditori();
    if (!supabase) return;
    const channel = supabase
      .channel("profiles-rt")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => loadVenditori())
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [role, user]);

  const initials = (name: string | null) =>
    (name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const convRate = (v: Venditore) =>
    v.lead_gestiti > 0 ? `${Math.round((v.chiusi / v.lead_gestiti) * 100)}%` : "—";

  return (
    <>
      {showInvite && role === "admin" && (
        <InviteModal onClose={() => setShowInvite(false)} onSuccess={loadVenditori} />
      )}
      {selectedVenditore && (
        <VenditoreDrawer
          v={selectedVenditore}
          onClose={() => setSelectedVenditore(null)}
          initials={initials}
          onCommissioneUpdated={(id, pct) => {
            setVenditori(vs => vs.map(v => v.id === id ? { ...v, percentuale_commissione: pct } : v));
            setSelectedVenditore(sv => sv && sv.id === id ? { ...sv, percentuale_commissione: pct } : sv);
          }}
          onRemoved={(id) => {
            setVenditori(vs => vs.filter(v => v.id !== id));
            setSelectedVenditore(null);
          }}
        />
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
                    onClick={() => setSelectedVenditore(v)}
                    className="flex flex-col items-center gap-2 rounded-2xl px-5 py-4 text-center cursor-pointer transition-all hover:scale-105"
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
