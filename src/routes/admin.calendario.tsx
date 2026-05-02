import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AdminCard } from "./admin/-admin-ui";
import { CalendarDays, Video, XCircle, Clock, CheckCircle2, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/admin/calendario")({
  head: () => ({ meta: [{ title: "Falcon Admin — Calendario" }] }),
  component: CalendarioPage,
});

interface Booking {
  id: string;
  invitee_name: string | null;
  invitee_email: string | null;
  start_time: string;
  end_time: string;
  status: string; // active | canceled | completata
  event_type_name: string | null;
  meeting_link: string | null;
  lead: { venditore_id: string | null; venditore: { id: string; full_name: string | null } | null } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
function isPast(iso: string) {
  return new Date(iso) < new Date();
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: "In programma", color: "#00d4ff", bg: "rgba(0,212,255,0.08)", border: "rgba(0,212,255,0.2)" },
  completata: { label: "Effettuata", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)" },
  canceled: { label: "Annullata", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.active;
  return (
    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status === "completata" && <CheckCircle2 className="w-3 h-3" />}
      {status === "canceled" && <XCircle className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

function StatusDropdown({ booking, onUpdate }: { booking: Booking; onUpdate: (id: string, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const options = [
    { value: "active", label: "In programma" },
    { value: "completata", label: "Segna come effettuata" },
    { value: "canceled", label: "Annulla call" },
  ].filter(o => o.value !== booking.status);

  const change = async (status: string) => {
    setOpen(false);
    setLoading(true);
    await onUpdate(booking.id, status);
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6677aa" }}
      >
        {loading ? "…" : "Cambia stato"}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-xl overflow-hidden shadow-xl"
          style={{ background: "#0d1525", border: "1px solid rgba(0,212,255,0.15)" }}
        >
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => change(o.value)}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors"
              style={{ color: o.value === "canceled" ? "#f87171" : o.value === "completata" ? "#4ade80" : "#c8d8e8" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CalendarioPage() {
  const { role } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all" | "canceled" | "completata">("upcoming");
  const [venditoreFilter, setVenditoreFilter] = useState<string>("");

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*, lead:leads!lead_id(venditore_id, venditore:profiles!venditore_id(id, full_name))")
      .order("start_time", { ascending: true });
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("bookings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    if (!supabase) return;
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
  };

  const filtered = bookings.filter(b => {
    if (filter === "upcoming" && !(b.status === "active" && !isPast(b.start_time))) return false;
    if (filter === "canceled" && b.status !== "canceled") return false;
    if (filter === "completata" && b.status !== "completata") return false;
    if (venditoreFilter && (b.lead?.venditore_id ?? "") !== venditoreFilter) return false;
    return true;
  });

  // Unique venditori for filter dropdown
  const venditori = Array.from(
    new Map(
      bookings
        .filter(b => b.lead?.venditore)
        .map(b => [b.lead!.venditore_id!, b.lead!.venditore!.full_name ?? b.lead!.venditore_id!])
    )
  );

  const counts = {
    upcoming: bookings.filter(b => b.status === "active" && !isPast(b.start_time)).length,
    completata: bookings.filter(b => b.status === "completata").length,
    canceled: bookings.filter(b => b.status === "canceled").length,
  };

  const filters: { key: typeof filter; label: string }[] = [
    { key: "upcoming", label: `Prossime (${counts.upcoming})` },
    { key: "all", label: "Tutte" },
    { key: "completata", label: `Effettuate (${counts.completata})` },
    { key: "canceled", label: `Annullate (${counts.canceled})` },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="label-section">Booking</p>
          <h1 className="mt-3 text-4xl font-black text-foreground">
            Calendario <span className="text-primary text-glow">Call</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: filter === f.key ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${filter === f.key ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: filter === f.key ? "#00d4ff" : "#6677aa",
              }}>
              {f.label}
            </button>
          ))}
          {role === "admin" && venditori.length > 0 && (
            <select
              value={venditoreFilter}
              onChange={e => setVenditoreFilter(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm font-medium outline-none"
              style={{ background: venditoreFilter ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${venditoreFilter ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`, color: venditoreFilter ? "#00d4ff" : "#6677aa" }}
            >
              <option value="">Tutti i venditori</option>
              {venditori.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }} />
        </div>
      ) : filtered.length === 0 ? (
        <AdminCard className="p-12 text-center">
          <CalendarDays className="w-12 h-12 mx-auto mb-4" style={{ color: "#2a3a5c" }} />
          <p className="text-muted-foreground">Nessuna call trovata.</p>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => (
            <AdminCard key={b.id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="flex flex-col items-center justify-center rounded-2xl px-4 py-3 min-w-[64px] text-center shrink-0"
                    style={{
                      background: b.status === "canceled" ? "rgba(255,255,255,0.04)" : b.status === "completata" ? "rgba(74,222,128,0.06)" : "rgba(0,212,255,0.08)",
                      border: `1px solid ${b.status === "canceled" ? "rgba(255,255,255,0.08)" : b.status === "completata" ? "rgba(74,222,128,0.2)" : "rgba(0,212,255,0.2)"}`,
                    }}>
                    <span className="text-xs font-semibold uppercase" style={{ color: b.status === "canceled" ? "#4a5568" : b.status === "completata" ? "#4ade80" : "#00d4ff" }}>
                      {new Date(b.start_time).toLocaleDateString("it-IT", { month: "short" })}
                    </span>
                    <span className="text-2xl font-black" style={{ color: b.status === "canceled" ? "#4a5568" : "#ffffff" }}>
                      {new Date(b.start_time).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{b.invitee_name ?? "—"}</p>
                      <StatusBadge status={b.status} />
                      {b.lead?.venditore && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: "rgba(0,212,255,0.07)", color: "#7dd9ff", border: "1px solid rgba(0,212,255,0.15)" }}>
                          {b.lead.venditore.full_name ?? "—"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: "#6677aa" }}>{b.invitee_email ?? "—"}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-sm" style={{ color: "#4a5568" }}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(b.start_time)} – {formatTime(b.end_time)}
                      </span>
                      <span>·</span>
                      <span>{formatDate(b.start_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {b.meeting_link && b.status === "active" && (
                    <a href={b.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", color: "#00d4ff" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,212,255,0.18)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,212,255,0.1)")}>
                      <Video className="w-4 h-4" /> Entra nella call
                    </a>
                  )}
                  <StatusDropdown booking={b} onUpdate={updateStatus} />
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
