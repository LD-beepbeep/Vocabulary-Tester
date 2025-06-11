// --- Onboarding Flow ---
const ONBOARD_LANGS = [
  { code: "fr-nl", label: "French ⇄ Dutch" },
  { code: "en-nl", label: "English ⇄ Dutch" }
];
const LEVELS = [
  { val: "basic", label: "Basic" },
  { val: "intermediate", label: "Intermediate" },
  { val: "advanced", label: "Advanced" }
];

function onboardingFlow() {
  const onboarding = document.getElementById("onboarding-modal");
  if (!onboarding) return;
  // Only show onboarding if not set
  if (localStorage.getItem("voc_onboard")) {
    onboarding.classList.remove("active");
    return;
  }
  onboarding.classList.add("active");
  document.querySelectorAll('.screen').forEach(s => s.classList.remove("active"));
  // Step logic
  let selectedLangs = [];
  let selectedMotivation = "school";
  let levels = {};
  // Step 1: Language selection
  function showStep1() {
    onboarding.querySelectorAll('.onboard-step').forEach(s=>s.style.display="none");
    document.getElementById("onboard-step-lang").style.display="block";
  }
  // Step 2: Motivation
  function showStep2() {
    onboarding.querySelectorAll('.onboard-step').forEach(s=>s.style.display="none");
    document.getElementById("onboard-step-motivation").style.display="block";
  }
  // Step 3: Levels
  function showStep3() {
    onboarding.querySelectorAll('.onboard-step').forEach(s=>s.style.display="none");
    // Build levels select for each chosen language
    let html = "";
    selectedLangs.forEach(pair => {
      html += `<label>${ONBOARD_LANGS.find(l=>l.code===pair).label}:
        <select name="level-${pair}" required>
          ${LEVELS.map(l=>`<option value="${l.val}">${l.label}</option>`).join("")}
        </select>
      </label>`;
    });
    document.getElementById("levels").innerHTML = html;
    document.getElementById("onboard-step-level").style.display="block";
  }
  // Next buttons
  document.getElementById("onboard-next-motivation").onclick = function() {
    selectedLangs = Array.from(document.querySelectorAll('[name="langs"]:checked')).map(cb=>cb.value);
    if (!selectedLangs.length) return alert("Select at least one language pair!");
    showStep2();
  };
  document.getElementById("onboard-next-level").onclick = function() {
    selectedMotivation = document.getElementById("motivation").value;
    showStep3();
  };
  document.getElementById("onboard-form").onsubmit = function(e) {
    e.preventDefault();
    // Collect levels per chosen lang
    levels = {};
    selectedLangs.forEach(pair=>{
      levels[pair] = onboarding.querySelector(`[name='level-${pair}']`).value;
    });
    localStorage.setItem("voc_onboard", JSON.stringify({
      langs: selectedLangs,
      levels,
      motivation: selectedMotivation
    }));
    onboarding.classList.remove("active");
    showApp();
  };
  showStep1();
}
onboardingFlow();

