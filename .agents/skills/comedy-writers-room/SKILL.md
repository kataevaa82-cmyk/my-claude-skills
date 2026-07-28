---
name: comedy-writers-room
description: Use when helping write stand-up comedy, jokes, or humorous material about any topic
---

# Comedy Writers Room

Write jokes using subagents as a simulated audience. One agent finds unexpected angles, one writes, four agents react as different personas, then iterate based on their feedback. The writer works in a fixed house style (лютый разъеб, от первого лица, без пощады). **На любом этапе главный критерий — смешность.** Если жёсткий/стильный вариант проигрывает по смешности менее стильному — выбирается более смешной.

## Process

### Step 0: Dispatch Разгонятор for raw angles

Read `razgonyator-prompt.md` and dispatch it first.
- Replace `[TOPIC]` with the user's topic
- Leave `[JOKES]` empty on the first pass (no material exists yet)

This produces a list of first-person angles/premises on the topic - not jokes,
just raw material to seed the writer with directions beyond the obvious.

### Step 1: Dispatch the writer

Read `writer-prompt.md` and use that template to dispatch a subagent.
- Replace `[TOPIC]` with the user's topic
- Include the angles from Разгонятор as extra inspiration alongside the topic
- For first draft, omit the revision section
- Do not add extra style instructions of your own - the house style lives
  inside `writer-prompt.md` and must be passed through unmodified

### Step 2: Dispatch all 4 audience members in series

Read each audience template and dispatch them one at a time:
1. `audience-enthusiast-prompt.md`
2. `audience-skeptic-prompt.md`
3. `audience-overthinker-prompt.md`
4. `audience-bratan-prompt.md`

Replace `[JOKES]` with the jokes from the writer.

### Step 3: Synthesize feedback

Read what each persona said. What landed? What fell flat? What confused people?

Collect the skeptic's КВН-флаги as a separate list, but weigh them against
actual laughs: a line that's stylistically off but genuinely killed with the
audience beats a stylistically pure line that landed flat. When in doubt,
пойди на смешное — style is a means, not the goal.

### Step 3.5: Re-dispatch Разгонятор if material feels stale

If the synthesized feedback suggests the jokes are hacky/derivative (especially
from the skeptic), dispatch `razgonyator-prompt.md` again with the current
`[JOKES]` filled in, so it generates angles that avoid what's already been tried.

### Step 4: Dispatch writer again with feedback

Use `writer-prompt.md` again, this time:
- Include the revision section
- Replace `[FEEDBACK]` with the synthesized audience reactions,
  КВН-флаги listed first
- Include any new angles from a re-dispatched Разгонятор

### Step 5: Repeat steps 2-4 until the jokes land

Run the number of passes the user requests. If no count is requested, run at
least two revision passes. A pass is complete only after the writer receives
specific line-level feedback and rewrites the material; merely dispatching a
persona does not count as a pass.

After every draft, perform a punch-density audit before asking the audience:

- Mark every sentence that contains an actual laugh mechanism: reversal,
  misdirection, act-out, escalation, analogy, callback, rule of three, or a
  sharply specific reveal.
- Treat attitude, insults, plot, vivid description, and profanity without a
  mechanism as setup, not as jokes.
- Verify that the draft preserves the user's facts. Comic escalation may invent
  imagined consequences, but must not rewrite the triggering events.
- Reject a draft if any paragraph has no marked laugh or if more than two setup
  sentences occur consecutively.
- Do not let a recurring metaphor substitute for jokes. Each return to the
  premise must introduce a new comic turn, not merely rename the next plot beat.

Stop only when the requested passes are complete and the final draft passes the
punch-density audit. Zero КВН-флаги is not enough.

### Step 6: Present final material to user

Include a brief summary of how it evolved - what got cut, what emerged from iteration, which angles came from Разгонятор, and which КВН-флаги were fixed.

## Critical Rules

- **Always use Task tool** - Never shell out to `claude` CLI
- **Dispatch audience in series** - One at a time, so each reaction is visible
- **Include feedback in revisions** - The writer needs to know what to fix
- **Funniest wins, always** - At every decision point (writing, revising, choosing between drafts), the funniest option wins over the stylistically purest, edgiest, or safest one
- **Count rewrites, not agents** - Never describe audience dispatches or raw-angle generation as completed orchestration passes
- **No prose disguised as comedy** - A coherent story, an angry voice, or an extended metaphor is not a joke unless individual lines contain laugh mechanisms
