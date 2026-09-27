# Design guide

The UI uses the EV admin platform's token system, Geist fonts, shared form controls, split auth layout, and responsive app shell.

| Token | Light | Dark |
| --- | --- | --- |
| Background | #ffffff | #09090b |
| Foreground | #000000 | #fafafa |
| Surface | #ffffff | #111114 |
| Subtle | #f4f4f5 | #1b1b20 |
| Muted text | #5b5b63 | #a1a1aa |
| Border | #e4e4e7 | #26262c |
| Input border | #94949d | #61616b |
| Brand | #0b7a5a | #2fcf97 |
| Brand foreground | #ffffff | #04211a |
| Brand soft | #e6f6f0 | #0f2b23 |
| Danger | #b42318 | #f97066 |
| Success | #067647 | #47cd89 |

Source of truth: app/globals.css. Components use semantic tokens so both themes stay consistent.

- Typography: Geist Sans; Geist Mono is available for technical values. Page titles use 24px semibold; auth titles grow to 30px. Body and form labels generally use 14px.
- Shape: 8px control corners and 12px card corners. Cards use a 1px border with 20–24px padding.
- Controls: 40px tall on desktop, 44px on coarse pointers. Focus indicators use the brand token.
- Navigation: 256px expanded sidebar, 72px collapsed rail, 56px header. Below 1024px, a modal drawer replaces the sidebar.
- Auth: dark artwork and form columns from 1024px; single form column on smaller screens.
- Themes: light, system, and dark; saved under garde-theme, applied before first paint.
- Sidebar: width preference saved in the garde-sidebar cookie.
- Accessibility: labeled controls, native form validation, visible focus, current-page indicators, skip link, modal drawer, and reduced-motion support.

Reuse components/ui, components/theme, and components/dashboard for future endpoint-driven screens. Keep operational pages out until their scope and contracts are supplied.
