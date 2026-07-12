---
name: comedy-writers-room
description: Use when helping write stand-up comedy, jokes, or humorous material about any topic
---

# Comedy Writers Room

Write jokes using subagents as a simulated audience. One agent finds unexpected angles, one writes, four agents react as different personas, then iterate based on their feedback. The writer works in a fixed house style (тихий деадпан, от первого лица); style compliance is enforced by the skeptic's КВН-детектор.

## Process

### Step -1: Load used motifs

Check for `used-motifs.md` in this skill's directory. If it exists, read it -
it's a running log of premises/motifs already used in past material for this
topic. Pass its contents to Разгонятор (Step 0) and the writer (Step 1) as an
explicit avoid-list, the same way a caller would manually ban stale motifs.
If the file doesn't exist, skip this step - there's nothing to avoid yet.

### Step 0: Dispatch Разгонятор for raw angles

Read `razgonyator-prompt.md` and dispatch it first.
- Replace `[TOPIC]` with the user's topic
- Leave `[JOKES]` empty on the first pass (no material exists yet)
- Include the avoid-list from Step -1, if any, so it doesn't re-propose
  angles already mined in past material

This produces a list of first-person angles/premises on the topic - not jokes,
just raw material to seed the writer with directions beyond the obvious.

### Step 1: Dispatch the writer

Read `writer-prompt.md` and use that template to dispatch a subagent.
- Replace `[TOPIC]` with the user's topic
- Include the angles from Разгонятор as extra inspiration alongside the topic
- Include the avoid-list from Step -1, if any, as motifs/premises that are
  banned - the writer must not reuse them even if they'd fit the topic
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

Collect the skeptic's КВН-флаги as a separate list. Style violations are
fixed first in revision, even for lines other personas liked - смешное
вне стиля is someone else's material.

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

Stop when the personas are reacting well AND the skeptic raises zero КВН-флаги,
or after 3 rounds of feedback - whichever comes first. 3 rounds is a hard cap
to prevent an infinite loop when the skeptic keeps finding something; if you
hit it, present the best draft so far rather than looping forever.

### Step 6: Present final material to user

Include a brief summary of how it evolved - what got cut, what emerged from iteration, which angles came from Разгонятор, and which КВН-флаги were fixed.

### Step 7: Log used motifs

Append the core premises/motifs actually used in the final material to
`used-motifs.md` in this skill's directory (create it if missing), one line
per motif, e.g. "аренда зала и её пересчёт в шутки". This is what Step -1
reads on the next run, so future material stays fresh without the caller
having to manually list everything that's already been done.

## Critical Rules

- **Always use Task tool** - Never shell out to `claude` CLI
- **Dispatch subagents SYNCHRONOUSLY** - Every dispatch (Разгонятор, writer,
  audience) must run with `run_in_background: false` and you must have its
  result in hand before doing anything else. NEVER fire a subagent in the
  background and end your turn "waiting" for it - if you end your turn
  without the final material, the whole run is considered failed.
- **Never end your turn mid-process** - Your reply to the caller must contain
  the final material from Step 6, not a status update like "dispatching the
  writer" or "waiting for the draft".
- **Dispatch audience in series** - One at a time, so each reaction is visible
- **Include feedback in revisions** - The writer needs to know what to fix
- **Style over laughs** - A line that breaks the house style gets rewritten even if it tested well
