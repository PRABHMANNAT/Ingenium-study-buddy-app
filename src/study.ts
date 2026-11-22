export type ReplyStyle = "Guided" | "Concise" | "Detailed";
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  saved?: boolean;
  attachmentName?: string;
};
export type Chat = {
  id: string;
  title: string;
  date: string;
  messages: Message[];
};
export type Note = { id: string; name: string; content: string; date: string };
export const uid = () => crypto.randomUUID();

export function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(fallback)) {
      if (!Array.isArray(parsed)) return fallback;
      const record = (item: unknown): item is Record<string, unknown> =>
        !!item && typeof item === "object";
      if (
        key.includes("chats") &&
        !parsed.every(
          (c) =>
            record(c) &&
            typeof c.id === "string" &&
            typeof c.title === "string" &&
            typeof c.date === "string" &&
            Array.isArray(c.messages) &&
            c.messages.every(
              (m: unknown) =>
                record(m) &&
                typeof m.id === "string" &&
                typeof m.content === "string" &&
                ["user", "assistant"].includes(String(m.role)),
            ),
        )
      )
        return fallback;
      if (
        key.includes("notes") &&
        !parsed.every(
          (n) =>
            record(n) &&
            typeof n.id === "string" &&
            typeof n.name === "string" &&
            typeof n.content === "string",
        )
      )
        return fallback;
      if (
        key.includes("tasks") &&
        !parsed.every(
          (t) =>
            record(t) &&
            typeof t.id === "string" &&
            typeof t.text === "string" &&
            typeof t.done === "boolean",
        )
      )
        return fallback;
      return parsed as T;
    }
    if (typeof parsed !== typeof fallback) return fallback;
    if (
      key.includes("style") &&
      !["Guided", "Concise", "Detailed"].includes(String(parsed))
    )
      return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export const initialChats: Chat[] = [
  {
    id: "welcome-biology",
    title: "Making sense of photosynthesis",
    date: "2026-11-22",
    messages: [
      {
        id: "bio-q",
        role: "user",
        content: "Can you explain photosynthesis simply?",
      },
      {
        id: "bio-a",
        role: "assistant",
        content:
          "## Think of a leaf as a tiny solar-powered kitchen.\nPlants use sunlight to turn water and carbon dioxide into glucose, a sugar they use for energy and growth. Oxygen is released along the way.\n\nSunlight + water + carbon dioxide → glucose + oxygen\n\nA quick check: what provides the energy for this process?\n\nThis is a built-in sample explanation.",
      },
    ],
  },
  {
    id: "welcome-plan",
    title: "My weekly study game plan",
    date: "2026-11-21",
    messages: [
      {
        id: "plan-q",
        role: "user",
        content: "Help me organize a week of studying.",
      },
      {
        id: "plan-a",
        role: "assistant",
        content:
          "## Small steps, steady progress.\nDay 1 · Map your topics and pick the three that feel hardest.\nDay 2–3 · Study one tricky topic at a time in 25-minute sessions.\nDay 4 · Recall what you learned without looking at your notes.\nDay 5 · Work through practice questions.\nDay 6 · Revisit the ideas you missed.\nDay 7 · Do a light review and take time to recharge.\n\nThis is a sample plan. Adjust it to your workload and schedule.",
      },
    ],
  },
  {
    id: "welcome-recall",
    title: "A better way to remember things",
    date: "2026-11-20",
    messages: [
      {
        id: "recall-q",
        role: "user",
        content: "How can I remember what I study?",
      },
      {
        id: "recall-a",
        role: "assistant",
        content:
          "## Give your memory a little workout.\n1. Read a short section, then close your notes.\n2. Explain the main idea out loud in your own words.\n3. Check what you missed and try again.\n4. Return to the topic tomorrow and again a few days later.\n\nTry it now: without looking back, what were the four steps?\n\nThis is a built-in sample response.",
      },
    ],
  },
];

