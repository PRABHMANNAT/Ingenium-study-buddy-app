import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Paperclip,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { makeResult, modes, products, shortcuts, windows } from "./study-tools";
import type { Product, Result, TimeWindow, Tool } from "./study-tools";
import { DesktopExample, DesktopLibrary } from "./DesktopWorkspace";
import type { LibraryItem, StudyEntry } from "./DesktopWorkspace";
import "./App.css";
import "./desktop.css";

type Readiness = {
  covered: number;
  topics: number;
  correct: number;
  attempts: number;
};

function ToolIcon({ item }: { item: Product | Tool }) {
  return (
    <span className={`tool-icon ${item.color}`} aria-hidden="true">
      <item.icon size={18} strokeWidth={1.75} />
    </span>
  );
}

function Activity({ result }: { result: Result }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [remaining, setRemaining] = useState(result.duration);
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (result.kind === "map")
    return (
      <div className="result">
        <h3>Concept map</h3>
        <div className="diagram">
          <strong>{result.title}</strong>
          <div>
            {result.items.map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    );
  if (result.kind === "list")
    return (
      <div className="result">
        <h3>{result.title}</h3>
        <ol>
          {result.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </div>
    );

  const line = result.items[index];
  const colon = line.indexOf(":");
  const hasDefinition = colon > 0 && line.slice(colon + 1).trim().length > 0;
  const lastWord = line.match(/\p{L}[\p{L}\p{N}-]*(?=[^\p{L}\p{N}]*$)/u);
  const prompt = hasDefinition
    ? line.slice(0, colon)
    : lastWord
      ? line.slice(0, lastWord.index) + "____"
      : "Recall this note";
  const answer = hasDefinition ? line.slice(colon + 1).trim() : line;
  return (
    <div className="result">
      <div className="result-heading">
        <h3>{result.title}</h3>
        {remaining !== undefined && <span>{remaining}s</span>}
      </div>
      {result.duration && !deadline ? (
        <button
          type="button"
          className="action-button"
          onClick={() => setDeadline(Date.now() + result.duration! * 1000)}
        >
          Start timed round
        </button>
      ) : remaining === 0 ? (
        <p>
          Time’s up. You reached card {index + 1} of {result.items.length}.
        </p>
      ) : (
        <>
          <div className="practice-card">
            <span>
              {index + 1} / {result.items.length}
            </span>
            <strong>{prompt}</strong>
            {revealed && <p>{answer}</p>}
          </div>
          <div className="practice-controls">
            <button
              type="button"
              className="action-button"
              onClick={() => setRevealed((value) => !value)}
            >
              {revealed ? "Hide answer" : "Reveal answer"}
            </button>
            {result.items.length > 1 && (
              <button
                type="button"
                className="action-button secondary"
                onClick={() => {
                  setIndex((index + 1) % result.items.length);
                  setRevealed(false);
                }}
              >
                Next <ArrowRight size={15} />
              </button>
            )}
          </div>
        </>
      )}
      {remaining === 0 && (
        <button
          type="button"
          className="action-button"
          onClick={() => {
            setDeadline(0);
            setRemaining(result.duration);
            setIndex(0);
            setRevealed(false);
          }}
        >
          Reset round
        </button>
      )}
    </div>
  );
}

function ReadinessPanel({
  onClose,
  onSave,
  previous,
}: {
  onClose: () => void;
  onSave: (score: Readiness) => void;
  previous: Readiness | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const estimate = previous && readinessEstimate(previous);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="readiness-dialog"
      aria-labelledby="readiness-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const score = {
            covered: Number(data.get("covered")),
            topics: Number(data.get("topics")),
            correct: Number(data.get("correct")),
            attempts: Number(data.get("attempts")),
          };
          if (score.covered > score.topics || score.correct > score.attempts) {
            setError(
              "Enter covered topics and correct answers within their totals.",
            );
            return;
          }
          setError("");
          onSave(score);
        }}
      >
        <div className="dialog-heading">
          <h2 id="readiness-title">Exam readiness</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close readiness"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        <p>
          The estimate combines your syllabus coverage and practice accuracy
          equally. Accuracy is less certain with fewer questions.
        </p>
        {estimate && (
          <div className="score-summary" role="status">
            <strong>{estimate.score}%</strong>
            <span>
              Practice-based range {estimate.low}–{estimate.high}%
              <small>Assumes your practice questions are representative.</small>
            </span>
          </div>
        )}
        <div className="readiness-fields">
          <label>
            Topics covered
            <input
              name="covered"
              type="number"
              min="0"
              max="10000"
              required
              defaultValue={previous?.covered}
            />
          </label>
          <label>
            Total topics
            <input
              name="topics"
              type="number"
              min="1"
              max="10000"
              required
              defaultValue={previous?.topics}
            />
          </label>
          <label>
            Correct answers
            <input
              name="correct"
              type="number"
              min="0"
              max="10000"
              required
              defaultValue={previous?.correct}
            />
          </label>
          <label>
            Practice questions
            <input
              name="attempts"
              type="number"
              min="1"
              max="10000"
              required
              defaultValue={previous?.attempts}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit" className="action-button">
          Calculate readiness
        </button>
      </form>
    </dialog>
  );
}