// --- Backgrounds ---
const BACKGROUNDS = [
  { id: 0, name: "Default", preview: "linear-gradient(120deg, #141b2c 0%, #6e7bf7 120%)", anim: "bg-blob-layer" },
  { id: 1, name: "Sparkle Night", preview: "url('https://assets.ld-beepbeep.pages.dev/sparkles.svg')", anim: "bg-sparkles" },
  { id: 2, name: "Tech Grid", preview: "linear-gradient(135deg, #232942 0%, #38cfa7 100%)", anim: "bg-grid" },
  { id: 3, name: "Sunset", preview: "linear-gradient(120deg, #ffb347 0%, #ff5f6d 100%)", anim: "bg-sunset" },
  { id: 4, name: "Aurora", preview: "linear-gradient(120deg, #00c3ff 0%, #ffff1c 100%)", anim: "bg-aurora" },
  { id: 5, name: "Matrix", preview: "linear-gradient(120deg, #232942 0%, #00ff99 100%)", anim: "bg-matrix" }
];
function getUnlockedBackgrounds() {
  let unlocked = JSON.parse(localStorage.getItem('voc_bg_unlocked')||'[0]');
  if (isAdmin()) return BACKGROUNDS.map(b=>b.id);
  return unlocked;
}
function unlockNextBackground() {
  let unlocked = getUnlockedBackgrounds();
  let next = BACKGROUNDS.find(b=>!unlocked.includes(b.id));
  if (next) {
    unlocked.push(next.id);
    localStorage.setItem('voc_bg_unlocked', JSON.stringify(unlocked));
    showConfetti();
    setTimeout(()=>{
      alert(`🎉 New background unlocked: ${next.name}! Check the gallery!`);
    }, 500);
  }
}
function setBackground(id) {
  localStorage.setItem('voc_bg_selected', id);
  applyBackground(id);
}
function applyBackground(id) {
  document.body.classList.remove(...BACKGROUNDS.map(b=>b.anim));
  let bg = BACKGROUNDS.find(b=>b.id==id);
  if (!bg) bg = BACKGROUNDS[0];
  document.body.classList.add(bg.anim);
}
function showBackgroundGallery() {
  const unlocked = getUnlockedBackgrounds();
  const selected = parseInt(localStorage.getItem('voc_bg_selected')||0);
  let html = BACKGROUNDS.map(bg=>
    `<div class="background-card${unlocked.includes(bg.id)?'':' locked'}${selected===bg.id?' selected':''}" onclick="${unlocked.includes(bg.id)?`setBackground(${bg.id})`:'showLockedBg()'}">
      <div class="background-preview" style="background:${bg.preview};"></div>
      <div>${bg.name}</div>
      ${unlocked.includes(bg.id)?(selected===bg.id?'<span style="color:var(--accent);font-weight:700;">Selected</span>':'<span style="color:var(--primary);">Unlocked</span>'):'<span class="lock-icon">🔒</span>'}
    </div>`
  ).join('');
  document.getElementById('background-gallery-list').innerHTML = html;
  showModal('background-gallery-modal');
}
window.showLockedBg = function() { alert('Unlock this background by reaching a new 7-day streak!'); };
// --- Streak logic with unlock ---
function getStreakData() {
  return JSON.parse(localStorage.getItem("voc_streak") || '{"count":0,"last":""}');
}
function updateStreak() {
  const streak = getStreakData();
  let today = new Date().toISOString().slice(0,10);
  if (streak.last !== today) {
    let yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    streak.count = (streak.last === yesterday) ? streak.count+1 : 1;
    streak.last = today;
    localStorage.setItem("voc_streak", JSON.stringify(streak));
    if (streak.count % 7 === 0) unlockNextBackground();
  }
  // Optionally update a streak bar if you want
}
updateStreak();

