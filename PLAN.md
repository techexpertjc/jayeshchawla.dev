# SAVE FILE — Jayesh Chawla's Portfolio

A JRPG overworld where the road *is* the career timeline. Toon-shaded 3D anime world,
hybrid rails/free-roam navigation, with a persistent Resume Mode escape hatch.

---

## 0. Decisions (locked)

| Decision | Choice |
|---|---|
| Navigation | **Hybrid** — scroll/click rails by default, unlockable free-roam Explore Mode |
| Art pipeline | **Toon low-poly** CC0 kits + custom toon shader + VRoid avatar via Mixamo |
| Fallback | **Persistent Resume Mode** toggle — same data, static HTML, SEO + a11y + print |
| Scope | **2–4 weeks of evenings** — full vertical slice, content complete |
| Identity | Real name front and centre — **Jayesh Chawla**. No domain yet |
| Patricia AI | Full detail, stack and links public |
| Hiike | **Stack details withheld.** Describe the work, never the technologies |
| Contact | `mailto:` + social links. No server, no form backend |
| Avatar | **Rigged CC0 character for now.** VRoid self-portrait swapped in later — the player glb must stay a one-line swap |

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript | Your stack; RSC gives Resume Mode real SEO |
| 3D | React Three Fiber v9 + drei + @react-three/postprocessing | Declarative, matches your React mental model |
| Physics | **Custom kinematic controller** (raycast ground snap + cylinder-vs-AABB) | Rapier's wasm is ~1MB for a walk-around we don't need. Drop in Rapier only if this fights back |
| Scroll rails | GSAP 3 + ScrollTrigger + Lenis | Precise timeline scrubbing for the camera spline |
| DOM animation | Framer Motion | Enter/exit, layout animations, `AnimatePresence` for the VN box |
| State | Zustand | Game state, quest log, current zone, mode |
| Styling | Tailwind v4 + CSS custom props | Toon palette as design tokens. **No component library** — uniqueness is the point |
| Audio | Howler | Muted by default (autoplay policy), HUD toggle |
| Assets | glTF + Draco + KTX2, via `gltf-transform` + `gltfjsx` | Typed model components, tiny payloads |
| Deploy | Vercel | Day-one deploy, always shippable |

**Deliberately using both GSAP and Framer Motion:** GSAP owns the scroll rails and long
cinematic sequences; Motion owns component-level presence and layout. This is also a
credible signal — knowing when to use which is a senior tell.

---

## 2. Architecture

```
JC/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                  # boot screen (pure DOM) → world (dynamic import)
│  ├─ resume/page.tsx           # SSG, real HTML, print CSS, ATS-friendly
│  ├─ work/[slug]/page.tsx      # deep-linkable case studies, SSG
│  └─ opengraph-image.tsx
├─ content/
│  ├─ save-file.ts              # ★ SINGLE SOURCE OF TRUTH: jobs, quests, gear, stats
│  └─ dialogue/*.ts             # VN scripts per NPC / landmark
├─ game/
│  ├─ World.tsx                 # <Canvas>, scene graph, zone streaming
│  ├─ camera/RailsCamera.tsx    # CatmullRom spline, scroll-scrubbed
│  ├─ camera/FollowCamera.tsx   # free-roam orbit-follow rig
│  ├─ camera/blend.ts           # smooth handoff between the two
│  ├─ player/Controller.tsx     # input, movement, collision, anim state machine
│  ├─ zones/{Streebo,Xmplify,Patricia,Predixtions,Freelance,Tavern}.tsx
│  ├─ systems/Interactables.tsx # proximity → HUD prompt → dialogue trigger
│  ├─ systems/Particles.tsx     # sakura, fireflies, dust (instanced, shader-driven)
│  └─ shaders/{toon,water,portal,geofence}.ts
├─ hud/
│  ├─ DialogueBox.tsx           # typewriter, portrait, branching choices
│  ├─ QuestCard.tsx             # "Quest Complete" reveal
│  ├─ QuestLog.tsx  Inventory.tsx  StatSheet.tsx  Minimap.tsx
│  └─ ModeToggle.tsx            # Story ⇄ Explore ⇄ Resume
├─ store/game.ts
└─ public/{models,textures,audio}/
```

**Hard rule:** `content/save-file.ts` feeds the 3D world, Resume Mode, the case-study
pages, and the dialogue. Job title changes in exactly one place.

---

## 3. The anime look

- **Toon shading** — `MeshToonMaterial` with a custom 4px `DataTexture` gradient ramp
  (3-band). Instantly cel-shaded, near-zero cost.
- **Outlines** — drei `<Outlines>` (inverted hull), per-mesh thickness.
- **Sky** — vertical gradient shader + drifting billboard clouds with soft alpha.
- **Particles** — instanced sakura petals, GPU-animated in the vertex shader.
- **Post** — SelectiveBloom on emissives + subtle vignette. Optional halftone/dither.
  Auto-disabled on weak devices.
- **Lighting** — baked. One directional light, no realtime shadows except a single
  contact shadow under the player.

---

## 4. Performance budget (enforced from day one)

| Metric | Target |
|---|---|
| Initial JS (gzip) | < 1.5 MB |
| First meaningful paint | < 2 s |
| Per-zone glb | < 1 MB (Draco + KTX2) |
| Desktop | 60 fps |
| Mobile | 30+ fps |

Tactics: boot screen is pure DOM/CSS (loads instantly, 3D is a dynamic import) ·
one merged glb per zone, streamed on approach with a themed loader
("Loading Region: Ahmedabad…") · `<Instances>` for every repeated prop ·
`<Detailed>` LODs on towns · drei `<PerformanceMonitor>` auto-drops DPR and kills post ·
mobile caps DPR at 1.5, quarters particles, defaults to rails.

