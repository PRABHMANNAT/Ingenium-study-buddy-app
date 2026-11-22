import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Check,
  Compass,
  Files,
  Gauge,
  Layers3,
  Library,
  Network,
  Plus,
} from "lucide-react";
import type { Result } from "./study-tools";

export type StudyEntry = { prompt: string; label: string; result: Result };
export type LibraryItem = { id: string; entry: StudyEntry };

const biology: LibraryItem = {
  id: "example-photosynthesis",
  entry: {
    label: "Flashcards",
    prompt: "Help me review the essentials of photosynthesis.",
    result: {
      kind: "flash",
      title: "Photosynthesis essentials",
      items: [
        "Which pigment captures light energy in a chloroplast?: Chlorophyll absorbs light energy for photosynthesis.",
        "Inputs: Light energy, carbon dioxide and water.",
        "Outputs: Sugars store chemical energy. Oxygen is released.",
        "Chloroplast: The organelle where photosynthesis takes place.",
      ],
    },
  },
};
const physics: LibraryItem = {
  id: "example-motion",
  entry: {
    label: "Generate visualization",
    prompt: "Map out Newton’s laws of motion.",
    result: {
      kind: "map",
      title: "Newton’s laws of motion",
      items: [
        "Inertia · Constant velocity unless a net force acts",
        "Acceleration · Net force equals mass × acceleration",
        "Action and reaction · Forces come in equal, opposite pairs on different objects",
      ],
    },
  },
};

type LibraryProps = {
  recent: LibraryItem[];
  saved: LibraryItem[];
  savedOnly: boolean;
  onFilter: (savedOnly: boolean) => void;
  onOpen: (item: LibraryItem) => void;
  onSave: (item: LibraryItem) => void;
  onNew: () => void;
  onReadiness: () => void;
};

export function DesktopLibrary({
  recent,
  saved,
  savedOnly,
  onFilter,
  onOpen,
  onSave,
  onNew,
  onReadiness,
}: LibraryProps) {
  const groups = savedOnly
    ? [{ title: "Bookmarked", items: saved }]
    : [
        { title: "Practice sets", items: [biology, physics] },
        { title: "This session", items: recent },
      ];

  return (
    <>
      <nav className="desktop-rail" aria-label="Workspace navigation">
        <span className="rail-brand" title="Ingenium">
          <Compass size={24} />
        </span>
        <div className="rail-controls">
          <button
            title="New study chat"
            aria-label="New study chat"
            onClick={onNew}
          >
            <Plus />
          </button>
          <button
            title="Study library"
            aria-label="Show study library"
            aria-pressed={!savedOnly}
            onClick={() => onFilter(false)}
          >
            <Library />
          </button>
          <button
            title="Bookmarks"
            aria-label="Show bookmarks"
            aria-pressed={savedOnly}
            onClick={() => onFilter(true)}
          >
            <Bookmark />
          </button>
          <button
            title="Check readiness"
            aria-label="Check readiness"
            onClick={onReadiness}
          >
            <Gauge />
          </button>
        </div>
        <img src="/aafreen-studypilot.webp" alt="" className="rail-avatar" />
      </nav>
      <aside className="desktop-library" aria-label="Study library">
        <header>
          <span className="library-brand">
            Ingenium <i />
          </span>
          <h2>{savedOnly ? "Bookmarks" : "Study library"}</h2>
        </header>
        {groups.map((group) => (
          <section key={group.title}>
            <h3>{group.title}</h3>
            {group.items.length === 0 && (
              <p className="library-empty">
                {savedOnly
                  ? "Bookmark a study set to find it here."
                  : "Your study results appear here as you practice."}
              </p>
            )}
            {group.items.map((item) => {
              const featured = item.id === biology.id;
              const pinned = saved.some((bookmark) => bookmark.id === item.id);
              const Icon =
                item.entry.result.kind === "map"
                  ? Network
                  : item.entry.result.kind === "flash"
                    ? Layers3
                    : BookOpen;
              return (
                <article
                  className={`library-item ${featured ? "featured-set" : ""}`}
                  key={item.id}
                >
                  <button
                    className="library-open"
                    onClick={() => onOpen(item)}
                    aria-label={`Open ${item.entry.result.title}`}
                  >
                    {featured ? (
                      <img
                        className="study-cover"
                        src="/photosynthesis.webp"
                        alt=""
                      />
                    ) : (
                      <span className="library-symbol">
                        <Icon size={20} />
                      </span>
                    )}
                    <span className="library-info">
                      <small>
                        {featured
                          ? "Biology · 4 flashcards"
                          : item.id === physics.id
                            ? "Physics · Concept map"
                            : item.entry.label}
                      </small>
                      <strong>{item.entry.result.title}</strong>
                    </span>
                  </button>
                  <button
                    className="bookmark-set"
                    onClick={() => onSave(item)}
                    title={pinned ? "Remove bookmark" : "Bookmark set"}
                    aria-label={`Bookmark ${item.entry.result.title}`}
                    aria-pressed={pinned}
                  >
                    <Bookmark
                      size={15}
                      fill={pinned ? "currentColor" : "none"}
                    />
                  </button>
                </article>
              );
            })}
          </section>
        ))}
      </aside>
    </>
  );
}

export function DesktopExample({ onStart }: { onStart: (item: LibraryItem) => void }) {
  return (
    <section className="desktop-example" aria-label="Example study session">
      <div className="example-brief">
        <div>
          <span className="example-caption">
            <BookOpen size={15} /> Biology practice set
          </span>
          <h2>
            Review photosynthesis
            <br />
            with flashcards.
          </h2>
          <button type="button" onClick={() => onStart(biology)}>
            Start practice <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="paper-preview" aria-hidden="true">
          <div className="paper-back">
            <Files size={19} />
            <span>Study notes</span>
            <i />
            <i />
          </div>
          <div className="paper-front">
            <Layers3 size={18} />
            <span>Recall deck</span>
            <small>Photosynthesis</small>
            <b>4 cards</b>
          </div>
        </div>
      </div>
      <div className="example-prompt">
        <span className="example-check">
          <Check size={16} />
        </span>
        <div>
          <small>Practice question</small>
          <p>Which pigment captures light energy in a chloroplast?</p>
        </div>
        <button
          aria-label="Practice the photosynthesis question"
          title="Start practice"
          onClick={() => onStart(biology)}
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
