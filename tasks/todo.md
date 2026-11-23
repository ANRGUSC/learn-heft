# learn-heft — plan

Goal: a Vercel app at learn-heft.vercel.app for learning and practising HEFT,
modeled on https://dijkstra-sim.vercel.app/ (style + interaction), reusing
https://heft-trainer.vercel.app/ (problems, DAG/Gantt, practice format), and
faithful to Lecture 21 slides 16-22 (plus slide 23's comm = 2 variant).

## Deliverables (mapped to the request)

- [ ] "a vercel app called learn-heft.vercel.app" — single `index.html`, deployed to production
- [ ] "modeled after ... dijkstra-sim" / "stylistically close to the dijkstra one" — same palette, fonts,
      header badge, controls row, Demo/Practice toggle, Prev/Next/Reset, cards, kbd shortcuts, dark mode
- [ ] "reuse a lot of what has been built on heft-trainer" — problem set, DAG view, Gantt chart,
      fill-in practice (ranks, priority order, EFT per processor, assignment, makespan)
- [ ] "look at slides 16-22 ... stay close to that in terms of the examples" — two phases, upward-rank
      formula, c-bar over inter-processor costs only, insertion-based EST, lecture example with exact
      numbers (ranks 9.5 / 6.0 / 5.5 / 2.0, makespan 7), example 2 (comm = 2, tie -> lower processor ID)

## Steps

- [ ] Tests first: `tests/heft.test.mjs` against the slide numbers + property tests on random problems
- [ ] HEFT engine (pure functions inside `index.html`, between ENGINE markers)
- [ ] UI: graph, state table, Gantt, explanation (Demo), quizzes (Practice)
- [ ] Verify in a browser (light/dark, demo + practice, presets + random)
- [ ] `.vercelignore` whitelist so the lecture PDF is never uploaded
- [ ] Deploy to production, confirm learn-heft.vercel.app serves the app and the PDF is not reachable

## Review

(filled in at the end)