---

## 5. Zones

### 5.1 Streebo Shrine — *The Trinity Gate* (Jun 2019 – Jul 2020)
Three torii — Web, iOS, Android — converge into one large gate marked **MobileFirst 7**.
Walking through triggers a shader dissolve that merges them into one.
**Signature interaction:** a shrine bell labelled *L3 Support*. Ring it → red production
alert overlay floods the HUD → you triage and clear it.
Quest card: front-facing insurance production app, one codebase → three platforms,
production ownership + L3 support.

### 5.2 Xmplify Geofence Garden (Aug 2020 – May 2021)
Hedge maze with a shader-drawn glowing polygon on the ground. An NPC field agent walks a
route; a compensation counter ticks up inside the boundary and freezes outside.
**Signature interaction: drag the polygon vertices and watch the payout change.**
This is the best demo on the whole site — it *is* the feature you shipped.
Springboot HRMS building as backdrop.

### 5.3 Patricia Observatory (Jun 2021 – Nov 2023)
Pixel-perfect architecture with ghosted Figma frames snapping to it — hover for a
Figma-vs-built diff slider. Rooftop portal triggers a WebGL transition into a "3D nav
home" (your Unity handoff). Second beat: **Design Ramp-Up ×2** — the entire building
glitches and rebuilds in a new visual style. Best pure-animation set piece.
NPCs: juniors you mentored, a PR-review terminal.

### 5.4 Predixtions Fortress (Dec 2023 – Present)
Three acts matching your arc:
1. **FE wing** — React work.
2. **SOC2 vault** — locks clicking into place, compliance checklist animating in.
3. **The Migration** — the fortress detaches and cargo-lifts across the sea to a second
   island, data crates (prod DB + buckets) flying overhead. Full cinematic.

Your most senior work gets the biggest spectacle.

### 5.5 Freelance Isles (side quests)
- **Timee** — WebRTC lighthouse beaming between two boats (LiveKit), Firebase
  cloud-function machinery below deck, a Flutter workbench.
- **Hiike** — full-stack workshop; Next/TS/Convex/Clerk mounted as gear on the wall.
- **Patricia (New Game+)** — marked as a repeat run, second ground-up build.

### 5.6 Traveler's Rest (contact / save point)
Tavern. Travel photos as postcards on the wall, anime + gaming shelf easter eggs,
contact form as the save dialog.

### 5.7 Inventory / Stat Sheet
Tech stack as equipped gear with "years wielded" bars. React · Next · TypeScript ·
Node · Flutter. **IBM MobileFirst 7 as a legendary ancient relic** you can still swing.
Skill tree page derived from the same data.

---

## 6. Phases

### Phase 0 — Foundation (evenings 1–2)
Scaffold Next 15 + TS + Tailwind + R3F + Zustand. Write `content/save-file.ts` with all
real content. **Build Resume Mode first** — it's the safety net and it's fast.
Deploy to Vercel immediately; stay always-shippable.

### Phase 1 — Look dev (evenings 3–5) ← highest risk
Prove the anime look on one prop before building five zones: toon ramp, outlines,
gradient sky, sakura, post stack. Boot screen with Press Start + title card.
**Gate: if the look doesn't land here, pivot now.**

### Phase 2 — Player + cameras (evenings 6–8)
VRoid avatar → Mixamo (idle/walk/run/emote) → glb → animation state machine.
Kinematic controller. Rails camera on a CatmullRom spline scrubbed by Lenis.
Follow-camera rig. Smooth blend on mode toggle.

### Phase 3 — HUD & VN system (evenings 9–11) ← the actual frontend showcase
Dialogue box (typewriter, portrait, branching), quest log, inventory, stat sheet,
minimap, mode toggle. GSAP timelines, staggered reveals, FLIP transitions,
SVG morphing on the quest card. **This is what proves the animation skills.**

### Phase 4 — Zones (evenings 12–18)
Built in order of impact:
Xmplify geofence → Predixtions migration → Patricia portal → Streebo shrine →
Freelance Isles → Traveler's Rest. ~1.5 evenings each.

### Phase 5 — Polish & ship (evenings 19–22)
Audio pass · perf pass against §4 budget · mobile pass · a11y (keyboard nav,
`prefers-reduced-motion`, focus traps in dialogue) · SEO + OG image · analytics ·
custom domain · loading screen tips.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| **VRoid → Mixamo retargeting** — VRM bone naming ≠ Mixamo, fiddliest step in the build | Test in Phase 2, not Phase 4. Fallback: rigged Quaternius character with a toon texture |
| **Mobile performance** — the #1 killer of 3D portfolios | Budget enforced from day one, `<PerformanceMonitor>` auto-degrade, rails-only default on mobile |
| **Scope creep per zone** | Exactly one signature interaction per zone. Everything else is set dressing |
| **Asset licensing** | CC0 only (Quaternius, Kenney, Poly Pizza CC0 filter). Maintain `ATTRIBUTIONS.md` |
| **Recruiter bounce** | Resume Mode toggle visible at all times, plus SSG case-study pages that rank |

---

## 8. Asset sources (all CC0)

- **Quaternius** — stylized low-poly nature, buildings, characters
- **Kenney** — props, UI kit sounds
- **Poly Pizza** (CC0 filter) — one-off props
- **VRoid Studio** (free) — anime avatar → VRM → glb
- **Mixamo** (free) — animation library
- **freesound.org** / **Pixabay Music** — SFX and lofi/chiptune loop
