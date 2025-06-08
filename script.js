// --- Profile pic and backgrounds ---
const BACKGROUNDS = [
  { name: "Default Blue", value: "linear-gradient(120deg, #151c28 0%, #26354d 100%)" },
  { name: "Sunset", value: "linear-gradient(135deg, #e96443 0%, #904e95 100%)" },
  { name: "Forest", value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { name: "Purple Night", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Gold", value: "linear-gradient(135deg,#ffe259 0%,#ffa751 100%)" }
];
function loadProfilePic() {
  const img = localStorage.getItem("voc_profilepic");
  document.getElementById("profile-pic").src = img || "default-profile.png";
}
function saveProfilePic(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    localStorage.setItem("voc_profilepic", e.target.result);
    loadProfilePic();
  };
  reader.readAsDataURL(file);
}
document.getElementById("profile-pic-input").onchange = function(e) {
  if (e.target.files[0]) saveProfilePic(e.target.files[0]);
};
document.getElementById("profile-pic").onclick = function() {
  document.getElementById("profile-pic-input").click();
};
function setupBgPicker() {
  const select = document.getElementById("bg-picker");
  select.innerHTML = BACKGROUNDS.map((b, i) => `<option value="${i}">${b.name}</option>`).join("");
  const bg = localStorage.getItem("voc_bg") || "0";
  select.value = bg;
  document.body.style.background = BACKGROUNDS[bg].value;
  select.onchange = () => {
    localStorage.setItem("voc_bg", select.value);
    document.body.style.background = BACKGROUNDS[select.value].value;
  };
}
loadProfilePic(); setupBgPicker();

// --- Streak logic ---
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
  }
  document.getElementById("streak-bar").innerHTML =
    `🔥 Streak: ${streak.count} day${streak.count!==1?"s":""} ${streak.count>=7?"<span style='color:gold'>🌟</span>":""}`;
  // Change background if streak >= 7
  if(streak.count>=7) document.body.style.background = BACKGROUNDS[4].value;
  else {
    const bg = localStorage.getItem("voc_bg") || "0";
    document.body.style.background = BACKGROUNDS[bg].value;
  }
}
updateStreak();

// --- Onboarding/first login ---
if (!localStorage.getItem("voc_onboard")) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove("active"));
  document.getElementById("onboarding-screen").classList.add("active");
  // Fill language levels
  let lvls = "";
  ["fr-nl","en-nl"].forEach(pair => {
    lvls += `<label>${pair.replace('-',' ⇄ ')}:
      <select name="level-${pair}">
        <option value="basic">Basic</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </label>`;
  });
  document.getElementById("levels").innerHTML = lvls;
  document.getElementById("onboard-form").onsubmit = function(e) {
    e.preventDefault();
    let langs = Array.from(document.querySelectorAll('[name="langs"]:checked')).map(cb=>cb.value);
    if(!langs.length) return alert("Select at least one language!");
    let levels = {};
    langs.forEach(pair=>{
      levels[pair]=document.querySelector(`[name="level-${pair}"]`).value;
    });
    let motivation = document.getElementById("motivation").value;
    localStorage.setItem("voc_onboard", JSON.stringify({langs,levels,motivation}));
    window.location.reload();
  };
} else {
  document.getElementById("onboarding-screen").classList.remove("active");
}

// --- Login logic ---
window.tryLogin = function() {
  const uname = document.getElementById('login-username').value.trim();
  const pw = document.getElementById('login-password').value;
  const error = document.getElementById('login-error');
  if (!uname || !pw) { error.textContent = "Please enter username and password."; return; }
  localStorage.setItem("voc_user_current", uname);
  showApp();
};
// Enter to login
document.getElementById('login-password').addEventListener('keydown',function(e){
  if(e.key==="Enter")document.getElementById('login-btn').click();
});
document.getElementById('login-btn').onclick = window.tryLogin;

function showApp() {
  document.getElementById('login-screen').style.display = "none";
  document.getElementById('login-screen').classList.remove("active");
  Array.from(document.querySelectorAll('.screen')).forEach(s=>{
    if(s.id!=="login-screen"&&s.id!=="onboarding-screen") s.style.display="";
    s.classList.remove('active');
  });
  document.getElementById('main-menu').classList.add('active');
  document.getElementById('language-selector').style.display = "";
  window.updateAll();
  updateStreak();
}
window.logout = function() {
  localStorage.removeItem("voc_user_current");
  document.getElementById('login-username').value = "";
  document.getElementById('login-password').value = "";
  document.getElementById('login-error').textContent = "";
  document.getElementById('login-screen').style.display = "flex";
  document.getElementById('login-screen').classList.add('active');
  Array.from(document.querySelectorAll('.screen')).forEach(s=>{
    if(s.id!=="login-screen"&&s.id!=="onboarding-screen") s.style.display="none";
    s.classList.remove('active');
  });
  document.getElementById('language-selector').style.display = "none";
};
// --- END login logic

