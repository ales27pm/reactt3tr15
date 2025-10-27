/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom audio transcription service that uses a custom API endpoint maintained by Netsight.
You can use this function to transcribe audio files, and it will return the text of the audio file.
*/

/**
 * Transcribe an audio file
 * @param localAudioUri - The local URI of the audio file to transcribe. Obtained via the expo-av library.
 * @returns The text of the audio file
 */
import { withRetry } from "../utils/retry";
import { mapApiError, toApiError } from "../utils/errors";

export const transcribeAudio = async (localAudioUri: string) => {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: localAudioUri,
      type: "audio/m4a",
      name: "recording.m4a",
    } as any);
    formData.append("model", "gpt-4o-transcribe");
    formData.append("language", "en");

    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_NETSIGHT_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw toApiError({
        code: "auth_missing",
        title: "Authorization required",
        message: "AI is unavailable right now due to missing credentials.",
        provider: "openai",
        retryable: false,
      });
    }

    const response = await withRetry(() => fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    }));

    if (!response.ok) {
      const errorText = await response.text();
      throw mapApiError({ status: response.status, message: errorText }, "openai");
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    throw mapApiError(error, "openai");
  }
};
