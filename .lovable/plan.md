## Obiettivo
1. Tracciare ogni step del form di contatto su Supabase (`form_events`) con un `session_id` univoco.
2. Sostituire i dati mock di `/admin/analytics` con dati reali letti da `form_events` (funnel) e `leads` (trend).
3. Aggiungere un bottone "🎯 Collega Ads" in alto a destra nella pagina Analytics.

---

## 1. Tabella `form_events` (Supabase)

Verifico via MCP se esiste già; se no, creo via migration:

```sql
create table public.form_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  step int not null,
  step_name text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_form_events_session on public.form_events(session_id);
create index idx_form_events_step on public.form_events(step);
create index idx_form_events_created_at on public.form_events(created_at desc);

alter table public.form_events enable row level security;

-- Policy temporanea per anon (coerente con leads/lead_events già aperti in dev)
create policy "anon insert form_events" on public.form_events
  for insert to anon with check (true);

create policy "anon select form_events" on public.form_events
  for select to anon using (true);
```

---

## 2. Tracciamento step nel form (`src/routes/form-contatto-1.tsx`)

Modifiche al componente `FormPage`:

- Generare un `sessionId` stabile per la durata del form:
  ```tsx
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  ```
- Mappa nomi step:
  ```tsx
  const STEP_NAMES = ["Servizio", "Dettagli", "Budget", "Contatto", "Grazie"];
  ```
- Funzione fire-and-forget:
  ```tsx
  const trackStep = (s: number) => {
    if (!isSupabaseConfigured || !supabase) return;
    void supabase.from("form_events").insert({
      session_id: sessionIdRef.current,
      step: s,
      step_name: STEP_NAMES[s - 1],
      completed: s === 5,
    }).then(({ error }) => { if (error) console.warn("form_events insert error", error); });
  };
  ```
- `useEffect(() => { trackStep(step); }, [step]);` → traccia mount iniziale (step 1) + ogni cambio step (avanti/indietro/step 5 dopo submit).

Nessun blocco in caso d'errore. Nessun cambio al flusso esistente.

---

## 3. Pagina Analytics — dati reali (`src/routes/admin.analytics.tsx`)

Refactor completo della parte dati:

- Rimuovere `funnelSteps`, `weeklyData` mock.
- Usare TanStack Query (già configurato a livello di app) con due query parallele:
  ```tsx
  const { data: events = [] } = useQuery({
    queryKey: ["form_events"],
    queryFn: async () => {
      const { data, error } = await supabase!.from("form_events").select("step, session_id, created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isSupabaseConfigured,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads", "trend30"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase!.from("leads")
        .select("created_at").gte("created_at", since);
      if (error) throw error;
      return data ?? [];
    },
    enabled: isSupabaseConfigured,
  });
  ```

- Calcolo funnel lato client:
  ```tsx
  const funnelData = [1,2,3,4,5].map((n, i) => {
    const visits = new Set(events.filter(e => e.step === n).map(e => e.session_id)).size;
    return { step: `Step ${n} · ${["Servizio","Dettagli","Budget","Contatto","Invio"][i]}`, visits, pct: 0 };
  });
  funnelData.forEach((s, i) => {
    s.pct = i === 0 ? 100 : (funnelData[i-1].visits ? Math.round(s.visits / funnelData[i-1].visits * 100) : 0);
  });
  ```

- KPI:
  - `totalVisits = funnelData[0].visits`
  - `completionRate = totalVisits ? Math.round(funnelData[4].visits / totalVisits * 100) : 0`
  - `worstDrop` = drop maggiore tra step consecutivi (gestire array vuoto → mostrare "—").

- Trend 30gg da `leads`: raggruppare per giorno (`YYYY-MM-DD`), mostrare gli ultimi 30 giorni anche con valore 0 (riempire eventuali buchi). Etichetta giorno `dd MMM` in italiano.

- Stato vuoto: se `events.length === 0`, mostrare placeholder elegante "Nessun dato funnel — i prossimi invii del form appariranno qui" all'interno della card del funnel.

---

## 4. Bottone "🎯 Collega Ads"

Nell'header della pagina Analytics, accanto al titolo:

```tsx
<header className="flex items-start justify-between gap-4 flex-wrap">
  <div>... titolo esistente ...</div>
  <a
    href="https://business.facebook.com"
    target="_blank"
    rel="noopener noreferrer"
    className="btn-ghost inline-flex items-center gap-2 border border-[rgba(0,212,255,0.4)] text-primary"
    title="Collega Facebook Business Manager per vedere i dati delle campagne direttamente qui"
  >
    🎯 Collega Ads
    <ExternalLink className="w-4 h-4" />
  </a>
</header>
```

Tooltip via attributo `title` nativo (semplice e zero-dipendenze); se preferisci tooltip stilizzato uso `@/components/ui/tooltip`.

---

## File modificati / creati
- **Migration nuova**: tabella `form_events` + RLS anon (insert+select).
- **Modifico** `src/routes/form-contatto-1.tsx`: import `useEffect`/`useRef`, sessionId, `trackStep`, effetto su `[step]`.
- **Refactor** `src/routes/admin.analytics.tsx`: query reali, calcoli aggregati, stato vuoto, bottone "Collega Ads", import `useQuery`, `supabase`, `ExternalLink`.

## Note
- Le RLS policy anon su `form_events` sono temporanee (dev), coerenti con quanto già fatto su `leads`/`lead_events`. In produzione andranno chiuse e l'insert spostato dietro un'edge function o policy mirate.
- Nessun cambiamento al routing né alla sidebar.
- Conferma se vuoi tooltip nativo (`title=""`) o componente `Tooltip` di shadcn — di default uso quello nativo.