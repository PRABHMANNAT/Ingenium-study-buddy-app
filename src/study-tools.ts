import {
  AudioLines,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  Compass,
  FileCheck2,
  FileStack,
  Gamepad2,
  Layers3,
  Network,
  NotebookPen,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";

export const products = [
  {
    id: "pilot",
    name: "ExamPilot AI",
    description: "Universal AI exam companion",
    detail:
      "Build a preparation strategy for your exam and track coverage with a readiness estimate.",
    icon: Compass,
    color: "indigo",
    emoji: "🧭",
    prompt: "Enter your exam, date, and topics…",
  },
  {
    id: "cram",
    name: "Cramazon Prime",
    description: "Last-minute exam prep",
    detail:
      "Build an emergency revision schedule for 30 minutes, 3 hours, 24 hours, or 7 days.",
    icon: Zap,
    color: "amber",
    emoji: "⚡",
    prompt: "What exam are you cramming for?",
  },
  {
    id: "paper",
    name: "PaperDNA",
    description: "Previous-year paper intelligence",
    detail:
      "Compare recurring topics and question formats using excerpts from past papers.",
    icon: FileStack,
    color: "teal",
    emoji: "🧬",
    prompt: "Paste questions from your past papers…",
  },
  {
    id: "viva",
    name: "VivaVerse",
    description: "Oral exam simulator",
    detail:
      "Practice explaining a topic aloud or in writing with examiner-style questions.",
    icon: AudioLines,
    color: "pink",
    emoji: "🎙️",
    prompt: "What topic is your viva on?",
  },
  {
    id: "mark",
    name: "MarkMyPaper",
    description: "Answer and rubric review",
    detail:
      "Paste an answer and rubric to check which rubric terms are present.",
    icon: FileCheck2,
    color: "blue",
    emoji: "📝",
    prompt: "Paste your answer and rubric…",
  },
  {
    id: "arena",
    name: "RevisionArena quizd",
    description: "Group exam preparation",
    detail:
      "Build a timed practice drill from shared notes for your next group revision session.",
    icon: Swords,
    color: "violet",
    emoji: "🏆",
    prompt: "Paste notes for your group challenge…",
  },
] as const;

export const modes = [
  {
    id: "plan",
    name: "Study Plan",
    description: "Make a study schedule",
    icon: CalendarDays,
    color: "blue",
    emoji: "📅",
    prompt: "What are you preparing for?",
  },
  {
    id: "sparky",
    name: "Sparky",
    description: "Get unstuck with a quick hint",
    icon: Sparkles,
    color: "amber",
    emoji: "✨",
    prompt: "What are you stuck on?",
  },
  {
    id: "tutor",
    name: "Tutor Me",
    description: "Work through a concept step by step",
    icon: BookOpen,
    color: "indigo",
    emoji: "📖",
    prompt: "What would you like to learn?",
  },
  {
    id: "lecture",
    name: "Live Lecture",
    description: "Make an outline from a transcript",
    icon: AudioLines,
    color: "pink",
    emoji: "🎧",
    prompt: "Paste a lecture transcript or outline…",
  },
  {
    id: "notes",
    name: "Notes",
    description: "Organize your study material",
    icon: NotebookPen,
    color: "teal",
    emoji: "🗒️",
    prompt: "Paste your study notes…",
  },
  {
    id: "arcade",
    name: "Arcade",
    description: "Turn your notes into a timed drill",
    icon: Gamepad2,
    color: "violet",
    emoji: "🎮",
    prompt: "Paste notes for a quick round…",
  },
] as const;

export const shortcuts = [
  {
    id: "visualize",
    name: "Generate visualization",
    description: "Map out a concept",
    icon: Network,
    color: "indigo",
    emoji: "🪄",
    prompt: "Enter a topic, then related ideas on separate lines…",
  },
  {
    id: "quiz",
    name: "Generate quizzes",
    description: "Practice what you know",
    icon: CircleHelp,
    color: "pink",
    emoji: "❓",
    prompt: "Paste facts to turn into recall questions…",
  },
  {
    id: "flash",
    name: "Flashcards",
    description: "Build a recall deck",
    icon: Layers3,
    color: "teal",
    emoji: "🗂️",
    prompt: "Add notes or enter one term: definition per line…",
  },
  {
    id: "readiness",
    name: "Exam readiness",
    description: "Check where you stand",
    icon: ChartNoAxesCombined,
    color: "amber",
    emoji: "📊",
    prompt: "Enter your exam name…",
  },
] as const;

export type Product = (typeof products)[number];
export type Tool = (typeof modes)[number] | (typeof shortcuts)[number];
export type Result = {
  kind: "map" | "quiz" | "flash" | "list";
  title: string;
  items: string[];
  duration?: number;
};
export const windows = ["30 minutes", "3 hours", "24 hours", "7 days"] as const;
export type TimeWindow = (typeof windows)[number];

export function splitNotes(input: string) {
  return input
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function makeResult(
  input: string,
  product: Product,
  tool: Tool | null,
  time: TimeWindow,
): Result {
  const items = splitNotes(input);
  const topic = items[0];
  const mode = tool?.id ?? product.id;
  switch (mode) {
    case "visualize":
      return {
        kind: "map",
        title: topic,
        items:
          items.length > 1
            ? items.slice(1, 7)
            : ["Key definitions", "How it works", "Example", "Common mistakes"],
      };
    case "flash":
      return { kind: "flash", title: "Your flashcard deck", items };
    case "arena":
    case "arcade":
    case "quiz":
      return {
        kind: "quiz",
        title: mode === "quiz" ? "Your recall quiz" : "Timed practice drill",
        items,
        duration: mode === "quiz" ? undefined : 60,
      };
    case "notes":
    case "lecture":
      return {
        kind: "list",
        title: mode === "lecture" ? "Lecture outline" : "Study notes",
        items,
      };
    case "paper": {
      const words = input.toLowerCase().match(/[\p{L}]{4,}/gu) ?? [];
      const ignored = new Set([
        "what",
        "which",
        "with",
        "from",
        "this",
        "that",
        "about",
        "your",
        "explain",
        "describe",
        "using",
        "following",
      ]);
      const counts = new Map<string, number>();
      for (const word of words) {
        if (!ignored.has(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
      }
      const repeats = [...counts]
        .filter(([, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
      return {
        kind: "list",
        title: "Keyword frequency in your excerpts",
        items: repeats.length
          ? repeats.map(([word, count]) => `${word} · ${count} mentions`)
          : [
              "No repeated keywords found. Paste excerpts from more papers to compare frequency.",
            ],
      };
    }
    case "mark": {
      const [answer, rubric] = input.split(/\brubric\s*:/i, 2);
      if (!rubric?.trim())
        return {
          kind: "list",
          title: "Add your marking criteria",
          items: [
            "Paste your answer, then add “Rubric:” on a new line with one criterion per line.",
          ],
        };
      const answerTerms = new Set(answer.toLowerCase().match(/[\p{L}]+/gu));
      return {
        kind: "list",
        title: "Rubric keyword check",
        items: splitNotes(rubric).map((criterion) => {
          const terms = criterion.toLowerCase().match(/[\p{L}]{4,}/gu) ?? [];
          const missing = terms.filter((term) => !answerTerms.has(term));
          return missing.length
            ? `${criterion} · Review whether you covered: ${[...new Set(missing)].join(", ")}`
            : `${criterion} · Key terms found`;
        }),
      };
    }
    case "viva":
      return {
        kind: "list",
        title: "Viva practice",
        items: [
          `Explain “${topic}” in your own words in under one minute.`,
          "What makes it important? Give a concrete example.",
          "What would change if one of your assumptions were false?",
          "Check your explanation for accuracy, clarity, and completeness.",
        ],
      };
    case "cram": {
      const schedule = {
        "30 minutes": [
          "5 min · Pick your top two topics",
          "15 min · Recall key ideas and work an example",
          "10 min · Test yourself and review errors",
        ],
        "3 hours": [
          "30 min · Rank topics and gather resources",
          "90 min · Work through the highest-priority topics",
          "60 min · Do timed practice and review mistakes",
        ],
        "24 hours": [
          "First block · Review priority concepts",
          "Second block · Complete a timed set",
          "Final block · Review errors, rest, and do a light recall session",
        ],
        "7 days": [
          "Days 1–2 · Map and review priority topics",
          "Days 3–5 · Alternate topic practice and recall",
          "Days 6–7 · Sit a mock exam and target weak spots",
        ],
      };
      return {
        kind: "list",
        title: `${time} until ${topic}`,
        items: [
          ...schedule[time],
          ...items.slice(1).map((item) => `Topic to prioritize: ${item}`),
        ],
      };
    }
    case "sparky":
    case "tutor":
      return {
        kind: "list",
        title:
          mode === "tutor" ? "Work through it step by step" : "A starting hint",
        items: [
          `Which part of “${topic}” feels hardest? Write the exact step where you got stuck.`,
          "Try a simpler example and explain each step aloud.",
          ...items.slice(1),
          "Compare with your notes and identify one thing to practice next.",
        ],
      };
    default:
      return {
        kind: "list",
        title: `Study plan for ${topic}`,
        items: [
          "List the topics you need to cover and put unfamiliar ones first.",
          ...items
            .slice(1)
            .map((item) => `Schedule a practice block for ${item}`),
          "Alternate focused review with closed-book recall.",
          "Complete a timed practice set and use the results to update your next session.",
        ],
      };
  }
}
