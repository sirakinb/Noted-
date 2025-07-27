import { createTogetherAI } from "@ai-sdk/togetherai";
import { Together } from "together-ai";

const APP_NAME_HELICONE = "noted-app";

export const togetheraiClient = createTogetherAI({
  apiKey: process.env.TOGETHER_API_KEY ?? "",
  ...(process.env.HELICONE_API_KEY ? {
    baseURL: "https://together.helicone.ai/v1",
    headers: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-AppName": APP_NAME_HELICONE,
    },
  } : {}),
});

// Dynamic TogetherAI client for client-side use
export function togetherVercelAiClient(apiKey?: string) {
  return createTogetherAI({
    apiKey: apiKey || process.env.TOGETHER_API_KEY || "",
    ...(process.env.HELICONE_API_KEY ? {
      baseURL: "https://together.helicone.ai/v1",
      headers: {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
        "Helicone-Property-AppName": APP_NAME_HELICONE,
      },
    } : {}),
  });
}

export function togetherBaseClientWithKey(apiKey?: string) {
  const baseSDKOptions: ConstructorParameters<typeof Together>[0] = {
    apiKey: apiKey || process.env.TOGETHER_API_KEY,
  };

  if (process.env.HELICONE_API_KEY) {
    baseSDKOptions.baseURL = "https://together.helicone.ai/v1";
    baseSDKOptions.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-AppName": APP_NAME_HELICONE,
    };
  }

  return new Together(baseSDKOptions);
}
