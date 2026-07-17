// Office Skills Practice — App Logic

const state = {
  subjectKey: null,
  order: [],       // shuffled question indices for current session
  current: 0,
  selected: null,  // selected option index for current question
  locked: false,   // true after answering, before moving on
  answers: [],     // {qIndex, chosen, correct}
};

const root = document.getElementById("app");

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function bestScore(key) {
  try {
    const v = localStorage.getItem("osp-best-" + key);
    return v ? JSON.parse(v) : null;
  } catch (e) { return null; }
}

function saveBestScore(key, correct, total) {
  try {
    const prev = bestScore(key);
    const pct = Math.round((correct / total) * 100);
    if (!prev || pct > prev.pct) {
      localStorage.setItem("osp-best-" + key, JSON.stringify({ pct, correct, total }));
    }
  } catch (e) { /* ignore storage errors */ }
}

function gaugeSVG(accent, pct) {
  // Semi-circle gauge, 0-100%
  const r = 26, cx = 28, cy = 28;
  const circumference = Math.PI * r; // half circle length
  const offset = circumference * (1 - pct / 100);
  return `
    <svg class="gauge" viewBox="0 0 56 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 2 28 A 26 26 0 0 1 54 28" stroke="var(--hairline)" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M 2 28 A 26 26 0 0 1 54 28" stroke="${accent}" stroke-width="5" stroke-linecap="round" fill="none"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
    </svg>`;
}

function scoreRingSVG(accent, pct) {
  const r = 50, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  return `
    <svg class="score-ring" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="var(--hairline)" stroke-width="10" fill="none"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${accent}" stroke-width="10" fill="none"
        stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-family="IBM Plex Mono, monospace"
        font-size="26" font-weight="600" fill="var(--ink)">${pct}%</text>
    </svg>`;
}

function renderMenu() {
  const keys = Object.keys(QUESTION_BANK);
  root.innerHTML = `
    <div class="masthead">
      <div>
        <div class="eyebrow">Practice Binder</div>
        <h1>Office Skills Practice</h1>
      </div>
      <p class="sub">Four short assessments — Word, Excel, PowerPoint, and AI Usage. 20 questions each, instant feedback, no sign-in required.</p>
    </div>
    <div class="binder">
      ${keys.map(k => {
        const s = QUESTION_BANK[k];
        const best = bestScore(k);
        return `
        <button class="tab-card" style="--accent:${s.color}; --accent-tint:${s.color}1A" data-key="${k}">
          <div class="tab-mark">${initials(s.label)}</div>
          <h3>${s.label}</h3>
          <p>${s.tagline}</p>
          <div class="tab-meta">
            <span>${s.questions.length} questions</span>
            <span class="best-score">${best ? "Best: " + best.pct + "%" : "Not attempted"}</span>
          </div>
        </button>`;
      }).join("")}
    </div>
    <footer class="credit">Built for practice &amp; self-assessment · scores are stored only in your browser</footer>
  `;

  root.querySelectorAll(".tab-card").forEach(el => {
    el.addEventListener("click", () => startQuiz(el.dataset.key));
  });
}

function initials(label) {
  if (label.includes("Word")) return "W";
  if (label.includes("Excel")) return "X";
  if (label.includes("PowerPoint")) return "P";
  return "AI";
}

function startQuiz(key) {
  const subject = QUESTION_BANK[key];
  state.subjectKey = key;
  state.order = shuffle(subject.questions.map((_, i) => i)).slice(0, 20);
  state.current = 0;
  state.selected = null;
  state.locked = false;
  state.answers = [];
  renderQuiz();
}