function readinessEstimate(data: Readiness) {
  const coverage = data.covered / data.topics;
  const proportion = data.correct / data.attempts;
  const n = data.attempts;
  const z = 1.96;
  // Wilson interval for practice accuracy, holding self-reported coverage fixed.
  const denominator = 1 + z ** 2 / n;
  const center = (proportion + z ** 2 / (2 * n)) / denominator;
  const margin =
    (z * Math.sqrt((proportion * (1 - proportion) + z ** 2 / (4 * n)) / n)) /
    denominator;
  return {
    score: Math.round((coverage + proportion) * 50),
    low: Math.round((coverage + center - margin) * 50),
    high: Math.round((coverage + center + margin) * 50),
  };
}

const bookmarkKey = "ingenium.bookmarks.v1";

function loadBookmarks(): LibraryItem[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(bookmarkKey) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((item) => {
      const result = item?.entry?.result;
      return (
        typeof item?.id === "string" &&
        typeof item.entry?.prompt === "string" &&
        typeof item.entry?.label === "string" &&
        typeof result?.title === "string" &&
        ["map", "list", "quiz", "flash"].includes(result.kind) &&
        Array.isArray(result.items) &&
        result.items.length > 0 &&
        result.items.every((line: unknown) => typeof line === "string") &&
        (result.duration === undefined || Number.isFinite(result.duration))
      );
    });
  } catch {
    return [];
  }
}

