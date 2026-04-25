import { useState } from "react";
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import {
  BarChart2,
  CheckCircle,
  ChevronDown,
  Clock,
  Cpu,
  FileText,
  LayoutDashboard,
  Map,
  Radar,
  Receipt,
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

type NavStatus = "active" | "mock";

type NavChild = { label: string; to: string; icon: typeof Users; status: NavStatus };
type NavItem = {
  label: string;
  to: string;
  icon: typeof Users;
  status: NavStatus;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, status: "mock" },
  { label: "Lead", to: "/admin/leads", icon: Users, status: "active" },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart2, status: "active" },
  {
    label: "Clienti",
    to: "/admin/clienti",
    icon: Users,
    status: "mock",
    children: [
      { label: "Contratti", to: "/admin/contracts", icon: FileText, status: "mock" },
      { label: "Fatture", to: "/admin/fatture", icon: Receipt, status: "mock" },
      { label: "AI Monitor", to: "/admin/ai-monitor", icon: Cpu, status: "mock" },
    ],
  },
  { label: "Team", to: "/admin/team", icon: Shield, status: "mock" },
  { label: "Contabilità", to: "/admin/contabilita", icon: BarChart2, status: "mock" },
  { label: "Road-map", to: "/admin/roadmap", icon: Map, status: "mock" },
  { label: "Competitor", to: "/admin/competitor", icon: Radar, status: "mock" },
  { label: "Impostazioni", to: "/admin/settings", icon: Settings, status: "mock" },
];

const contractColors = ["var(--falcon-cyan)", "var(--falcon-deep)", "#f59e0b"];

function AdminLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === "/admin";

  const itemIsActive = (to: string) =>
    to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);

  const childActiveFor = (item: NavItem) =>
    item.children?.some((c) => itemIsActive(c.to)) ?? false;

  const clientiItem = navItems.find((i) => i.label === "Clienti");
  const [clientiOpen, setClientiOpen] = useState<boolean>(
    clientiItem ? childActiveFor(clientiItem) || itemIsActive(clientiItem.to) : false,
  );

  const rowBase =
    "group flex h-10 items-center gap-3 rounded-xl border-l-2 px-3 text-sm font-medium transition-all md:px-4";

  const rowStateClass = (active: boolean, isMock: boolean) => {
    if (isMock) {
      return active
        ? "border-l-transparent bg-[rgba(255,255,255,0.03)] text-[#4a5568] hover:bg-[rgba(255,255,255,0.04)]"
        : "border-l-transparent text-[#4a5568] hover:bg-[rgba(255,255,255,0.025)]";
    }
    return active
      ? "border-l-primary bg-[rgba(0,212,255,0.08)] text-foreground shadow-[inset_0_0_24px_rgba(0,212,255,0.08)]"
      : "border-l-transparent text-foreground hover:bg-[rgba(255,255,255,0.04)]";
  };

  const mockBadge = (
    <span className="hidden rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#4a5568] md:inline">
      Mock
    </span>
  );

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
        <nav className="flex flex-1 flex-col gap-1 px-3 md:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isMock = item.status === "mock";
            const iconClass = isMock ? "text-[#4a5568]" : "text-primary";

            if (item.children) {
              const childActive = childActiveFor(item);
              const selfActive = itemIsActive(item.to);
              const expanded = clientiOpen || childActive;
              const rowActive = selfActive || childActive;

              return (
                <div key={item.to}>
                  <button
                    type="button"
                    onClick={() => setClientiOpen((v) => !v || childActive)}
                    className={`${rowBase} w-full ${rowStateClass(rowActive, isMock)}`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} />
                    <span className="hidden flex-1 text-left md:inline">{item.label}</span>
                    {isMock && mockBadge}
                    <ChevronDown
                      className={`hidden h-4 w-4 shrink-0 text-[#4a5568] transition-transform md:inline ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expanded && (
                    <div className="ml-5 mt-1 hidden flex-col gap-1 border-l border-[rgba(255,255,255,0.06)] pl-3 md:flex">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const cActive = itemIsActive(child.to);
                        const cMock = child.status === "mock";
                        const cIconClass = cMock ? "text-[#4a5568]" : "text-primary";
                        return (
                          <Link
                            key={child.to}
                            to={child.to}
                            className={`${rowBase} ${rowStateClass(cActive, cMock)}`}
                          >
                            <ChildIcon className={`h-4 w-4 shrink-0 ${cIconClass}`} />
                            <span className="flex-1">{child.label}</span>
                            {cMock && mockBadge}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = itemIsActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${rowBase} ${rowStateClass(active, isMock)}`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} />
                <span className="hidden flex-1 md:inline">{item.label}</span>
                {isMock && mockBadge}
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
