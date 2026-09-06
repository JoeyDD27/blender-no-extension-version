/*
 * Stabfish 2 Tab Blender — DevTools Snippet
 *
 * Run this file as a Chrome/Edge DevTools Snippet on the page you want under
 * Stabfish. It creates a cross-origin iframe and never reads or sends data from
 * the underlying page.
 */
(() => {
  "use strict";

  const API_KEY = "__stabfishTabBlender";
  const ROOT_ID = "__stabfish-tab-blender-root";
  const STABFISH_URL = "https://stabfish2.io/";

  // Re-running the snippet replaces the previous instance cleanly.
  if (window[API_KEY] && typeof window[API_KEY].destroy === "function") {
    window[API_KEY].destroy();
  }
  document.getElementById(ROOT_ID)?.remove();

  const host = document.createElement("div");
  host.id = ROOT_ID;
  Object.assign(host.style, {
    all: "initial",
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    pointerEvents: "none"
  });

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host, * { box-sizing: border-box; }

      #layer {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        border: 0;
        opacity: .4;
        background: #05070d;
        pointer-events: none;
      }

      #layer.darkened {
        filter: invert(.88) hue-rotate(180deg);
      }

      #bar {
        position: fixed;
        left: 50%;
        bottom: 12px;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        border: 1px solid rgba(102, 126, 234, .3);
        border-radius: 10px;
        background: rgba(10, 10, 24, .94);
        backdrop-filter: blur(12px);
        color: #ccc;
        font: 600 13px/1.2 "Segoe UI", Tahoma, sans-serif;
        white-space: nowrap;
        pointer-events: auto;
        user-select: none;
        opacity: 1;
        transition: opacity .15s;
      }

      #bar.hidden {
        opacity: 0;
        pointer-events: none;
      }

      #dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #667eea;
        flex: 0 0 auto;
        transition: background .2s;
      }

      #dot.stabfish { background: #c084fc; }

      #label {
        font-size: 12px;
        font-weight: 600;
      }

      .slider-group {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .pct-num {
        min-width: 28px;
        text-align: center;
        font-size: 11px;
        font-weight: 700;
      }

      #page-pct { color: #667eea; }
      #stabfish-pct { color: #c084fc; }

      #blend-slider {
        appearance: none;
        width: 80px;
        height: 4px;
        border: 0;
        border-radius: 2px;
        outline: none;
        background: linear-gradient(90deg, #667eea, #c084fc);
        cursor: pointer;
      }

      #blend-slider::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        border: 2px solid #667eea;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
      }

      #swap {
        border: 0;
        border-radius: 6px;
        padding: 5px 12px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
        font: 600 11px/1.2 "Segoe UI", Tahoma, sans-serif;
        cursor: pointer;
      }

      #swap:hover { opacity: .8; }
      #swap:focus-visible,
      #dark-select:focus-visible,
      #blend-slider:focus-visible { outline: 2px solid #a99cff; outline-offset: 2px; }

      #dark-select {
        border: 1px solid #444;
        border-radius: 5px;
        padding: 4px 6px;
        background: #2a2a4a;
        color: #ccc;
        font: 11px/1.2 "Segoe UI", Tahoma, sans-serif;
        cursor: pointer;
      }

      #status {
        position: fixed;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        padding: 7px 10px;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 999px;
        background: rgba(9,12,25,.88);
        color: #dce2ff;
        font: 600 11px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        opacity: 1;
        transition: opacity .25s;
        pointer-events: none;
      }

      #status.hidden { opacity: 0; }

      @media (max-width: 760px) {
        #bar { max-width: calc(100vw - 20px); flex-wrap: wrap; justify-content: center; }
      }
    </style>

    <iframe
      id="layer"
      title="Stabfish 2 overlay"
      allow="autoplay; fullscreen; gamepad"
    ></iframe>

    <div id="status" role="status">Loading Stabfish 2…</div>

    <div id="bar" role="toolbar" aria-label="Stabfish blender controls">
      <span id="dot" aria-hidden="true"></span>
      <span id="label">Selected website (60%)</span>
      <label class="slider-group" aria-label="Blend percentage">
        <span class="pct-num" id="page-pct">60%</span>
        <input id="blend-slider" type="range" min="0" max="100" value="60">
        <span class="pct-num" id="stabfish-pct">40%</span>
      </label>
      <button id="swap" type="button">Swap</button>
      <select id="dark-select" aria-label="Dark mode">
        <option value="none">Dark: Off</option>
        <option value="page">Dark: Selected website</option>
        <option value="stabfish">Dark: Stabfish</option>
      </select>
    </div>
  `;

  document.documentElement.appendChild(host);

  const frame = shadow.getElementById("layer");
  const bar = shadow.getElementById("bar");
  const dot = shadow.getElementById("dot");
  const label = shadow.getElementById("label");
  const slider = shadow.getElementById("blend-slider");
  const pagePct = shadow.getElementById("page-pct");
  const stabfishPct = shadow.getElementById("stabfish-pct");
  const darkSelect = shadow.getElementById("dark-select");
  const status = shadow.getElementById("status");
  const pageRoot = document.body || document.documentElement;
  const originalPageFilter = pageRoot.style.filter;

  let selectedWebsitePct = 60;
  let activeLayer = "page";
  let controlsVisible = true;
  let statusTimer;

  function showStatus(message, duration = 1800) {
    clearTimeout(statusTimer);
    status.textContent = message;
    status.classList.remove("hidden");
    statusTimer = setTimeout(() => status.classList.add("hidden"), duration);
  }

  function applyBlend() {
    selectedWebsitePct = Math.max(0, Math.min(100, Number(selectedWebsitePct) || 0));
    const stabfishPercent = 100 - selectedWebsitePct;

    slider.value = String(selectedWebsitePct);
    pagePct.textContent = `${Math.round(selectedWebsitePct)}%`;
    stabfishPct.textContent = `${Math.round(stabfishPercent)}%`;
    frame.style.opacity = String(stabfishPercent / 100);

    if (stabfishPercent === 0) activeLayer = "page";
    frame.style.pointerEvents = activeLayer === "stabfish" ? "auto" : "none";
    dot.classList.toggle("stabfish", activeLayer === "stabfish");
    label.textContent = activeLayer === "stabfish"
      ? `Stabfish (${Math.round(stabfishPercent)}%)`
      : `Selected website (${Math.round(selectedWebsitePct)}%)`;
  }

  function toggleControls(force) {
    controlsVisible = typeof force === "boolean" ? force : !controlsVisible;
    bar.classList.toggle("hidden", !controlsVisible);
  }

  function setActiveLayer(layer, announce = true) {
    activeLayer = layer === "stabfish" && selectedWebsitePct < 100
      ? "stabfish"
      : "page";
    applyBlend();
    if (announce) {
      showStatus(activeLayer === "stabfish"
        ? "Mouse and keyboard now control Stabfish"
        : "Mouse and keyboard now control the selected website");
    }
  }

  function emergencyHide() {
    selectedWebsitePct = 100;
    activeLayer = "page";
    applyBlend();
    showStatus("Emergency: selected website is now 100%", 2500);
  }

  function onKeydown(event) {
    const commandKey = event.metaKey || event.ctrlKey;
    const key = String(event.key || "").toLowerCase();

    if (commandKey && !event.altKey && !event.shiftKey &&
        (event.code === "KeyK" || key === "k")) {
      event.preventDefault();
      event.stopPropagation();
      toggleControls();
      return;
    }

    if (commandKey && !event.altKey && !event.shiftKey &&
        (event.code === "KeyX" || key === "x")) {
      event.preventDefault();
      event.stopPropagation();
      emergencyHide();
    }
  }

  // Command/Ctrl+X is a browser Cut command. Some editable controls emit the
  // cut event instead of exposing the shortcut keydown to the page.
  function onCut(event) {
    event.preventDefault();
    event.stopPropagation();
    emergencyHide();
  }

  function destroy() {
    clearTimeout(statusTimer);
    window.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("cut", onCut, true);
    pageRoot.style.filter = originalPageFilter;
    host.remove();
    if (window[API_KEY]?.host === host) delete window[API_KEY];
  }

  slider.addEventListener("input", () => {
    selectedWebsitePct = Number(slider.value);
    applyBlend();
  });
  shadow.getElementById("swap").addEventListener("click", () => {
    setActiveLayer(activeLayer === "page" ? "stabfish" : "page");
  });
  darkSelect.addEventListener("change", () => {
    pageRoot.style.filter = darkSelect.value === "page"
      ? "invert(.88) hue-rotate(180deg)"
      : originalPageFilter;
    frame.classList.toggle("darkened", darkSelect.value === "stabfish");
  });
  window.addEventListener("keydown", onKeydown, true);
  window.addEventListener("cut", onCut, true);

  frame.addEventListener("load", () => {
    // A browser may also fire load for a blocked frame, so this is deliberately
    // phrased as a prompt to verify the visible result.
    showStatus("Stabfish request finished — if blank, check CSP instructions", 3500);
  });

  window[API_KEY] = {
    host,
    destroy,
    emergency: emergencyHide,
    hideControls: () => toggleControls(false),
    showControls: () => toggleControls(true),
    setPercentage: (value) => {
      selectedWebsitePct = value;
      applyBlend();
    },
    controlPage: () => setActiveLayer("page"),
    controlStabfish: () => setActiveLayer("stabfish")
  };

  applyBlend();
  setActiveLayer("page", false);
  frame.src = STABFISH_URL;
})();
