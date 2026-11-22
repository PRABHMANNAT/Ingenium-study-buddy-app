import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  ArrowUp,
  BookOpen,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  FileText,
  FolderOpen,
  GraduationCap,
  Lightbulb,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pause,
  PencilLine,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { createReply, initialChats, readStored, uid } from "./study";
import type { Chat, Note, ReplyStyle } from "./study";
import "./App.css";

type View = "chat" | "library" | "focus";
const prompts = [
  {
    icon: Lightbulb,
    color: "peach",
    label: "Make it click",
    text: "Break down a tricky concept",
    prompt: "Explain photosynthesis in simple terms.",
  },
  {
    icon: FileText,
    color: "purple",
    label: "Less reading, more learning",
    text: "Turn my notes into a summary",
    prompt: "Help me summarize my study notes.",
  },
  {
    icon: GraduationCap,
    color: "blue",
    label: "Put your knowledge to work",
    text: "Quiz me on what I’m learning",
    prompt: "Quiz me on photosynthesis.",
  },
  {
    icon: BookOpen,
    color: "green",
    label: "A little structure goes a long way",
    text: "Build a study plan that sticks",
    prompt: "Make me a one-week study plan.",
  },
];

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? "small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M20 6v28M6 20h28M10.1 10.1l19.8 19.8M10.1 29.9l19.8-19.8"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function App() {
  const [chats, setChats] = useState<Chat[]>(() =>
    readStored("ingenium.chats.v1", initialChats),
  );
  const [notes, setNotes] = useState<Note[]>(() =>
    readStored("ingenium.notes.v1", []),
  );
  const [name, setName] = useState(() =>
    readStored("ingenium.name.v1", "Learner"),
  );
  const [style, setStyle] = useState<ReplyStyle>(() =>
    readStored("ingenium.style.v1", "Guided"),
  );
  const [view, setView] = useState<View>("chat");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [attachment, setAttachment] = useState<Note | null>(null);
  const [toast, setToast] = useState("");
  const [seconds, setSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [tasks, setTasks] = useState<
    { id: string; text: string; done: boolean }[]
  >(() =>
    readStored("ingenium.tasks.v1", [
      { id: "first", text: "Choose one topic to focus on", done: false },
      {
        id: "second",
        text: "Review notes and recall the key ideas",
        done: false,
      },
      { id: "third", text: "Test yourself without looking", done: false },
    ]),
  );
  const [taskInput, setTaskInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerDeadline = useRef(0);
  const activeChat = chats.find((c) => c.id === activeId);
  const messages = activeChat?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    try {
      for (const [key, value] of Object.entries({
        chats,
        notes,
        name,
        style,
        tasks,
      }))
        localStorage.setItem(`ingenium.${key}.v1`, JSON.stringify(value));
    } catch {
      setToast(
        "Browser storage is full or unavailable. Changes may not survive a refresh.",
      );
    }
  }, [chats, notes, name, style, tasks]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeId, messages.length, pending]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!timerRunning) return;
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((timerDeadline.current - Date.now()) / 1000),
      );
      setSeconds(remaining);
      if (remaining === 0) {
        setTimerRunning(false);
        setToast("Focus session complete. Time for a well-earned break!");
      }
    }, 250);
    return () => clearInterval(timer);
  }, [timerRunning]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen((s) => !s);
        setCollapsed(false);
        setMobileOpen(true);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  function navigate(next: View) {
    setView(next);
    setMobileOpen(false);
  }
  function newChat() {
    setActiveId(null);
    setInput("");
    setAttachment(null);
    navigate("chat");
    setTimeout(() => textareaRef.current?.focus(), 0);
  }
  function openChat(id: string) {
    setActiveId(id);
    setInput("");
    setAttachment(null);
    navigate("chat");
  }
  function send(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const text = (prompt ?? input).trim();
    if (!text || pending) return;
    const id = activeId ?? uid();
    const note = attachment;
    const userMessage = {
      id: uid(),
      role: "user" as const,
      content: text,
      attachmentName: note?.name,
    };
    setChats((previous) =>
      activeId
        ? previous.map((chat) =>
            chat.id === id
              ? { ...chat, messages: [...chat.messages, userMessage] }
              : chat,
          )
        : [
            {
              id,
              title: text.slice(0, 42),
              date: new Date().toISOString(),
              messages: [userMessage],
            },
            ...previous,
          ],
    );
    setActiveId(id);
    setInput("");
    setAttachment(null);
    setPending(true);
    setView("chat");
    replyTimer.current = setTimeout(() => {
      const reply = {
        id: uid(),
        role: "assistant" as const,
        content: createReply(text, style, note),
      };
      setChats((previous) =>
        previous.map((chat) =>
          chat.id === id
            ? { ...chat, messages: [...chat.messages, reply] }
            : chat,
        ),
      );
      setPending(false);
    }, 700);
  }
  async function attachFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      setToast("Please choose a .txt or .md file.");
      return;
    }
    if (file.size > 100_000) {
      setToast("Please use a notes file smaller than 100 KB.");
      return;
    }
    try {
      const content = await file.text();
      if (!content.trim()) {
        setToast("This file is empty. Please choose a file with study notes.");
        return;
      }
      const note = {
        id: uid(),
        name: file.name,
        content,
        date: new Date().toISOString(),
      };
      setNotes((previous) => [note, ...previous]);
      setAttachment(note);
      navigate("chat");
      setInput("Help me summarize my study notes.");
      setToast("Notes attached. Ready when you are.");
    } catch {
      setToast("The file could not be read. Please try again.");
    }
  }
  function bookmark(chatId: string, messageId: string) {
    setChats((previous) =>
      previous.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId
                  ? { ...message, saved: !message.saved }
                  : message,
              ),
            }
          : chat,
      ),
    );
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied to clipboard");
    } catch {
      setToast("Clipboard unavailable. You can select and copy the text.");
    }
  }
  function deleteChat(id: string) {
    setChats((previous) => previous.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    setToast("Conversation deleted");
  }
  const filteredChats = chats.filter((c) =>
    `${c.title} ${c.messages.map((m) => m.content).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const savedMessages = chats.flatMap((chat) =>
    chat.messages.filter((m) => m.saved).map((message) => ({ chat, message })),
  );

  return (
    <div className={`app ${collapsed ? "sidebar-collapsed" : ""}`}>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="brand-row">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              newChat();
            }}
          >
            <BrandMark small />
            <span>
              ingenium<span className="brand-period">.</span>
            </span>
          </a>
          <button
            className="icon-button collapse-button"
            aria-label="Collapse sidebar"
            onClick={() => {
              setCollapsed(true);
              setMobileOpen(false);
            }}
          >
            <ChevronLeft size={17} />
          </button>
        </div>
        <button className="new-chat" onClick={newChat}>
          <Plus size={18} />
          <span>New conversation</span>
          <PencilLine size={16} />
        </button>
        <nav className="main-nav">
          <button
            className={view === "chat" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("chat")}
          >
            <MessageCircle size={19} />
            <span>Study chat</span>
            <span className="active-dot" />
          </button>
          <button
            className={view === "library" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("library")}
          >
            <FolderOpen size={19} />
            <span>My library</span>
            {notes.length + savedMessages.length > 0 && (
              <span className="count">
                {notes.length + savedMessages.length}
              </span>
            )}
          </button>
          <button
            className={view === "focus" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("focus")}
          >
            <Timer size={19} />
            <span>Focus space</span>
            {timerRunning && (
              <span className="timer-badge">{Math.ceil(seconds / 60)}m</span>
            )}
          </button>
        </nav>
        <div className="history-heading">
          <span>Recent conversations</span>
          <button
            className="icon-button"
            aria-label="Search conversations"
            title="Search conversations (Ctrl+K)"
            onClick={() => setSearchOpen((s) => !s)}
          >
            <Search size={15} />
          </button>
        </div>
        {searchOpen && (
          <div className="search-field">
            <Search size={15} />
            <input
              autoFocus
              placeholder="Search your chats…"
              aria-label="Search your chats"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                setSearchOpen(false);
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="history-list">
          {filteredChats.length ? (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`history-row ${activeId === chat.id && view === "chat" ? "current" : ""}`}
              >
                <button onClick={() => openChat(chat.id)}>
                  <MessageCircle size={15} />
                  <span>{chat.title}</span>
                </button>
                <button
                  className="delete-chat icon-button"
                  aria-label={`Delete ${chat.title}`}
                  onClick={() => deleteChat(chat.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          ) : (
            <p className="empty-history">
              {search
                ? "No conversations found."
                : "Your ideas will feel at home here."}
            </p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="little-note">
            <Sparkles size={18} />
            <p>
              A little progress,
              <br />
              <strong>every single day.</strong>
            </p>
            <span className="note-decoration">✳</span>
          </div>
          <button className="help-link" onClick={() => setHelpOpen(true)}>
            <CircleHelp size={17} />
            Help & getting started
            <ChevronRight size={14} />
          </button>
          <div className="profile-row">
            <span className="avatar">{name.slice(0, 2).toUpperCase()}</span>
            <button
              className="profile-name"
              onClick={() => setSettingsOpen(true)}
            >
              <strong>{name}</strong>
              <span>Your personal workspace</span>
            </button>
            <button
              className="icon-button"
              aria-label="Open settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main
        className={`main-panel ${hasMessages && view === "chat" ? "conversation-view" : ""}`}
      >
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button expand-button"
              aria-label="Open navigation"
              onClick={() => {
                setCollapsed(false);
                setMobileOpen(true);
              }}
            >
              <Menu size={20} />
            </button>
            <span>Your workspace</span>
            <ChevronRight size={13} />
            <strong>
              {view === "chat"
                ? "Study chat"
                : view === "library"
                  ? "My library"
                  : "Focus space"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="workspace-badge">A space to grow</span>
            <button
              className="icon-button"
              aria-label="About this workspace"
              onClick={() => setHelpOpen(true)}
            >
              <MoreHorizontal size={21} />
            </button>
          </div>
        </header>
        {view === "chat" && (
          <div
            className={`chat-workspace ${hasMessages ? "has-messages" : ""}`}
          >
            {!hasMessages ? (
              <section className="welcome">
                <div className="welcome-symbol">
                  <BrandMark />
                  <span className="orbit-dot one" />
                  <span className="orbit-dot two" />
                  <span className="tiny-spark">✧</span>
                </div>
                <div className="eyebrow">
                  BIG IDEAS START WITH SMALL QUESTIONS
                </div>
                <h1>
                  What will you
                  <br />
                  <span>learn today?</span>
                </h1>
                <p>
                  Your curious mind. A little guidance. Endless possibilities.
                  <br className="desktop-break" /> Let’s make your next “aha”
                  moment happen.
                </p>
                <div className="prompt-grid">
                  {prompts.map(({ icon: Icon, color, label, text, prompt }) => (
                    <button
                      key={text}
                      className="prompt-card"
                      onClick={() => {
                        setInput(prompt);
                        textareaRef.current?.focus();
                      }}
                    >
                      <div className={`prompt-icon ${color}`}>
                        <Icon size={19} strokeWidth={1.7} />
                      </div>
                      <span className="prompt-label">{label}</span>
                      <span className="prompt-text">
                        {text}
                        <Plus size={15} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className="conversation" aria-label="Conversation">
                <div className="conversation-title">
                  <span>
                    <BrandMark small />
                    {activeChat?.title}
                  </span>
                  <span className="demo-pill">Sample responses</span>
                </div>
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`message ${message.role}`}
                  >
                    <div className="message-avatar">
                      {message.role === "assistant" ? (
                        <BrandMark small />
                      ) : (
                        name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="message-body">
                      <span className="message-name">
                        {message.role === "assistant" ? "Ingenium" : "You"}
                        {message.role === "assistant" && (
                          <span className="message-demo">DEMO</span>
                        )}
                      </span>
                      {message.attachmentName && (
                        <div className="message-attachment">
                          <FileText size={15} />
                          {message.attachmentName}
                        </div>
                      )}
                      <div className="message-content">
                        {message.content
                          .split("\n")
                          .map((line, index) =>
                            line.startsWith("## ") ? (
                              <h3 key={index}>{line.slice(3)}</h3>
                            ) : (
                              <p key={index}>{line || "\u00a0"}</p>
                            ),
                          )}
                      </div>
                      {message.role === "assistant" && (
                        <div className="message-actions">
                          <button
                            className="icon-button"
                            aria-label="Copy response"
                            onClick={() => copy(message.content)}
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            className={`icon-button ${message.saved ? "selected" : ""}`}
                            aria-label={
                              message.saved
                                ? "Unsave response"
                                : "Save response"
                            }
                            onClick={() => bookmark(activeId!, message.id)}
                          >
                            <Bookmark
                              size={15}
                              fill={message.saved ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {pending && (
                  <div className="thinking" role="status">
                    <BrandMark small />
                    <span />
                    <span />
                    <span />
                    <span className="sr-only">Preparing a sample response</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </section>
            )}
            <div className="composer-area">
              <form className="composer" onSubmit={send}>
                {attachment && (
                  <div className="attachment-chip">
                    <FileText size={14} />
                    <span>{attachment.name}</span>
                    <button
                      type="button"
                      aria-label="Remove attachment"
                      onClick={() => setAttachment(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  rows={2}
                  aria-label="Message Ingenium"
                  placeholder="Ask anything. No question is too small…"
                  value={input}
                  maxLength={8000}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <div className="composer-bottom">
                  <div className="composer-tools">
                    <button
                      type="button"
                      className="attach-button"
                      onClick={() => fileRef.current?.click()}
                      title="Attach a .txt or .md file, up to 100 KB"
                    >
                      <Paperclip size={18} />
                      <span>Attach notes</span>
                    </button>
                    <span className="tool-separator" />
                    <div className="style-control">
                      <button
                        type="button"
                        className="style-button"
                        aria-expanded={styleOpen}
                        onClick={() => setStyleOpen((v) => !v)}
                      >
                        <Sparkles size={15} />
                        <span>
                          {style === "Guided"
                            ? "Learn together"
                            : style === "Concise"
                              ? "Keep it concise"
                              : "Explore deeper"}
                        </span>
                        <ChevronDown size={13} />
                      </button>
                      {styleOpen && (
                        <div className="style-menu">
                          {(
                            ["Guided", "Concise", "Detailed"] as ReplyStyle[]
                          ).map((option) => (
                            <button
                              type="button"
                              key={option}
                              onClick={() => {
                                setStyle(option);
                                setStyleOpen(false);
                              }}
                            >
                              <span>{option}</span>
                              {style === option && <Check size={15} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="send-button"
                    aria-label="Send message"
                    disabled={!input.trim() || pending}
                  >
                    <ArrowUp size={20} strokeWidth={2.3} />
                  </button>
                </div>
              </form>
              <div className="composer-caption">
                <span>
                  <Sparkles size={12} /> Made for your lightbulb moments.
                </span>
                <span>Local preview · Sample responses</span>
              </div>
            </div>
          </div>
        )}

        {view === "library" && (
          <section className="secondary-view">
            <div className="section-eyebrow">
              <FolderOpen size={17} /> YOUR LEARNING, COLLECTED
            </div>
            <div className="section-title-row">
              <div>
                <h1>A home for your ideas.</h1>
                <p>Keep the notes and explanations you want to come back to.</p>
              </div>
              <button
                className="primary-button"
                onClick={() => fileRef.current?.click()}
              >
                <Plus size={17} />
                Add notes
              </button>
            </div>
            <h2 className="subheading">
              Your notes <span>{notes.length}</span>
            </h2>
            {notes.length ? (
              <div className="note-grid">
                {notes.map((note) => (
                  <article className="library-note" key={note.id}>
                    <FileText size={23} />
                    <h3>{note.name}</h3>
                    <p>{note.content.slice(0, 130)}</p>
                    <div>
                      <button
                        className="text-button"
                        onClick={() => {
                          newChat();
                          setAttachment(note);
                          setInput("Help me summarize my study notes.");
                        }}
                      >
                        Study these notes
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete note ${note.name}`}
                        onClick={() => {
                          setNotes((previous) =>
                            previous.filter((n) => n.id !== note.id),
                          );
                          if (attachment?.id === note.id) setAttachment(null);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FileText size={30} />
                <h3>A fresh page for your next big idea</h3>
                <p>
                  Add .txt or .md notes to keep them here and bring them into a
                  conversation.
                </p>
                <button
                  className="text-button"
                  onClick={() => fileRef.current?.click()}
                >
                  Add your first notes
                </button>
              </div>
            )}
            <h2 className="subheading">
              Saved explanations <span>{savedMessages.length}</span>
            </h2>
            {savedMessages.length ? (
              <div className="saved-list">
                {savedMessages.map(({ chat, message }) => (
                  <article key={message.id}>
                    <Bookmark size={18} />
                    <div>
                      <h3>{chat.title}</h3>
                      <p>{message.content.slice(0, 170)}…</p>
                      <button
                        className="text-button"
                        onClick={() => openChat(chat.id)}
                      >
                        Open conversation
                      </button>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Remove saved explanation"
                      onClick={() => bookmark(chat.id, message.id)}
                    >
                      <X size={17} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                <Bookmark size={24} />
                <p>
                  Save a helpful response using its bookmark icon. Find it here,
                  whenever you need it.
                </p>
              </div>
            )}
          </section>
        )}

        {view === "focus" && (
          <section className="secondary-view focus-view">
            <div className="section-eyebrow">
              <Timer size={17} /> LESS DISTRACTION. MORE DISCOVERY.
            </div>
            <h1>One thing at a time.</h1>
            <p>A quiet space to settle in and make a little progress.</p>
            <div className="focus-grid">
              <div className="timer-card">
                <span className="timer-label">
                  <Timer size={16} />
                  FOCUS SESSION
                </span>
                <div className="timer-ring">
                  <span>
                    {String(Math.floor(seconds / 60)).padStart(2, "0")}
                    <i>:</i>
                    {String(seconds % 60).padStart(2, "0")}
                  </span>
                  <small>
                    {timerRunning
                      ? "You’re doing great. Keep going."
                      : seconds === 0
                        ? "Take a breath. You earned it."
                        : "A little focus goes a long way."}
                  </small>
                </div>
                <div className="timer-controls">
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (timerRunning) {
                        setTimerRunning(false);
                      } else {
                        const duration = seconds > 0 ? seconds : 25 * 60;
                        setSeconds(duration);
                        timerDeadline.current = Date.now() + duration * 1000;
                        setTimerRunning(true);
                      }
                    }}
                  >
                    {timerRunning ? <Pause size={17} /> : <Play size={17} />}
                    {timerRunning ? "Pause session" : "Start focusing"}
                  </button>
                  <button
                    className="icon-button reset-timer"
                    aria-label="Reset focus timer"
                    onClick={() => {
                      setSeconds(25 * 60);
                      setTimerRunning(false);
                    }}
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>
              <div className="task-card">
                <h2>Your small steps</h2>
                <p>
                  {tasks.filter((t) => t.done).length} of {tasks.length}{" "}
                  completed
                </p>
                <div className="task-list">
                  {tasks.map((task) => (
                    <div className="task-row" key={task.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() =>
                            setTasks((previous) =>
                              previous.map((t) =>
                                t.id === task.id ? { ...t, done: !t.done } : t,
                              ),
                            )
                          }
                        />
                        <span className={task.done ? "done" : ""}>
                          {task.text}
                        </span>
                      </label>
                      <button
                        className="icon-button"
                        aria-label={`Delete task ${task.text}`}
                        onClick={() =>
                          setTasks((previous) =>
                            previous.filter((t) => t.id !== task.id),
                          )
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <form
                  className="task-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (taskInput.trim()) {
                      setTasks((previous) => [
                        ...previous,
                        { id: uid(), text: taskInput.trim(), done: false },
                      ]);
                      setTaskInput("");
                    }
                  }}
                >
                  <input
                    aria-label="New focus task"
                    placeholder="Add a small step…"
                    maxLength={160}
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                  />
                  <button
                    className="icon-button"
                    aria-label="Add task"
                    disabled={!taskInput.trim()}
                  >
                    <Plus size={18} />
                  </button>
                </form>
              </div>
            </div>
            <p className="focus-quote">
              A little progress is still progress.
              <span>SHOW UP FOR YOUR CURIOUS SELF.</span>
            </p>
          </section>
        )}
        <footer className="page-footer">
          <span>STAY CURIOUS.</span>
          <span>One question can change everything.</span>
          <span>INGENIUM © {new Date().getFullYear()}</span>
        </footer>
      </main>
      <input
        type="file"
        ref={fileRef}
        className="sr-only"
        tabIndex={-1}
        accept=".txt,.md,text/plain,text/markdown"
        onChange={attachFile}
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {settingsOpen && (
        <Modal
          title="Make yourself at home"
          onClose={() => setSettingsOpen(false)}
        >
          <p className="modal-description">
            A few little things to make this space yours.
          </p>
          <label className="form-label">
            What should we call you?
            <input
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              onBlur={() => {
                if (!name.trim()) setName("Learner");
              }}
            />
          </label>
          <label className="form-label">
            How do you like to learn?
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as ReplyStyle)}
            >
              <option>Guided</option>
              <option>Concise</option>
              <option>Detailed</option>
            </select>
          </label>
          <div className="privacy-note">
            <BookOpen size={20} />
            <p>
              Conversations and notes stay in this browser. This preview uses
              sample responses and does not send your notes to an AI service.
            </p>
          </div>
          <button
            className="primary-button full-width"
            onClick={() => {
              if (!name.trim()) setName("Learner");
              setSettingsOpen(false);
              setToast("Your preferences are saved");
            }}
          >
            All set
          </button>
        </Modal>
      )}
      {helpOpen && (
        <Modal title="Meet your study space" onClose={() => setHelpOpen(false)}>
          <p className="modal-description">
            Ingenium makes a little room for your curiosity.
          </p>
          <div className="help-item">
            <MessageCircle size={21} />
            <div>
              <h3>Start with a question</h3>
              <p>
                Try one of the suggestions, or type your own. Enter sends; Shift
                + Enter adds a new line.
              </p>
            </div>
          </div>
          <div className="help-item">
            <Bookmark size={21} />
            <div>
              <h3>Keep what clicks</h3>
              <p>
                Bookmark explanations and upload text or Markdown notes to your
                library. Search conversations with Ctrl / ⌘ + K.
              </p>
            </div>
          </div>
          <div className="help-item">
            <Timer size={21} />
            <div>
              <h3>Find your focus</h3>
              <p>
                Start a 25-minute session and take your study goals one small
                step at a time.
              </p>
            </div>
          </div>
          <div className="privacy-note">
            <Sparkles size={20} />
            <p>
              This is an interface preview with built-in sample responses. Live
              AI chat requires a backend integration. Your data is stored only
              in this browser.
            </p>
          </div>
          <button
            className="primary-button full-width"
            onClick={() => setHelpOpen(false)}
          >
            Let’s get curious
          </button>
        </Modal>
      )}
    </div>
  );
}

export default App;
