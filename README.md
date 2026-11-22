# Ingenium Study Buddy

Open the plus button to choose Study Plan, Tutor Me, or Notes, or attach study material. The Exam companions tab starts with ExamPilot AI, Cramazon Prime, and PaperDNA. Expand either list to access its three additional tools.

Run locally with `npm install` and `npm run dev`. Open http://localhost:5173.

The app runs local study exercises from text you enter or attach. It can build concept maps, recall questions, flashcards, time-boxed revision plans, and a readiness estimate with a practice-based range. Readiness uses self-reported topic coverage and practice results. Live AI tutoring, speech analysis, photo marking, and multiplayer sessions require connected services.

Run `npm run build` for a production build and `npm run test:e2e` for browser checks. Install Chromium for those checks with `npx playwright install chromium`.

## Deploy to Vercel

Import this GitHub repository into Vercel and select the repository root. The included configuration selects Vite, runs `npm run build`, and publishes `dist`. The current browser-based features work without environment variables.

The menu artwork uses [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) under the [MIT license](public/study-icons/Fluent-Emoji-LICENSE.txt).
