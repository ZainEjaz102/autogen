"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const AGENTS = [
  { name: "Planner", role: "Breaks the task into steps", color: "#2F5D9E" },
  { name: "Researcher", role: "Looks things up with tools", color: "#1F8A70" },
  { name: "Analyst", role: "Checks and interprets findings", color: "#B7791F" },
  { name: "Writer", role: "Writes the final answer", color: "#8B3A62" },
];

const EXAMPLES = [
  "Convert 500 USD to PKR, check the weather in Dubai, and summarize it in 3 bullet points.",
  "Summarize the Wikipedia article on solar power in three bullet points.",
];

const colorOf = (name) => AGENTS.find((a) => a.name === name)?.color || "#5B6770";

export default function Home() {
  const [task, setTask] = useState("");
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const active = running && messages.length ? messages[messages.length - 1].source : null;

  const lastWriter = [...messages].reverse().find((m) => m.source === "Writer");
  const final = lastWriter ? lastWriter.content.replace(/TERMINATE/g, "").trim() : "";

  async function run(text) {
    const prompt = (text ?? task).trim();
    if (!prompt || running) return;
    setTask(prompt);
    setMessages([]);
    setError("");
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: prompt }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Server returned ${res.status}.`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line);
          if (evt.error) throw new Error(evt.error);
          setMessages((m) => [...m, { source: evt.source, content: evt.content }]);
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(
          e instanceof TypeError
            ? `Can't reach the agent server at ${API}. Check that the backend is running.`
            : e.message
        );
      }
    } finally {
      setRunning(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <main className="shell">
      <header className="top">
        <h1>Agent Team</h1>
        <p>Give the team a task and watch each agent hand its work to the next.</p>
      </header>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run();
            }
          }}
          placeholder="Describe a task for the team"
          rows={2}
          aria-label="Task"
        />
        {running ? (
          <button type="button" className="btn stop" onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="submit" className="btn" disabled={!task.trim()}>
            Run task
          </button>
        )}
      </form>

      <div className="layout">
        <aside className="roster" aria-label="Agents">
          <ol>
            {AGENTS.map((a) => (
              <li
                key={a.name}
                className={active === a.name ? "on" : ""}
                style={{ "--c": a.color }}
              >
                <span className="dot" />
                <div>
                  <strong>{a.name}</strong>
                  <span>{active === a.name ? "Working now" : a.role}</span>
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <section className="stream" aria-live="polite">
          {!messages.length && !running && !error && (
            <div className="empty">
              <p>Try one of these, or write your own.</p>
              {EXAMPLES.map((ex) => (
                <button key={ex} className="chip" onClick={() => run(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          )}

          {final && (
            <article className="msg final" style={{ "--c": colorOf("Writer") }}>
              <h2>Answer</h2>
              <div className="body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{final}</ReactMarkdown>
              </div>
            </article>
          )}

          {running && !final && <p className="hint">The team is working on it…</p>}
          {error && <div className="error">{error}</div>}
          <div ref={endRef} />
        </section>
      </div>
    </main>
  );
}
