// Draggable floating utility panels — M (quick panel) and N (marks distribution).
(() => {
  const isTyping = () => {
    const a = document.activeElement;
    return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
  };
  const X = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  const panels = [];

  function createPanel(cfg) {
    const POS = "cn-panel-pos-" + cfg.id, NOTE = "cn-panel-note-" + cfg.id;
    let pos = null, el = null, open = false;
    try { pos = JSON.parse(sessionStorage.getItem(POS)); } catch (e) {}

    const place = (x, y) => {
      const w = el.offsetWidth, h = el.offsetHeight;
      x = Math.min(Math.max(8, x), Math.max(8, innerWidth - w - 8));
      y = Math.min(Math.max(8, y), Math.max(8, innerHeight - h - 8));
      el.style.left = x + "px"; el.style.top = y + "px";
      pos = { x, y };
      try { sessionStorage.setItem(POS, JSON.stringify(pos)); } catch (e) {}
    };

    function build() {
      el = document.createElement("aside");
      el.className = "fp fp-" + cfg.id;
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", cfg.title || (cfg.note ? "Panel" : "Marks distribution"));
      el.innerHTML =
        '<div class="fp-head" data-drag><span class="fp-grip" aria-hidden="true"></span>' +
        '<span class="fp-title">' + cfg.title + '</span>' +
        '<button class="fp-x" type="button" aria-label="Close panel">' + X + '</button></div>' +
        '<div class="fp-body">' + cfg.body +
        (cfg.note ? '<textarea id="fp-note-' + cfg.id + '" class="fp-note" rows="4" placeholder="Type here…"></textarea>' : '') + '</div>';
      document.body.appendChild(el);

      const note = el.querySelector(".fp-note");
      if (note) {
        try { note.value = sessionStorage.getItem(NOTE) || ""; } catch (e) {}
        const grow = () => {
          note.style.height = "auto";
          note.style.height = Math.min(note.scrollHeight + 2, Math.round(innerHeight * 0.6)) + "px";
          if (open && pos) place(pos.x, pos.y);
        };
        note.addEventListener("input", () => { try { sessionStorage.setItem(NOTE, note.value); } catch (e) {} grow(); });
        el._grow = grow;
      }
      el.querySelector(".fp-x").addEventListener("click", () => toggle(false));
      el.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); e.stopPropagation(); });
      el.addEventListener("pointerdown", () => { panels.forEach((p) => p.raise(el)); });

      const head = el.querySelector("[data-drag]");
      head.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".fp-x")) return;
        e.preventDefault();
        const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
        el.classList.add("fp-drag");
        head.setPointerCapture(e.pointerId);
        const move = (ev) => place(ev.clientX - dx, ev.clientY - dy);
        const up = () => {
          el.classList.remove("fp-drag");
          head.removeEventListener("pointermove", move);
          head.removeEventListener("pointerup", up);
          head.removeEventListener("pointercancel", up);
        };
        head.addEventListener("pointermove", move);
        head.addEventListener("pointerup", up);
        head.addEventListener("pointercancel", up);
      });
      addEventListener("resize", () => { if (open && pos) place(pos.x, pos.y); });
    }

    function toggle(force) {
      const want = typeof force === "boolean" ? force : !open;
      if (want === open) return;
      open = want;
      if (open) {
        if (!el) build();
        clearTimeout(el._t);
        el.style.display = "block";
        if (pos) place(pos.x, pos.y);
        else place(innerWidth - el.offsetWidth - 24 - cfg.offset, 88 + cfg.offset);
        panels.forEach((p) => p.raise(el));
        if (el._grow) el._grow();
        void el.offsetWidth;
        el.classList.add("fp-on");
      } else if (el) {
        el.classList.remove("fp-on");
        el._t = setTimeout(() => { if (!open) el.style.display = "none"; }, 200);
      }
    }
    const api = { key: cfg.key, toggle, raise(top) { if (el) el.style.zIndex = el === top ? 10000 : 9999; } };
    panels.push(api);
    return api;
  }

  createPanel({ id: "m", key: "m", title: "", offset: 0, note: true, body: "" });

  const rows = [["M1", "10", ""], ["M2", "20", ""], ["M3", "20", ""], ["M4", "20", ""], ["M5", "10", ""], ["M6", "10", "+ Choice"], ["M7", "10", "+ Choice"]];
  createPanel({
    id: "n", key: "n", title: "", offset: 36,
    body: '<table class="fp-tbl"><tbody>' +
      rows.map((r) => "<tr><th>" + r[0] + "</th><td>" + r[1] + (r[2] ? ' <span class="fp-tag">' + r[2] + "</span>" : "") + "</td></tr>").join("") +
      '</tbody></table>'
  });

  // Capture phase so it works on every view, ahead of other handlers.
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.defaultPrevented || isTyping()) return;
    const p = panels.find((x) => x.key === e.key.toLowerCase());
    if (!p) return;
    e.preventDefault();
    p.toggle();
  }, true);
})();
