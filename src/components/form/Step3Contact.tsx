import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { FormState } from "./types";

interface Props {
  state: FormState;
  update: (patch: Partial<FormState>) => void;
}

// Comprehensive TLD whitelist — blocks random strings like @11lldd.com → TLD "com" passes,
// but invalid TLDs like @test.zzz are blocked. Combined with domain checks below.
const KNOWN_TLDS = new Set([
  // Generic
  "com","net","org","info","biz","pro","name","mobi","tel","int","gov","edu","mil",
  // Europe
  "it","de","fr","es","uk","eu","ch","at","be","nl","pl","pt","se","no","dk","fi",
  "ie","gr","cz","sk","hu","ro","bg","hr","si","lt","lv","ee","lu","mt","cy",
  // Global common
  "us","ca","au","nz","br","mx","ar","jp","cn","kr","in","sg","ae","za","ru",
  "tr","sa","eg","ng","ke","gh","tz","ma","th","vn","ph","id","pk","bd","ir",
  // New gTLDs
  "io","ai","app","dev","tech","digital","agency","studio","online","site","web",
  "store","shop","cloud","media","group","team","design","marketing","consulting",
  "company","services","solutions","systems","network","global","world","business",
  "email","mail","me","tv","fm","am","pm","so","ac","co","cc","bz","ms","gg",
  "im","je","vc","vg","to","ws","nu","tk","la","li","lc","fm","nf","sb","pg",
  // Branded / common new
  "email","healthcare","legal","finance","insurance","realty","estate","property",
  "education","academy","school","university","institute","training","coaching",
  "news","blog","press","media","video","photo","gallery","art","music","band",
  "pizza","cafe","bar","restaurant","food","kitchen","recipes","wine","coffee",
  "fitness","sport","yoga","golf","tennis","soccer","football","basketball",
  "hotel","travel","vacation","holiday","tours","flights","car","auto","moto",
  "fashion","style","beauty","salon","spa","health","clinic","dental","vision",
  "software","computer","hosting","server","data","analytics","security","crypto",
  "bank","credit","loans","mortgage","tax","accounting","audit","law","legal",
]);

// Known disposable/temp email providers to block
const BLOCKED_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","tempmail.com","throwam.com","fakeinbox.com",
  "yopmail.com","sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.info",
  "spam4.me","trashmail.com","dispostable.com","mailnull.com","maildrop.cc",
  "spamgourmet.com","spamgourmet.net","spamgourmet.org","tempr.email","discard.email",
  "tempinbox.com","getairmail.com","filzmail.com","spamfree24.org","mailexpire.com",
]);

function validateEmail(email: string): string | null {
  if (!email) return null;

  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return "Inserisci un'email valida";

  const parts = trimmed.split("@");
  if (parts.length !== 2) return "Formato email non valido";

  const [local, domain] = parts;
  if (!local || local.length < 1) return "Formato email non valido";

  const domainParts = domain.split(".");
  if (domainParts.length < 2) return "Dominio email non valido";

  const tld = domainParts[domainParts.length - 1];
  const domainName = domainParts.slice(0, -1).join(".");

  // Basic format checks
  if (tld.length < 2) return "Dominio email non valido";
  if (domainName.length < 2) return "Dominio email non valido";
  if (!/^[a-z0-9._+-]+$/.test(local)) return "Caratteri non validi nell'email";
  if (!/^[a-z0-9.-]+$/.test(domain)) return "Dominio non valido";

  // Block disposable email providers
  if (BLOCKED_DOMAINS.has(domain)) return "Email temporanee non accettate. Usa la tua email reale.";

  // TLD must be known
  if (!KNOWN_TLDS.has(tld)) {
    return "Dominio non riconosciuto. Controlla di aver scritto bene l'email.";
  }

  // Domain name sanity: must contain at least one letter (blocks pure-number domains like @123.com)
  if (!/[a-z]/.test(domainName)) {
    return "Dominio email non valido";
  }

  // Full regex check
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(trimmed)) {
    return "Formato email non valido";
  }

  return null; // valid
}

