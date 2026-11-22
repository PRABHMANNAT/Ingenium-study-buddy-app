import { expect, test } from "@playwright/test";

test("chat, bookmarks, history search, and refresh persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "What will you learn today?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeDisabled();
  await page.screenshot({ path: ".artifacts/desktop.png", fullPage: true });
  await page
    .getByRole("button", { name: /Break down a tricky concept/ })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Message Ingenium" }),
  ).toHaveValue("Explain photosynthesis in simple terms.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByRole("heading", {
      name: "A leaf is a tiny solar-powered kitchen.",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save response", exact: true })
    .click();
  await page.getByRole("button", { name: /My library/ }).click();
  await expect(page.locator(".saved-list article")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: /My library/ }).click();
  await expect(page.locator(".saved-list article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Open conversation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A leaf is a tiny solar-powered kitchen.",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Search conversations", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search your chats" })
    .fill("no-such-conversation");
  await expect(page.getByText("No conversations found.")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search your chats" })
    .fill("Explain photosynthesis in simple terms.");
  await expect(page.locator(".history-row")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("attached notes stay in the library and produce honest local excerpts", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({
    name: "biology.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(
      "Cells are the basic unit of life.\nMitochondria release usable energy.\nDNA carries genetic information.",
    ),
  });
  await expect(page.locator(".attachment-chip")).toContainText("biology.md");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByRole("heading", { name: "Let’s work through biology.md" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "This preview extracts text from your file; it does not generate an AI summary.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: /My library/ }).click();
  await expect(page.locator(".library-note")).toContainText(
    "Cells are the basic unit of life.",
  );
  await page.reload();
  await page.getByRole("button", { name: /My library/ }).click();
  await expect(page.getByRole("heading", { name: "biology.md" })).toBeVisible();
  await page.getByRole("button", { name: "Study these notes" }).click();
  await expect(page.locator(".attachment-chip")).toContainText("biology.md");
  await page.getByRole("button", { name: "Remove attachment" }).click();
  await expect(page.locator(".attachment-chip")).toHaveCount(0);
});

test("focus timer, editable tasks, and settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Focus space", exact: true }).click();
  await expect(page.locator(".timer-ring > span")).toHaveText("25:00");
  await page.getByRole("button", { name: "Start focusing" }).click();
  await expect(page.locator(".timer-ring > span")).not.toHaveText("25:00");
  await page.getByRole("button", { name: "Pause session" }).click();
  await page.getByRole("button", { name: "Reset focus timer" }).click();
  await expect(page.locator(".timer-ring > span")).toHaveText("25:00");
  await page
    .getByRole("textbox", { name: "New focus task" })
    .fill("Review chapter 4");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page.getByRole("checkbox", { name: "Review chapter 4" }).check();
  await expect(page.getByText("1 of 4 completed")).toBeVisible();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Prabhmannat");
  await page.getByRole("combobox").selectOption("Concise");
  await page.getByRole("button", { name: "All set" }).click();
  await page.reload();
  await expect(page.locator(".profile-name strong")).toHaveText("Prabhmannat");
  await page.getByRole("button", { name: /Keep it concise/ }).click();
  await expect(
    page.getByRole("button", { name: "Concise", exact: true }),
  ).toBeVisible();
});

test("mobile navigation, dialog dismissal, collapse and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "What will you learn today?" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".artifacts/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Focus space", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "One thing at a time." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "About this workspace" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("button", { name: "New conversation", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Message Ingenium" }),
  ).toBeVisible();
});
