export const revenueData = [
  { month: "Jan", value: 22000 },
  { month: "Feb", value: 28500 },
  { month: "Mar", value: 34000 },
  { month: "Apr", value: 31500 },
  { month: "Mag", value: 42000 },
  { month: "Giu", value: 48500 },
];

export const contractStatusData = [
  { name: "Chiusi", value: 23 },
  { name: "Aperti", value: 18 },
  { name: "In sospeso", value: 14 },
];

export const dashboardLeads = [
  { name: "Giulia Ferri", email: "giulia@aurora.it", service: "Piattaforma AI", budget: "€15k–€30k", status: "Nuovo", date: "23 Apr" },
  { name: "Marco Riva", email: "marco@nova.com", service: "Sito Web", budget: "€5k–€10k", status: "In valutazione", date: "22 Apr" },
  { name: "Elena Costa", email: "elena@zenith.it", service: "Automazioni", budget: "€10k–€20k", status: "Proposta inviata", date: "21 Apr" },
  { name: "Luca Bianchi", email: "luca@orbit.it", service: "Brand Identity", budget: "€3k–€8k", status: "Chiuso", date: "20 Apr" },
  { name: "Sara Leone", email: "sara@pixel.it", service: "E-commerce", budget: "€20k+", status: "Perso", date: "19 Apr" },
];

export const leads = [
  ...dashboardLeads,
  { name: "Andrea Neri", email: "andrea@mesh.ai", service: "Piattaforma AI", budget: "€30k+", timing: "Subito", status: "Chiuso vinto", date: "18 Apr" },
  { name: "Marta Villa", email: "marta@studio-v.it", service: "Sito Web", budget: "€8k–€15k", timing: "Entro 30 giorni", status: "Nuovo", date: "18 Apr" },
  { name: "Davide Fontana", email: "davide@flow.io", service: "CRM Custom", budget: "€15k–€25k", timing: "Questo trimestre", status: "In valutazione", date: "17 Apr" },
  { name: "Nadia Romano", email: "nadia@atlas.it", service: "E-commerce", budget: "€25k–€40k", timing: "Q3", status: "Proposta inviata", date: "16 Apr" },
  { name: "Paolo Greco", email: "paolo@raven.it", service: "Consulenza AI", budget: "€5k–€12k", timing: "Da definire", status: "Chiuso perso", date: "15 Apr" },
].map((lead, index) => ({
  ...lead,
  timing: "timing" in lead ? lead.timing : ["Subito", "Entro 30 giorni", "Questo trimestre", "Q3", "Da definire"][index % 5],
  answers: "Obiettivo: aumentare conversioni e automatizzare il flusso commerciale. Integrazioni richieste: CRM, analytics e dashboard operativa. Note: preferenza per look premium futuristico Falcon.",
}));

export const sellers = [
  { name: "Alessio Vento", initials: "AV", assigned: 34, closed: 12, rate: "35%", revenue: "€86.400", progress: 86 },
  { name: "Bianca Serra", initials: "BS", assigned: 28, closed: 9, rate: "32%", revenue: "€72.900", progress: 73 },
  { name: "Cristian Moro", initials: "CM", assigned: 31, closed: 8, rate: "26%", revenue: "€64.200", progress: 64 },
  { name: "Diana Ricci", initials: "DR", assigned: 24, closed: 6, rate: "25%", revenue: "€49.800", progress: 50 },
  { name: "Enrico Sala", initials: "ES", assigned: 22, closed: 5, rate: "23%", revenue: "€41.300", progress: 41 },
];

export const contracts = [
  { client: "Aurora Labs", service: "Piattaforma AI", value: "€42.000", start: "01 Mar 2026", end: "01 Mar 2027", status: "Attivo" },
  { client: "Nova Retail", service: "E-commerce", value: "€28.500", start: "12 Feb 2026", end: "12 Mag 2026", status: "In scadenza" },
  { client: "Orbit Studio", service: "Brand Identity", value: "€9.800", start: "10 Gen 2026", end: "10 Apr 2026", status: "Scaduto" },
  { client: "Zenith Group", service: "Automazioni", value: "€18.700", start: "05 Apr 2026", end: "05 Apr 2027", status: "Attivo" },
  { client: "Mesh AI", service: "CRM Custom", value: "€31.000", start: "—", end: "—", status: "Bozza" },
  { client: "Atlas Partners", service: "Consulenza AI", value: "€12.400", start: "20 Mar 2026", end: "20 Giu 2026", status: "In scadenza" },
];