function validatePhone(digits: string): string | null {
  if (!digits) return null;
  const clean = digits.replace(/\s/g, "");
  if (!/^\d+$/.test(clean)) return "Solo numeri";
  if (clean.length < 9) return "Numero troppo corto";
  if (clean.length > 11) return "Numero troppo lungo";
  return null;
}

export function Step3Contact({ state, update }: Props) {
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Phone digits without the +39 prefix
  const phoneDigits = state.phone.startsWith("+39")
    ? state.phone.slice(3).trimStart()
    : state.phone;

  const emailError = emailTouched ? validateEmail(state.email) : null;
  const phoneError = phoneTouched ? validatePhone(phoneDigits) : null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s]/g, ""); // only digits + spaces
    update({ phone: "+39 " + raw });
  };

  const emailOk = emailTouched && !validateEmail(state.email) && state.email.includes("@");
  const phoneOk = phoneTouched && !validatePhone(phoneDigits) && phoneDigits.replace(/\s/g, "").length >= 9;

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <p className="label-section">Contatti</p>
        <h2
          className="mt-3 font-bold text-white"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
        >
          I tuoi contatti
        </h2>
        <p className="mt-3 text-base" style={{ color: "#6677aa" }}>
          Il tuo Falcon sta per spiccare il volo.
        </p>
      </div>

      <div className="space-y-5">

        {/* Nome */}
        <div>
          <label className="label-section block mb-2">
            Nome e cognome <span style={{ color: "#00d4ff" }}>*</span>
          </label>
          <input
            type="text"
            value={state.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            placeholder="Mario Rossi"
            className="input-premium"
          />
        </div>

        {/* Email */}
        <div>
          <label className="label-section block mb-2">
            Email <span style={{ color: "#00d4ff" }}>*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              value={state.email}
              onChange={(e) => update({ email: e.target.value })}
              onBlur={() => setEmailTouched(true)}
              placeholder="mario@azienda.it"
              className="input-premium"
              style={{
                borderColor: emailError
                  ? "rgba(248,113,113,0.6)"
                  : emailOk
                  ? "rgba(34,211,238,0.5)"
                  : undefined,
                paddingRight: "40px",
              }}
            />
            {emailTouched && state.email && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailOk ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: "#22d3ee" }} />
                ) : (
                  <XCircle className="w-4 h-4" style={{ color: "#f87171" }} />
                )}
              </span>
            )}
          </div>
          {emailError && (
            <p className="mt-1.5 text-xs" style={{ color: "#f87171" }}>
              {emailError}
            </p>
          )}
        </div>

        {/* Telefono con +39 fisso */}
        <div>
          <label className="label-section block mb-2">
            Telefono <span style={{ color: "#00d4ff" }}>*</span>
          </label>
          <div
            className="relative flex items-center overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${
                phoneError
                  ? "rgba(248,113,113,0.6)"
                  : phoneOk
                  ? "rgba(34,211,238,0.5)"
                  : "rgba(255,255,255,0.1)"
              }`,
              borderRadius: "12px",
              transition: "border-color 200ms ease",
            }}
          >
            <span
              className="flex-shrink-0 px-4 text-sm font-semibold select-none"
              style={{
                color: "#00d4ff",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                paddingTop: "14px",
                paddingBottom: "14px",
              }}
            >
              +39
            </span>
            <input
              type="tel"
              value={phoneDigits}
              onChange={handlePhoneChange}
              onBlur={() => setPhoneTouched(true)}
              placeholder="333 1234567"
              maxLength={13}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                padding: "14px 40px 14px 12px",
                fontSize: "14px",
              }}
            />
            {phoneTouched && phoneDigits && (
              <span className="absolute right-3">
                {phoneOk ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: "#22d3ee" }} />
                ) : (
                  <XCircle className="w-4 h-4" style={{ color: "#f87171" }} />
                )}
              </span>
            )}
          </div>
          {phoneError && (
            <p className="mt-1.5 text-xs" style={{ color: "#f87171" }}>
              {phoneError}
            </p>
          )}
        </div>

        {/* Azienda */}
        <div>
          <label className="label-section block mb-2">Azienda</label>
          <input
            type="text"
            value={state.company}
            onChange={(e) => update({ company: e.target.value })}
            placeholder="(opzionale)"
            className="input-premium"
          />
        </div>
      </div>
    </div>
  );
}
