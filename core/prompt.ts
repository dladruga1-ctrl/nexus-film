import { Screenplay, Scene } from "./types";

/**
 * Системный промпт, который жёстко задаёт модели формат ответа.
 * Модель обязана вернуть ТОЛЬКО валидный JSON без каких-либо
 * пояснений, markdown-разметки или лишнего текста.
 */
export const SYSTEM_PROMPT = `Ты — профессиональный сценарист.
Твоя задача: превратить идею фильма, присланную пользователем, в структурированный сценарий.

Отвечай СТРОГО в формате JSON, без markdown, без кода в тройных кавычках, без пояснений — только сам JSON-объект.

Формат ответа обязателен и должен точно соответствовать следующей структуре:
{
  "title": string,
  "scenes": [
    {
      "scene": number,
      "description": string,
      "dialogue": string
    }
  ]
}

Правила:
- "title" — краткое название фильма на основе идеи.
- "scenes" — массив из 4-8 сцен, раскрывающих сюжет от завязки до финала.
- "scene" — порядковый номер сцены, начиная с 1.
- "description" — описание происходящего в сцене (обстановка, действия персонажей).
- "dialogue" — реплики персонажей в этой сцене (можно несколько строк, разделённых \\n).
- Никогда не добавляй текст до или после JSON.
- Никогда не оборачивай JSON в markdown-блоки.`;

export function buildUserPrompt(idea: string): string {
  return `Идея фильма: "${idea}"\n\nСоздай структурированный сценарий в указанном JSON-формате.`;
}

/**
 * Проверяет, что распарсенный объект действительно соответствует
 * форме Screenplay. Бросает Error с понятным сообщением, если нет.
 */
export function assertScreenplayShape(data: unknown): Screenplay {
  if (typeof data !== "object" || data === null) {
    throw new Error("Ответ модели не является объектом JSON");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== "string" || obj.title.trim() === "") {
    throw new Error('Поле "title" отсутствует или не является строкой');
  }

  if (!Array.isArray(obj.scenes)) {
    throw new Error('Поле "scenes" отсутствует или не является массивом');
  }

  const scenes: Scene[] = obj.scenes.map((rawScene, index) => {
    if (typeof rawScene !== "object" || rawScene === null) {
      throw new Error(`Сцена #${index + 1} не является объектом`);
    }
    const s = rawScene as Record<string, unknown>;

    if (typeof s.scene !== "number") {
      throw new Error(`Сцена #${index + 1}: поле "scene" не является числом`);
    }
    if (typeof s.description !== "string") {
      throw new Error(`Сцена #${index + 1}: поле "description" не является строкой`);
    }
    if (typeof s.dialogue !== "string") {
      throw new Error(`Сцена #${index + 1}: поле "dialogue" не является строкой`);
    }

    return {
      scene: s.scene,
      description: s.description,
      dialogue: s.dialogue,
    };
  });

  return {
    title: obj.title,
    scenes,
  };
}

/**
 * Извлекает JSON из текстового ответа модели.
 * На случай, если модель всё же обернула ответ в markdown-блок
 * (```json ... ```) или добавила текст вокруг — вырезаем сам объект.
 */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // fallback: ищем первую { и последнюю } в тексте
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Не удалось найти JSON-объект в ответе модели");
    }
    const candidate = trimmed.slice(start, end + 1);
    return JSON.parse(candidate);
  }
}
