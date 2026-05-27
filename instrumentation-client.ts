import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    { path: "/api/generate", method: "POST", advancedOptions: { checkLevel: "deepAnalysis" } },
    { path: "/api/chat", method: "POST", advancedOptions: { checkLevel: "deepAnalysis" } },
    { path: "/api/reports/*/regenerate", method: "POST", advancedOptions: { checkLevel: "deepAnalysis" } },
    { path: "/api/*", method: "GET" },
    { path: "/api/*", method: "POST" },
    { path: "/api/*", method: "PATCH" },
    { path: "/api/*", method: "PUT" },
    { path: "/api/*", method: "DELETE" },
  ],
});
