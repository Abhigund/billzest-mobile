## Audit/Review report to tasks

You have just completed a feature audit and produced a findings report.
Now convert that report into executable tasks and APPEND them to `docs/cursor_agent_tasks.md`.

## Rules for task creation

**Format:** Match the existing task format in the file exactly:
- Section headers: `## 🟥 High Priority`, `## 🟧 Medium Priority`, `## 🟨 Low Priority`
- Each task: `- [ ] **Task N** (Audit X.Y): <filename> (L<start>–<end> if known). <One sentence: what to change and how.> *(Note: dependency if any)*`
- Task numbering: continue from the last task number already in the file
- Group tasks by file to minimize context switching (same as existing pattern)

**Severity mapping:**
- 🔴 Critical → 🟥 High Priority
- 🟠 Major → 🟧 Medium Priority
- 🟡 Minor → 🟨 Low Priority

**Task writing rules:**
- Each task must be completable in 15–30 min by a small agent with no extra context.
- Include exact function name or line range if the audit report mentions it.
- Skip anything already marked `[x]` in the existing file — do not re-add completed tasks.
- Skip any task from the "Needs Clarification" section of the audit — do not add ambiguous items.
- Do NOT add a preamble section or modify anything above the appended content.

## Output
Append the new tasks directly to `docs/cursor_agent_tasks.md` under the correct priority sections.
Print a short summary: total tasks added, breakdown by priority.