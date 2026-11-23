# learn-heft

An interactive tool to learn and practice the HEFT (Heterogeneous Earliest Finish Time)
task-scheduling algorithm, built for EE 250 at USC.

Live: https://learn-heft.vercel.app

- **Demo mode** steps through the algorithm: average computation costs, upward ranks,
  priority order, then insertion-based processor selection, with a Gantt chart of the schedule.
- **Practice mode** asks for each of those values in turn and scores the answers.
- Problems: the two lecture examples (communication cost 1 and 2), a set of small fork, chain,
  diamond and merge graphs, an idle-gap insertion example, and randomly generated problems
  (3-7 tasks, 2-3 processors).

Conventions follow the lecture: the average communication cost of an edge uses inter-processor
costs only, a task may be inserted into any idle gap long enough to run it after its inputs
arrive, and equal-EFT ties go to the lower processor ID.

## Develop

The app is a single static file, `index.html`, with no build step.

```bash
# Preview locally at http://localhost:5173
python -m http.server 5173

# Run the scheduling-engine tests (Node 20+)
node --test tests/heft.test.mjs

# Deploy to production
npx vercel --prod
```

The tests extract the engine (the block between `ENGINE-START` and `ENGINE-END` in `index.html`)
and check it against the worked lecture examples and against randomly generated problems.

## Credits

Bhaskar Krishnamachari. Modeled on the EE 250 Dijkstra tool (https://dijkstra-sim.vercel.app/);
problem set and practice format adapted from the HEFT Algorithm Trainer by Abir Bhatt
(https://heft-trainer.vercel.app/).

HEFT: H. Topcuoglu, S. Hariri, and Min-You Wu, "Performance-effective and low-complexity task
scheduling for heterogeneous computing," IEEE Transactions on Parallel and Distributed Systems,
vol. 13, no. 3, pp. 260-274, 2002. https://doi.org/10.1109/71.993206