// --- Login logic (with admin God Mode) ---
window.tryLogin = function() {
  const uname = document.getElementById('login-username').value.trim();
  const pw = document.getElementById('login-password').value;
  const error = document.getElementById('login-error');
  if (!uname || !pw) { error.textContent = "Please enter username and password."; return; }
  if (uname.toLowerCase()==='admin' && pw==='lars') {
    localStorage.setItem('voc_user_current', 'admin');
    localStorage.setItem('voc_user_current_pw', 'lars');
    showApp();
    document.getElementById('god-mode-badge').style.display = '';
    document.getElementById('admin-panel-btn').style.display = '';
    return;
  }
  const userKey = `voc_user_${uname}`;
  const stored = JSON.parse(localStorage.getItem(userKey) || "{}" );
  if (!stored.password) {
    localStorage.setItem(userKey, JSON.stringify({password: pw}));
    localStorage.setItem("voc_user_current", uname);
    showApp();
    return;
  }
  if (stored.password === pw) {
    localStorage.setItem("voc_user_current", uname);
    showApp();
    return;
  }
  if (confirm("Wrong password. Forgot password?")) {
    const npw = prompt("Enter a new password:");
    if (npw && npw.length >= 1) {
      localStorage.setItem(userKey, JSON.stringify({password: npw}));
      localStorage.setItem("voc_user_current", uname);
      showApp();
      return;
    }
  }
  error.textContent = "Wrong password. Try again.";
};
function showApp() {
  document.getElementById('login-screen').style.display = "none";
  document.getElementById('login-screen').classList.remove("active");
  Array.from(document.querySelectorAll('.screen')).forEach(s=>{
    if(s.id!=="login-screen") s.style.display="";
    s.classList.remove('active');
  });
  document.getElementById('main-menu').classList.add('active');
  document.getElementById('language-selector').style.display = "";
  window.updateAll && window.updateAll();
  updateStreak();
  // Show God Mode badge/admin panel if admin
  if (isAdmin()) {
    document.getElementById('god-mode-badge').style.display = '';
    document.getElementById('admin-panel-btn').style.display = '';
  } else {
    document.getElementById('god-mode-badge').style.display = 'none';
    document.getElementById('admin-panel-btn').style.display = 'none';
  }
}
window.logout = function() {
  localStorage.removeItem("voc_user_current");
  document.getElementById('login-username').value = "";
  document.getElementById('login-password').value = "";
  document.getElementById('login-error').textContent = "";
  document.getElementById('login-screen').style.display = "flex";
  document.getElementById('login-screen').classList.add('active');
  Array.from(document.querySelectorAll('.screen')).forEach(s=>{
    if(s.id!=="login-screen") s.style.display="none";
    s.classList.remove('active');
  });
  document.getElementById('language-selector').style.display = "none";
};
window.currentUser = function() {
  return localStorage.getItem("voc_user_current") || "";
};
function isAdmin() {
  return window.currentUser && window.currentUser().toLowerCase()==='admin' && localStorage.getItem('voc_user_current_pw')==='lars';
}

// --- Modal logic ---
function showModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

// --- Confetti ---
function showConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.style.display = '';
  // Simple confetti animation (placeholder, can be replaced with a library)
  setTimeout(()=>{canvas.style.display='none';}, 1800);
}

// --- Sound toggle ---
let soundOn = JSON.parse(localStorage.getItem('voc_sound_on')||'true');
function toggleSound() {
  soundOn = !soundOn;
  localStorage.setItem('voc_sound_on', soundOn);
  document.getElementById('sound-toggle').classList.toggle('muted', !soundOn);
}
document.getElementById('sound-toggle').onclick = toggleSound;

// --- Dark/Light mode toggle ---
let darkMode = JSON.parse(localStorage.getItem('voc_dark_mode')||'true');
function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('voc_dark_mode', darkMode);
  document.body.classList.toggle('dark-mode', darkMode);
  document.getElementById('dark-mode-toggle').classList.toggle('active', darkMode);
}
document.getElementById('dark-mode-toggle').onclick = toggleDarkMode;

// --- Keyboard shortcuts ---
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key==='b') showBackgroundGallery();
  if (e.ctrlKey && e.key==='a') showModal('achievements-modal');
  if (e.ctrlKey && e.key==='p') showModal('privacy-modal');
  if (e.ctrlKey && e.key==='h') showModal('shortcuts-modal');
  if (e.key==='Escape') document.querySelectorAll('.modal.active').forEach(m=>closeModal(m.id));
});

// --- Achievements ---
function updateAchievements() {
  // Example: streak, words added, accuracy, backgrounds unlocked
  let streak = getStreakData().count;
  let words = allWords().length;
  let acc = 100; // Placeholder
  let bgs = getUnlockedBackgrounds().length;
  let html = '';
  html += `<div class="achievement-badge${streak>=7?' unlocked':' locked'}">🔥<br>7 Day Streak</div>`;
  html += `<div class="achievement-badge${words>=50?' unlocked':' locked'}">📚<br>50 Words</div>`;
  html += `<div class="achievement-badge${acc>=90?' unlocked':' locked'}">🎯<br>90% Accuracy</div>`;
  html += `<div class="achievement-badge${bgs>=BACKGROUNDS.length?' unlocked':' locked'}">🌈<br>All Backgrounds</div>`;
  document.getElementById('achievements-list').innerHTML = html;
}

