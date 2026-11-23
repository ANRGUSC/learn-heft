# learn-heft — plan

Goal: a Vercel app at learn-heft.vercel.app for learning and practising HEFT,
modeled on https://dijkstra-sim.vercel.app/ (style + interaction), reusing
https://heft-trainer.vercel.app/ (problems, DAG/Gantt, practice format), and
faithful to Lecture 21 slides 16-22 (plus slide 23's comm = 2 variant).

## Deliverables (mapped to the request)

- [x] "a vercel app called learn-heft.vercel.app" — single `index.html`, deployed to production
- [x] "modeled after ... dijkstra-sim" / "stylistically close to the dijkstra one" — same palette, fonts,
      header badge, controls row, Demo/Practice toggle, Prev/Next/Reset, cards, kbd shortcuts, dark mode
- [x] "reuse a lot of what has been built on heft-trainer" — problem set, DAG view, Gantt chart,
      fill-in practice (ranks, priority order, EFT per processor, assignment, makespan)
- [x] "look at slides 16-22 ... stay close to that in terms of the examples" — two phases, upward-rank
      formula, c-bar over inter-processor costs only, insertion-based EST, lecture example with exact
      numbers (ranks 9.5 / 6.0 / 5.5 / 2.0, makespan 7), example 2 (comm = 2, tie -> lower processor ID)

## Steps

- [x] Tests first: `tests/heft.test.mjs` against the slide numbers + property tests on random problems
- [x] HEFT engine (pure functions inside `index.html`, between ENGINE markers)
- [x] UI: graph, state table, Gantt, explanation (Demo), quizzes (Practice)
- [x] Verify in a browser (light/dark, demo + practice, presets + random)
- [x] `.vercelignore` whitelist so the lecture PDF is never uploaded
- [x] Deploy to production, confirm learn-heft.vercel.app serves the app and the PDF is not reachable

## Review

Shipped 2026-11-22.

- Live at https://learn-heft.vercel.app (public, no login); source at https://github.com/ANRGUSC/learn-heft
- Engine tests: 7 passing (`node --test tests/heft.test.mjs`). They reproduce the lecture numbers
  (ranks 9.5 / 6.0 / 5.5 / 2.0 and makespan 7 for example 1; makespan 9 with the P1 tie-break for
  example 2) and replay 1,500 random problems against a brute-force earliest-slot search.
- Browser check (headless Chromium, local and production): every preset and 48 random problems
  stepped end to end, practice mode scored 32/32 with correct answers, no console errors.
- Only `index.html` is uploaded to Vercel (`.vercelignore` whitelist); the lecture PDF is in
  neither the deployment nor the repo.

Differences from the HEFT Algorithm Trainer, on purpose:

- Processor selection is insertion-based (idle gaps are searched), as taught on slide 18. The
  trainer only appends after a processor's last task.
- Its "Fall 2025 Exam (Actual)" problem is kept as "3-Task Fork II" without the exam label or the
  hint, because the hint's ranks (4 and 4.5) do not match the problem's own numbers (3.5 and 3.0).

Follow-ups:

- The Vercel project is not connected to the GitHub repo, so pushes do not auto-deploy; redeploy
  with `npx vercel --prod`.
- The installed Vercel CLI is old (54.18.0; latest is 66.x).
