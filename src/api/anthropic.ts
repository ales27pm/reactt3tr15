/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Anthropic API. You may update this service, but you should not need to.

Valid model names: 
claude-sonnet-4-20250514
claude-3-7-sonnet-latest
claude-3-5-haiku-latest
*/
import Anthropic from "@anthropic-ai/sdk";
import { logWarn } from "../utils/logger";

export const getAnthropicClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    logWarn("Anthropic API key not found in environment variables", { context: "anthropic" });
  }
  return new Anthropic({
    apiKey: apiKey,
  });
};
