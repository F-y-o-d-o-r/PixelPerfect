# Pixel Perfect by ITITI

> Modern, lightweight, and precise visual comparison & overlay tool for web developers, designers, and QA teams.

---

## 🎯 About

**Pixel Perfect by ITITI** is a modern browser extension that helps frontend developers and QA engineers verify that coded web implementations match design mockups down to the single pixel.

Built as an ad-free, fast, and privacy-respecting alternative to legacy tools, with direct clipboard integration, smart Retina scaling, and automated visual diffing.

---

## ✨ Key Features

- **No Ads:** Clean, distraction-free interface right next to DevTools.
- **Strict Folder-Based Organization:** Mockups always belong to a specific folder (`Folder 1`, `Folder 2`, etc.) with quick tab navigation, native trackpad horizontal scrolling, gap-free folder auto-numbering, drag-and-drop reordering for both folder tabs and mockups with centered neon indicator lines, moving mockups between folders via Drag & Drop, remembering the last active mockup in each folder, and zero unorganized clutter.
- **Raster & Vector Mockup Support:** Upload PNG, JPEG, WebP, and SVG files, with native project dimension detection from `viewBox` and `width`/`height`.
- **Centered Floating Toasts:** Real-time feedback for move mode, locking, mockup selection, and uploads in an elegant bottom-center pill capsule with blur.
- **Safe Deletion:** Localized confirmation before deleting a mockup or a folder, plus a duplicate `Upload` button next to the `MOCKUPS` header.
- **Dark Mode Included:** Full dark theme support out of the box, 100% free (Dark `🌙`, Light `☀️`, System Auto `🌗`).
- **Keyboard-First Controls:** Full keyboard navigation (`s` Show/Hide, `i` Move/Lock, `m` Minimize, `u` Upload, `0` Top-Center snap, `h/j/k/l` 1px/10px nudge, `- / +` & `1–9` opacity).
- **On-Demand Hotkeys Guide (`?`):** Clean UI by default; press `?` (`Shift + /`) or click `?` in the header to reveal subtle key badges.
- **Smart Edge & Corner Snapping:** Window snaps magnetically to all 4 screen corners, 4 edges, and center, automatically flattening docked corners.
- **Instant Clipboard Paste (`Cmd + V` / `Ctrl + V`):** Paste mockups directly from Figma or the clipboard without saving intermediate PNG files to disk.
- **Magnetic Overlay Dragging:** Snap mockup to origin (0, 0), center, or right edge while dragging, with `⌥ / Alt` to disable snapping on the fly.
- **Smart Retina / DPI Scaling:** Fixes the 0.5x / 2x display bug on high-DPI screens with instant `[ 1x | 2x | Auto ]` toggle.
- **8 Built-in Locales:** Native multi-language support (`en`, `ru`, `uk`, `el`, `sr`, `bg`, `ro`, `ka`) with browser auto-detection.
- **Top Layer Web Component:** Complete style isolation via Shadow DOM (`mode: 'open'`) in Chrome's native Top Layer (`popover="manual"`).
- **Precision Overlay & Invert Mode:** Real-time opacity slider, keyboard adjustments, and 1-click color invert (`[ ◐ ]`) for dark/light theme testing.
- **Smart Loading & System Pages Handling:** Defaults to a clean grayscale icon while tabs are loading, transitions to the active colored icon as soon as the page is ready, and displays an informative popup on restricted browser pages (`chrome://`, Web Store).
- **Built-in Layout Grids:** Preset column grids for Tailwind CSS, Bootstrap, Material UI, custom grids, and precision rulers.
- **Responsive Auto-Switch:** Automatically switches active mockups between Desktop, Tablet, and Mobile based on viewport width.
- **Click-Through Mode:** Lock overlays with `pointer-events: none` to inspect and edit DOM elements underneath via DevTools.
- **Smart Visual Diff:** Canvas-based pixel comparison with anti-aliasing filtering (`pixelmatch`) to highlight genuine layout deviations.
- **One-Click QA Bug Reports:** Capture misaligned areas with diff highlighting and export directly for designers or issue trackers.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| **`?`** (`Shift + /`) | Toggle hotkey hints on controls |
| **`s`** | Show / Hide active mockup |
| **`i`** / **`Esc`** | Toggle Move mode / Lock mockup |
| **`m`** | Minimize to compact bar / Expand window |
| **`u`** | Open file upload dialog |
| **`⌘V`** / **`Ctrl+V`** | Paste image from clipboard |
| **`h`** / **`j`** / **`k`** / **`l`** (or arrows) | Nudge mockup by 1px (Left / Down / Up / Right) |
| **`Shift` + `h/j/k/l`** | Nudge mockup by 10px |
| **`0`** / **`Home`** | Snap mockup to Top-Center (X: Center, Y: 0) |
| **`x`** | Snap mockup horizontally to Center |
| **`y`** | Snap mockup vertically to Top (Y: 0) |
| **`r`** | Reset mockup to origin (X: 0, Y: 0, 1x, Normal, 50%) |
| **`v`** | Toggle color inversion (Normal / Invert) |
| **`1`** – **`9`** | Set opacity to 10% – 90% |
| **`-`** / **`+`** (or `[` / `]`) | Adjust opacity by ±10% (with `Shift`: ±1%) |
| **Mouse Wheel** | Adjust opacity by ±5% (in Move mode over overlay) |
| **`⌥ / Alt`** | Hold while dragging to bypass magnetic edge snapping |
| **`⇧ / Shift`** | Hold while dragging to lock movement strictly to one axis (X or Y) |

---

## 📁 Repository Structure

```text
PixelPerfect/
├── chrome/          # Google Chrome extension (Manifest V3)
├── md/              # Project documentation, roadmap, and research
│   └── ROADMAP.md   # Master roadmap and competitor analysis
├── .gitignore
├── AGENTS.md        # AI Agent instructions and coding conventions
└── README.md
```

*(Future support planned for Mozilla Firefox in `firefox/`).*

---

## 🛠️ Development & Tooling

```bash
cd chrome

# Install dependencies (strictly use Yarn)
yarn

# Build extension (bundles to dist/)
yarn build

# Watch mode for rapid development
yarn dev

# Type check TypeScript definitions
yarn typecheck

# Code linting & formatting checks (ESLint + Prettier)
yarn lint
yarn format
```

---

## 🌐 Brand & Publisher

Developed and maintained by **[ITITI](https://ititi.dev)** (`hello@ititi.dev`).
