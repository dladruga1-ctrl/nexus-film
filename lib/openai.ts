import OpenAI from "openai";
import { Screenplay } from "@/core/types";
import { SYSTEM_PROMPT, buildUserPrompt, extractJson, assertScreenplayShape } from "@/core/prompt";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Переменная окружения OPENAI_API_KEY не установлена");
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

/**
 * Отправляет идею в OpenAI (gpt-4o-mini) и возвращает
 * распарсенный и провалидированный сценарий.
 */
export async function generateScreenplay(idea: string): Promise<Screenplay> {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(idea) },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content;

  if (!rawContent) {
    throw new Error("Модель вернула пустой ответ");
  }

  let parsed: unknown;
  try {
    parsed = extractJson(rawContent);
  } catch (err) {
    throw new Error(
      `Не удалось распарсить JSON из ответа модели: ${(err as Error).message}`
    );
  }

  return assertScreenplayShape(parsed);
}
