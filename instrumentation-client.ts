import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    { path: "/api/generate", method: "POST", advancedOptions: { checkLevel: "deepAnalysis" } },
    { path: "/api/reports/*/regenerate", method: "POST", advancedOptions: { checkLevel: "deepAnalysis" } },
    { path: "/api/reports/*/images", method: "POST" },
    { path: "/api/profile/logo", method: "POST" },
    { path: "/api/profile/signature", method: "POST" },
  ],
});