function renderQuiz() {
  const subject = QUESTION_BANK[state.subjectKey];
  const total = state.order.length;
  const qIndex = state.order[state.current];
  const q = subject.questions[qIndex];
  const pct = Math.round((state.current / total) * 100);
  const accent = subject.color;

  root.innerHTML = `
    <div class="quiz-header" style="--accent:${accent}">
      <button class="back-btn" id="backBtn">&larr; Menu</button>
      <div class="gauge-wrap">
        ${gaugeSVG(accent, pct)}
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-label">${state.current + 1} / ${total}</div>
      </div>
    </div>
    <div class="question-card" style="--accent:${accent}">
      <div class="q-eyebrow">${subject.label}</div>
      <h2>${q.q}</h2>
      <div id="options"></div>
      <div class="note-box" id="noteBox"></div>
      <div class="quiz-actions">
        <button class="btn" id="nextBtn" disabled>${state.current === total - 1 ? "See Results" : "Next Question"}</button>
      </div>
    </div>
  `;

  const optionsEl = document.getElementById("options");
  q.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "option";
    div.innerHTML = `<span class="marker">&#10003;</span><span>${opt}</span>`;
    div.addEventListener("click", () => selectOption(i, q, div));
    optionsEl.appendChild(div);
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    if (confirm("Leave this test? Your progress on this attempt will be lost.")) renderMenu();
  });
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
}

function selectOption(i, q, el) {
  if (state.locked) return;
  state.locked = true;
  state.selected = i;

  const isCorrect = i === q.correct;
  state.answers.push({ q, chosen: i, correct: isCorrect });

  const options = document.querySelectorAll(".option");
  options.forEach((opt, idx) => {
    opt.classList.add("disabled");
    if (idx === q.correct) opt.classList.add("correct-answer");
    else if (idx === i) opt.classList.add("wrong-answer");
    if (idx === i) opt.classList.add("selected");
  });

  const noteBox = document.getElementById("noteBox");
  noteBox.textContent = (isCorrect ? "Correct — " : "Not quite — ") + q.note;
  noteBox.classList.add("visible");

  document.getElementById("nextBtn").disabled = false;
}

function nextQuestion() {
  if (state.current < state.order.length - 1) {
    state.current++;
    state.selected = null;
    state.locked = false;
    renderQuiz();
  } else {
    renderResults();
  }
}

function renderResults() {
  const subject = QUESTION_BANK[state.subjectKey];
  const accent = subject.color;
  const correctCount = state.answers.filter(a => a.correct).length;
  const total = state.answers.length;
  const pct = Math.round((correctCount / total) * 100);
  saveBestScore(state.subjectKey, correctCount, total);

  let headline = "Keep practicing";
  if (pct >= 90) headline = "Excellent work";
  else if (pct >= 75) headline = "Strong result";
  else if (pct >= 50) headline = "Good start";

  root.innerHTML = `
    <div class="quiz-header" style="--accent:${accent}">
      <button class="back-btn" id="backBtn">&larr; Menu</button>
    </div>
    <div class="results-hero" style="--accent:${accent}">
      ${scoreRingSVG(accent, pct)}
      <div>
        <h2>${headline} — ${subject.label}</h2>
        <p><span class="score-number">${correctCount} / ${total}</span> correct on this attempt.</p>
      </div>
    </div>
    <div class="review-list" id="reviewList"></div>
    <div class="results-actions">
      <button class="btn btn-ghost" id="retryBtn">Retry this test</button>
      <button class="btn" id="menuBtn" style="--accent:${accent}">Choose another test</button>
    </div>
  `;

  const list = document.getElementById("reviewList");
  state.answers.forEach((a, i) => {
    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `
      <div class="r-top">
        <span class="badge ${a.correct ? "correct" : "incorrect"}">${a.correct ? "&#10003;" : "&#10005;"}</span>
        <span>${i + 1}. ${a.q.q}</span>
      </div>
      <div class="r-answer">${a.correct ? "Your answer: " + a.q.options[a.chosen] : "Your answer: " + a.q.options[a.chosen] + " · Correct answer: " + a.q.options[a.q.correct]}</div>
    `;
    list.appendChild(div);
  });

  document.getElementById("backBtn").addEventListener("click", renderMenu);
  document.getElementById("menuBtn").addEventListener("click", renderMenu);
  document.getElementById("retryBtn").addEventListener("click", () => startQuiz(state.subjectKey));
}

renderMenu();
