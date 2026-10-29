export const OVERLAY_SHADOW_STYLES = `
:host {
  all: initial;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  overflow: clip;
  z-index: 2147483645;
  pointer-events: none;
}

.pp-overlay-layer {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
  transition: box-shadow 0.14s ease;
}

.pp-overlay-layer--move {
  pointer-events: auto;
  cursor: move;
  outline: 1.5px solid #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25), 0 12px 32px rgba(0, 0, 0, 0.35);
}

.pp-overlay-img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  image-rendering: pixelated;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.pp-move-pill {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(14, 16, 21, 0.92);
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.55);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  white-space: nowrap;
  z-index: 2147483646;
}

.pp-move-pill kbd {
  display: inline-block;
  padding: 1px 5px;
  margin: 0 2px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.14);
  border-radius: 4px;
}

.pp-move-pill-sep {
  display: inline-block;
  opacity: 0.45;
  margin: 0 5px;
}
`
