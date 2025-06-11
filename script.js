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
  const onboarding = document.getElementById("onboarding-screen");
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
    window.location.reload();
  };
  showStep1();
}
onboardingFlow();

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
}
updateStreak();

// --- Login logic (just-for-fun, no real security) ---
window.tryLogin = function() {
  const uname = document.getElementById('login-username').value.trim();
  const pw = document.getElementById('login-password').value;
  const error = document.getElementById('login-error');
  if (!uname || !pw) { error.textContent = "Please enter username and password."; return; }
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
// Enter to login
document.getElementById('login-password').addEventListener('keydown',function(e){
  if(e.key==="Enter")document.getElementById('login-btn').click();
});
document.getElementById('login-btn').onclick = window.tryLogin;

function showApp() {
  document.getElementById('login-screen').style.display = "none";
  document.getElementById('login-screen').classList.remove("active");
  Array.from(document.querySelectorAll('.screen')).forEach(s=>{
    if(s.id!=="login-screen") s.style.display="";
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
    if(s.id!=="login-screen") s.style.display="none";
    s.classList.remove('active');
  });
  document.getElementById('language-selector').style.display = "none";
};
window.currentUser = function() {
  return localStorage.getItem("voc_user_current") || "";
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
function getLangPairs() {
  const s = getUserSettings();
  return s.langs || ["fr-nl"];
}
let currentPair = getLangPairs()[0]?.split('-') || ["fr","nl"];
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
// Attach event listeners after DOMContentLoaded
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
  const quizCard = document.querySelector('#main-menu .nav-card[onclick*="startQuiz"]');
  if (quizCard) quizCard.onclick = showQuizModeSelector;
});
// Refactor startQuiz to accept mode
function startQuiz(mode) {
  // ... existing startQuiz logic, but use 'mode' to determine quiz type ...
  // For now, just call the original logic (typing mode)
  // TODO: Implement other modes
  // Example: if (mode === 'multiple') { ... }
}

// ... rest of your logic, unchanged (quiz, custom words, bulk, hard words, etc.) ...
// (Paste your previous script.js here, replacing onboarding, getLangPairs, and currentPair logic as above)
// If you want the rest of the code pasted as well, let me know!
