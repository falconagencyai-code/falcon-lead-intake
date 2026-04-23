import { createFileRoute } from "@tanstack/react-router";

import { sellers } from "./admin/-admin-data";
import { AdminBadge, AdminCard } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/team")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Team" },
      { name: "description", content: "Performance team venditori mock Falcon Agency." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const podium = sellers.slice(0, 3);
  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="label-section">Sales engine</p>
          <h1 className="mt-3 text-4xl font-black text-foreground">Performance <span className="text-primary text-glow">Team</span></h1>
        </div>
        <select className="glass h-12 px-4 text-sm text-foreground outline-none">
          <option>Questo mese</option>
          <option>Trimestre</option>
          <option>Anno</option>
        </select>
      </header>

      <section className="grid items-end gap-5 lg:grid-cols-3">
        {podium.map((seller, index) => (
          <AdminCard key={seller.name} className={`p-6 text-center ${index === 0 ? "lg:min-h-[300px] lg:-order-none" : "lg:min-h-[250px]"}`}>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.1)] text-2xl font-black text-primary shadow-[0_0_32px_rgba(0,212,255,0.2)]">
              {seller.initials}
            </div>
            <div className="mt-5"><AdminBadge status={index === 0 ? "Nuovo" : "Proposta inviata"}>#{index + 1}</AdminBadge></div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">{seller.name}</h2>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-muted-foreground">Fatturato</p><p className="mt-1 font-bold text-primary">{seller.revenue}</p></div>
              <div><p className="text-muted-foreground">Chiusi</p><p className="mt-1 font-bold text-foreground">{seller.closed}</p></div>
              <div><p className="text-muted-foreground">Conv.</p><p className="mt-1 font-bold text-foreground">{seller.rate}</p></div>
            </div>
          </AdminCard>
        ))}
      </section>

      <AdminCard className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]"><th className="py-4">Posizione</th><th>Venditore</th><th>Lead assegnati</th><th>Chiusi</th><th>Tasso conv.</th><th>Fatturato</th><th>Obiettivo</th></tr>
            </thead>
            <tbody>
              {sellers.map((seller, index) => (
                <tr key={seller.name} className="border-b border-[rgba(255,255,255,0.06)]">
                  <td className="py-4 font-bold text-primary">#{index + 1}</td>
                  <td className="font-semibold text-foreground">{seller.name}</td>
                  <td>{seller.assigned}</td>
                  <td>{seller.closed}</td>
                  <td>{seller.rate}</td>
                  <td className="font-bold text-foreground">{seller.revenue}</td>
                  <td><div className="h-2 w-40 rounded-full bg-[rgba(255,255,255,0.08)]"><div className="h-full rounded-full gradient-progress" style={{ width: `${seller.progress}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
