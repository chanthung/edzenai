## Changes to `src/pages/Index.tsx` — `ProblemCard` component

1. **Enlarge icons**: Increase the icon container from `w-11 h-11` to `w-14 h-14`, and the icon from `h-5 w-5` to `h-7 w-7`.

2. **Add hover animation**: Add a gentle bounce/scale animation on the icon container when the card is hovered, using Tailwind's `group` + `group-hover:scale-110` with a smooth transition. Also add a subtle upward float on the entire card on hover.

Single file edit — `ProblemCard` function in `src/pages/Index.tsx` (~lines 709-729).
