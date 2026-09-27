// Te Reo Manu — extracted verbatim from the Aotearoa Birdsong research page
// (https://cyborg.garden/open-science/experiments/nz-birdsong/, Te Reo Manu tab).

// ==================== TE REO MANU GAME ====================
const GAME_DATA = {
  syllable_types: ['LF', 'H', 'HF', 'T', 'R'],
  syllable_names: {
    LF:  { en: 'Low Frequency', mi: 'Ōraro', desc: 'Syllables with dominant frequency below 2kHz — the foundation of tūī song.' },
    H:   { en: 'Harmonic', mi: 'Rangi Rua', desc: 'Clear harmonic structure with parallel frequency bands — the signature of a resonant vocal tract.' },
    HF:  { en: 'High Frequency', mi: 'Ōrunga', desc: 'Dominant frequency at or above 5kHz — near the upper limit of human hearing.' },
    T:   { en: 'Trill', mi: 'Tīoriori', desc: 'Rapid frequency modulation (>10 Hz) — the characteristic warbling sound.' },
    R:   { en: 'RMNR', mi: 'Nguru', desc: 'Rapid Modulated Narrowband Repeat — machine-gun-like bursts in a narrow frequency band.' }
  },
  syllable_colors: { LF: 'var(--low)', H: 'var(--harmonic)', HF: 'var(--high)', T: 'var(--trill)', R: 'var(--rmnr)' },
  sample_keys: { LF: 'low_frequency', H: 'harmonic', HF: 'high_frequency', T: 'trill', R: 'rmnr' },
  samples: {
    low_frequency: [0,1,2], harmonic: [0,1,2], high_frequency: [0,1,2], trill: [0,1,2], rmnr: [0,1,2]
  },
  species_clips: {
    tui: ['1104055'],
    bellbird: ['152939'],
    kaka: ['326938'],
    kea: ['405529'],
    morepork: ['33770'],
    fantail: ['984431'],
    warbler: ['153000']
  },
  transition_probs: {
    tui: {LF:{LF:.733,H:.117,HF:.051,T:.041,R:.058},H:{LF:.342,H:.383,HF:.095,T:.065,R:.114},HF:{LF:.265,H:.167,HF:.376,T:.086,R:.106},T:{LF:.335,H:.170,HF:.106,T:.244,R:.146},R:{LF:.312,H:.155,HF:.107,T:.083,R:.343}}
  },
  opening_prefs: { tui: {LF:.707,H:.112,HF:.086,T:.060,R:.034} },
  closing_prefs: { tui: {LF:.578,H:.172,HF:.112,R:.069,T:.069} },
  top_trigrams: { tui: ['LF-LF-LF','LF-LF-H','H-LF-LF','H-H-H','LF-H-LF'] },
  regional_diversity: {
    Auckland:   {H:2.10, recordings:21, syllables:3682, type_pcts:{LF:41.3,H:22.6,HF:15.8,R:11.1,T:9.3}},
    Waikato:    {H:2.09, recordings:3,  syllables:215,  type_pcts:{LF:44.7,H:20.0,HF:12.1,R:11.6,T:11.6}},
    Northland:  {H:1.93, recordings:4,  syllables:1345, type_pcts:{LF:51.3,H:16.7,HF:17.0,R:7.4,T:7.6}},
    'Bay of Plenty':{H:1.91, recordings:11,syllables:1872,type_pcts:{LF:52.5,H:20.2,HF:10.4,R:8.7,T:8.2}},
    Wellington: {H:1.89, recordings:13, syllables:1741, type_pcts:{LF:52.3,H:21.0,HF:12.5,R:7.9,T:6.3}},
    'West Coast':{H:1.73, recordings:40,syllables:5335,type_pcts:{LF:58.4,H:19.4,HF:9.5,R:8.1,T:4.6}},
    Southland:  {H:1.52, recordings:13, syllables:1349, type_pcts:{LF:67.0,H:16.0,HF:5.6,R:7.0,T:4.4}},
    Otago:      {H:1.43, recordings:3,  syllables:207,  type_pcts:{LF:47.3,H:15.5,HF:2.4,R:6.3,T:28.5}},
    "Hawke's Bay":{H:1.40,recordings:4, syllables:1158, type_pcts:{LF:69.9,H:19.1,HF:1.7,R:5.4,T:3.9}}
  },
  level_config: [
    {name:'Ko Wai?',    mi:'Who Is This?',       total:7,  pass:5,  desc:'Recognise the tūī among NZ birds'},
    {name:'Ngā Oro',    mi:'The Sounds',        total:15, pass:12, desc:'Identify the five syllable types by ear'},
    {name:'E Whai Ake', mi:'What Comes Next?',   total:15, pass:8,  desc:'Predict tūī song transitions'},
    {name:'Waiata',     mi:'Compose the Song',   total:6,  pass:3,  desc:'Build a plausible tūī phrase'},
    {name:'Te Rohe',    mi:'Regional Dialects',  total:8,  pass:5,  desc:'Read tūī dialect geography'}
  ]
};

