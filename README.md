# NEXUS Film MVP

Пользователь вводит идею фильма → получает структурированный сценарий (JSON), сгенерированный через OpenAI (`gpt-4o-mini`).

## Стек

- Next.js 14 (App Router)
- TypeScript
- OpenAI SDK

## Структура проекта

```
nexus-film-mvp/
├── app/
│   ├── api/film/route.ts   # API endpoint: POST /api/film
│   ├── layout.tsx
│   ├── page.tsx            # UI: ввод идеи, кнопка Generate, вывод JSON
│   └── globals.css
├── core/
│   ├── types.ts            # типы Screenplay / Scene
│   └── prompt.ts           # системный промпт + валидация JSON
├── lib/
│   └── openai.ts           # клиент OpenAI + вызов gpt-4o-mini
├── .env.example
├── package.json
├── tsconfig.json
└── next.config.js
```

## Установка и запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте файл `.env.local` в корне проекта и добавьте ключ OpenAI:

```
OPENAI_API_KEY=sk-ваш-ключ
```

(можно скопировать `.env.example` → `.env.local` и вставить свой ключ)

3. Запустите dev-сервер:

```bash
npm run dev
```

4. Откройте [http://localhost:3000](http://localhost:3000)

## Как это работает

1. Пользователь вводит идею в текстовое поле и нажимает **Generate**.
2. Фронтенд (`app/page.tsx`) отправляет `POST /api/film` с телом `{ idea: string }`.
3. API route (`app/api/film/route.ts`):
   - валидирует входные данные;
   - вызывает `generateScreenplay()` из `lib/openai.ts`;
   - тот отправляет запрос в OpenAI (`gpt-4o-mini`) с жёстким системным промптом (`core/prompt.ts`), включая `response_format: { type: "json_object" }`;
   - ответ парсится (`extractJson`) и валидируется по форме `Screenplay` (`assertScreenplayShape`);
   - при любой ошибке парсинга/валидации/сети возвращается `{ error: string }` со статусом 502 (или 400 при некорректном запросе).
4. Фронтенд отображает сценарий: заголовок фильма и карточки сцен с описанием и диалогом, плюс возможность посмотреть исходный JSON.

## Формат ответа API

```json
{
  "title": "Название фильма",
  "scenes": [
    {
      "scene": 1,
      "description": "Описание сцены",
      "dialogue": "Реплики персонажей"
    }
  ]
}
```

## Обработка ошибок

- Пустая/слишком длинная идея → `400` с описанием ошибки.
- Отсутствует `OPENAI_API_KEY` → `502` с сообщением об ошибке.
- Модель вернула невалидный JSON или не тот формат → JSON парсится с fallback-извлечением объекта из текста; если это не помогает — `502` с точным описанием, какое поле не соответствует ожидаемой структуре.