// --- Language pairs and vocab ---
const BASE_WORDS = {
  "fr-nl": {
    basic: [
      ["bonjour","hallo"],["merci","dankje"],["oui","ja"],["non","nee"],["maison","huis"],["pain","brood"],["eau","water"],["chat","kat"],["chien","hond"],["s'il vous plaît","alsjeblieft"],["livre","boek"],["amour","liefde"],["pomme","appel"],["je","ik"],["toi","jij"]
    ],
    travel: [
      ["aéroport","luchthaven"],["taxi","taxi"],["hôtel","hotel"],["gare","station"],["bagage","bagage"],["ticket","kaartje"],["carte","kaart"],["train","trein"],["avion","vliegtuig"],["restaurant","restaurant"],["toilette","toilet"],["clé","sleutel"],["passeport","paspoort"],["adresse","adres"],["argent","geld"]
    ],
    advanced: [
      ["alors que","terwijl"],["quoique","hoewel"],["malgré","ondanks"],["par conséquent","daardoor"],["néanmoins","desondanks"],["autrement dit","met andere woorden"],["soutenir","ondersteunen"],["atteindre","bereiken"],["développer","ontwikkelen"],["considérer","overwegen"],["significatif","betekenisvol"]
    ]
  },
  "en-nl": {
    basic: [
      ["hello","hallo"],["thank you","dankje"],["yes","ja"],["no","nee"],["house","huis"],["bread","brood"],["water","water"],["cat","kat"],["dog","hond"],["please","alsjeblieft"],["book","boek"],["love","liefde"],["apple","appel"],["i","ik"],["you","jij"]
    ],
    travel: [
      ["airport","luchthaven"],["taxi","taxi"],["hotel","hotel"],["station","station"],["baggage","bagage"],["ticket","kaartje"],["map","kaart"],["train","trein"],["plane","vliegtuig"],["restaurant","restaurant"],["toilet","toilet"],["key","sleutel"],["passport","paspoort"],["address","adres"],["money","geld"]
    ],
    advanced: [
      ["although","hoewel"],["despite","ondanks"],["consequently","daardoor"],["nevertheless","desondanks"],["meanwhile","ondertussen"],["otherwise","anders"],["support","ondersteunen"],["achieve","bereiken"],["develop","ontwikkelen"],["consider","overwegen"],["significant","betekenisvol"]
    ]
  }
};
// Onboarding settings (device-based)
function getUserSettings() {
  return JSON.parse(localStorage.getItem("voc_onboard")||'{"langs":["fr-nl"],"levels":{"fr-nl":"basic"},"motivation":"school"}');
}
function getBaseWordsForCurrentPair() {
  const s = getUserSettings();
  const pair = currentPair.join('-');
  const level = s.levels[pair]||"basic";
  let arr = [];
  if (BASE_WORDS[pair]) {
    arr = BASE_WORDS[pair][level] || [];
    if (s.motivation==="travel") arr = arr.concat(BASE_WORDS[pair].travel||[]);
    if (level==="advanced") arr = arr.concat(BASE_WORDS[pair].advanced||[]);
  }
  return arr;
}
function allWords() {
  let base = getBaseWordsForCurrentPair();
  return base.concat(loadCustomWords());
}

// --- Storage util ---
function pairKey() { return `voc_custom_${currentPair[0]}_${currentPair[1]}`; }
function pairHardKey() { return `voc_hard_${currentPair[0]}_${currentPair[1]}`; }
function loadCustomWords() { return JSON.parse(localStorage.getItem(pairKey())) || []; }
function saveCustomWords(words) { localStorage.setItem(pairKey(), JSON.stringify(words)); }
function loadHardWords() { return JSON.parse(localStorage.getItem(pairHardKey())) || []; }
function saveHardWords(words) { localStorage.setItem(pairHardKey(), JSON.stringify(words)); }