const GameEngine = {
  state: { level: 0, qIndex: 0, score: 0, selected: null, questions: [], answered: false, composing: [] },
  progress: { levels: {}, version: 2 },

  init() {
    this.loadProgress();
    this.renderLevels();
  },

  // ---- Progress / localStorage ----
  loadProgress() {
    try {
      const saved = localStorage.getItem('reo-manu-progress');
      if (saved) this.progress = JSON.parse(saved);
    } catch(e) {}
  },
  saveProgress() {
    try { localStorage.setItem('reo-manu-progress', JSON.stringify(this.progress)); } catch(e) {}
  },
  getProgress() { return this.progress; },

  isLevelUnlocked(n) {
    if (n === 1) return true;
    const prev = this.progress.levels[n - 1];
    return prev && prev.completed;
  },

  calculateStars(score, total) {
    const pct = score / total;
    if (pct >= 1.0) return 3;
    if (pct >= 0.9) return 2;
    const passThreshold = GAME_DATA.level_config[(this.state.level || 1) - 1].pass / GAME_DATA.level_config[(this.state.level || 1) - 1].total;
    if (pct >= passThreshold) return 1;
    return 0;
  },

  // ---- Level rendering ----
  renderLevels() {
    const container = document.getElementById('game-levels');
    if (!container) return;
    container.innerHTML = GAME_DATA.level_config.map((lvl, i) => {
      const n = i + 1;
      const unlocked = this.isLevelUnlocked(n);
      const data = this.progress.levels[n];
      const nStars = data ? Math.max(0, Math.min(3, data.stars | 0)) : 0;
      const stars = data ? "⭐".repeat(nStars) + "☆".repeat(3 - nStars) : "☆☆☆";
      const cls = unlocked ? '' : ' locked';
      const active = this.state.level === n ? ' active' : '';
      return `<div class="game-level-btn${cls}${active}" onclick="GameEngine.selectLevel(${n})" title="${lvl.desc}">
        <span class="level-num">${n}</span>
        <span class="level-stars">${unlocked ? stars : '🔒'}</span>
        <span class="level-name">${lvl.name}<br><em style="font-size:.62rem;color:inherit;opacity:.7">${lvl.mi}</em></span>
      </div>`;
    }).join('');
  },

  selectLevel(n) {
    if (!this.isLevelUnlocked(n)) return;
    this.startLevel(n);
  },

  // ---- Start level ----
  startLevel(n) {
    if (!this.isLevelUnlocked(n)) return;
    this.state = { level: n, qIndex: 0, score: 0, selected: null, questions: [], answered: false, composing: [] };
    this.state.questions = this.generateQuestions(n);
    this.renderLevels();
    document.getElementById('game-intro').style.display = 'none';
    document.getElementById('game-score').style.display = 'none';
    this.showQuestion();
  },

  // ---- Question generation ----
  generateQuestions(level) {
    const questions = [];
    if (level === 1) {
      // Level 1: Species ID — play a clip, identify species (the intro level)
      const allClips = [];
      for (const [sp, clips] of Object.entries(GAME_DATA.species_clips)) {
        for (const id of clips) allClips.push({ species: sp, audio: `audio/${id}.mp3` });
      }
      this.shuffle(allClips);
      for (let i = 0; i < allClips.length; i++) questions.push({ type: 'species', ...allClips[i] });
    } else if (level === 2) {
      // Level 2: Listen & Identify syllables — one question per sample, shuffled
      const types = GAME_DATA.syllable_types;
      for (const type of types) {
        const key = GAME_DATA.sample_keys[type];
        for (let i = 0; i < 3; i++) {
          questions.push({ type: 'identify', answer: type, audio: `samples/${key}_${i}.wav`, spectrogram: `samples/${key}_${i}.png` });
        }
      }
      this.shuffle(questions);
    } else if (level === 3) {
      // Level 3: What comes next — given a syllable, predict most likely successor
      const types = GAME_DATA.syllable_types;
      const matrix = GAME_DATA.transition_probs.tui;
      for (let i = 0; i < 15; i++) {
        const from = types[i % 5];
        questions.push({ type: 'transition', from, probs: matrix[from] });
      }
      this.shuffle(questions);
    } else if (level === 4) {
      // Level 4: Compose a song — arrange tokens
      for (let i = 0; i < 6; i++) {
        const len = 5 + Math.floor(Math.random() * 3); // 5-7 tokens
        questions.push({ type: 'compose', length: len });
      }
    } else if (level === 5) {
      // Level 5: Regional dialects — compare two regions
      const regionNames = Object.keys(GAME_DATA.regional_diversity);
      const pairs = [];
      for (let i = 0; i < regionNames.length; i++) {
        for (let j = i + 1; j < regionNames.length; j++) {
          const a = GAME_DATA.regional_diversity[regionNames[i]];
          const b = GAME_DATA.regional_diversity[regionNames[j]];
          if (Math.abs(a.H - b.H) > 0.15) pairs.push([regionNames[i], regionNames[j]]);
        }
      }
      this.shuffle(pairs);
      for (let i = 0; i < Math.min(8, pairs.length); i++) {
        const [r1, r2] = pairs[i];
        questions.push({ type: 'dialect', regions: [r1, r2] });
      }
    }
    return questions;
  },

  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } },

  // ---- Show question ----
  showQuestion() {
    const q = this.state.questions[this.state.qIndex];
    if (!q) { this.showResult(); return; }

    this.state.selected = null;
    this.state.answered = false;
    this.state.composing = [];

    const qCard = document.getElementById('game-question');
    const opts = document.getElementById('game-options');
    const fb = document.getElementById('game-feedback');
    const submitRow = document.getElementById('game-submit-row');
    const submitBtn = document.getElementById('game-submit');

    qCard.style.display = 'block';
    opts.style.display = 'flex';
    submitRow.style.display = 'flex';
    fb.style.display = 'none';
    fb.className = 'game-feedback';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Check';

    this.updateProgress();

    if (q.type === 'identify') this.renderIdentify(q);
    else if (q.type === 'species') this.renderSpecies(q);
    else if (q.type === 'transition') this.renderTransition(q);
    else if (q.type === 'compose') this.renderCompose(q);
    else if (q.type === 'dialect') this.renderDialect(q);
  },

  // ---- Render question types ----
  renderIdentify(q) {
    document.getElementById('q-text').textContent = 'What type of syllable is this?';
    document.getElementById('q-context').textContent = 'Listen to the sample, then choose the syllable type.';
    document.getElementById('q-audio').innerHTML = `<button class="game-play-btn" onclick="GameEngine.playAudio('${q.audio}',this)"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Play</button>`;
    this.renderOptions(GAME_DATA.syllable_types.map(t => ({
      value: t,
      label: `${GAME_DATA.syllable_names[t].en} (${GAME_DATA.syllable_names[t].mi})`
    })));
  },

  renderSpecies(q) {
    document.getElementById('q-text').textContent = 'Which bird is singing?';
    document.getElementById('q-context').textContent = 'Listen carefully — each species has a distinct vocal signature.';
    document.getElementById('q-audio').innerHTML = `<button class="game-play-btn" onclick="GameEngine.playAudio('${q.audio}',this)"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Play</button>`;
    const speciesNames = {
      tui: 'Tūī', bellbird: 'Korimako', kaka: 'Kākā',
      kea: 'Kea', morepork: 'Morepork (Ruru)', fantail: 'Fantail (Pīwakawaka)', warbler: 'Grey Warbler (Riroriro)'
    };
    // Always show 4 options including the correct one
    const allSpecies = Object.keys(speciesNames);
    let options = [q.species];
    const others = allSpecies.filter(s => s !== q.species);
    this.shuffle(others);
    options = options.concat(others.slice(0, 3));
    this.shuffle(options);
    this.renderOptions(options.map(s => ({ value: s, label: speciesNames[s] })));
  },

  renderTransition(q) {
    const fromName = GAME_DATA.syllable_names[q.from];
    document.getElementById('q-text').innerHTML = `A tūī just sang a <span style="color:${GAME_DATA.syllable_colors[q.from]};font-weight:600">${fromName.en}</span> syllable. What comes next?`;
    document.getElementById('q-context').textContent = 'Pick the most likely successor based on tūī grammar rules.';
    // Play an example of the "from" type
    const key = GAME_DATA.sample_keys[q.from];
    document.getElementById('q-audio').innerHTML = `<button class="game-play-btn" onclick="GameEngine.playAudio('samples/${key}_0.wav',this)"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Hear ${fromName.en}</button>`;
    this.renderOptions(GAME_DATA.syllable_types.map(t => ({
      value: t,
      label: `${GAME_DATA.syllable_names[t].en} (${(q.probs[t] * 100).toFixed(0)}% chance)`
    })), true);  // hideProbs=true until answered
  },

  renderCompose(q) {
    document.getElementById('q-text').textContent = `Compose a ${q.length}-syllable tūī phrase`;
    document.getElementById('q-context').textContent = 'Click syllable tokens to build a sequence. The more natural it sounds to a tūī, the higher your score. Click a placed token to remove it.';
    document.getElementById('q-audio').innerHTML = '';
    document.getElementById('game-options').style.display = 'block';
    document.getElementById('game-options').innerHTML = `
      <div class="compose-bank" id="compose-bank">
        ${GAME_DATA.syllable_types.map(t => `<div class="compose-token" data-type="${t}" onclick="GameEngine.addToken('${t}')">${GAME_DATA.syllable_names[t].en}</div>`).join('')}
      </div>
      <div class="compose-sequence" id="compose-seq"></div>
      <div style="text-align:center;font-family:var(--mono);font-size:.72rem;color:var(--ink-faint)" id="compose-count">0 / ${q.length} syllables</div>`;
    document.getElementById('game-submit').disabled = true;
  },

  renderDialect(q) {
    const [r1, r2] = q.regions;
    const d1 = GAME_DATA.regional_diversity[r1];
    const d2 = GAME_DATA.regional_diversity[r2];
    document.getElementById('q-text').textContent = 'Which region has more diverse tūī song?';
    document.getElementById('q-context').innerHTML = 'Compare the syllable distribution between two regions. Higher diversity = more even mix of syllable types.';
    document.getElementById('q-audio').innerHTML = '';

    // Show mini distribution bars for both regions
    const barHtml = (name, data) => {
      const types = ['LF','H','HF','T','R'];
      const bars = types.map(t => {
        const pct = data.type_pcts[t] || 0;
        const color = GAME_DATA.syllable_colors[t];
        return `<div style="width:${pct}%;background:${color};height:18px" title="${GAME_DATA.syllable_names[t].en}: ${pct}%"></div>`;
      }).join('');
      return `<div style="margin-bottom:.6rem"><div style="font-family:var(--mono);font-size:.72rem;color:var(--ink-soft);margin-bottom:.3rem">${name} · ${data.recordings} recordings</div><div style="display:flex;border-radius:4px;overflow:hidden">${bars}</div></div>`;
    };

    document.getElementById('game-options').style.display = 'block';
    document.getElementById('game-options').innerHTML = `
      <div style="margin-bottom:1rem">${barHtml('Region A', d1)}${barHtml('Region B', d2)}</div>
      <div class="game-option" onclick="GameEngine.selectOpt(this,this.dataset.value)" data-value="${r1.replace(/"/g,'&quot;')}"><span class="opt-dot"></span> Region A is more diverse</div>
      <div class="game-option" onclick="GameEngine.selectOpt(this,this.dataset.value)" data-value="${r2.replace(/"/g,'&quot;')}"><span class="opt-dot"></span> Region B is more diverse</div>`;
    document.getElementById('game-submit').disabled = true;
  },

  renderOptions(options, hideProbs) {
    const container = document.getElementById('game-options');
    container.innerHTML = options.map(opt => {
      let label = opt.label;
      if (hideProbs) label = label.replace(/\s*\(\d+% chance\)/, '');
      return `<div class="game-option" onclick="GameEngine.selectOpt(this,this.dataset.value)" data-value="${String(opt.value).replace(/"/g,'&quot;')}"><span class="opt-dot"></span> ${label}</div>`;
    }).join('');
  },

  // ---- Interactions ----
  selectOpt(el, value) {
    if (this.state.answered) return;
    document.querySelectorAll('#game-options .game-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    this.state.selected = value;
    document.getElementById('game-submit').disabled = false;
  },

  addToken(type) {
    const q = this.state.questions[this.state.qIndex];
    if (!q || this.state.composing.length >= q.length) return;
    this.state.composing.push(type);
    this.renderSequence();
    if (this.state.composing.length >= q.length) {
      document.getElementById('game-submit').disabled = false;
    }
  },

  removeToken(idx) {
    if (this.state.answered) return;
    this.state.composing.splice(idx, 1);
    this.renderSequence();
    document.getElementById('game-submit').disabled = true;
  },

  renderSequence() {
    const seq = document.getElementById('compose-seq');
    const q = this.state.questions[this.state.qIndex];
    seq.innerHTML = this.state.composing.map((t, i) =>
      `<div class="compose-token" data-type="${t}" onclick="GameEngine.removeToken(${i})">${GAME_DATA.syllable_names[t].en}</div>`
    ).join('');
    const countEl = document.getElementById('compose-count');
    if (countEl) countEl.textContent = `${this.state.composing.length} / ${q.length} syllables`;
  },

  playAudio(src, btn) {
    // Remember each button's resting label once, so a second tap mid-clip
    // does not save "Playing…" as the label to come back to.
    if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
    if (this._audio) { this._audio.pause(); this._audio = null; }
    if (this._audioBtn && this._audioBtn.dataset.label) this._audioBtn.innerHTML = this._audioBtn.dataset.label;
    const audio = new Audio(src);
    this._audio = audio;
    this._audioBtn = btn;
    const origHTML = btn.dataset.label;
    btn.innerHTML = origHTML.replace('Play', 'Playing…').replace('Hear ', 'Playing ');
    // Only the clip still playing may put its label back; a superseded clip
    // (paused above) would otherwise reset the newer one's "Playing…".
    const done = () => { if (this._audio !== audio) return; btn.innerHTML = origHTML; this._audio = null; this._audioBtn = null; };
    audio.addEventListener('ended', done);
    audio.addEventListener('error', done);
    audio.play().catch(done);
  },

  // ---- Submit answer ----
  submit() {
    if (this.state.answered) { this.next(); return; }
    const q = this.state.questions[this.state.qIndex];
    if (!q) return;

    this.state.answered = true;
    // Only the first Check of a question can score: a wrong answer brings
    // the same question back (Try Again), and the retry must not earn marks.
    const firstTry = !this.state.scoredQ;
    this.state.scoredQ = true;
    let correct = false;
    let feedbackText = '';
    const fb = document.getElementById('game-feedback');
    const submitBtn = document.getElementById('game-submit');

    if (q.type === 'identify') {
      correct = this.state.selected === q.answer;
      const name = GAME_DATA.syllable_names[q.answer];
      feedbackText = correct
        ? `Correct! ${name.en} (${name.mi}) — ${name.desc}`
        : `That was ${name.en} (${name.mi}). ${name.desc}`;
      if (correct && firstTry) this.state.score++;
      // Show spectrogram
      feedbackText += `<div style="margin-top:.8rem"><img src="${q.spectrogram}" alt="Spectrogram" style="max-width:100%;border-radius:4px;border:1px solid var(--rule)"></div>`;
    } else if (q.type === 'species') {
      correct = this.state.selected === q.species;
      const names = { tui: 'Tūī', bellbird: 'Korimako', kaka: 'Kākā', kea: 'Kea', morepork: 'Morepork (Ruru)', fantail: 'Fantail (Pīwakawaka)', warbler: 'Grey Warbler (Riroriro)' };
      feedbackText = correct
        ? `Correct! That was a ${names[q.species]}.`
        : `That was a ${names[q.species]}, not a ${names[this.state.selected]}.`;
      if (correct && firstTry) this.state.score++;
    } else if (q.type === 'transition') {
      const sorted = Object.entries(q.probs).sort((a, b) => b[1] - a[1]);
      const bestAnswer = sorted[0][0];
      correct = this.state.selected === bestAnswer;
      const selectedProb = q.probs[this.state.selected] || 0;
      const bestProb = sorted[0][1];
      // Weighted scoring: best=3, second=1, else=0
      if (firstTry) {
        if (this.state.selected === sorted[0][0]) this.state.score += 3;
        else if (this.state.selected === sorted[1][0]) this.state.score += 1;
      }
      feedbackText = correct
        ? `Correct! ${GAME_DATA.syllable_names[bestAnswer].en} follows with ${(bestProb * 100).toFixed(0)}% probability.`
        : `The most likely next syllable is ${GAME_DATA.syllable_names[bestAnswer].en} (${(bestProb * 100).toFixed(0)}%). You picked ${GAME_DATA.syllable_names[this.state.selected].en} (${(selectedProb * 100).toFixed(0)}%).`;
      // Show full probability bar
      feedbackText += '<div style="margin-top:.6rem;display:flex;border-radius:4px;overflow:hidden;height:22px">';
      for (const [t, p] of sorted) {
        feedbackText += `<div style="width:${p*100}%;background:${GAME_DATA.syllable_colors[t]};display:flex;align-items:center;justify-content:center;font-size:.65rem;font-family:var(--mono);color:#fff">${t} ${(p*100).toFixed(0)}%</div>`;
      }
      feedbackText += '</div>';
      // Reveal percentages on options
      document.querySelectorAll('#game-options .game-option').forEach(o => {
        const v = o.dataset.value;
        const prob = q.probs[v] || 0;
        const nameObj = GAME_DATA.syllable_names[v];
        o.innerHTML = `<span class="opt-dot"></span> ${nameObj.en} (${(prob*100).toFixed(0)}% chance)`;
      });
    } else if (q.type === 'compose') {
      const prob = this.sequenceProbability(this.state.composing, 'tui');
      // Score against random baseline (0.2 for each of 5 types)
      const randomBaseline = Math.pow(0.2, this.state.composing.length - 1);
      correct = prob > randomBaseline * 3;
      const pct = Math.min(100, (prob / (randomBaseline * 10)) * 100);
      if (correct && firstTry) this.state.score++;
      feedbackText = correct
        ? `Nice phrase! Naturalness score: ${pct.toFixed(0)}%. A tūī would find this plausible.`
        : `This sequence is quite unlikely for a tūī. Naturalness: ${pct.toFixed(0)}%. Tip: tūī songs are dominated by low-frequency runs (LF→LF has 73.3% probability).`;
      feedbackText += `<div class="compose-score-bar" style="margin-top:.6rem"><div class="compose-score-fill" style="width:${pct}%;background:${correct?'var(--pos)':'var(--neg)'}"></div></div>`;
    } else if (q.type === 'dialect') {
      const [r1, r2] = q.regions;
      const d1 = GAME_DATA.regional_diversity[r1];
      const d2 = GAME_DATA.regional_diversity[r2];
      const moreDiv = d1.H >= d2.H ? r1 : r2;
      correct = this.state.selected === moreDiv;
      if (correct && firstTry) this.state.score++;
      feedbackText = correct
        ? `Correct! ${moreDiv} has Shannon diversity H = ${GAME_DATA.regional_diversity[moreDiv].H.toFixed(2)}, meaning a more even mix of syllable types.`
        : `Actually, ${moreDiv} is more diverse (H = ${GAME_DATA.regional_diversity[moreDiv].H.toFixed(2)}) vs ${this.state.selected} (H = ${GAME_DATA.regional_diversity[this.state.selected].H.toFixed(2)}).`;
      feedbackText += ` The Shannon diversity index measures how evenly syllable types are distributed — higher means more variety.`;
    }

    // Highlight correct/wrong options
    this.state.lastCorrect = correct;
    document.querySelectorAll('#game-options .game-option').forEach(o => {
      o.classList.add('disabled');
      if (q.type === 'identify' || q.type === 'species') {
        const answer = q.type === 'identify' ? q.answer : q.species;
        if (o.dataset.value === answer) o.classList.add('correct');
        else if (o.classList.contains('selected')) o.classList.add('wrong');
      } else if (q.type === 'dialect') {
        const [r1, r2] = q.regions;
        const moreDiv = GAME_DATA.regional_diversity[r1].H >= GAME_DATA.regional_diversity[r2].H ? r1 : r2;
        if (o.dataset.value === moreDiv) o.classList.add('correct');
        else if (o.classList.contains('selected')) o.classList.add('wrong');
      }
    });

    fb.innerHTML = feedbackText;
    fb.className = 'game-feedback ' + (correct ? 'correct' : 'wrong');
    fb.style.display = 'block';
    if (correct) {
      submitBtn.textContent = this.state.qIndex < this.state.questions.length - 1 ? 'Next →' : 'See Results';
    } else {
      submitBtn.textContent = 'Try Again';
    }
    submitBtn.disabled = false;
  },

  next() {
    // If they got it wrong, retry the same question
    if (this.state.answered && !this.state.lastCorrect) {
      this.showQuestion();
      return;
    }
    this.state.qIndex++;
    this.state.scoredQ = false;
    if (this.state.qIndex >= this.state.questions.length) {
      this.showResult();
    } else {
      this.showQuestion();
    }
  },

  // ---- Scoring helpers ----
  sequenceProbability(seq, species) {
    if (seq.length < 2) return 1;
    const matrix = GAME_DATA.transition_probs[species];
    let prob = 1;
    for (let i = 0; i < seq.length - 1; i++) {
      const p = matrix[seq[i]] && matrix[seq[i]][seq[i + 1]];
      prob *= (p || 0.01);
    }
    return prob;
  },

  scoreSequence(seq, species) {
    return this.sequenceProbability(seq, species);
  },

  scoreTransitionAnswer(from, answer, species) {
    const probs = GAME_DATA.transition_probs[species][from];
    const sorted = Object.entries(probs).sort((a, b) => b[1] - a[1]);
    if (answer === sorted[0][0]) return 3;
    if (answer === sorted[1][0]) return 1;
    return 0;
  },

  // ---- Results ----
  showResult() {
    const config = GAME_DATA.level_config[this.state.level - 1];
    const total = config.total;
    let displayScore = this.state.score;
    let displayTotal = total;

    // Level 3 has weighted scoring
    if (this.state.level === 3) {
      displayTotal = total * 3;
    }

    const stars = this.calculateStars(displayScore, displayTotal);
    const passed = true; // everyone can pass — retry until correct

    // Save progress
    if (!this.progress.levels[this.state.level] || this.progress.levels[this.state.level].stars < stars) {
      this.progress.levels[this.state.level] = { completed: passed, stars: stars, bestScore: displayScore };
    }
    this.saveProgress();
    this.renderLevels();

    const scoreEl = document.getElementById('game-score');
    document.getElementById('game-question').style.display = 'none';
    document.getElementById('game-options').style.display = 'none';
    document.getElementById('game-submit-row').style.display = 'none';
    document.getElementById('game-feedback').style.display = 'none';

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const nextLevel = this.state.level < 5 && passed ? this.state.level + 1 : null;

    scoreEl.innerHTML = `
      <h3>${passed ? 'Tino pai!' : 'Kia kaha — try again!'}</h3>
      <div class="stars">${starStr}</div>
      <div class="stat-line">${displayScore} / ${displayTotal} ${this.state.level === 3 ? 'points' : 'correct'}</div>
      <div class="stat-line">${passed ? 'Level passed!' : `Need ${config.pass}${this.state.level === 3 ? ' pts' : ''} to pass`}</div>
      <button class="game-next-btn" onclick="GameEngine.startLevel(${this.state.level})" style="background:var(--ink-soft)">Retry Level ${this.state.level}</button>
      ${nextLevel ? `<button class="game-next-btn" onclick="GameEngine.startLevel(${nextLevel})">Level ${nextLevel} →</button>` : ''}
      ${!nextLevel && passed && this.state.level === 5 ? '<div style="margin-top:1rem;font-family:var(--display);font-size:1.1rem;color:var(--tui)">🎉 You\'ve mastered Te Reo Manu!</div>' : ''}`;
    scoreEl.style.display = 'block';
  },

  // ---- Progress bar ----
  updateProgress() {
    const total = this.state.questions.length;
    const current = this.state.qIndex + 1;
    document.getElementById('game-progress').textContent = `${current}/${total}`;
    document.getElementById('game-progress-fill').style.width = `${(current / total) * 100}%`;
  },

  // ---- Reset ----
  resetProgress() {
    localStorage.removeItem('reo-manu-progress');
    this.progress = { levels: {}, version: 1 };
    this.state = { level: 0, qIndex: 0, score: 0, selected: null, questions: [], answered: false, composing: [] };
    this.renderLevels();
    document.getElementById('game-intro').style.display = 'block';
    document.getElementById('game-question').style.display = 'none';
    document.getElementById('game-options').style.display = 'none';
    document.getElementById('game-submit-row').style.display = 'none';
    document.getElementById('game-score').style.display = 'none';
    document.getElementById('game-feedback').style.display = 'none';
  }
};

