/* ═══════════════════════════════════════════════════════════════════════════
   newsie by Fin-Z — Vertical Swipe + Detail View
   Matches the React frontend UX: vertical swipe up/down, click/swipe-right
   for detail, spring-style animations.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
    "use strict";

    // ── Bridge for Voice Chat module ─────────────────────────────────────
    // Expose current card getter so voice-chat.js can send context
    // to the Gemini Live session without coupling the modules.
    window.__newsie_getCurrentCard = function () {
        if (!cards || !cards[currentIdx]) return null;
        const c = cards[currentIdx];
        return {
            hook: c.hook,
            TLDR: c.TLDR,
            category: c.category,
            source: c.source,
            vibe_check: c.vibe_check,
            financial_facts: c.financial_facts
        };
    };

    // ── DOM ─────────────────────────────────────────────────────────────
    const track       = document.getElementById("card-track");
    const viewport    = document.getElementById("card-viewport");
    const progressRail= document.getElementById("progress-rail");
    const catBadge    = document.getElementById("category-badge");
    const detailPanel = document.getElementById("detail-panel");
    const detailHero  = document.getElementById("detail-hero");
    const detailBody  = document.getElementById("detail-body");
    const detailBack  = document.getElementById("detail-back");
    const deskUp      = document.getElementById("desk-up");
    const deskDown    = document.getElementById("desk-down");

    let cards       = [];
    let currentIdx  = 0;
    let showDetail  = false;

    // ── Utils ───────────────────────────────────────────────────────────
    function esc(s) {
        const d = document.createElement("div"); d.textContent = s; return d.innerHTML;
    }

    function classifyVibe(v) {
        const s = v.toLowerCase();
        if (s.includes("stonks"))    return "stonks";
        if (s.includes("cooked"))    return "cooked";
        if (s.includes("major l"))   return "cooked";
        if (s.includes("vibe"))      return "major-vibe";
        return "default";
    }

    function catClass(cat) {
        const map = { Tech:"cat-tech", Science:"cat-science", Markets:"cat-markets",
                      AI:"cat-ai", Sports:"cat-sports", World:"cat-world", Breaking:"cat-breaking" };
        return map[cat] || "";
    }

    // ── Build card element ──────────────────────────────────────────────
    function buildCard(card) {
        const el = document.createElement("div");
        el.className = "news-card";

        const imgSrc = card.image || "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=800&q=80";

        el.innerHTML = `
            <img class="card-bg-image" src="${esc(imgSrc)}" alt="" draggable="false" />
            <div class="card-gradient-top"></div>
            <div class="card-gradient-bottom"></div>

            <div class="card-content">
                <h2 class="card-title">${esc(card.hook)}</h2>
                <p class="card-description">${esc(card.TLDR)}</p>
                <div class="card-footer">
                    <span class="card-source">${esc(card.source || "Fin-Z")}</span>
                    <div class="card-cta">
                        <span>tap for full story</span>
                        <span>→</span>
                    </div>
                </div>
            </div>

            <div class="scroll-dots">
                <div class="scroll-dot"></div>
                <div class="scroll-dot active"></div>
                <div class="scroll-dot"></div>
            </div>
        `;

        // Tap to open detail
        el.addEventListener("click", () => openDetail());

        return el;
    }

    // ── Render ───────────────────────────────────────────────────────────
    function renderAll() {
        track.innerHTML = "";
        cards.forEach(c => track.appendChild(buildCard(c)));
        buildProgressBars();
        updateView(false);
    }

    // ── Progress bars ───────────────────────────────────────────────────
    function buildProgressBars() {
        progressRail.innerHTML = "";
        cards.forEach((_, i) => {
            const bar = document.createElement("div");
            bar.className = "progress-bar";
            progressRail.appendChild(bar);
        });
        updateProgressBars();
    }

    function updateProgressBars() {
        const bars = progressRail.querySelectorAll(".progress-bar");
        bars.forEach((bar, i) => {
            if (i === currentIdx) {
                bar.style.height = "24px";
                bar.style.opacity = "1";
            } else {
                bar.style.height = "6px";
                bar.style.opacity = "0.25";
            }
        });
    }

    // ── Navigation ──────────────────────────────────────────────────────
    function goTo(idx, animate = true) {
        if (idx < 0 || idx >= cards.length || showDetail) return;
        currentIdx = idx;
        updateView(animate);
    }

    function goNext() { goTo(currentIdx + 1); }
    function goPrev() { goTo(currentIdx - 1); }

    function updateView(animate = true) {
        if (!animate) track.classList.add("dragging");
        track.style.transform = `translateY(-${currentIdx * 100}%)`;
        if (!animate) requestAnimationFrame(() => track.classList.remove("dragging"));

        updateProgressBars();

        // Update category badge
        const card = cards[currentIdx];
        if (card) {
            catBadge.textContent = card.category || "News";
            catBadge.className = "category-badge " + catClass(card.category);
        }

        // Update desktop nav
        if (deskUp) deskUp.disabled = (currentIdx === 0);
        if (deskDown) deskDown.disabled = (currentIdx === cards.length - 1);
    }

    // ── Detail view ─────────────────────────────────────────────────────
    function openDetail() {
        const card = cards[currentIdx];
        if (!card) return;
        showDetail = true;

        const imgSrc = card.image || "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=800&q=80";
        detailHero.style.backgroundImage = `url('${imgSrc}')`;

        const vibeClass = classifyVibe(card.vibe_check);
        const factsHTML = card.financial_facts.map(f => `<li>${esc(f)}</li>`).join("");

        detailBody.innerHTML = `
            <div class="detail-meta">
                <div class="category-badge ${catClass(card.category)}">${esc(card.category || "News")}</div>
                <span class="detail-source">${esc(card.source || "Fin-Z")}</span>
            </div>

            <h1 class="detail-title">${esc(card.hook)}</h1>

            <p class="detail-hook">${esc(card.TLDR.substring(0, 120))}…</p>

            <span class="detail-section-label label-vibe">⚡ vibe check</span>
            <div class="detail-vibe-badge dvibe-${vibeClass}">${esc(card.vibe_check)}</div>

            <hr class="detail-divider" />

            <span class="detail-section-label label-tldr">📝 tl;dr</span>
            <p class="detail-tldr">${esc(card.TLDR)}</p>

            <span class="detail-section-label label-facts">📊 key facts</span>
            <ul class="detail-facts">${factsHTML}</ul>

            <span class="detail-section-label label-visual">🎬 visual direction</span>
            <div class="detail-visual">${esc(card.visual_direction)}</div>

            <div class="detail-footer">
                <div>
                    <p class="detail-footer-source-label">Source</p>
                    <p class="detail-footer-source">${esc(card.source || "Fin-Z")}</p>
                </div>
                <div class="detail-footer-icon">↗</div>
            </div>
        `;

        detailPanel.classList.add("open");
        detailPanel.scrollTop = 0;
    }

    function closeDetail() {
        showDetail = false;
        detailPanel.classList.remove("open");
    }

    detailBack.addEventListener("click", closeDetail);

    // ── Vertical swipe (touch) ──────────────────────────────────────────
    let startX = 0, startY = 0, dragging = false;

    viewport.addEventListener("touchstart", (e) => {
        if (showDetail) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dragging = true;
    }, { passive: true });

    viewport.addEventListener("touchend", (e) => {
        if (!dragging || showDetail) return;
        dragging = false;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        const threshold = 50;

        if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical swipe
            if (dy < -threshold) goNext();
            else if (dy > threshold) goPrev();
        } else {
            // Horizontal — swipe right opens detail
            if (dx > threshold) openDetail();
        }
    });

    // ── Mouse wheel (desktop) ───────────────────────────────────────────
    let wheelTimeout = false;
    viewport.addEventListener("wheel", (e) => {
        if (showDetail || wheelTimeout) return;
        if (e.deltaY > 30) { goNext(); wheelTimeout = true; }
        else if (e.deltaY < -30) { goPrev(); wheelTimeout = true; }
        if (wheelTimeout) setTimeout(() => wheelTimeout = false, 500);
    }, { passive: true });

    // ── Keyboard ────────────────────────────────────────────────────────
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            if (showDetail) return;
            goNext();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            if (showDetail) return;
            goPrev();
        } else if (e.key === "Enter") {
            if (!showDetail) openDetail();
        } else if (e.key === "Escape" || e.key === "Backspace") {
            if (showDetail) closeDetail();
        }
    });

    // ── Desktop nav buttons ─────────────────────────────────────────────
    if (deskUp) deskUp.addEventListener("click", goPrev);
    if (deskDown) deskDown.addEventListener("click", goNext);

    // ── Detail panel swipe-left to close ─────────────────────────────────
    let detailStartX = 0;
    detailPanel.addEventListener("touchstart", (e) => {
        detailStartX = e.touches[0].clientX;
    }, { passive: true });

    detailPanel.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - detailStartX;
        if (dx < -80) closeDetail(); // swipe left to close
    });

    // ── Load data ───────────────────────────────────────────────────────
    async function loadSamples() {
        try {
            const res = await fetch("/api/samples");
            if (!res.ok) throw new Error("Failed");
            cards = await res.json();
            renderAll();
        } catch (err) {
            console.error(err);
            track.innerHTML = `<div class="news-card" style="display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.4);font-size:0.9rem;">Failed to load feed 😔</div>`;
        }
    }

    loadSamples();
})();