// --- Custom words add/search/edit (with search) ---
function updateRecentAdditions() {
  const container = document.getElementById('recent-list');
  if (!container) return;
  const all = loadCustomWords();
  const search = (document.getElementById('search-custom')||{value:""}).value.trim().toLowerCase();
  const filtered = all.filter(([from, to]) =>
    from.toLowerCase().includes(search) || to.toLowerCase().includes(search));
  container.innerHTML = filtered.length
    ? filtered.slice(-10).reverse().map(([from, to], i) =>
      `<div class="recent-item"><strong>${from}</strong> → ${to}
        <button class="btn btn-small" onclick="window.editCustomWord(${all.length-1-i})">✎</button>
        <button class="btn btn-small" onclick="window.deleteCustomWord(${all.length-1-i})">🗑</button>
      </div>`
    ).join('')
    : '<p style="color:#8fa9cc;">No custom words added yet.</p>';
}
window.editCustomWord = function(idx) {
  const all = loadCustomWords();
  const [f, t] = all[idx];
  const from = prompt("Edit source word:", f);
  const to = prompt("Edit target word:", t);
  if (from && to) {
    all[idx] = [from, to];
    saveCustomWords(all);
    updateRecentAdditions(); updateAll();
  }
};
window.deleteCustomWord = function(idx) {
  const all = loadCustomWords();
  if (confirm("Delete this word?")) {
    all.splice(idx, 1);
    saveCustomWords(all);
    updateRecentAdditions(); updateAll();
  }
};
document.getElementById('search-custom').oninput = updateRecentAdditions;

// --- Hard words add/search/edit ---
function updateHardWordsList() {
  const container = document.getElementById('hard-words-list');
  const clearBtn = document.getElementById('clear-hard-btn');
  if (!container) return;
  const all = loadHardWords();
  const search = (document.getElementById('search-hard')||{value:""}).value.trim().toLowerCase();
  const filtered = all.filter(hw =>
    hw.question.toLowerCase().includes(search) || hw.answer.toLowerCase().includes(search));
  container.innerHTML = filtered.length
    ? filtered.map((hw, i) => `
      <div class="hard-word-item">
        <div class="hard-word-content">${i + 1}. ${hw.question} → ${hw.answer}</div>
        <button class="remove-hard-btn" onclick="window.removeHardWord(${i})">Remove</button>
      </div>
    `).join('')
    : '<p style="color:#8fa9cc;">No hard words yet!</p>';
  if (clearBtn) clearBtn.style.display = all.length ? 'inline-block' : 'none';
}
window.removeHardWord = function(idx) {
  const all = loadHardWords();
  all.splice(idx, 1);
  saveHardWords(all);
  updateHardWordsList(); updateAll();
};
document.getElementById('search-hard').oninput = updateHardWordsList;
window.clearHardWords = function() {
  if (confirm('Are you sure you want to clear all hard words?')) {
    saveHardWords([]);
    updateHardWordsList(); updateAll();
  }
};
// --- Add word ---
window.addNewWord = function() {
  const fromInput = document.getElementById('custom-from-word');
  const toInput = document.getElementById('custom-to-word');
  const from = fromInput ? fromInput.value.trim() : "";
  const to = toInput ? toInput.value.trim() : "";
  if (!from || !to) return alert('Please fill in both fields!');
  const all = loadCustomWords();
  if (all.some(([f, t]) => f === from && t === to)) return alert('Word exists.');
  all.push([from, to]);
  saveCustomWords(all);
  if (fromInput) fromInput.value = '';
  if (toInput) toInput.value = '';
  updateRecentAdditions(); updateAll();
  alert('Word added!');
};

// --- Bulk upload (smarter, editable) ---
document.getElementById('bulk-upload-btn').onclick = function() {
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
    // Remove duplicates
    const key = `voc_custom_${from}_${to}`;
    let existing = JSON.parse(localStorage.getItem(key) || "[]");
    let added = 0, skippedDup = 0, actualAddedPairs = [];
    for (let [left, right] of pairs) {
      if (existing.some(([l, r]) => l === left && r === right)) {skippedDup++; continue;}
      existing.push([left, right]);
      actualAddedPairs.push([left, right]);
      added++;
    }
    localStorage.setItem(key, JSON.stringify(existing));
    let preview = document.getElementById('bulk-upload-preview');
    preview.innerHTML = `<b>Found:</b> ${pairs.length} pairs.<br><b>Added:</b> ${added} new word pairs.<br>` +
      (skippedDup ? `<b>Skipped:</b> ${skippedDup} duplicates.<br>` : "") +
      (actualAddedPairs.length ? `<b>Pairs added:</b>` : "No new pairs added.");
    // Editable list
    showBulkEditList(from, to, existing);
    updateAll();
  };
  reader.readAsText(file);
};
function showBulkEditList(from, to, list) {
  let el = document.getElementById("bulk-edit-list");
  el.innerHTML = list.length ? list.map(([f, t], idx) =>
    `<div class="bulk-edit-item">
      <input type="text" value="${f}" id="bulk-edit-from-${idx}">
      <input type="text" value="${t}" id="bulk-edit-to-${idx}">
      <button class="btn btn-small" onclick="window.bulkEditSave(${idx},'${from}','${to}')">💾</button>
      <button class="btn btn-small" onclick="window.bulkEditDelete(${idx},'${from}','${to}')">🗑</button>
    </div>`
  ).join("") : "<span style='color:#888'>No words.</span>";
}
window.bulkEditSave = function(idx, from, to) {
  const key = `voc_custom_${from}_${to}`;
  let existing = JSON.parse(localStorage.getItem(key)||"[]");
  let newF = document.getElementById(`bulk-edit-from-${idx}`).value.trim();
  let newT = document.getElementById(`bulk-edit-to-${idx}`).value.trim();
  if (!newF || !newT) return alert("No empty fields!");
  existing[idx]=[newF,newT];
  localStorage.setItem(key,JSON.stringify(existing));
  showBulkEditList(from,to,existing);
}
window.bulkEditDelete = function(idx, from, to) {
  const key = `voc_custom_${from}_${to}`;
  let existing = JSON.parse(localStorage.getItem(key)||"[]");
  existing.splice(idx,1);
  localStorage.setItem(key,JSON.stringify(existing));
  showBulkEditList(from,to,existing);
}