// --- Quiz Mode Selector Logic ---
let quizMode = 'typing'; // default
function showQuizModeSelector() {
  document.getElementById('quiz-mode-modal').classList.add('active');
  document.getElementById('quiz-mode-modal').classList.add('modal', 'active');
}
function hideQuizModeSelector() {
  document.getElementById('quiz-mode-modal').classList.remove('active');
  document.getElementById('quiz-mode-modal').classList.remove('modal', 'active');
}
window.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = function() {
      quizMode = this.dataset.mode;
      hideQuizModeSelector();
      startQuiz(quizMode);
    };
  });
  document.getElementById('close-mode-modal').onclick = hideQuizModeSelector;
  // Replace main menu Start Quiz click
  //const quizCard = document.querySelector('#main-menu .nav-card[onclick*="startQuiz"]');
  //if (quizCard) quizCard.onclick = showQuizModeSelector;
  // Background gallery button
  document.querySelector('button[onclick*="background-gallery-modal"]').onclick = showBackgroundGallery;
  // Achievements update
  document.querySelector('button[onclick*="achievements-modal"]').onclick = updateAchievements;
});

// --- Your working vocab/quiz logic (from working_js.js) ---
// (Paste your previous quiz, vocab, stats, add word, bulk upload, hard words, etc. logic here)
// --- Language pairs and vocab ---
const ALLOWED_PAIRS = [
  ["fr", "nl"],
  ["en", "nl"]
];
const LANGUAGES = [
  { code: "fr", name: "French" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" }
];
const VOCAB = {
  "fr-nl": [
    ["la pomme", "de appel"],
    ["le pain", "het brood"],
    ["le livre", "het boek"],
    ["le chat", "de kat"],
    ["la maison", "het huis"]
  ],
  "en-nl": [
    ["apple", "appel"],
    ["book", "boek"],
    ["cat", "kat"],
    ["house", "huis"],
    ["water", "water"]
  ]
};
let currentPair = ["fr", "nl"];
function updateLangSelector() {
  const sel = document.getElementById('lang-choice');
  sel.innerHTML = ALLOWED_PAIRS.map(([from, to]) =>
    `<option value="${from}-${to}">${getLangName(from)} ⇄ ${getLangName(to)}</option>`
  ).join('');
  sel.value = currentPair.join('-');
}
function getLangName(code) {
  const l = LANGUAGES.find(l => l.code === code);
  return l ? l.name : code;
}
function pairKey() { return `voc_${window.currentUser()}_custom_${currentPair[0]}_${currentPair[1]}`; }
function pairHardKey() { return `voc_${window.currentUser()}_hard_${currentPair[0]}_${currentPair[1]}`; }
function loadCustomWords() { return JSON.parse(localStorage.getItem(pairKey())) || []; }
function saveCustomWords(words) { localStorage.setItem(pairKey(), JSON.stringify(words)); }
function loadHardWords() { return JSON.parse(localStorage.getItem(pairHardKey())) || []; }
function saveHardWords(words) { localStorage.setItem(pairHardKey(), JSON.stringify(words)); }
function allWords() {
  const base = VOCAB[`${currentPair[0]}-${currentPair[1]}`] || VOCAB[`${currentPair[1]}-${currentPair[0]}`]?.map(([a,b])=>[b,a]) || [];
  return base.concat(loadCustomWords());
}
let statsAll = JSON.parse(localStorage.getItem("VOC_STATS") || "{}");
function saveStats() { localStorage.setItem("VOC_STATS", JSON.stringify(statsAll)); }
function getStatsKey() { return window.currentUser() + "_" + currentPair.join("-"); }
function getStats() {
  if (!statsAll[getStatsKey()]) {
    statsAll[getStatsKey()] = {
      from_to: { correct: 0, total: 0 },
      to_from: { correct: 0, total: 0 },
      total_correct: 0, total_total: 0
    };
  }
  return statsAll[getStatsKey()];
}
function incStat(dir, correct) {
  let s = getStats();
  s.total_total++;
  if (correct) s.total_correct++;
  if (dir === "from_to" || dir === "to_from") {
    s[dir].total++;
    if (correct) s[dir].correct++;
  }
  saveStats();
}
function updateRecentAdditions() {
  const container = document.getElementById('recent-list');
  if (!container) return;
  const all = loadCustomWords();
  container.innerHTML = all.length
    ? all.slice(-10).reverse().map(([from, to], i) =>
      `<div class="recent-item">
        <strong>${from}</strong> → ${to}
        <button class="remove-hard-btn" onclick="window.removeCustomWord(${all.length-1-i})">Remove</button>
      </div>`
    ).join('')
    : '<p style="color:#8fa9cc;">No custom words added yet.</p>';
}
window.removeCustomWord = function(idx) {
  const all = loadCustomWords();
  all.splice(idx, 1);
  saveCustomWords(all);
  updateRecentAdditions();
  updateUI();
};
function updateHardWordsList() {
  const container = document.getElementById('hard-words-list');
  const clearBtn = document.getElementById('clear-hard-btn');
  if (!container) return;
  const all = loadHardWords();
  container.innerHTML = all.length
    ? all.map((hw, i) => `
      <div class="hard-word-item">
        <div class="hard-word-content">${i + 1}. ${hw.question} → ${hw.answer}</div>
        <button class="remove-hard-btn" onclick="window.removeHardWord(${i})">Remove</button>
      </div>`).join('')
    : '<p style="color:#8fa9cc;">No hard words yet!</p>';
  if (clearBtn) clearBtn.style.display = all.length ? 'inline-block' : 'none';
}
window.removeHardWord = function(idx) {
  const all = loadHardWords();
  all.splice(idx, 1);
  saveHardWords(all);
  updateHardWordsList();
  updateUI();
};
window.clearHardWords = function() {
  if (confirm('Are you sure you want to clear all hard words?')) {
    saveHardWords([]);
    updateHardWordsList();
    updateUI();
  }
};
window.addNewWord = function() {
  const from = document.getElementById('custom-from-word').value.trim();
  const to = document.getElementById('custom-to-word').value.trim();
  if (!from || !to) return alert('Please fill in both fields!');
  const all = loadCustomWords();
  if (all.some(([f, t]) => f === from && t === to)) return alert('Word exists.');
  all.push([from, to]);
  saveCustomWords(all);
  document.getElementById('custom-from-word').value = '';
  document.getElementById('custom-to-word').value = '';
  updateRecentAdditions();
  updateUI();
  alert('Word added!');
};
document.addEventListener("DOMContentLoaded", function() {
  const bulkBtn = document.getElementById('bulk-upload-btn');
  if (bulkBtn) bulkBtn.onclick = function() {
    const file = document.getElementById('bulk-upload-file').files[0];
    const from = document.getElementById('bulk-from-lang').value;
    const to = document.getElementById('bulk-to-lang').value;
    if (!file) return alert("Select a file!");
    if (from === to) return alert("Pick different languages!");
    const reader = new FileReader();
    reader.onload = function(e) {
      let lines = e.target.result.split(/\r?\n/).filter(Boolean);
      let pairs = [];
      for (let line of lines) {
        let parts = line.split(/[,;|\t\-–—]/);
        if (parts.length < 2) continue;
        let left = parts[0].trim();
        let right = parts.slice(1).join(' ').trim();
        if (!left || !right) continue;
        pairs.push([left, right]);
      }
      const key = `voc_${window.currentUser()}_custom_${from}_${to}`;
      let existing = JSON.parse(localStorage.getItem(key) || "[]");
      let before = existing.length;
      let added = 0;
      let skippedDup = 0;
      let actualAddedPairs = [];
      for (let [left, right] of pairs) {
        if (existing.some(([l, r]) => l === left && r === right)) {
          skippedDup++;
          continue;
        }
        existing.push([left, right]);
        actualAddedPairs.push([left, right]);
        added++;
      }
      localStorage.setItem(key, JSON.stringify(existing));
      let preview = document.getElementById('bulk-upload-preview');
      preview.innerHTML =
        `<b>Found:</b> ${pairs.length} pairs.<br><b>Added:</b> ${added} new word pairs.<br>` +
        (skippedDup ? `<b>Skipped:</b> ${skippedDup} duplicates.<br>` : "") +
        (actualAddedPairs.length ? `<b>Pairs added:</b><br><div style='max-height:140px;overflow:auto;line-height:1.6em'>${actualAddedPairs.map(p=>`${p[0]} → ${p[1]}`).join('<br>')}</div>` : "No new pairs added.") +
        `<br><button class="btn" onclick="showScreen('main-menu')">Back to Menu</button>`;
      window.updateAll && window.updateAll();
    };
    reader.readAsText(file);
  };
});
let quizState = {
  isHard: false,
  isCustom: false,
  qNum: 0,
  currentQ: null,
  currentA: null,
  currentDir: null,
  pendingHard: null,
  quizPair: null
};
function randomQuizPair() {
  if (document.getElementById('lang-choice')) {
    const [from, to] = document.getElementById('lang-choice').value.split('-');
    currentPair = [from, to];
  }
  return currentPair;
}
function generateQuestion() {
  quizState.quizPair = randomQuizPair();
  let pairs;
  let [fromLang, toLang] = quizState.quizPair;
  if (quizState.isHard) {
    pairs = loadHardWords().map(hw => [hw.question, hw.answer]);
  } else if (quizState.isCustom) {
    pairs = loadCustomWords();
  } else {
    pairs = allWords();
  }
  if (!pairs.length) return null;
  const [from, to] = pairs[Math.floor(Math.random() * pairs.length)];
  const askFrom = Math.random() < 0.5;
  quizState.currentQ = askFrom ? from : to;
  quizState.currentA = askFrom ? to : from;
  quizState.currentDir = askFrom ? 'from_to' : 'to_from';
  quizState.qNum++;
  let fromName = getLangName(fromLang);
  let toName = getLangName(toLang);
  let label = askFrom ? `${fromName} → ${toName}` : `${toName} → ${fromName}`;
  document.getElementById('quiz-direction-label').textContent = label;
  return { question: quizState.currentQ, answer: quizState.currentA, direction: quizState.currentDir };
}
window.startQuiz = function(mode) {
  quizState.isHard = false;
  quizState.isCustom = false;
  quizState.qNum = 0;
  // TODO: Use mode to switch quiz type (typing, multiple, flashcard, listening)
  showScreen('quiz-screen');
  nextQuestion();
};
window.practiceHardWords = function() {
  quizState.isHard = true;
  quizState.isCustom = false;
  quizState.qNum = 0;
  showScreen('quiz-screen');
  nextQuestion();
};
window.practiceCustomWords = function() {
  quizState.isCustom = true;
  quizState.isHard = false;
  quizState.qNum = 0;
  showScreen('quiz-screen');
  nextQuestion();
};
function nextQuestion() {
  const q = generateQuestion();
  if (!q) { alert("No vocabulary available!"); showScreen('main-menu'); return; }
  document.getElementById('question-direction').textContent = "";
  document.getElementById('question-text').textContent = q.question;
  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').focus();
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';
  updateUI();
}
window.submitAnswer = function() {
  const userAnswer = document.getElementById('answer-input').value.trim();
  if (!userAnswer) { alert('Please enter an answer!'); return; }
  const correct = normalizeAnswer(userAnswer) === normalizeAnswer(quizState.currentA);
  incStat(quizState.currentDir, correct);
  if (correct) {
    document.getElementById('feedback').textContent = '✅ Correct! Well done!';
    document.getElementById('feedback').className = 'feedback correct';
    setTimeout(nextQuestion, 900);
  } else {
    document.getElementById('feedback').textContent = `❌ Incorrect. The correct answer is: ${quizState.currentA}`;
    document.getElementById('feedback').className = 'feedback incorrect';
    quizState.pendingHard = {
      question: quizState.currentQ,
      answer: quizState.currentA,
      direction: quizState.currentDir
    };
    setTimeout(showHardWordsModal, 900);
  }
  updateUI();
};
window.addToHardWords = function(shouldAdd) {
  if (shouldAdd && quizState.pendingHard) {
    let all = loadHardWords();
    if (!all.some(hw => hw.question === quizState.pendingHard.question && hw.answer === quizState.pendingHard.answer))
    {
      all.push(quizState.pendingHard);
      saveHardWords(all);
      updateHardWordsList();
    }
  }
  document.getElementById('hard-words-modal').classList.remove('active');
  document.body.style.overflow = '';
  quizState.pendingHard = null;
  setTimeout(nextQuestion, 500);
};
function showHardWordsModal() {
  const modal = document.getElementById('hard-words-modal');
  document.body.style.overflow = 'hidden';
  modal.classList.add('active');
  modal.focus();
}
function normalizeAnswer(ans) {
  return (ans||"").toLowerCase().trim().replace(/[.,;:!?()"'-]/g, '').replace(/\s+/g, ' ');
}
function updateUI() {
  document.getElementById('vocab-count').textContent = allWords().length;
  document.getElementById('hard-count').textContent = loadHardWords().length;
  let s = getStats();
  document.getElementById('current-score').textContent =
    `${s.total_correct}/${s.total_total}`;
  const percentage = s.total_total > 0 ?
    Math.round((s.total_correct / s.total_total) * 100) : 0;
  document.getElementById('score-percentage').textContent = `${percentage}%`;
  document.getElementById('question-number').textContent = quizState.qNum;
}
window.showScreen = function(screenId) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  if (screenId === 'add-word-menu') updateRecentAdditions();
  if (screenId === 'practice-hard-menu') {
    updateRecentAdditions('recent-list-hard');
    updateHardWordsList();
  }
  if (screenId === 'main-menu') {
    updateRecentAdditions();
    updateHardWordsList();
    updateUI();
  }
  if (screenId === 'upload-bulk-menu') {
    if (document.getElementById('bulk-upload-preview'))
      document.getElementById('bulk-upload-preview').innerHTML = '';
  }
};
window.showStatsScreen = function() {
  updateStatsDisplay();
  showScreen('stats-screen');
};
function updateStatsDisplay() {
  let s = getStats();
  document.getElementById('total-questions').textContent = s.total_total;
  document.getElementById('correct-answers').textContent = s.total_correct;
  const acc = s.total_total > 0 ? Math.round((s.total_correct / s.total_total) * 100) : 0;
  document.getElementById('accuracy').textContent = `${acc}%`;
}
window.updateAll = function() {
  updateLangSelector();
  updateRecentAdditions();
  updateHardWordsList();
  updateUI();
};
document.addEventListener('DOMContentLoaded', function () {
  // Apply selected background
  applyBackground(localStorage.getItem('voc_bg_selected')||0);
  if (localStorage.getItem("voc_user_current")) showApp();
  updateLangSelector();
  updateRecentAdditions();
  updateHardWordsList();
  updateUI();
  if (document.getElementById('custom-to-word'))
    document.getElementById('custom-to-word').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') window.addNewWord();
    });
  if (document.getElementById('custom-from-word'))
    document.getElementById('custom-from-word').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('custom-to-word').focus();
    });
  document.getElementById('lang-choice').onchange = function() {
    currentPair = this.value.split('-');
    window.updateAll();
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.getElementById('hard-words-modal').classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});