export function createReply(
  text: string,
  style: ReplyStyle,
  note?: Note | null,
): string {
  const query = text.toLowerCase();
  let reply: string;
  if (note) {
    const lines = note.content
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const excerpt = lines
      .slice(0, style === "Concise" ? 3 : 6)
      .map((line) => `• ${line.slice(0, 280)}`)
      .join("\n");
    reply = `## Let’s work through ${note.name}\nHere are the opening points from your notes:\n\n${excerpt}\n\nTry explaining each point in your own words, then turn it into a question you can answer without looking.\n\nThis preview extracts text from your file; it does not generate an AI summary.`;
  } else if (/quiz answers|show.*answers/.test(query)) {
    reply =
      "## Let’s check your work\n1. Sunlight provides the energy.\n2. Water and carbon dioxide are the inputs.\n3. The plant produces glucose.\n4. Oxygen is released.\n\nIf you missed one, explain that part out loud once, then try again in a few minutes.";
  } else if (/quiz|test me|practice question/.test(query)) {
    reply =
      "## A quick curiosity check\nTry these photosynthesis practice questions without looking at your notes:\n\n1. What is the main source of energy for photosynthesis?\n2. Which two ingredients does a plant take in?\n3. What sugar does the plant make?\n4. Which gas is released?\n\nSend “show quiz answers” when you’re ready to check your work.";
  } else if (/photosynth|biology|chlorophyll/.test(query)) {
    reply =
      style === "Concise"
        ? "## Photosynthesis, in a nutshell\nPlants use sunlight to turn water and carbon dioxide into glucose, releasing oxygen. Chlorophyll absorbs the light energy.\n\nThink: a leaf is a tiny solar-powered kitchen."
        : "## A leaf is a tiny solar-powered kitchen.\nPlants make their own food through photosynthesis. Here’s the idea, one step at a time:\n\n1. Catch the light. Chlorophyll, the green pigment in leaves, absorbs sunlight.\n2. Gather the ingredients. Roots take in water; leaves take in carbon dioxide from the air.\n3. Make something useful. Light energy helps turn those ingredients into glucose. Oxygen is released along the way.\n\nThe big picture\n6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n\nGlucose stores chemical energy that the plant can use for growth and other processes.\n\nYour turn: if a plant had water and carbon dioxide but no light, which part of this process would be missing?";
  } else if (/plan|schedule|week|exam/.test(query)) {
    reply =
      "## A week of small wins\nHere’s a flexible starting point for your next seven days:\n\nDay 1 · List your topics. Mark the ones that need the most attention.\nDay 2 · Tackle your hardest topic in two 25-minute focus sessions.\nDay 3 · Recall yesterday’s ideas, then move to your next topic.\nDay 4 · Practice questions with your notes closed.\nDay 5 · Review your mistakes and explain the tricky parts out loud.\nDay 6 · Try a short practice test, then revisit any gaps.\nDay 7 · Do a gentle review and give yourself time to recharge.\n\nKeep the daily workload realistic. You can track your next steps in Focus space.";
  } else if (/summari|summary|notes/.test(query)) {
    reply =
      "## Let’s make room for the key ideas.\nAttach your study notes using the paperclip below. This preview accepts .txt and .md files up to 100 KB and can pull out their opening points.\n\nFor a useful summary, look for:\n1. The big idea in one sentence.\n2. Three to five important facts.\n3. A concrete example.\n4. One question you still have.\n\nYour notes stay in this browser.";
  } else if (/remember|memory|recall|revision/.test(query)) {
    reply =
      "## Make remembering an active habit.\nRead a short section, close your notes, and write down what you remember. Then check what you missed.\n\nReturn to the same topic tomorrow and a few days later. Each time, try recalling it before rereading.\n\nA small challenge: explain your topic to an imaginary friend in three sentences.";
  } else {
    reply = `## A good question is a great beginning.\nYou’re exploring: “${text.slice(0, 220)}”\n\nThis local interface preview has sample explanations for photosynthesis, study planning, and active recall. It isn’t connected to a live AI model yet.\n\nYou can try “Explain photosynthesis”, “Quiz me on photosynthesis”, or “Make a study plan”, or attach your own text notes to work through their key points.`;
  }
  if (style === "Detailed" && !note)
    reply +=
      "\n\nA little deeper\nTry making a one-page concept map. Connect each idea to an example, then add one question you could ask about each connection.";
  return reply;
}
