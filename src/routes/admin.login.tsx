import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Accesso — Falcon Agency" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate({ to: "/admin/leads" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError("Credenziali non valide. Riprova.");
    } else {
      navigate({ to: "/admin/leads" });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#070b14" }}
    >
      <div className="absolute inset-0 circuit-bg pointer-events-none opacity-40" />

      <div
        className="relative w-full max-w-sm rounded-2xl p-8 space-y-6"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex w-14 h-14 items-center justify-center rounded-2xl text-2xl font-black"
            style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.35)",
              color: "#00d4ff",
              boxShadow: "0 0 28px rgba(0,212,255,0.2)",
            }}
          >
            F
          </div>
          <p className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: "#00d4ff" }}>
            Falcon Agency
          </p>
          <h1 className="text-xl font-bold text-white">Accedi al pannello</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-section block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@falconagencyai.com"
              required
              className="input-premium"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label-section block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input-premium"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#f87171" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {loading ? "Accesso in corso…" : "Accedi →"}
          </button>
        </form>
      </div>
    </div>
  );
}
