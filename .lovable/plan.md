

# Development Principle: No Hard-Coding — Admin-Configurable First

## What This Is

This is not a code change — it's a **project-level guideline** to be saved as a persistent reference.

## The Rule

> **Default to admin-configurable, never hard-code.**
>
> When the user requests any new feature, content, behaviour, or value:
> 1. First consider whether it should be an **admin setting**, **lookup table**, or **configurable parameter** rather than a hard-coded value.
> 2. If the user hasn't explicitly said "make this configurable," proactively suggest: *"This should probably be an admin setting — shall I add it to the Settings page?"*
> 3. Hard-coding is only acceptable for true constants (e.g., mathematical values, framework config) — not business logic, labels, thresholds, durations, messages, or clinical parameters.

## Examples of What Should Be Configurable

- Treatment durations, vitals intervals, alert thresholds
- Email/SMS/WhatsApp message templates and content
- Appointment type names, colours, durations (already done)
- Chair names and capacity (already done)
- Business hours, clinic contact details, addresses
- Consent form requirements per treatment type
- Any text shown to patients (instructions, preparation notes)
- Feature flags (e.g., enable/disable WhatsApp, Ketamine monitoring)

## Where This Gets Saved

I'll add this to the project plan file (`.lovable/plan.md`) so it persists across all future conversations as a core development principle.

## File Changed

### `.lovable/plan.md` — Append development principle

Add a "Development Principles" section documenting this guideline so it's always referenced.

