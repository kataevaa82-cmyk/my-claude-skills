---
name: comedy-writers-room
description: Use when helping write stand-up comedy, jokes, or humorous material about any topic
---

# Comedy Writers Room

Write jokes using subagents as a simulated audience. One agent finds unexpected angles, one writes, four agents react as different personas, then iterate based on their feedback.

## Process

### Step 0: Dispatch Разгонятор for raw angles

Read `razgonyator-prompt.md` and dispatch it first.
- Replace `[TOPIC]` with the user's topic
- Leave `[JOKES]` empty on the first pass (no material exists yet)

This produces a list of unexpected angles/premises on the topic - not jokes,
just raw material to seed the writer with directions beyond the obvious.

### Step 1: Dispatch the writer

Read `writer-prompt.md` and use that template to dispatch a subagent.
- Replace `[TOPIC]` with the user's topic
- Include the angles from Разгонятор as extra inspiration alongside the topic
- For first draft, omit the revision section

### Step 2: Dispatch all 4 audience members in series

Read each audience template and dispatch them one at a time:
1. `audience-enthusiast-prompt.md`
2. `audience-skeptic-prompt.md`
3. `audience-overthinker-prompt.md`
4. `audience-bratan-prompt.md`

Replace `[JOKES]` with the jokes from the writer.

### Step 3: Synthesize feedback

Read what each persona said. What landed? What fell flat? What confused people?

### Step 3.5: Re-dispatch Разгонятор if material feels stale

If the synthesized feedback suggests the jokes are hacky/derivative (especially
from the skeptic), dispatch `razgonyator-prompt.md` again with the current
`[JOKES]` filled in, so it generates angles that avoid what's already been tried.

### Step 4: Dispatch writer again with feedback

Use `writer-prompt.md` again, this time:
- Include the revision section
- Replace `[FEEDBACK]` with the synthesized audience reactions
- Include any new angles from a re-dispatched Разгонятор

### Step 5: Repeat steps 2-4 until the jokes land

Stop when the personas are reacting well.

**TESTING: Limit to 1 round of feedback for now.**

### Step 6: Present final material to user

Include a brief summary of how it evolved - what got cut, what emerged from iteration, and which angles came from Разгонятор.

## Critical Rules

- **Always use Task tool** - Never shell out to `claude` CLI
- **Dispatch audience in series** - One at a time, so each reaction is visible
- **Include feedback in revisions** - The writer needs to know what to fix