function App() {
  const [product, setProduct] = useState<Product>(products[0]);
  const [tool, setTool] = useState<Tool | null>(null);
  const [menu, setMenu] = useState<"all" | "products" | null>(null);
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<StudyEntry[]>([]);
  const [attachment, setAttachment] = useState<{
    name: string;
    text: string;
  } | null>(null);
  const [recent, setRecent] = useState<LibraryItem[]>([]);
  const [saved, setSaved] = useState<LibraryItem[]>(loadBookmarks);
  const [savedOnly, setSavedOnly] = useState(false);
  const [activityVersion, setActivityVersion] = useState(0);
  const [notice, setNotice] = useState("");
  const [time, setTime] = useState<TimeWindow>("30 minutes");
  const [showReadiness, setShowReadiness] = useState(false);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const menuHeading = useRef<HTMLHeadingElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const fileVersion = useRef(0);
  const estimate = readiness && readinessEstimate(readiness);
  const active = tool ?? product;

  useEffect(() => {
    if (entries.length) bottom.current?.scrollIntoView({ block: "nearest" });
  }, [entries.length]);

  useEffect(() => {
    if (menu) menuHeading.current?.focus();
  }, [menu]);

  function closeMenu(restoreFocus = false) {
    setMenu(null);
    if (restoreFocus) menuTrigger.current?.focus();
  }

  function chooseTool(item: Tool) {
    closeMenu();
    if (item.id === "readiness") {
      setShowReadiness(true);
      return;
    }
    setTool(item);
    input.current?.focus();
  }

  function chooseProduct(item: Product) {
    setProduct(item);
    setTool(null);
    closeMenu();
    input.current?.focus();
  }

  function reset() {
    fileVersion.current += 1;
    setEntries([]);
    setAttachment(null);
    setText("");
    setTool(null);
    setProduct(products[0]);
    setMenu(null);
    setNotice("");
    input.current?.focus();
  }

  function send() {
    const prompt = [text.trim(), attachment?.text.trim()]
      .filter(Boolean)
      .join("\n");
    if (!prompt) return;
    fileVersion.current += 1;
    const entry: StudyEntry = {
      prompt: text.trim() || attachment?.name || prompt,
      label: active.name,
      result: makeResult(prompt, product, tool, time),
    };
    setEntries((previous) => [...previous, entry]);
    const item = { id: crypto.randomUUID(), entry };
    setRecent((previous) => [item, ...previous]);
    setText("");
    setAttachment(null);
    setNotice("");
    closeMenu();
  }

  function openSet(item: LibraryItem) {
    reset();
    setEntries([item.entry]);
    setActivityVersion((version) => version + 1);
  }

  function toggleBookmark(item: LibraryItem) {
    const next = saved.some((bookmark) => bookmark.id === item.id)
      ? saved.filter((bookmark) => bookmark.id !== item.id)
      : [item, ...saved];
    setSaved(next);
    try {
      localStorage.setItem(bookmarkKey, JSON.stringify(next));
    } catch {
      setNotice(
        "Browser storage is unavailable. Bookmarks will last for this session.",
      );
    }
  }

  async function attach(source: File) {
    const currentVersion = ++fileVersion.current;
    setNotice("");
    if (!/\.(txt|md|csv)$/i.test(source.name) || source.size > 100_000) {
      setNotice("Choose a TXT, Markdown, or CSV file up to 100 KB.");
      return;
    }
    try {
      const content = (await source.text()).trim();
      if (currentVersion !== fileVersion.current) return;
      if (!content) {
        setNotice("This file has no text to study.");
        return;
      }
      setAttachment({ name: source.name, text: content });
      input.current?.focus();
    } catch {
      if (currentVersion === fileVersion.current)
        setNotice("Could not read this file. Try attaching it again.");
    }
  }

  function toggleMenu(next: "all" | "products", trigger: HTMLButtonElement) {
    menuTrigger.current = trigger;
    setMenu(menu === next ? null : next);
  }

  return (
    <div
      className="page"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu) {
          event.preventDefault();
          closeMenu(true);
        }
      }}
    >
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <DesktopLibrary
        recent={recent}
        saved={saved}
        savedOnly={savedOnly}
        onFilter={setSavedOnly}
        onOpen={openSet}
        onSave={toggleBookmark}
        onNew={reset}
        onReadiness={() => setShowReadiness(true)}
      />
      <div className="app-shell">
        <header className="topbar">
          <button
            type="button"
            className="icon-button"
            aria-label="Back to new chat"
            onClick={reset}
          >
            <ArrowLeft size={19} />
          </button>
          <button
            type="button"
            className="chat-title"
            aria-label="Choose an exam companion"
            onClick={(event) => toggleMenu("products", event.currentTarget)}
            aria-expanded={menu === "products"}
          >
            {product.id !== "pilot" && <product.icon size={17} />}
            <span>{product.id === "pilot" ? "New Chat" : product.name}</span>
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Clear conversation"
            onClick={reset}
          >
            <X size={19} />
          </button>
        </header>

        <main className="main">
          {entries.length === 0 ? (
            <div className="home">
              <section className="greeting">
                <div className="avatar-wrap">
                  <img
                    src="/aafreen-studypilot.webp"
                    alt="AI avatar of Aafreen"
                    width="72"
                    height="72"
                  />
                  <span className="avatar-spark">
                    <Sparkles size={12} fill="currentColor" />
                  </span>
                </div>
                <div>
                  <p>Hi, Aafreen!</p>
                  <h1>How can I help you?</h1>
                </div>
              </section>
              <div className="divider" />
              <DesktopExample onStart={openSet} />
            </div>
          ) : (
            <div className="conversation" aria-label="Study session">
              <button
                type="button"
                className="text-button back"
                onClick={reset}
              >
                <ArrowLeft size={16} /> Back to study tools
              </button>
              {entries.map((entry, index) => (
                <section
                  className="exchange"
                  key={`${activityVersion}-${index}`}
                >
                  <div className="user-message">{entry.prompt}</div>
                  <div className="result-label">
                    <img src="/aafreen-studypilot.webp" alt="" />
                    {entry.label}
                    <span>Local practice</span>
                  </div>
                  <Activity result={entry.result} />
                </section>
              ))}
              <div ref={bottom} />
            </div>
          )}
          <section
            className={`cards ${entries.length ? "in-conversation" : ""}`}
            aria-label="Quick study tools"
          >
            {shortcuts.map((item) => (
              <button
                type="button"
                className={`card ${item.color}`}
                key={item.id}
                onClick={() => chooseTool(item)}
              >
                <span className="card-art" aria-hidden="true">
                  <item.icon size={47} strokeWidth={1.35} />
                </span>
                <span className="card-label">
                  <span>
                    {item.name}
                    {item.id === "readiness" && estimate && (
                      <small>{estimate.score}% estimate</small>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </section>
        </main>

        <div className="composer-dock">
          {menu && (
            <>
              <button
                type="button"
                aria-label="Close study tools"
                tabIndex={-1}
                className="menu-backdrop"
                onClick={() => closeMenu(true)}
              />
              <section
                className="tool-menu"
                id="study-menu"
                aria-label="Study tools"
              >
                <div className="menu-heading">
                  <h2 ref={menuHeading} tabIndex={-1}>
                    Study tools
                  </h2>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Close menu"
                    onClick={() => closeMenu(true)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="menu-tabs" aria-label="Tool categories">
                  <button
                    type="button"
                    className={menu === "all" ? "active" : ""}
                    aria-pressed={menu === "all"}
                    onClick={() => setMenu("all")}
                  >
                    Study modes
                  </button>
                  <button
                    type="button"
                    className={menu === "products" ? "active" : ""}
                    aria-pressed={menu === "products"}
                    onClick={() => setMenu("products")}
                  >
                    Exam companions
                  </button>
                </div>
                <div className="menu-scroll">
                  {menu === "all" && (
                    <>
                      <button
                        type="button"
                        className="menu-row"
                        onClick={() => {
                          closeMenu(true);
                          file.current?.click();
                        }}
                      >
                        <span className="tool-icon neutral">
                          <Paperclip size={18} />
                        </span>
                        <span>
                          <strong>Add study material</strong>
                          <small>Attach TXT, Markdown, or CSV</small>
                        </span>
                      </button>
                      {modes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="menu-row"
                          onClick={() => chooseTool(item)}
                        >
                          <ToolIcon item={item} />
                          <span>
                            <strong>{item.name}</strong>
                            <small>{item.description}</small>
                          </span>
                          {tool?.id === item.id && (
                            <Check className="menu-check" size={17} />
                          )}
                        </button>
                      ))}
                    </>
                  )}
                  {menu === "products" &&
                    products.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="menu-row"
                        onClick={() => chooseProduct(item)}
                      >
                        <ToolIcon item={item} />
                        <span>
                          <strong>{item.name}</strong>
                          <small>
                            {menu === "products"
                              ? item.detail
                              : item.description}
                          </small>
                        </span>
                        {product.id === item.id && (
                          <Check className="menu-check" size={17} />
                        )}
                      </button>
                    ))}
                </div>
              </section>
            </>
          )}
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            {notice && (
              <div className="composer-notice" role="status">
                {notice}
                <button
                  type="button"
                  aria-label="Dismiss notice"
                  onClick={() => setNotice("")}
                >
                  <X size={15} />
                </button>
              </div>
            )}
            {attachment && (
              <div className="attachment">
                <Paperclip size={15} />
                <span>{attachment.name}</span>
                <button
                  type="button"
                  aria-label="Remove attachment"
                  onClick={() => setAttachment(null)}
                >
                  <X size={15} />
                </button>
              </div>
            )}
            {product.id === "cram" && !tool && (
              <div className="time-options" aria-label="Revision time">
                {windows.map((option) => (
                  <button
                    type="button"
                    key={option}
                    aria-pressed={option === time}
                    onClick={() => setTime(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            <div className="composer-row">
              <button
                type="button"
                className="add-button"
                aria-label="Open study tools"
                aria-expanded={menu === "all"}
                aria-controls={menu === "all" ? "study-menu" : undefined}
                onClick={(event) => toggleMenu("all", event.currentTarget)}
              >
                <Plus size={23} />
              </button>
              <textarea
                ref={input}
                value={text}
                maxLength={10000}
                onChange={(event) => setText(event.target.value)}
                placeholder={
                  tool
                    ? tool.prompt
                    : product.id === "pilot"
                      ? "Ask me anything …"
                      : product.prompt
                }
                aria-label="Ask me anything"
                rows={1}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
              <button
                type="submit"
                className="send-button"
                aria-label="Send message"
                disabled={!text.trim() && !attachment}
              >
                <ArrowUp size={21} />
              </button>
            </div>
            {(tool || product.id !== "pilot") && (
              <div className="mode-chip">
                <ToolIcon item={active} />
                {active.name}
                <button
                  type="button"
                  aria-label="Reset study mode"
                  onClick={() => {
                    if (tool) setTool(null);
                    else setProduct(products[0]);
                    input.current?.focus();
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </form>
          <input
            type="file"
            hidden
            ref={file}
            accept=".txt,.md,.csv"
            onChange={(event) => {
              const source = event.target.files?.[0];
              event.target.value = "";
              if (source) void attach(source);
            }}
          />
        </div>
      </div>
      {showReadiness && (
        <ReadinessPanel
          previous={readiness}
          onClose={() => setShowReadiness(false)}
          onSave={setReadiness}
        />
      )}
    </div>
  );
}

export default App;
