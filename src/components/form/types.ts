export type ServiceKey =
  | "sito_web"
  | "piattaforma_ai"
  | "gestionale"
  | "automazione_ai_agent"
  | "altro";

export interface FormState {
  service: ServiceKey | null;
  answers: Record<string, string>;
  budget: string | null;
  timeline: string | null;
  fullName: string;
  email: string;
  phone: string;
  company: string;
}

export const initialState: FormState = {
  service: null,
  answers: {},
  budget: null,
  timeline: null,
  fullName: "",
  email: "",
  phone: "",
  company: "",
};
