import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Camera, Check } from "lucide-react";

export const Route = createFileRoute("/admin/setup-profilo")({
  head: () => ({ meta: [{ title: "Completa il tuo profilo — Falcon Agency" }] }),
  component: SetupProfiloPage,
});

function SetupProfiloPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConferma, setPasswordConferma] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase gestisce il token nell'URL hash automaticamente
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setSessionReady(true);
      }
    });
    // Controlla sessione già attiva
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
        setSessionReady(true);
      }
    });
  }, []);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userId) return;

    if (password !== passwordConferma) {
      setError("Le password non coincidono.");
      return;
    }
    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Imposta la password
      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) throw pwErr;

      // 2. Upload avatar se presente
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }

      // 3. Aggiorna profilo
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          full_name: `${nome.trim()} ${cognome.trim()}`,
          phone: telefono.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("id", userId);
      if (profileErr) throw profileErr;

      navigate({ to: "/admin/leads" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070b14" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#070b14" }}>
      <div className="absolute inset-0 circuit-bg pointer-events-none opacity-40" />

      <div className="relative w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex w-14 h-14 items-center justify-center rounded-2xl text-2xl font-black mx-auto"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.35)", color: "#00d4ff", boxShadow: "0 0 28px rgba(0,212,255,0.2)" }}
          >
            F
          </div>
          <p className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: "#00d4ff" }}>Falcon Agency</p>
          <h1 className="text-2xl font-bold text-white">Completa il tuo profilo</h1>
          <p className="text-sm" style={{ color: "#6677aa" }}>Sei quasi dentro. Inserisci i tuoi dati per accedere al pannello.</p>
        </div>

        <div className="rounded-2xl p-8 space-y-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.15)" }}>
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group"
            >
              <div
                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center transition-all"
                style={{ background: "rgba(0,212,255,0.08)", border: "2px solid rgba(0,212,255,0.3)" }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8" style={{ color: "#00d4ff" }} />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            <p className="text-xs" style={{ color: "#4a5568" }}>Clicca per aggiungere una foto (opzionale)</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-section block mb-2">Nome</label>
                <input className="input-premium" value={nome} onChange={e => setNome(e.target.value)} placeholder="Mario" required />
              </div>
              <div>
                <label className="label-section block mb-2">Cognome</label>
                <input className="input-premium" value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Rossi" required />
              </div>
            </div>

            <div>
              <label className="label-section block mb-2">Telefono</label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}>+39</span>
                <input
                  className="input-premium flex-1"
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value.replace(/\D/g, ""))}
                  placeholder="3401234567"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="label-section block mb-2">Scegli una password</label>
              <input className="input-premium" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 caratteri" required minLength={8} />
            </div>

            <div>
              <label className="label-section block mb-2">Conferma password</label>
              <input className="input-premium" type="password" value={passwordConferma} onChange={e => setPasswordConferma(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 mt-2">
              {loading ? "Salvataggio…" : <><Check className="w-4 h-4" /> Accedi al pannello →</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
