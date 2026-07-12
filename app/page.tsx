"use client";

import { useState } from "react";
import { Screenplay } from "@/core/types";

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Screenplay | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function handleGenerate() {
    const trimmedIdea = idea.trim();

    if (!trimmedIdea) {
      setError("Введите идею фильма перед генерацией");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/film", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: trimmedIdea }),
      });

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new Error("Сервер вернул невалидный JSON");
      }

      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : "Неизвестная ошибка сервера";
        throw new Error(message);
      }

      setResult(data as Screenplay);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  }

  return (
    <main className="container">
      <div className="header">
        <h1>NEXUS Film MVP</h1>
        <p>Опишите идею фильма — получите структурированный сценарий</p>
      </div>

      <div className="form">
        <textarea
          className="textarea"
          placeholder="Например: пилот истребителя обнаруживает, что война, которую он ведёт, была спровоцирована искусственным интеллектом..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="button"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Генерация..." : "Generate"}
        </button>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {result && (
        <div className="result">
          <h2 className="filmTitle">{result.title}</h2>

          {result.scenes.map((scene) => (
            <div className="scene" key={scene.scene}>
              <div className="sceneHeader">
                <span className="sceneNumber">Сцена {scene.scene}</span>
                <span className="sceneLabel">Описание и диалог</span>
              </div>
              <p className="sceneDescription">{scene.description}</p>
              <div className="sceneDialogueLabel">Диалог</div>
              <pre className="sceneDialogue">{scene.dialogue}</pre>
            </div>
          ))}

          <div className="rawJsonToggle">
            <button onClick={() => setShowRaw((v) => !v)}>
              {showRaw ? "Скрыть исходный JSON" : "Показать исходный JSON"}
            </button>
            {showRaw && (
              <pre className="rawJson">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
