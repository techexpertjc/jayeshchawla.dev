# Save File — Jayesh Chawla

A portfolio built as a JRPG overworld, where the road is the career timeline.

See [PLAN.md](./PLAN.md) for the full design, phases and risks.

## Requirements

Node.js 20+.

## Getting started

```bash
npm install
```

```bash
npm run dev
```

- `/` — boot screen (pure DOM/CSS, paints instantly)
- `/play` — the overworld: walk around with WASD, Shift to run, drag to look
- `/resume` — Resume Mode: static HTML, print-ready, SEO-indexed
- `/lookdev` — look-dev gate for the toon pipeline. Unlinked and `noindex`

Add `?at=<zone>` to `/play` to spawn straight into a region in Explore mode,
e.g. `/play?at=xmplify`. Zone ids are the keys in `game/zones/layout.ts`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## The one rule

[`content/save-file.ts`](./content/save-file.ts) is the single source of truth.
The 3D world, Resume Mode and every dialogue script read from it. Never duplicate content out of it.

Anything marked `TODO(jayesh)` in that file needs your input.

### Updating content later

Edit `save-file.ts` and everything downstream follows. No code changes needed for:

| Change | What updates itself |
|---|---|
| New job or freelance project | Resume section, boot-screen region list, quest log |
| Edit a title, summary or bullet | Every surface that shows it |
| Add / remove / reorder a stat | Radar chart redraws — axis count and angles are derived |
| Add a technology to `gear` | Inventory grid, resume skills row, `knowsAbout` in the JSON-LD |
| End a role (`end: null` → a date) | Durations, "years wielded", `worksFor` in the JSON-LD |
| Withhold a stack (`stack: null`) | Renders a "withheld" chip instead of a list |

Nothing anywhere is hardcoded to a count — no `stats[2]`, no fixed column spans.
Dates and years of experience are computed at build time, so they never go stale.

**The one exception:** a quest's `zone` must be one of the `ZoneId` values, and each
zone has a hand-authored 3D scene under `game/zones/`. Adding a *new* region means
building it. Adding a quest to an *existing* region is pure data.

### Swapping in the VRoid avatar

[`game/player/character.ts`](./game/player/character.ts) is the only file that
needs to change. Drop the new `.glb` into `public/models`, point `url` at it,
retune `scale`, and map `clips` onto whatever the export named its animations.
If the character moonwalks, set `facingOffset` to `Math.PI`.

The character is a VRoid export of Jayesh, optimized by `scripts/optimize-avatar.mjs`
(11.3 MB VRM to 1.5 MB glb — morph targets stripped, textures resized to WebP).
Third-party assets are credited in [ATTRIBUTIONS.md](./ATTRIBUTIONS.md).

## Gotchas worth remembering

**Outline thickness is in pixels.** drei's `<Outlines>` defaults to
`screenspace={false}`, which — despite the name — is the clip-space path where
thickness is divided by canvas size. So the unit is pixels and lines hold a
constant weight at any distance. `screenspace={true}` is the *model*-space path
(world units, lines fatten as you approach). The names are inverted from what
they suggest. `thickness={0.02}` renders a 0.02-pixel line, i.e. nothing.

**Never `next/dynamic` a component that renders inside `<Canvas>`.** It suspends
against R3F's reconciler and never resolves, which halts the render loop with a
blank canvas and an empty console. One dynamic boundary per route, at the DOM
level — see `game/LookDevRoot.tsx`.

**Never run `next build` while `next dev` is live.** They share `.next` and will
corrupt each other's chunks. Use `NEXT_DIST_DIR=.next-verify` for an isolated
build; `.claude/launch.json` has `prod` and `dev-verify` configs that do this.

**Outline thickness is in drawing-buffer pixels, so it must scale with the
device.** `<Outlines thickness>` is a pixel count, not a fraction of the screen.
13px on a 1920-wide desktop buffer is a hairline; the same 13px on a 375-wide
phone buffer is a stripe. `quality().outlineScale` normalises it against a
1920 reference — `ToonMesh` applies it, so pass plain desktop-tuned numbers.

**Movement intent lives in `game/player/inputState.ts`, not in a hook.**
Keyboard and touch write to separate slots and `readInput` picks whichever is
pushing harder — sharing one vector meant releasing a key zeroed a live
joystick. The module has no three.js import because the on-screen stick lives
in the DOM bundle.

**Story mode ignores collision — the rails must be authored clear.** In Story
mode the player is placed on the spline every frame, so `resolveCollisions`
never runs on it. If the path crosses a solid, the character walks through it.
A zone's origin is its *centre*, which is usually exactly where its building
is, so never route the rails to an origin.

There is a geometry check for this in the scratchpad (`check-rails.mjs`): it
samples the real curve and reports clearance from every solid plus any water
crossed off-bridge. Re-run it after moving a zone or editing the path — it
caught two through-building routes that were invisible from a screenshot.

**Set pieces claim the camera with `setCinematic`.** A zone can hand the camera
a world-space position and focus; `CameraRig` flies to it with the same damping
as every other mode, so it eases rather than cuts. Set `lockPlayer: true` for a
sequence that must play out, `false` for a composed viewpoint the visitor can
walk out of. Always hand it back (`setCinematic(null)`), and guard the call with
a ref so it writes to the store on change rather than every frame.

Worth knowing why this exists: the follow camera pitches about 17 degrees down,
which pushes the horizon high and clips tall distant geometry off the top of the
frame. Backing away makes it worse, not better. Anything that needs to be seen
whole needs its own shot.

**Scene components must read game state with `useGame.getState()`, never by
subscribing.** Components under `<Canvas>` live in R3F's own React root, where a
zustand subscription does not reliably re-render them — `mode` changes reached
the HUD but never the camera or player. Subscribing would also be wrong on its
own terms: it re-renders scene nodes on every store write.

**Anything inside `<AnimatePresence>` must take its data as a prop, not read it
from the store.** The component stays mounted through its exit animation, by
which point the store value is already null — reading it there crashes on the
way out. This bit both the dialogue box and the panels.

**Never import `game/camera/rails.ts` from DOM-side code.** It imports three for
`CatmullRomCurve3`, so anything outside the lazy 3D chunk that touches it drags
all of three.js into the route's initial bundle — it took `/play` from 114 kB to
214 kB First Load. The shared scroll value lives in `game/camera/railsState.ts`,
which is deliberately dependency-free. Import from there.

**Fonts are self-hosted** in `app/fonts/`. `next/font/google` cannot reach
`fonts.gstatic.com` from Node in this environment (socket hang up, twelve
retries, ~50 s added per build).

## Status

- [x] **Phase 0** — foundation, content model, Resume Mode, boot screen
- [x] **Phase 1** — look dev running at `/lookdev`: toon ramp, ink outlines, banded
      sky, fog, sakura, threshold-gated bloom. Verified in a browser
- [x] **Phase 2** — player, input, animation state machine, rails camera,
      follow camera and the Story ⇄ Explore blend, all at `/play`
- [x] **Phase 3** — HUD: dialogue box with typewriter and branching choices,
      Quest Complete card, quest log, inventory, character sheet with a derived
      radar chart, proximity interaction prompt
- [x] **Phase 4** — all six zones built and wired into the rails: Streebo
      (Trinity Gate), Xmplify (Geofence Garden), Patricia (the Observatory),
      Predixtions (the Fortress), the Freelance Isles and Traveller's Rest

- [ ] **Phase 5** — polish & ship
