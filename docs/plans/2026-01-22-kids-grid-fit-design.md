# Kids Grid Fit - Design

## Goal
Avoid vertical scrolling when there are 4+ kids by making the kids grid adapt to available width and limiting visible routines per kid.

## Approach (selected)
- Use CSS grid `auto-fit` with `minmax(220px, 1fr)` so the layout can reach 4 columns when space allows.
- Limit routines visible per kid to 5; show a `+N` indicator when there are more routines.
- Keep the completion counter based on total routines (not just visible ones).

## Scope
- UI-only change in `KidsGrid`.
- No new dependencies.
- No data/model changes.

## Out of scope
- FireTV compact mode (tracked separately).
- Scroll-in-card behavior (explicitly avoided).

## Files
- `src/App.tsx` (KidsGrid section)

## Testing
- Manual visual check on desktop and narrow screens.
- No new automated tests required for layout.
