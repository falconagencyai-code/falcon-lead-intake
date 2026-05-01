import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminCard, AdminSectionTitle } from "./admin/-admin-ui";
import { CalendarDays, Video, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/calendario")({
  head: () => ({
    meta: [{ title: "Falcon Admin — Calendario" }],
  }),
  component: CalendarioPage,
});

interface Booking {
  id: string;
  invitee_name: string | null;
  invitee_email: string | null;
  start_time: string;
  end_time: string;
  status: string;
  event_type_name: string | null;
  meeting_link: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date();
}

export default function CalendarioPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all" | "canceled">("upcoming");

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true });
    setBookings(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Realtime
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("bookings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, []);

  const filtered = bookings.filter(b => {
    if (filter === "upcoming") return b.status === "active" && isUpcoming(b.start_time);
    if (filter === "canceled") return b.status === "canceled";
    return true;
  });

  const upcomingCount = bookings.filter(b => b.status === "active" && isUpcoming(b.start_time)).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="label-section">Booking</p>
          <h1 className="mt-3 text-4xl font-black text-foreground">
            Calendario <span className="text-primary text-glow">Call</span>
          </h1>
        </div>
        <div className="flex gap-2">
          {(["upcoming", "all", "canceled"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: filter === f ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${filter === f ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: filter === f ? "#00d4ff" : "#6677aa",
              }}
            >
              {f === "upcoming" ? `Prossime (${upcomingCount})` : f === "all" ? "Tutte" : "Annullate"}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }} />
        </div>
      ) : filtered.length === 0 ? (
        <AdminCard className="p-12 text-center">
          <CalendarDays className="w-12 h-12 mx-auto mb-4" style={{ color: "#2a3a5c" }} />
          <p className="text-muted-foreground">
            {filter === "upcoming" ? "Nessuna call programmata." : "Nessuna call trovata."}
          </p>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => {
            const upcoming = isUpcoming(b.start_time);
            const canceled = b.status === "canceled";
            return (
              <AdminCard key={b.id} className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Left: date + info */}
                  <div className="flex items-start gap-4">
                    {/* Date badge */}
                    <div
                      className="flex flex-col items-center justify-center rounded-2xl px-4 py-3 min-w-[64px] text-center shrink-0"
                      style={{
                        background: canceled ? "rgba(255,255,255,0.04)" : "rgba(0,212,255,0.08)",
                        border: `1px solid ${canceled ? "rgba(255,255,255,0.08)" : "rgba(0,212,255,0.2)"}`,
                      }}
                    >
                      <span className="text-xs font-semibold uppercase" style={{ color: canceled ? "#4a5568" : "#00d4ff" }}>
                        {new Date(b.start_time).toLocaleDateString("it-IT", { month: "short" })}
                      </span>
                      <span className="text-2xl font-black" style={{ color: canceled ? "#4a5568" : "#ffffff" }}>
                        {new Date(b.start_time).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{b.invitee_name ?? "—"}</p>
                        {canceled && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                            <XCircle className="w-3 h-3" /> Annullata
                          </span>
                        )}
                        {!canceled && upcoming && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>
                            In programma
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

                  {/* Right: meeting link */}
                  {b.meeting_link && !canceled && (
                    <a
                      href={b.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-all"
                      style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", color: "#00d4ff" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,212,255,0.18)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,212,255,0.1)")}
                    >
                      <Video className="w-4 h-4" /> Entra nella call
                    </a>
                  )}
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
