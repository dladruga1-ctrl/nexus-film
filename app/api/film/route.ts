import { NextRequest, NextResponse } from "next/server";
import { generateScreenplay } from "@/lib/openai";
import { FilmRequestBody, ApiErrorResponse, Screenplay } from "@/core/types";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest
): Promise<NextResponse<Screenplay | ApiErrorResponse>> {
  let body: FilmRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Некорректное тело запроса: ожидался JSON" },
      { status: 400 }
    );
  }

  const idea = body?.idea;

  if (typeof idea !== "string" || idea.trim().length === 0) {
    return NextResponse.json(
      { error: 'Поле "idea" обязательно и должно быть непустой строкой' },
      { status: 400 }
    );
  }

  if (idea.length > 2000) {
    return NextResponse.json(
      { error: 'Поле "idea" слишком длинное (максимум 2000 символов)' },
      { status: 400 }
    );
  }

  try {
    const screenplay = await generateScreenplay(idea.trim());
    return NextResponse.json(screenplay, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    console.error("[/api/film] Ошибка генерации сценария:", message);

    return NextResponse.json(
      { error: `Ошибка генерации сценария: ${message}` },
      { status: 502 }
    );
  }
}
