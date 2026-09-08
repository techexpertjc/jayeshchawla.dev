# Attributions

Third-party assets used in this project, with their licences.

## Models

### Fox.glb — `public/models/Fox.glb`

No longer used — the player is now `avatar.glb`, a VRoid export. Kept as a
known-good rig for debugging animation problems against.

- **Source:** [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox)
- **Licence:** CC0 1.0 Universal (public domain dedication)
- **Credits:** model by PixelMannen; rig and animations by tomkranis

## Fonts — `app/fonts/`

Latin subsets only, self-hosted.

- **Inter** — SIL Open Font License 1.1 — Rasmus Andersson
- **Zen Maru Gothic** — SIL Open Font License 1.1 — Yoshimichi Ohira

`ZenMaruGothic-700.ttf` is the same subset as the woff2 beside it, decompressed
once for the Open Graph card: Satori, which renders it, cannot read woff2. It is
not served to browsers. To regenerate after changing the font:

```bash
npm i -D wawoff2
```

```js
import { decompress } from "wawoff2";
import { readFile, writeFile } from "node:fs/promises";
await writeFile(
  "app/fonts/ZenMaruGothic-700.ttf",
  Buffer.from(await decompress(await readFile("app/fonts/ZenMaruGothic-700.woff2"))),
);
```

## Notes

New assets must be CC0 where possible. Anything under CC-BY needs a credit line
added here before it ships.