// --- Quiz logic ---
let quizState = {
  isHard: false,
  isCustom: false,
  qNum: 0,
  currentQ: null,
  currentA: null,
  currentDir: null,
  pendingHard: null,
  quizPair: null,
  isPracticingHard: false
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
    quizState.isPracticingHard=true;
  } else if (quizState.isCustom) {
    pairs = loadCustomWords();
    quizState.isPracticingHard=false;
  } else {
    pairs = allWords();
    quizState.isPracticingHard=false;
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
window.startQuiz = function() {
  quizState.isHard = false;
  quizState.isCustom = false;
  quizState.qNum = 0;
  quizState.isPracticingHard = false;
  showScreen('quiz-screen');
  nextQuestion();
  updateStreak();
};
window.practiceHardWords = function() {
  quizState.isHard = true;
  quizState.isCustom = false;
  quizState.qNum = 0;
  quizState.isPracticingHard = true;
  showScreen('quiz-screen');
  nextQuestion();
  updateStreak();
};
window.practiceCustomWords = function() {
  quizState.isCustom = true;
  quizState.isHard = false;
  quizState.qNum = 0;
  quizState.isPracticingHard = false;
  showScreen('quiz-screen');
  nextQuestion();
  updateStreak();
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
  if (correct) {
    document.getElementById('feedback').textContent = '✅ Correct! Well done!';
    document.getElementById('feedback').className = 'feedback correct';
    // Remove from hard words if correct while practicing hard
    if (quizState.isPracticingHard) {
      setTimeout(() => {
        if (confirm('Remove this word from hard words list?')) {
          let all = loadHardWords();
          const idx = all.findIndex(hw =>
            hw.question === quizState.currentQ && hw.answer === quizState.currentA
          );
          if (idx !== -1) {
            all.splice(idx, 1);
            saveHardWords(all);
            updateHardWordsList();
          }
        }
        setTimeout(nextQuestion, 900);
      }, 900);
    } else {
      setTimeout(nextQuestion, 900);
    }
  } else {
    document.getElementById('feedback').textContent = `❌ Incorrect. The correct answer is: ${quizState.currentA}`;
    document.getElementById('feedback').className = 'feedback incorrect';
    quizState.pendingHard = {
      question: quizState.currentQ,
      answer: quizState.currentA,
      direction: quizState.currentDir
    };
    // Only show add-to-hard modal if not already in hard words and not practicing hard
    if (!quizState.isPracticingHard && !loadHardWords().some(hw=>hw.question===quizState.currentQ && hw.answer===quizState.currentA)) {
      setTimeout(showHardWordsModal, 900);
    } else {
      setTimeout(nextQuestion, 1400);
    }
  }
  updateUI();
};
// ENTER to submit in quiz
document.getElementById('answer-input').addEventListener('keydown',function(e){
  if(e.key==="Enter")document.getElementById('quiz-submit-btn').click();
});
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
    updateStreak();
  }
  if (screenId === 'upload-bulk-menu') {
    document.getElementById('bulk-upload-preview').innerHTML = '';
    document.getElementById('bulk-edit-list').innerHTML = '';
  }
};
window.showStatsScreen = function() {
  updateStatsDisplay();
  showScreen('stats-screen');
};
function updateStatsDisplay() {
  // Just show quiz progress for now
  // Could be improved to show per language/direction etc.
}
window.updateAll = function() {
  updateLangSelector();
  updateRecentAdditions();
  updateHardWordsList();
  updateUI();
  updateStreak();
};
document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem("voc_user_current")) showApp();
  updateLangSelector();
  updateRecentAdditions();
  updateHardWordsList();
  updateUI();
  updateStreak();
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
