import { createFileRoute } from "@tanstack/react-router";

import { ContractsPage } from "./admin/-contracts-page";

export const Route = createFileRoute("/admin/contracts")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Contratti" },
      { name: "description", content: "Lista contratti mock Falcon Agency." },
    ],
  }),
  component: ContractsPage,
});
