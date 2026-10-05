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
    {name:'E Whai Ake', mi:'What Comes Next?',   total:15, pass:11, desc:'Predict tūī song transitions'},
    {name:'Waiata',     mi:'Compose the Song',   total:6,  pass:3,  desc:'Build a plausible tūī phrase'},
    {name:'Te Rohe',    mi:'Regional Dialects',  total:8,  pass:5,  desc:'Read tūī dialect geography'}
  ],
  // Each syllable sample carries this much of the surrounding song either
  // side of the syllable itself (the spectrograms show it). Play only the
  // syllable, so a sample is heard once and not with its neighbours.
  sample_pad: 0.2
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
      // Level 3: What comes next — given a syllable, which of two successors
      // is more likely. Most likely overall is nearly always LF or a repeat,
      // so asking for the top successor had the same answer everywhere. Each
      // pair here has a different winner after some other syllable, so the
      // answer depends on what the tūī just sang.
      // Draw again until every syllable offered as a choice is wrong at least
      // once, so "always pick LF" (or any one type) cannot win the level.
      const matrix = GAME_DATA.transition_probs.tui;
      const alwaysRight = qs => GAME_DATA.syllable_types.some(t =>
        qs.some(q => q.choices.includes(t)) && qs.every(q => !q.choices.includes(t) || q.answer === t));
      for (let tries = 0; tries < 100 && (!questions.length || alwaysRight(questions)); tries++) {
        questions.length = 0;
        for (const from of GAME_DATA.syllable_types) {
          const pairs = this.contrastPairs(from, 'tui');
          this.shuffle(pairs);
          for (const [answer, other] of pairs.slice(0, 3)) {
            const choices = [answer, other];
            this.shuffle(choices);
            questions.push({ type: 'transition', from, probs: matrix[from], answer, choices });
          }
        }
      }
      this.shuffle(questions);
    } else if (level === 4) {
      // Level 4: Compose a song — arrange tokens. Each phrase must include a
      // given syllable and at least three types, so one syllable repeated
      // (or one phrase reused) cannot win; see composeProblem.
      const needs = ['H', 'HF', 'T', 'R'];
      this.shuffle(needs);
      for (let i = 0; i < 6; i++) {
        const len = 5 + Math.floor(Math.random() * 3); // 5-7 tokens
        questions.push({ type: 'compose', length: len, include: needs[i % needs.length] });
      }
    } else if (level === 5) {
      // Level 5: Regional dialects — compare two named regions. Half the
      // questions ask which is more diverse, half which sings more of one
      // syllable type. The regions are listed most diverse first, so the
      // pair order is set per question (half A, half B), and no region turns
      // up more than twice where that can be managed.
      const rd = GAME_DATA.regional_diversity;
      const regionNames = Object.keys(rd);
      const div = [], mix = [];
      for (let i = 0; i < regionNames.length; i++) {
        for (let j = i + 1; j < regionNames.length; j++) {
          const a = rd[regionNames[i]], b = rd[regionNames[j]];
          const pair = [regionNames[i], regionNames[j]];
          if (Math.abs(a.H - b.H) > 0.15) div.push({ type: 'dialect', ask: 'H', regions: pair });
          for (const t of GAME_DATA.syllable_types) {
            const hi = Math.max(a.type_pcts[t], b.type_pcts[t]), lo = Math.min(a.type_pcts[t], b.type_pcts[t]);
            if (hi - lo >= 5 && hi >= lo * 1.5) mix.push({ type: 'dialect', ask: t, regions: pair });
          }
        }
      }
      let picked = [];
      for (let tries = 0; tries < 400 && picked.length < 8; tries++) {
        const cap = tries < 200 ? 2 : 3;
        const uses = {}, asked = new Set();
        picked = [];
        this.shuffle(div); this.shuffle(mix);
        const take = (pool, n) => {
          let got = 0;
          for (const q of pool) {
            if (got >= n) break;
            if (q.regions.some(r => (uses[r] || 0) >= cap)) continue;
            if (q.ask !== 'H' && asked.has(q.ask)) continue;   // one question per syllable type
            q.regions.forEach(r => { uses[r] = (uses[r] || 0) + 1; });
            asked.add(q.ask);
            picked.push(q);
            got++;
          }
        };
        take(div, 4);
        take(mix, 4);
      }
      const winnerFirst = picked.map((_, i) => i % 2 === 0);
      this.shuffle(winnerFirst);
      picked.forEach((q, i) => {
        const win = this.dialectAnswer(q);
        const lose = q.regions[0] === win ? q.regions[1] : q.regions[0];
        questions.push({ type: 'dialect', ask: q.ask, regions: winnerFirst[i] ? [win, lose] : [lose, win] });
      });
      this.shuffle(questions);
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
    document.getElementById('q-audio').innerHTML = `<button class="game-play-btn" onclick="GameEngine.playAudio('${q.audio}',this,GAME_DATA.sample_pad)"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Play</button>`;
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
    document.getElementById('q-text').innerHTML = `A tūī just sang a <span style="color:${GAME_DATA.syllable_colors[q.from]};font-weight:600">${fromName.en}</span> syllable. Which is it more likely to sing next?`;
    document.getElementById('q-context').textContent = 'What a tūī sings next depends on what it just sang. Pick the likelier of the two.';
    // Play an example of the "from" type
    const key = GAME_DATA.sample_keys[q.from];
    document.getElementById('q-audio').innerHTML = `<button class="game-play-btn" onclick="GameEngine.playAudio('samples/${key}_0.wav',this,GAME_DATA.sample_pad)"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Hear ${fromName.en}</button>`;
    this.renderOptions(q.choices.map(t => ({
      value: t,
      label: `${GAME_DATA.syllable_names[t].en} (${(q.probs[t] * 100).toFixed(0)}% chance)`
    })), true);  // hideProbs=true until answered
  },

  renderCompose(q) {
    document.getElementById('q-text').textContent = `Compose a ${q.length}-syllable tūī phrase with a ${GAME_DATA.syllable_names[q.include].en} in it`;
    document.getElementById('q-context').textContent = 'Use at least three different syllable types, no more than three of one in a row, and a new phrase each time. The more natural the order is to a tūī, the higher your score. Click a placed token to remove it.';
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
    const askName = q.ask === 'H' ? null : GAME_DATA.syllable_names[q.ask];
    document.getElementById('q-text').textContent = askName
      ? `Which region's tūī sing more ${askName.en} (${askName.mi}) syllables?`
      : 'Which region has more diverse tūī song?';
    document.getElementById('q-context').innerHTML = askName
      ? 'Each bar is one region\'s mix of syllable types. Tūī song differs from region to region.'
      : 'Compare the syllable distribution between two regions. Higher diversity = more even mix of syllable types.';
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
      <div style="margin-bottom:1rem">${barHtml(r1, d1)}${barHtml(r2, d2)}</div>
      <div class="game-option" onclick="GameEngine.selectOpt(this,this.dataset.value)" data-value="${r1.replace(/"/g,'&quot;')}"><span class="opt-dot"></span> ${r1}</div>
      <div class="game-option" onclick="GameEngine.selectOpt(this,this.dataset.value)" data-value="${r2.replace(/"/g,'&quot;')}"><span class="opt-dot"></span> ${r2}</div>`;
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

  // pad (seconds): skip that much at each end and play only the middle, so a
  // syllable sample is heard once, without the song around it.
  playAudio(src, btn, pad) {
    // Remember each button's resting label once, so a second tap mid-clip
    // does not save "Playing…" as the label to come back to.
    if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
    if (this._audio) { this._audio.stop(); this._audio = null; }
    if (this._audioBtn && this._audioBtn.dataset.label) this._audioBtn.innerHTML = this._audioBtn.dataset.label;
    const player = { stopped: false, stop() { this.stopped = true; if (this.node) this.node(); } };
    this._audio = player;
    this._audioBtn = btn;
    const origHTML = btn.dataset.label;
    btn.innerHTML = origHTML.replace('Play', 'Playing…').replace('Hear ', 'Playing ');
    // Only the clip still playing may put its label back; a superseded clip
    // (stopped above) would otherwise reset the newer one's "Playing…".
    const done = () => { if (this._audio !== player) return; btn.innerHTML = origHTML; this._audio = null; this._audioBtn = null; };
    const whole = () => {
      if (player.stopped) return;
      const audio = new Audio(src);
      player.node = () => audio.pause();
      audio.addEventListener('ended', done);
      audio.addEventListener('error', done);
      audio.play().catch(done);
    };
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!pad || !Ctx) { whole(); return; }
    // Web Audio cuts to the millisecond; an <audio> element's end time is
    // too coarse for a 60 ms syllable. If it fails, play the whole sample.
    const ctx = this._ctx || (this._ctx = new Ctx());
    if (ctx.state === 'suspended') ctx.resume();   // inside the tap, or it stays muted
    this._buffers = this._buffers || {};
    const load = this._buffers[src] || (this._buffers[src] = fetch(src)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(b => new Promise((ok, fail) => ctx.decodeAudioData(b, ok, fail))));
    load.then(buf => {
      if (player.stopped) return;
      const len = Math.max(0.01, buf.duration - 2 * pad), t = ctx.currentTime, fade = 0.003;
      const node = ctx.createBufferSource(), gain = ctx.createGain();
      node.buffer = buf;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(1, t + fade);
      gain.gain.setValueAtTime(1, t + len - fade);
      gain.gain.linearRampToValueAtTime(0, t + len);
      node.connect(gain); gain.connect(ctx.destination);
      node.onended = done;
      player.node = () => { try { node.stop(); } catch (e) {} };
      node.start(t, pad, len);
    }).catch(() => { delete this._buffers[src]; whole(); });
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
      feedbackText += `<div style="margin-top:.8rem"><img src="${q.spectrogram}" alt="Spectrogram" style="max-width:100%;border-radius:4px;border:1px solid var(--rule)"><div style="font-family:var(--mono);font-size:.68rem;color:var(--ink-faint)">The syllable you heard starts at 0.2 s; either side is the song around it.</div></div>`;
    } else if (q.type === 'species') {
      correct = this.state.selected === q.species;
      const names = { tui: 'Tūī', bellbird: 'Korimako', kaka: 'Kākā', kea: 'Kea', morepork: 'Morepork (Ruru)', fantail: 'Fantail (Pīwakawaka)', warbler: 'Grey Warbler (Riroriro)' };
      feedbackText = correct
        ? `Correct! That was a ${names[q.species]}.`
        : `That was a ${names[q.species]}, not a ${names[this.state.selected]}.`;
      if (correct && firstTry) this.state.score++;
    } else if (q.type === 'transition') {
      const sorted = Object.entries(q.probs).sort((a, b) => b[1] - a[1]);
      const other = q.choices.find(t => t !== q.answer);
      const fromEn = GAME_DATA.syllable_names[q.from].en;
      const pc = t => `${GAME_DATA.syllable_names[t].en} (${(q.probs[t] * 100).toFixed(0)}%)`;
      correct = this.state.selected === q.answer;
      if (correct && firstTry) this.state.score++;
      // Name a syllable after which the other one wins, so the point lands:
      // the answer depends on what came before.
      const flip = GAME_DATA.syllable_types.find(f => f !== q.from && this.contrastWins(f, other, q.answer, 'tui'));
      feedbackText = (correct ? 'Correct! ' : '') + `After a ${fromEn}, ${pc(q.answer)} is more likely than ${pc(other)}.` +
        (flip ? ` After a ${GAME_DATA.syllable_names[flip].en} it is the other way round.` : '');
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
      const seq = this.state.composing;
      const used = this.state.usedPhrases || (this.state.usedPhrases = []);
      const problem = this.composeProblem(seq, q, used);
      const ranked = this.composeRank(q, 'tui');
      const pct = problem ? 0 : this.composeScore(seq, ranked, 'tui') * 100;
      correct = !problem && pct >= this.COMPOSE_PASS * 100;
      if (correct) used.push(seq.join('-'));
      if (correct && firstTry) this.state.score++;
      // Suggest one not already sung, or the hint could not be used.
      const best = (ranked.top.find(t => !used.includes(t.seq.join('-'))) || ranked.top[0]).seq.join(' → ');
      feedbackText = problem ? problem
        : correct
          ? `Nice phrase! Naturalness score: ${pct.toFixed(0)}%. A tūī would find this plausible.`
          : `This order is quite unlikely for a tūī. Naturalness: ${pct.toFixed(0)}% (you need ${(this.COMPOSE_PASS * 100).toFixed(0)}%).`;
      if (!correct) feedbackText += ` A very tūī-like one: ${best}. Tip: tūī mostly open on Low Frequency, tend to repeat a syllable, and fall back to Low Frequency between changes.`;
      feedbackText += `<div class="compose-score-bar" style="margin-top:.6rem"><div class="compose-score-fill" style="width:${pct}%;background:${correct?'var(--pos)':'var(--neg)'}"></div></div>`;
    } else if (q.type === 'dialect') {
      const rd = GAME_DATA.regional_diversity;
      const moreDiv = this.dialectAnswer(q);
      correct = this.state.selected === moreDiv;
      if (correct && firstTry) this.state.score++;
      if (q.ask !== 'H') {
        const less = q.regions.find(r => r !== moreDiv);
        const en = GAME_DATA.syllable_names[q.ask].en;
        feedbackText = `${correct ? 'Correct! ' : ''}${moreDiv}'s tūī: ${rd[moreDiv].type_pcts[q.ask]}% ${en}, against ${rd[less].type_pcts[q.ask]}% in ${less}. Tūī song differs from region to region.`;
      } else feedbackText = correct
        ? `Correct! ${moreDiv} has Shannon diversity H = ${GAME_DATA.regional_diversity[moreDiv].H.toFixed(2)}, meaning a more even mix of syllable types.`
        : `Actually, ${moreDiv} is more diverse (H = ${GAME_DATA.regional_diversity[moreDiv].H.toFixed(2)}) vs ${this.state.selected} (H = ${GAME_DATA.regional_diversity[this.state.selected].H.toFixed(2)}).`;
      if (q.ask === 'H') feedbackText += ` The Shannon diversity index measures how evenly syllable types are distributed — higher means more variety.`;
    }

    // Highlight correct/wrong options
    this.state.lastCorrect = correct;
    document.querySelectorAll('#game-options .game-option').forEach(o => {
      o.classList.add('disabled');
      if (q.type === 'identify' || q.type === 'species') {
        const answer = q.type === 'identify' ? q.answer : q.species;
        if (o.dataset.value === answer) o.classList.add('correct');
        else if (o.classList.contains('selected')) o.classList.add('wrong');
      } else if (q.type === 'dialect' || q.type === 'transition') {
        const moreDiv = q.type === 'dialect' ? this.dialectAnswer(q) : q.answer;
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

  // A transition "wins" when it is clearly (1.4x) the likelier of the two.
  contrastWins(from, a, b, species) {
    const row = GAME_DATA.transition_probs[species][from];
    return row[a] >= row[b] * 1.4;
  },

  // Level 3 pairs for one syllable: [likelier, other], kept only when some
  // other syllable reverses the order, so no fixed answer works everywhere.
  contrastPairs(from, species) {
    const types = GAME_DATA.syllable_types, pairs = [];
    for (let i = 0; i < types.length; i++) {
      for (let j = i + 1; j < types.length; j++) {
        const a = types[i], b = types[j];
        const pair = this.contrastWins(from, a, b, species) ? [a, b] : this.contrastWins(from, b, a, species) ? [b, a] : null;
        if (pair && types.some(f => f !== from && this.contrastWins(f, pair[1], pair[0], species))) pairs.push(pair);
      }
    }
    return pairs;
  },

  // How likely a tūī is to sing this whole phrase: its opening syllable,
  // then each transition. Without the opening, a phrase could start on a
  // rare syllable for free.
  phraseProbability(seq, species) {
    return (GAME_DATA.opening_prefs[species][seq[0]] || 0.01) * this.sequenceProbability(seq, species);
  },

  // Level 4 naturalness: 1 for the likeliest phrase that fits the rules,
  // 0.5 for one a tenth as likely (the pass mark), 0 at a hundredth.
  COMPOSE_PASS: 0.5,

  // Level 4 rules: why a phrase cannot score, or null. Without them one
  // syllable repeated (LF→LF is 73%) beat every real phrase.
  composeProblem(seq, q, used) {
    const name = t => GAME_DATA.syllable_names[t].en;
    if (new Set(seq).size < 3) return 'Use at least three different syllable types: a tūī phrase is more than one sound repeated.';
    for (let i = 3; i < seq.length; i++) {
      if (seq[i] === seq[i - 1] && seq[i] === seq[i - 2] && seq[i] === seq[i - 3]) return `No more than three ${name(seq[i])} syllables in a row.`;
    }
    if (q.include && !seq.includes(q.include)) return `This phrase needs a ${name(q.include)} in it.`;
    if (used && used.includes(seq.join('-'))) return 'You have already sung that phrase in this level. Compose a new one.';
    return null;
  },

  // The likeliest phrases of this length that fit the rules, best first.
  // 5^7 phrases at most, worked out once per question.
  composeRank(q, species) {
    if (q._ranked) return q._ranked;
    const types = GAME_DATA.syllable_types, top = [];
    const seq = [];
    const walk = () => {
      if (seq.length === q.length) {
        if (this.composeProblem(seq, q)) return;
        const p = this.phraseProbability(seq, species);
        if (top.length < 8 || p > top[top.length - 1].p) {
          top.push({ p, seq: seq.slice() });
          top.sort((a, b) => b.p - a.p);
          if (top.length > 8) top.pop();
        }
        return;
      }
      for (const t of types) { seq.push(t); walk(); seq.pop(); }
    };
    walk();
    q._ranked = { top, best: top[0].seq, bestP: top[0].p };
    return q._ranked;
  },

  composeScore(seq, ranked, species) {
    const ratio = this.phraseProbability(seq, species) / ranked.bestP;
    return Math.max(0, Math.min(1, 1 + Math.log10(ratio) / 2 + 1e-9));
  },

  // Level 5: the region with more diversity (ask 'H') or more of one type.
  dialectAnswer(q) {
    const [r1, r2] = q.regions, rd = GAME_DATA.regional_diversity;
    const v = r => q.ask && q.ask !== 'H' ? rd[r].type_pcts[q.ask] : rd[r].H;
    return v(r1) >= v(r2) ? r1 : r2;
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
      <div class="stat-line">${displayScore} / ${displayTotal} correct</div>
      <div class="stat-line">${passed ? 'Level passed!' : `Need ${config.pass} to pass`}</div>
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
      // Instant, not the page's smooth scroll: an animation still running
      // when the next screen renders would carry the new ring off screen.
      if (r.top < m || r.bottom > window.innerHeight - m) el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    }
  }

  // After Check: show the verdict from its top, then bring the ring as far
  // into view as that allows. Centring the button alone pushed a tall
  // feedback box off the top, with no way to scroll back while steering.
  function showFeedback() {
    // A spectrogram can finish loading after the player has moved on and
    // the box is hidden again; nothing to show then.
    if (!visible(current) || !visible(fbEl)) return;
    setFocus(current);
    const m = 80, bottom = window.innerHeight - m;
    const fb = fbEl.getBoundingClientRect();
    const r = current.getBoundingClientRect();
    let dy = 0;
    if (r.bottom > bottom) dy = Math.min(r.bottom - bottom, fb.top - 8);
    else if (fb.top < 8) dy = Math.max(fb.top - 8, r.bottom - bottom);
    // On a very short screen both cannot fit: the ring wins, so the player
    // always sees what A will press. setFocus has already centred it.
    if (r.bottom - dy > bottom) return;
    if (dy) window.scrollBy({ top: dy, behavior: 'instant' });
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
    // Tab took keyboard focus elsewhere (a link) and the ring came off: the
    // first A only brings the ring back, so nothing is chosen unseen. A key
    // on the focused element itself is seen through its own outline.
    if (!el.classList.contains('pad-focus') && document.activeElement !== el) { setFocus(el); return; }
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
    const seq = area.querySelector('#compose-seq');
    const placed = wasToken && seq && seq.contains(el) ? [...seq.children].indexOf(el) : -1;
    el.click();
    disarm();
    // Taking a token off the phrase: stay in the phrase, or once it is empty
    // go to the bank token of that type (as back() does), never whichever
    // bank token sits nearest, which the next A would add unaimed.
    if (placed >= 0) {
      const left = seq.querySelectorAll('.compose-token');
      setFocus(left[Math.min(placed, left.length - 1)] ||
        area.querySelector(`#compose-bank .compose-token[data-type="${el.dataset.type}"]`));
      return;
    }
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
    else if (records.some(r => fbEl.contains(r.target))) showFeedback();
  }).observe(area, { childList: true, subtree: true });
  mark();
  // The feedback's spectrogram grows the box again once it has loaded.
  area.addEventListener('load', e => {
    if (navMode && e.target.tagName === 'IMG' && fbEl.contains(e.target)) showFeedback();
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
  // and a diagonal push arrives as two arrows, in the same frame or a few
  // frames apart. Gather the arrows for ~5 frames, take one step (up/down
  // wins a diagonal: the game's lists run down the page), then repeat it
  // while the stick stays held, like the website's own gamepad poll.
  const COMBINE_MS = 80, REPEAT_DELAY = 400, REPEAT_RATE = 150;
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
    // Focus on something we do not steer (the intro's Methodology link) has
    // its own outline: drop ours, so there is only ever one ring.
    if (!el) { if (current && e.target !== current) current.classList.remove('pad-focus'); return; }
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
