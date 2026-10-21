# Pixel Perfect by ITITI

> Modern, lightweight, and precise visual comparison & overlay tool for web developers, designers, and QA teams.

---

## 🎯 About

**Pixel Perfect by ITITI** is a modern browser extension that helps frontend developers and QA engineers verify that coded web implementations match design mockups down to the single pixel.

Built as an ad-free, fast, and privacy-respecting alternative to legacy tools, with direct clipboard integration, smart Retina scaling, and automated visual diffing.

---

## ✨ Key Features

- **No Ads:** Clean, distraction-free interface right next to DevTools.
- **Dark Mode Included:** Full dark theme support out of the box, 100% free.
- **Instant Clipboard Paste (`Cmd + V` / `Ctrl + V`):** Paste mockups directly from Figma or the clipboard without saving intermediate PNG files to disk.
- **Smart Retina / DPI Scaling:** Fixes the 0.5x / 2x display bug on high-DPI screens with automatic detection and an instant `[ 1x | 2x | Auto ]` toggle.
- **Built-in Layout Grids:** Preset column grids for Tailwind CSS, Bootstrap, Material UI, custom grids, and precision rulers.
- **Responsive Auto-Switch:** Automatically switches active mockups between Desktop, Tablet, and Mobile based on viewport width.
- **Click-Through Mode:** Lock overlays with `pointer-events: none` to inspect and edit DOM elements underneath via DevTools.
- **Smart Visual Diff:** Canvas-based pixel comparison with anti-aliasing filtering (`pixelmatch`) to highlight genuine layout deviations.
- **One-Click QA Bug Reports:** Capture misaligned areas with diff highlighting and export directly for designers or issue trackers.

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

## 🌐 Brand & Publisher

Developed and maintained by **[ITITI](https://ititi.dev)** (`hello@ititi.dev`).
