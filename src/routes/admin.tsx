import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import {
  BarChart2,
  CheckCircle,
  CheckSquare,
  Clock,
  FileText,
  LayoutDashboard,
  Radar,
  Settings,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { contractStatusData, dashboardLeads, revenueData } from "./admin/-admin-data";
import { AdminBadge, AdminCard, AdminKpi, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Dashboard" },
      { name: "description", content: "Dashboard amministrativa Falcon Agency con dati mock." },
    ],
  }),
  component: AdminLayout,
});

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Lead", to: "/admin/leads", icon: Users },
  { label: "Team", to: "/admin/team", icon: Shield },
  { label: "Contratti", to: "/admin/contracts", icon: FileText },
  { label: "Contabilità", to: "/admin/contabilita", icon: BarChart2 },
  { label: "Task", to: "/admin/tasks", icon: CheckSquare },
  { label: "Competitor", to: "/admin/competitor", icon: Radar },
  { label: "Impostazioni", to: "/admin/settings", icon: Settings },
] as const;

const contractColors = ["var(--falcon-cyan)", "var(--falcon-deep)", "#f59e0b"];

function AdminLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === "/admin";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-20 flex-col border-r border-[rgba(0,212,255,0.08)] bg-[rgba(255,255,255,0.02)] backdrop-blur-xl md:w-60">
        <div className="flex h-24 items-center gap-3 px-4 md:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)] text-xl font-black text-primary shadow-[0_0_28px_rgba(0,212,255,0.25)]">
            F
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground">Falcon Admin</p>
            <p className="label-section mt-1">Control room</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2 px-3 md:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/admin" ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex h-12 items-center gap-3 rounded-2xl border-l-2 px-3 text-sm font-medium transition-all md:px-4 ${
                  active
                    ? "border-l-primary bg-[rgba(0,212,255,0.08)] text-primary shadow-[inset_0_0_24px_rgba(0,212,255,0.08)]"
                    : "border-l-transparent text-muted-foreground hover:bg-[rgba(255,255,255,0.04)] hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="ml-20 min-h-screen overflow-x-hidden px-4 py-8 md:ml-60 md:px-8">
        <div className="pointer-events-none fixed inset-0 circuit-bg" />
        <div className="relative mx-auto max-w-7xl">{isDashboard ? <DashboardPage /> : <Outlet />}</div>
      </main>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="label-section">Falcon Agency</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Dashboard <span className="text-primary text-glow">Admin</span>
        </h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpi icon={TrendingUp} title="Fatturato mese" value="€48.500" meta="+12% vs mese scorso" tone="cyan" />
        <AdminKpi icon={Users} title="Lead totali" value="127" meta="+8 questa settimana" tone="cyan" />
        <AdminKpi icon={CheckCircle} title="Contratti chiusi" value="23" meta="tasso conv. 18%" tone="green" />
        <AdminKpi icon={Clock} title="In sospeso" value="14" meta="da gestire" tone="orange" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[3fr_2fr]">
        <AdminCard className="min-h-[380px] p-5">
          <AdminSectionTitle eyebrow="Revenue" title="Grafico fatturato" />
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ left: -18, right: 14, top: 12 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--falcon-cyan)" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="var(--falcon-cyan)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(0,212,255,0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#070b14", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 16 }} />
                <Area type="monotone" dataKey="value" stroke="var(--falcon-cyan)" fill="url(#revenueFill)" strokeWidth={3} />
                <Line type="monotone" dataKey="value" stroke="var(--falcon-cyan)" strokeWidth={3} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard className="min-h-[380px] p-5">
          <AdminSectionTitle eyebrow="Contracts" title="Stato contratti" />
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={contractStatusData} innerRadius={70} outerRadius={104} paddingAngle={4} dataKey="value">
                  {contractStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={contractColors[index]} stroke="rgba(255,255,255,0.06)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#070b14", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 16 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3">
            {contractStatusData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: contractColors[index] }} />
                  {item.name}
                </span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </section>

      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Inbox" title="Ultimi lead ricevuti" />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="py-4">Nome</th>
                <th>Servizio</th>
                <th>Budget</th>
                <th>Stato</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {dashboardLeads.map((lead) => (
                <tr key={lead.email} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                  <td className="py-4 font-medium">{lead.name}</td>
                  <td>{lead.service}</td>
                  <td>{lead.budget}</td>
                  <td><AdminBadge status={lead.status}>{lead.status}</AdminBadge></td>
                  <td className="text-muted-foreground">{lead.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
