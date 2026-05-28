import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { withApiHandler } from "@/lib/api-handler";
import { GENERATE_MODEL } from "@/shared/constants";
import { buildLaudoChatSystem, type ReportChatContext } from "@/lib/report/templates";

export const maxDuration = 60;

export const POST = withApiHandler(
  async ({ req }) => {
    const { messages, report }: { messages: UIMessage[]; report: ReportChatContext } = await req.json();

    const result = streamText({
      model: google(GENERATE_MODEL),
      system: buildLaudoChatSystem(report),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  },
  { rateLimit: { endpoint: "laudo.review", max: 30, windowSec: 60 } },
);