// ==================== STANDALONE BOOT ====================
// On the research page the game initialised lazily when its tab was opened.
// Here it is the whole page, so it initialises on load.
GameEngine.init();

// Keyboard and controller support. The engine renders options, level buttons
// and compose tokens as clickable <div>s; make each one focusable, let the
// arrow keys move a focus ring between whatever is on screen (nearest element
// in that direction), and let Enter/Space activate it, without touching the
// engine itself. A gamepad drives the same navigation on the website.
(function () {
  const SEL = '.game-option, .game-level-btn, .compose-token';
  const NAV = SEL + ', #game button';
  const area = document.getElementById('game');
  const optsEl = document.getElementById('game-options');
  const scoreEl = document.getElementById('game-score');
  const submitEl = document.getElementById('game-submit');
  const fbEl = document.getElementById('game-feedback');
  // On the xbox50 console the shell owns the gamepad and sends us keys.
  const ON_CONSOLE = location.pathname.startsWith('/cart/');
  const DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

  // navMode: the player is steering with keys or a pad, so keep a ring on
  // screen and put focus somewhere useful after every render. A real mouse
  // or finger turns it off again.
  let navMode = ON_CONSOLE;
  let current = null;
  let lastRect = null;

  const mark = () => area.querySelectorAll(SEL).forEach(el => {
    if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); }
    if (el.classList.contains('game-level-btn')) {
      // Locked levels stay out of the Tab order (as before this navigation
      // existed), and are announced as unavailable.
      const locked = el.classList.contains('locked');
      el.setAttribute('aria-disabled', locked ? 'true' : 'false');
      el.setAttribute('tabindex', locked ? '-1' : '0');
    }
  });

  const usable = el => el && el.isConnected && area.contains(el) &&
    el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' &&
    !el.disabled && !el.classList.contains('locked') && !el.classList.contains('disabled');
  const targets = () => Array.from(area.querySelectorAll(NAV)).filter(usable);
  const visible = el => el && usable(el);

  // Where focus should land when a screen or question appears.
  function defaultTarget() {
    if (scoreEl.style.display !== 'none' && scoreEl.innerHTML.trim()) {
      const next = Array.from(scoreEl.querySelectorAll('button')).filter(usable)
        .find(b => !/^Retry/.test(b.textContent.trim()));
      if (next) return next;   // "Level n →"
      // The last level has no next button, only Retry; a stray A there would
      // restart it. Rest the ring on the result itself, which A ignores.
      if (!scoreEl.hasAttribute('tabindex')) scoreEl.setAttribute('tabindex', '-1');
      return scoreEl;
    }
    const start = area.querySelector('#game-intro .start-btn');
    if (visible(start)) return start;
    if (visible(submitEl) && (GameEngine.state.answered || !submitEl.disabled)) return submitEl;
    return [area.querySelector('#compose-bank .compose-token'), area.querySelector('#q-audio button'),
      optsEl.querySelector('.game-option')].find(visible) || targets()[0] || null;
  }

  function setFocus(el) {
    if (!el) return;
    if (armed && armed !== el) disarm();
    if (current && current !== el) current.classList.remove('pad-focus');
    current = el;
    lastRect = el.getBoundingClientRect();
    if (navMode) el.classList.add('pad-focus');
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    if (navMode) {
      const r = el.getBoundingClientRect();
      const m = 80;   // clear of the xbox50 shell's hint pill at the bottom
      if (r.top < m || r.bottom > window.innerHeight - m) el.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
  }

  function nearestTo(rect) {
    if (!rect) return null;
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let best = null, bestD = Infinity;
    for (const el of targets()) {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
      if (d < bestD) { bestD = d; best = el; }
    }
    return best;
  }

  // Spatial step: among elements whose centre lies in that direction, take
  // the nearest. Left/right only ever moves along the current row.
  function step(dir) {
    const from = current.getBoundingClientRect();
    const fx = from.left + from.width / 2, fy = from.top + from.height / 2;
    const vertical = dir === 'up' || dir === 'down';
    let best = null, bestScore = Infinity;
    const cands = [];
    for (const el of targets()) {
      if (el === current) continue;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let primary, ortho, off;
      if (vertical) {
        if (dir === 'down' ? cy <= fy + 1 : cy >= fy - 1) continue;
        primary = Math.max(0, dir === 'down' ? r.top - from.bottom : from.top - r.bottom);
        ortho = Math.max(0, r.left - from.right, from.left - r.right);
        off = Math.abs(cx - fx);
      } else {
        if (dir === 'right' ? cx <= fx + 1 : cx >= fx - 1) continue;
        primary = Math.max(0, dir === 'right' ? r.left - from.right : from.left - r.right);
        ortho = Math.max(0, r.top - from.bottom, from.top - r.bottom);
        if (ortho > 0) continue;   // left/right stays on the same row
        off = Math.abs(cy - fy);
      }
      if (vertical) { cands.push({ el, r, primary, ortho, off, cy }); continue; }
      const score = primary + ortho * 3 + off * 0.1;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (!vertical || !cands.length) return best;
    // Up/down goes to the nearest row first, then the closest thing in it,
    // so a narrow centred button (Play) is not skipped for a full-width
    // option further down that happens to overlap the current column.
    cands.sort((a, b) => a.primary - b.primary || a.off - b.off);
    const band = cands[0].r;
    const row = cands.filter(c => c.cy >= band.top && c.cy <= band.bottom);
    row.sort((a, b) => a.ortho - b.ortho || a.off - b.off);
    return row[0].el;
  }

  // Returns true when the key was ours.
  function navigate(dir) {
    const wasNav = navMode;
    navMode = true;
    if (!visible(current)) { const d = defaultTarget(); if (d) { setFocus(d); return true; } return false; }
    if (!wasNav) { setFocus(current); return true; }   // first key press just shows the ring
    let next = step(dir);
    if (!next) return false;
    // Stepping into the level row from a question lands on the level being
    // played, not whichever button happens to sit nearest.
    const lvlBtn = el => el && el.classList.contains('game-level-btn');
    if (lvlBtn(next) && !lvlBtn(current) && midLevel()) {
      const act = area.querySelector('.game-level-btn.active');
      if (visible(act)) next = act;
    }
    setFocus(next);
    return true;
  }

  const onResult = () => scoreEl.style.display !== 'none' && !!scoreEl.innerHTML.trim();
  // A level is being played (not finished, not on its result screen).
  function midLevel() {
    const st = GameEngine.state;
    return st.level > 0 && st.questions.length > 0 && st.qIndex < st.questions.length && scoreEl.style.display !== 'block';
  }

  // Leaving a level partway through by key or pad takes two presses on the
  // same level button, with a visible warning in between, so no stray
  // choose (or double tap) can throw away a run.
  let armed = null, armedAt = 0, hintEl = null;
  function disarm() {
    armed = null;
    if (hintEl) hintEl.hidden = true;
  }
  function arm(el) {
    armed = el; armedAt = performance.now();
    if (!hintEl) {
      hintEl = document.createElement('div');
      hintEl.className = 'nav-leave-hint';
      hintEl.setAttribute('role', 'status');
      document.getElementById('game-levels').after(hintEl);
    }
    const st = GameEngine.state;
    const n = el.querySelector('.level-num');
    hintEl.textContent = `Level ${st.level} is in progress (${st.qIndex + 1}/${st.questions.length}). ` +
      `Choose Level ${n ? n.textContent.trim() : ''} again to leave it and lose your answers, or move away to stay.`;
    hintEl.hidden = false;
  }

  function activate() {
    navMode = true;
    // A locked level does nothing, and focus stays on it rather than jumping
    // somewhere the player did not ask to go.
    if (current && current.isConnected && current.classList.contains('game-level-btn') && current.classList.contains('locked')) return;
    const el = visible(current) ? current : null;
    if (!el) { setFocus(defaultTarget()); return; }
    // On a result screen the active level is the one just finished. Choosing
    // it by key or pad (after Back) must not quietly start it again: go back
    // to the result's own buttons, where Retry says what it does.
    if (el.classList.contains('game-level-btn') && el.classList.contains('active') && onResult()) {
      setFocus(defaultTarget()); return;
    }
    if (el.classList.contains('game-level-btn') && midLevel()) {
      // Choosing the level already being played would restart it and throw
      // away the answers so far. From keys or a pad that is almost always
      // one Back too many followed by A, so go back into the question.
      if (el.classList.contains('active')) { setFocus(defaultTarget()); return; }
      // Any other level: the first choose only warns. A second one counts
      // once the warning has been up long enough to read, not as the other
      // half of a double tap.
      if (armed !== el) { arm(el); return; }
      if (performance.now() - armedAt < 600) return;
    }
    const wasOption = el.classList.contains('game-option');
    const wasToken = el.classList.contains('compose-token');
    el.click();
    disarm();
    // Picking an answer (or filling the phrase) hands focus to Check, so a
    // pad plays as: choose, Check, Next.
    if ((wasOption || wasToken) && !GameEngine.state.answered && !submitEl.disabled && visible(submitEl)) setFocus(submitEl);
  }

  // Back: in Waiata take off the last token, otherwise jump to the level row.
  // Choosing the level row's active button mid-level does not restart it
  // (see activate), so no run of Back then A can wipe a level.
  function back() {
    navMode = true;
    const st = GameEngine.state;
    // Already on the level row: nothing further back, and in Waiata a token
    // the player cannot see must not come off.
    if (visible(current) && current.classList.contains('game-level-btn')) {
      // Back is the natural "no" to the leave-level warning: cancel it and
      // return to the question, so the next choose cannot leave the level.
      if (armed) { disarm(); setFocus(defaultTarget()); return; }
      setFocus(current); return;
    }
    const bank = area.querySelector('#compose-bank');
    if (bank && !st.answered && !st.composing.length && visible(bank.querySelector('.compose-token'))) {
      // An empty phrase has nothing to take off: stay in the bank.
      if (!(visible(current) && bank.contains(current))) setFocus(bank.querySelector('.compose-token'));
      else setFocus(current);
      return;
    }
    if (area.querySelector('#compose-seq') && st.composing.length && !st.answered) {
      const type = st.composing[st.composing.length - 1];
      GameEngine.removeToken(st.composing.length - 1);
      // Removing disables Check (and re-renders the phrase), so focus would
      // otherwise fall to the nearest placed token and the next A would
      // delete a second one. Go to the bank instead.
      if (!(visible(current) && bank.contains(current))) {
        setFocus(bank.querySelector(`.compose-token[data-type="${type}"]`) || bank.querySelector('.compose-token'));
      }
      return;
    }
    const lvl = area.querySelector('.game-level-btn.active') || area.querySelector('.game-level-btn:not(.locked)');
    if (visible(lvl)) setFocus(lvl);
  }

  // After the engine re-renders: a new question or result screen resets focus
  // to its default; anything else only repairs focus that was lost.
  new MutationObserver(records => {
    mark();
    if (!navMode) return;
    const fresh = records.some(r => r.target === optsEl || r.target === scoreEl);
    if (fresh) setFocus(defaultTarget());
    else if (!visible(current)) setFocus(nearestTo(lastRect) || defaultTarget());
    // Check's feedback box lands above the button and pushes Next off screen;
    // bring the ring back into view.
    else if (records.some(r => fbEl.contains(r.target))) setFocus(current);
  }).observe(area, { childList: true, subtree: true });
  mark();
  // The feedback's spectrogram grows the box again once it has loaded.
  area.addEventListener('load', e => {
    if (navMode && e.target.tagName === 'IMG' && fbEl.contains(e.target) && visible(current)) setFocus(current);
  }, true);

  // Off the console, the arrows and Space scroll the page as usual until the
  // player has engaged the game: Enter, keyboard focus inside it (Tab), or
  // already steering. Focus left behind by a mouse click does not count, so
  // a mouse player can still scroll with the arrows after clicking an answer.
  let pointerFocus = false;
  let spaceOurs = false;
  // Keyboard focus on the rest of the page (a footer link, reached by Tab)
  // belongs to the page: the arrows scroll and Backspace is left alone there.
  const outside = t => !ON_CONSOLE && !!t && t.nodeType === 1 && t !== document.body && t !== document.documentElement && !area.contains(t);
  const engaged = t => ON_CONSOLE || (!outside(t) && (navMode || (!pointerFocus && t && t !== document.body && t !== document.documentElement && area.contains(t))));

  // The xbox50 shell sends one keydown per stick push and never repeats it,
  // and a diagonal push arrives as two arrows in the same frame. Gather the
  // arrows for a moment, take one step (up/down wins a diagonal: the game's
  // lists run down the page), then repeat it while the stick stays held,
  // like the website's own gamepad poll.
  const COMBINE_MS = 30, REPEAT_DELAY = 400, REPEAT_RATE = 150;
  const shellHeld = new Set();
  let batch = null, batchTimer = 0, repeatKey = null, repeatTimer = 0;
  function stopRepeat() { clearTimeout(repeatTimer); repeatKey = null; }
  function shellArrow(key) {
    shellHeld.add(key);
    if (!batch) { batch = []; batchTimer = setTimeout(flushBatch, COMBINE_MS); }
    batch.push(key);
  }
  function flushBatch() {
    // Every push in the window counts, even a one-frame flick that was
    // already released; only a key still held goes on to repeat.
    const keys = batch;
    batch = null;
    if (!keys.length) return;
    const key = keys.find(k => k === 'ArrowUp' || k === 'ArrowDown') || keys[0];
    stopRepeat();
    navigate(DIRS[key]);
    if (!shellHeld.has(key)) return;
    repeatKey = key;
    const again = delay => { repeatTimer = setTimeout(() => {
      if (repeatKey !== key || !shellHeld.has(key) || document.hidden) return stopRepeat();
      navigate(DIRS[key]); again(REPEAT_RATE);
    }, delay); };
    again(REPEAT_DELAY);
  }
  function releaseShell() { shellHeld.clear(); stopRepeat(); }
  window.addEventListener('blur', releaseShell);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseShell(); });

  // The xbox50 shell sends a button's key when the button comes up. The
  // press that picked this game in the console's chooser can still be down
  // while the game loads, and its release would arrive here as a choose
  // (or, held longer, a back) the player never meant. The shell drops any
  // release that comes 2.5 s or more after the game started, so only the
  // first choose/back inside that window can be such a leftover.
  //
  // Where this page can see the pad, judge that first key against the pad's
  // reading at load (only A and B, the buttons the shell treats as the
  // click): if A/B now differ from that reading, the key is the pick press
  // coming up and is ignored; if they are back where they were, it is a
  // real tap. This holds for a homebrew stick that reads "pressed" at rest.
  // A pad that only shows up later (the browser can hide a pad until a
  // button is pressed on this page) was not holding anything at load, so
  // there is no leftover to catch. Where the page never sees a pad (the
  // Arduino stick reaches the shell over serial), there is no telling, so
  // that first key is ignored.
  const PICK_WINDOW_MS = 2700;   // the shell's 2.5 s hold-to-quit, plus slack
  const PICK_SEEN_MS = 300;      // a pad seen this soon counts as there at load
  const pickStart = performance.now();
  let pickBase = null;           // A/B reading when the pad was first seen
  let pickDone = !ON_CONSOLE;
  function readPick() {
    let pads = [];
    try { pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean); } catch (e) {}
    if (!pads.length) return null;
    const on = b => !!(b && b.pressed);
    return pads.map(p => p.index + ':' + +on(p.buttons[0]) + +on(p.buttons[1])).join(' ');
  }
  function watchPick() {
    if (pickDone || performance.now() > PICK_WINDOW_MS) return;
    const seen = readPick();
    if (seen !== null) {
      if (performance.now() - pickStart <= PICK_SEEN_MS) pickBase = seen;
      else pickDone = true;
      return;
    }
    requestAnimationFrame(watchPick);
  }
  if (ON_CONSOLE) watchPick();
  // Called for each choose/back the shell sends: true means ignore it.
  function pickLeftover() {
    if (pickDone) return false;
    pickDone = true;
    if (performance.now() > PICK_WINDOW_MS) return false;
    if (pickBase === null) return true;
    return readPick() !== pickBase;
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Tab') pointerFocus = false;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (ON_CONSOLE && !e.isTrusted && !e.repeat &&
        (e.key === 'Enter' || e.key === ' ' || e.key === 'Backspace') && pickLeftover()) { e.preventDefault(); return; }
    const dir = DIRS[e.key];
    if (dir) {
      // Once steering, the arrows belong to the game even when there is
      // nothing further that way; otherwise they would scroll the page.
      if (!engaged(e.target)) return;
      e.preventDefault();
      if (ON_CONSOLE && !e.isTrusted) { if (!e.repeat && !shellHeld.has(e.key)) shellArrow(e.key); }
      else navigate(dir);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      const t = e.target;
      const inGame = t.closest && t.closest(NAV) && area.contains(t);
      // Space on something the mouse last clicked is still the reader's
      // Space (scroll, or a native button's own click), not a way in.
      if (e.key === ' ' && pointerFocus && !navMode) return;
      if (inGame) {
        e.preventDefault();
        if (e.key === ' ') spaceOurs = true;
        if (e.repeat) return;
        current = t.closest(NAV);
        activate();
        return;
      }
      // A key aimed at nothing in particular (the page body, where the
      // console's keys land before anything has focus, or a fresh page).
      // Enter always engages the game from here; Space only while steering,
      // so a reader's Space still scrolls. When not yet steering this just
      // shows the ring (on Begin, on a fresh page) and never clicks whatever
      // the mouse last touched.
      const onBody = t === document.body || t === document.documentElement || t === document;
      if (!onBody || !(e.key === 'Enter' || engaged(t))) return;
      e.preventDefault();
      if (e.repeat) return;
      if (navMode) activate();
      else { navMode = true; setFocus(defaultTarget()); }
      return;
    }
    // Held Backspace auto-repeats; one press takes off one token, like Enter.
    if (e.key === 'Backspace' && navMode && !outside(e.target)) { e.preventDefault(); if (e.repeat) return; back(); }
  });
  // Space on a native <button> clicks on keyup; we already clicked on keydown.
  window.addEventListener('keyup', e => {
    if (DIRS[e.key] && shellHeld.delete(e.key) && repeatKey === e.key) stopRepeat();
    if (e.key !== ' ') return;
    if (spaceOurs && e.target.closest && e.target.closest('#game button')) e.preventDefault();
    spaceOurs = false;
  });

  window.addEventListener('pointerdown', () => {
    navMode = false;
    disarm();
    pointerFocus = true;
    if (current) current.classList.remove('pad-focus');
  }, true);
  // Tab (or anything else) moving focus away cancels the leave warning too.
  // Focus leaving the game takes the ring with it, so there is never a
  // second, stale ring; Tab back in (or an arrow once focus is on the page
  // body again) puts it back.
  document.addEventListener('focusin', e => {
    if (armed && e.target !== armed) disarm();
    if (outside(e.target) && current) current.classList.remove('pad-focus');
  });
  area.addEventListener('focusin', e => {
    const el = e.target.closest && e.target.closest(NAV);
    if (!el) return;
    if (el !== current) { if (current) current.classList.remove('pad-focus'); current = el; lastRect = el.getBoundingClientRect(); }
    if (navMode) el.classList.add('pad-focus');
  });

  if (ON_CONSOLE) setFocus(defaultTarget());

  // ---- Gamepad (website only) ----
  // D-pad or left stick moves, A (button 0) chooses, B (button 1) goes back.
  // Holding a direction repeats. Off on the console, where the shell reads
  // the pad and would otherwise double every press.
  if (ON_CONSOLE || !navigator.getGamepads) return;
  const DEAD = 0.5;   // REPEAT_DELAY and REPEAT_RATE are shared with the shell repeat above
  const held = {};
  let polling = false;

  function edge(name, down, now, fn, repeat) {
    const h = held[name];
    if (down && !h) { held[name] = now + REPEAT_DELAY; fn(); }
    else if (down && repeat && now >= h) { held[name] = now + REPEAT_RATE; fn(); }
    else if (!down) held[name] = 0;
  }

  function poll() {
    const pads = Array.from(navigator.getGamepads()).filter(Boolean);
    if (!pads.length) { polling = false; return; }
    const now = performance.now();
    // Only steer while this page has focus. Embedded in an iframe (the
    // research page), a pad press must not pull focus out of the parent
    // page or play a game the reader cannot see; click into it first.
    if (document.hidden || !document.hasFocus()) {
      // Whatever is held now has to be released before it counts.
      for (const k of ['up', 'down', 'left', 'right', 'a', 'b']) held[k] = Infinity;
    } else {
      let up = false, down = false, left = false, right = false, a = false, b = false;
      for (const p of pads) {
        const btn = i => !!(p.buttons[i] && p.buttons[i].pressed);
        // The stick points one way only: whichever axis it leans on more.
        let x = p.axes[0] || 0, y = p.axes[1] || 0;
        if (Math.abs(x) > Math.abs(y)) y = 0; else x = 0;
        up = up || btn(12) || y < -DEAD;
        down = down || btn(13) || y > DEAD;
        left = left || btn(14) || x < -DEAD;
        right = right || btn(15) || x > DEAD;
        a = a || btn(0);
        b = b || btn(1);
      }
      // A diagonal (two d-pad arrows, or two pads) is one step, and up/down
      // wins, as with the console's stick: the game's lists run down the page.
      if (up || down) left = right = false;
      const go = dir => () => navigate(dir);
      edge('up', up, now, go('up'), true);
      edge('down', down, now, go('down'), true);
      edge('left', left, now, go('left'), true);
      edge('right', right, now, go('right'), true);
      edge('a', a, now, activate, false);
      edge('b', b, now, back, false);
    }
    requestAnimationFrame(poll);
  }
  function startPolling() { if (!polling) { polling = true; requestAnimationFrame(poll); } }
  window.addEventListener('gamepadconnected', startPolling);
  if (Array.from(navigator.getGamepads()).some(Boolean)) startPolling();
})();
