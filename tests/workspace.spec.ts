import { expect, test } from "@playwright/test";

test("the mobile home keeps its layout and separates products from study modes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "How can I help you?" }),
  ).toBeVisible();
  await expect(page.getByText("Hi, Aafreen!")).toBeVisible();
  const avatar = page.getByAltText("AI avatar of Aafreen");
  await expect(avatar).toBeVisible();
  await expect
    .poll(() =>
      avatar.evaluate((img) => (img as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(
    page.getByRole("region", { name: "Quick study tools" }).getByRole("button"),
  ).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  const trigger = page.getByRole("button", { name: "Open study tools" });
  await trigger.click();
  const menu = page.getByRole("region", { name: "Study tools" });
  await expect(menu.getByRole("button", { name: "Study modes" })).toBeVisible();
  await expect(
    menu.getByRole("button", { name: "Exam companions" }),
  ).toBeVisible();
  await expect(
    menu.getByRole("button", {
      name: /^(Study Plan|Sparky|Tutor Me|Live Lecture|Notes|Arcade)\b/,
    }),
  ).toHaveCount(6);
  await menu.getByRole("button", { name: "Exam companions" }).click();
  await expect(
    menu.getByRole("button", {
      name: /^(ExamPilot AI|Cramazon Prime|PaperDNA|VivaVerse|MarkMyPaper|RevisionArena quizd)\b/,
    }),
  ).toHaveCount(6);
  await menu.getByRole("button", { name: "Study modes" }).click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole("button", { name: /^Tutor Me/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Ask me anything" }),
  ).toHaveAttribute("placeholder", "What would you like to learn?");
  await expect(page.locator(".mode-chip")).toContainText("Tutor Me");
});

test("flashcards reveal answers and readiness reports uncertainty", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Flashcards", exact: true }).click();
  await page
    .getByRole("textbox")
    .fill("Osmosis: Movement of water across a membrane");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByRole("heading", { name: "Your flashcard deck" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await expect(page.locator(".practice-card")).toContainText(
    "Movement of water across a membrane",
  );
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await page
    .getByRole("button", { name: "Exam readiness", exact: true })
    .click();
  await page.getByLabel("Topics covered", { exact: true }).fill("6");
  await page.getByLabel("Total topics").fill("10");
  await page.getByLabel("Correct answers").fill("7");
  await page.getByLabel("Practice questions").fill("10");
  await page.getByRole("button", { name: "Calculate readiness" }).click();
  await expect(page.getByRole("status")).toContainText("65%");
  await expect(page.getByRole("status")).toContainText("Practice-based range");
  await page.getByRole("button", { name: "Close readiness" }).click();
  await expect(
    page.getByRole("button", { name: /Exam readiness/ }),
  ).toContainText("65% estimate");
});
