import { createFileRoute } from "@tanstack/react-router";

import { AIMonitorPage } from "./admin/-ai-monitor-page";

export const Route = createFileRoute("/admin/ai-monitor")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — AI Monitor" },
      { name: "description", content: "Monitoraggio costi e utilizzo AI per progetto Falcon Agency." },
    ],
  }),
  component: AIMonitorPage,
});
