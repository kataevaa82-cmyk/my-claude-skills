---
name: comedy-writers-room
description: Use when helping write stand-up comedy, jokes, or humorous material about any topic
---

# Comedy Writers Room

Write jokes using real Codex subagent delegation as a simulated writers room. One subagent finds unexpected angles, one writer subagent drafts, four audience subagents react, then a separate writer subagent revises based on their feedback.

## Process

### Step 0: Delegate to Разгонятор for raw angles

Read `razgonyator-prompt.md` and spawn a real Codex subagent with that prompt.
- Replace `[TOPIC]` with the user's topic.
- Leave `[JOKES]` empty on the first pass because no material exists yet.

This produces a list of unexpected angles/premises on the topic - not jokes, just raw material to seed the writer with directions beyond the obvious.

### Step 1: Delegate to a writer subagent for the first draft

Read `writer-prompt.md` and spawn a separate real Codex writer subagent with that prompt.
- Replace `[TOPIC]` with the user's topic.
- Include the angles from Разгонятор as extra inspiration alongside the topic.
- For the first draft, omit the revision section.

### Step 2: Delegate to all 4 audience subagents

Read each audience template and spawn separate real Codex subagents for each persona:
1. `audience-enthusiast-prompt.md`
2. `audience-skeptic-prompt.md`
3. `audience-overthinker-prompt.md`
4. `audience-bratan-prompt.md`

Replace `[JOKES]` with the jokes from the writer. The audience subagents may work in parallel.

### Step 3: Synthesize feedback

The main agent collects what each persona said. Identify what landed, what fell flat, what confused people, and what should be cut or strengthened.

### Step 3.5: Optionally re-delegate to Разгонятор if material feels stale

If the synthesized feedback suggests the jokes are hacky/derivative, especially from the skeptic, spawn a new real Codex subagent with `razgonyator-prompt.md` and the current `[JOKES]` filled in, so it generates angles that avoid what's already been tried.

### Step 4: Delegate to a separate writer subagent for the rewrite

Use `writer-prompt.md` again with a separate real Codex writer subagent, this time:
- Include the revision section.
- Replace `[FEEDBACK]` with the synthesized audience reactions.
- Include any new angles from a re-dispatched Разгонятор.

### Step 5: Default iteration limit

By default, run exactly one editing cycle: first draft, audience feedback, one rewrite. Only run additional cycles if the user explicitly asks for more iteration.

### Step 6: Present final material to user

Show the user only the finished stand-up material. Do not show the angle list, audience feedback, synthesis, process notes, or subagent transcripts unless the user explicitly asks for them.

## Critical Rules

- Use real Codex delegation for every role. Do not imitate multiple subagents inside one message.
- Do not use Claude Task tool.
- Do not use Claude CLI.
- Audience subagents may run in parallel.
- The main agent synthesizes feedback before requesting the rewrite.
- Include feedback in revisions so the writer knows what to fix.
- By default, perform one editing cycle.
- The user sees only the finished stand-up.
