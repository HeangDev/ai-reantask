# Animations (`motion`)

Import from `motion/react`: `import { motion, AnimatePresence, useReducedMotion } from 'motion/react'`.

## 1. Principles

- Animation **explains** (state change, hierarchy, continuity) — never decorates blocking content.
- Fast and subtle: 150–300 ms, ease-out for enter, ease-in for exit. Springs for direct manipulation.
- **Respect reduced motion** everywhere.
- Animate only `opacity` and `transform` (and `layout`) — no animating `width/height/top/left` directly.
- Never delay access to content (no entrance animation > 300 ms on primary content).

## 2. Shared presets (`shared/motion/`)

```ts
export const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } };
export const slideUp = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 }, transition: { duration: 0.2, ease: 'easeOut' } };
export const listStagger = { animate: { transition: { staggerChildren: 0.04 } } };
export const scaleIn = { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 }, transition: { duration: 0.15 } };
```
Use presets; don't define ad-hoc durations/easings in components.

## 3. Where to use

| Use case                                       | Pattern                                                 |
|------------------------------------------------|---------------------------------------------------------|
| Modal / drawer / toast                         | `AnimatePresence` + `scaleIn` / slide + `fade` backdrop |
| AI review result appears                       | `slideUp` on panel; staggered comment cards             |
| Status change (`ai_reviewing` → `ai_reviewed`) | Cross-fade badge; subtle highlight pulse once           |
| Accordion / expand                             | `motion.div` with `layout` or height `auto` animation   |
| Tabs indicator                                 | `layoutId` shared underline                             |
| Reordering criteria                            | `Reorder.Group` / `layout`                              |
| Route transition                               | Simple `fade` only on the `<Outlet>` content (optional) |
| Score change                                   | Animated number (`useSpring`) ≤ 400 ms                  |

## 4. Where NOT to use

- Tables with many rows (no per-row entrance animation beyond first 10).
- Form validation errors (no shaking).
- Anything looping infinitely except a small "AI reviewing" indicator (pause when tab hidden / reduced motion).
- Loading skeleton → content swap (just replace).

## 5. Reduced motion

Configure globally: `<MotionConfig reducedMotion="user">` in providers. This disables transform/layout animations when the OS setting is on. For custom logic use `useReducedMotion()` and provide opacity-only fallbacks.

## 6. Performance

- Prefer `LazyMotion` + `domAnimation` and `m.*` components to reduce bundle size.
- Avoid animating many elements simultaneously (> ~20).
- Use `layout` sparingly; avoid on large lists.
- `AnimatePresence` direct children need stable `key`s.

## 7. Testing

Set `MotionGlobalConfig.skipAnimations = true` in `test/setup.ts`; wrap exit animations with `mode="popLayout"` carefully so elements are removed from the DOM in tests.