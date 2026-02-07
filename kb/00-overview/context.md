# Overview

## What is this?

Family Dashboard is a self-hosted family organization tool built with React + Vite + Supabase.
It replaces spreadsheets, fridge magnets, and SaaS subscriptions with a single, always-on screen.

Two interfaces:
- `/painel` — public kiosk dashboard (read-only, ambient display)
- `/editar` — admin panel (OTP-protected, phone-optimized CRUD)

## Who uses it?

- **Admin users**: parents (2 people), manage content via `/editar` on phone
- **Viewers**: the whole family, including children
- **Children**: interact mainly with routine checklists (tap to complete)

This is a real household tool, not a demo or SaaS product.

## Physical deployment

The `/painel` route runs on a **fixed kiosk screen** in the house:
- Wall-mounted iPad (primary target)
- FireTV / Silk browser
- Any tablet or TV with a browser

The kiosk URL is typically: `/painel?desktop=1`

## Daily usage

- Morning: check kids' routines, see the day's schedule
- Throughout the day: mark routines as done (kids tap the screen)
- Evening: quick review of tomorrow
- Weekly: parents update schedule, focus verse, homeschool topics via `/editar`

## Core priorities (in order)

1. **Zero friction** — if it's annoying, it gets abandoned
2. **Reliability** — no crashes, no stale state, no sync bugs
3. **Readable from distance** — 2-3 meters, high contrast, large text
4. **Admin via phone** — fast editing with minimal taps
5. **Simplicity** — no feature creep, no enterprise patterns

## What this is NOT

- Not a SaaS product
- Not multi-tenant
- Not designed for scale
- Not internationalized (PT-BR only, by design)
- Not a startup MVP — it's a finished domestic tool that evolves slowly
