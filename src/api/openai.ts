/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the OpenAI API. You may update this service, but you should not need to.

valid model names:
gpt-4.1-2025-04-14
o4-mini-2025-04-16
gpt-4o-2024-11-20
*/
import OpenAI from "openai";
import { logWarn } from "../utils/logger";

export const getOpenAIClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  if (!apiKey) {
    logWarn("OpenAI API key not found in environment variables", { context: "openai" });
  }
  return new OpenAI({
    apiKey: apiKey,
  });
};
