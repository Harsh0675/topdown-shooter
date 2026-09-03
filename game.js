(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  const W = 480, H = 800, TAU = Math.PI * 2;

  const ui = {
    wave: $('wave'), score: $('score'), best: $('best'), combo: $('combo'),
    hp: $('hp-bar'), shield: $('shield-bar'), boss: $('boss-bar'), bossHp: $('boss-hp'),
    bossName: $('boss-name'), bossText: $('boss-hp-text'), toast: $('toast'),
    overlay: $('overlay'), menu: $('menu-panel'), over: $('gameover-panel'),
    upgrade: $('upgrade-panel'), upgrades: $('upgrade-list'), finalScore: $('final-score'),
    finalWave: $('final-wave'), ship: $('ship-name'), sound: $('sound-state'), dash: $('dash-hint')
  };

  let state = 'menu';
  let last = 0;
  let score = 0;
  let wave = 1;
  let combo = 1;
  let comboTimer = 0;
  let waveKills = 0;
  let nextWaveKills = 8;
  let spawnTimer = 0.5;
  let dashCooldown = 0;
  let shake = 0;
  let boss = null;
  let shipIndex = Number(localStorage.getItem('neon-strike-ship') || 0);
  let best = Number(localStorage.getItem('neon-strike-best') || 0);
  let soundOn = localStorage.getItem('neon-strike-sound') !== 'off';

  const ships = [
    { name: 'INTERCEPTOR', speed: 1, damage: 1 },
    { name: 'BLASTER', speed: 0.9, damage: 1.35 },
    { name: 'PHANTOM', speed: 1.2, damage: 0.85 }
  ];

  const player = {
    x: W / 2, y: H - 100, r: 18, speed: 330,
    hp: 100, shield: 70, maxShield: 70,
    fire: 0, fireRate: 0.16, damage: 1, shots: 1,
    bulletSpeed: 650, spread: 0.13, invuln: 0
  };

  const input = { x: W / 2, y: H - 100, active: false, startX: 0, startY: 0 };
  const bullets = [], enemies = [], particles = [], stars = [];
  for (let i = 0; i < 90; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + .5, v: 15 + Math.random() * 35 });

  const upgrades = [
    ['OVERDRIVE', 'Fire rate +18%', () => player.fireRate *= .82],
    ['PLASMA CORE', 'Damage +25%', () => player.damage *= 1.25],
    ['NANO ARMOR', 'Repair 30 HP', () => player.hp = Math.min(100, player.hp + 30)],
    ['VOID SHIELD', 'Shield +30', () => { player.maxShield += 30; player.shield = player.maxShield; }],
    ['MULTI SHOT', 'Add one projectile', () => player.shots = Math.min(3, player.shots + 1)],
    ['THRUSTERS', 'Movement speed +15%', () => player.speed *= 1.15]
  ];

  function beep(freq, duration = .06, type = 'sine', volume = .02) {
    if (!soundOn) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      const audio = beep.ctx || (beep.ctx = new Audio());
      if (audio.state === 'suspended') audio.resume();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type; osc.frequency.value = freq; gain.gain.value = volume;
      osc.connect(gain); gain.connect(audio.destination); osc.start();
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      osc.stop(audio.currentTime + duration + .02);
    } catch (_) {}
  }

  function reset() {
    score = 0; wave = 1; combo = 1; comboTimer = 0; waveKills = 0;
    nextWaveKills = 8; spawnTimer = .5; dashCooldown = 0; shake = 0; boss = null;
    bullets.length = 0; enemies.length = 0; particles.length = 0;
    const ship = ships[shipIndex];
    Object.assign(player, {
      x: W / 2, y: H - 100, hp: 100, shield: 70, maxShield: 70,
      fire: 0, fireRate: .16, damage: ship.damage, shots: 1,
      speed: 330 * ship.speed, invuln: 0
    });
    ui.boss.classList.add('hidden');
    updateHud();
  }

  function updateHud() {
    ui.wave.textContent = wave;
    ui.score.textContent = Math.floor(score);
    ui.best.textContent = Math.max(best, Math.floor(score));
    ui.combo.textContent = `x${combo}`;
    ui.hp.style.width = `${Math.max(0, player.hp)}%`;
    ui.shield.style.width = `${Math.max(0, player.shield / player.maxShield * 100)}%`;
    ui.dash.textContent = dashCooldown <= 0 ? 'DASH READY' : `DASH ${dashCooldown.toFixed(1)}s`;
    ui.ship.textContent = ships[shipIndex].name;
    ui.sound.textContent = soundOn ? 'ON' : 'OFF';
  }

  function toast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => ui.toast.classList.remove('show'), 1000);
  }

  function burst(x, y, amount = 8, color = '#7ef4d0', power = 140) {
    for (let i = 0; i < amount; i++) {
      const a = Math.random() * TAU, speed = Math.random() * power;
      particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .25 + Math.random() * .4, max: .65, r: 1 + Math.random() * 3, color });
    }
  }

  function spawn(type) {
    if (type === 'boss') {
      const hp = 260 + wave * 60;
      boss = { x: W / 2, y: 90, r: 48, hp, max: hp, t: 0 };
      ui.boss.classList.remove('hidden');
      toast('BOSS INBOUND');
      beep(110, .3, 'sawtooth', .05);
      return;
    }
    const types = ['drone', 'swarm', 'tank', 'shooter', 'chaser'];
    const maxTypes = Math.min(types.length, 2 + Math.floor(wave / 3));
    type = type || types[Math.floor(Math.random() * maxTypes)];
    const data = {
      drone: [14, 55, 1, 10], swarm: [9, 100, 1, 18], tank: [25, 35, 3, 35],
      shooter: [16, 42, 2, 25], chaser: [13, 70, 2, 30]
    }[type];
    enemies.push({ type, x: 30 + Math.random() * (W - 60), y: -30, r: data[0], speed: data[1] + wave * 2, hp: data[2] + Math.floor(wave / 5), value: data[3], shoot: 1 + Math.random() * 2 });
  }

  function shoot() {
    for (let i = 0; i < player.shots; i++) {
      const angle = (i - (player.shots - 1) / 2) * player.spread;
      bullets.push({ x: player.x, y: player.y - 22, vx: Math.sin(angle) * player.bulletSpeed, vy: -Math.cos(angle) * player.bulletSpeed, r: 4, damage: player.damage, enemy: false });
    }
    beep(720, .035, 'square', .012);
  }

  function hurt(amount) {
    if (player.invuln > 0) return;
    const shieldDamage = Math.min(player.shield, amount);
    player.shield -= shieldDamage;
    player.hp -= amount - shieldDamage;
    player.invuln = .55;
    shake = 7;
    burst(player.x, player.y, 14, '#ff5d87', 180);
    beep(100, .15, 'sawtooth', .04);
    if (player.hp <= 0) gameOver();
  }

  function killEnemy(index) {
    const enemy = enemies[index];
    score += enemy.value * combo;
    waveKills++;
    combo = Math.min(12, combo + 1);
    comboTimer = 2.5;
    burst(enemy.x, enemy.y, enemy.type === 'tank' ? 22 : 10, enemy.type === 'tank' ? '#ff5d87' : '#7ef4d0', 220);
    enemies.splice(index, 1);
    if (waveKills >= nextWaveKills && !boss) showUpgrade();
  }

  function update(dt) {
    for (const star of stars) { star.y += star.v * dt; if (star.y > H) star.y = 0; }
    if (comboTimer > 0 && (comboTimer -= dt) <= 0) combo = 1;
    dashCooldown = Math.max(0, dashCooldown - dt);
    player.invuln = Math.max(0, player.invuln - dt);

    if (input.active) {
      const dx = input.x - player.x, dy = input.y - player.y, distance = Math.hypot(dx, dy);
      if (distance > 4) { player.x += dx / distance * player.speed * dt; player.y += dy / distance * player.speed * dt; }
      player.fire -= dt;
      if (player.fire <= 0) { shoot(); player.fire = player.fireRate; }
    }
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(105, Math.min(H - player.r - 20, player.y));

    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawn(); spawnTimer = Math.max(.28, 1.05 - wave * .045) * (.75 + Math.random() * .45); }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < -40 || b.y > H + 40 || b.x < -40 || b.x > W + 40) bullets.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.type === 'chaser') {
        const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy) || 1;
        e.x += dx / d * e.speed * dt * .55; e.y += e.speed * dt * .45;
      } else e.y += e.speed * dt;

      if (e.type === 'shooter' && e.y > 80 && (e.shoot -= dt) <= 0) {
        e.shoot = 2;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        bullets.push({ enemy: true, x: e.x, y: e.y, vx: Math.cos(angle) * 190, vy: Math.sin(angle) * 190, r: 5, damage: 12 });
      }
      if (e.y > H + 35) { enemies.splice(i, 1); hurt(8); continue; }
      if (Math.hypot(e.x - player.x, e.y - player.y) < e.r + player.r) { enemies.splice(i, 1); hurt(e.type === 'tank' ? 28 : 18); continue; }

      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j]; if (b.enemy) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
          e.hp -= b.damage; bullets.splice(j, 1); burst(b.x, b.y, 3, '#ffffff', 70);
          if (e.hp <= 0) { killEnemy(i); break; }
        }
      }
    }

    if (boss) {
      boss.t += dt;
      boss.x = W / 2 + Math.sin(boss.t * .8) * 150;
      boss.y = 90 + Math.sin(boss.t * 1.7) * 22;
      if (Math.random() < dt * (boss.hp < boss.max * .5 ? 1.5 : .9)) {
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        bullets.push({ enemy: true, x: boss.x, y: boss.y, vx: Math.cos(angle) * 210, vy: Math.sin(angle) * 210, r: 6, damage: 15 });
      }
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (!b.enemy && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.r + b.r) { boss.hp -= b.damage; bullets.splice(j, 1); burst(b.x, b.y, 4, '#ff5d87', 90); }
      }
      if (Math.hypot(boss.x - player.x, boss.y - player.y) < boss.r + player.r) hurt(25);
      if (boss.hp <= 0) {
        score += 1500 + wave * 300; burst(boss.x, boss.y, 70, '#ff5d87', 360);
        toast('BOSS DESTROYED +BONUS'); boss = null; ui.boss.classList.add('hidden');
        waveKills = nextWaveKills; setTimeout(showUpgrade, 350);
      } else {
        ui.bossHp.style.width = `${boss.hp / boss.max * 100}%`;
        ui.bossText.textContent = `${Math.ceil(boss.hp / boss.max * 100)}%`;
        ui.bossName.textContent = `OVERLORD // WAVE ${wave}`;
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    shake *= .88;
    updateHud();
  }

  function render() {
    ctx.save();
    if (shake > .1) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    ctx.fillStyle = '#050a14'; ctx.fillRect(0, 0, W, H);
    for (const s of stars) { ctx.fillStyle = `rgba(126,244,208,${.18 + s.s / 5})`; ctx.fillRect(s.x, s.y, s.s, s.s); }
    ctx.strokeStyle = 'rgba(126,244,208,.035)';
    for (let y = 120; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    for (const b of bullets) {
      ctx.fillStyle = b.enemy ? '#ff5d87' : '#ffffff'; ctx.shadowBlur = 12; ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    }
    for (const e of enemies) {
      const glow = e.type === 'tank' ? '#ff5d87' : e.type === 'shooter' ? '#9b8cff' : '#7ef4d0';
      ctx.save(); ctx.translate(e.x, e.y); ctx.fillStyle = glow; ctx.shadowBlur = 16; ctx.shadowColor = glow;
      ctx.beginPath(); e.type === 'tank' ? ctx.rect(-e.r, -e.r, e.r * 2, e.r * 2) : ctx.arc(0, 0, e.r, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#06101b'; ctx.beginPath(); ctx.arc(0, 0, e.r * .35, 0, TAU); ctx.fill(); ctx.restore();
    }
    if (boss) {
      ctx.save(); ctx.translate(boss.x, boss.y); ctx.rotate(boss.t * .5); ctx.strokeStyle = '#ff5d87'; ctx.lineWidth = 6; ctx.shadowBlur = 25; ctx.shadowColor = '#ff5d87';
      ctx.beginPath(); ctx.arc(0, 0, boss.r, 0, TAU); ctx.stroke(); ctx.fillStyle = '#ff5d87'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.lineTo(Math.cos(a) * boss.r, Math.sin(a) * boss.r); } ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.translate(player.x, player.y); ctx.globalAlpha = player.invuln > 0 && Math.floor(player.invuln * 14) % 2 ? .35 : 1;
    ctx.fillStyle = '#7ef4d0'; ctx.shadowBlur = 22; ctx.shadowColor = '#7ef4d0'; ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(17, 19); ctx.lineTo(0, 13); ctx.lineTo(-17, 19); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#06131a'; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(0, 2, 6, 0, TAU); ctx.fill(); ctx.restore();
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.r, p.r); }
    ctx.globalAlpha = 1; ctx.restore();
  }

  function loop(time) {
    if (state !== 'playing') { render(); return; }
    const dt = Math.min(.033, Math.max(0, (time - last) / 1000));
    last = time; update(dt); render(); requestAnimationFrame(loop);
  }

  function start() {
    reset(); state = 'playing'; input.active = false;
    ui.overlay.classList.add('hidden'); ui.menu.classList.add('hidden'); ui.over.classList.add('hidden'); ui.upgrade.classList.add('hidden');
    last = performance.now(); requestAnimationFrame(loop); beep(440, .08);
  }

  function showUpgrade() {
    if (state !== 'playing') return;
    state = 'upgrade'; input.active = false;
    const pool = [...upgrades].sort(() => Math.random() - .5).slice(0, 3);
    ui.upgrades.innerHTML = '';
    pool.forEach(([name, description, apply]) => {
      const button = document.createElement('button'); button.className = 'upgrade-card';
      button.innerHTML = `<strong>${name}</strong><small>${description}</small>`;
      button.addEventListener('click', () => {
        apply(); wave++; waveKills = 0; nextWaveKills = 8 + wave * 2; state = 'playing';
        ui.upgrade.classList.add('hidden'); ui.overlay.classList.add('hidden'); toast('UPGRADE INSTALLED');
        if (wave % 5 === 0) setTimeout(() => { if (state === 'playing') spawn('boss'); }, 500);
        last = performance.now(); requestAnimationFrame(loop);
      });
      ui.upgrades.appendChild(button);
    });
    ui.overlay.classList.remove('hidden'); ui.menu.classList.add('hidden'); ui.over.classList.add('hidden'); ui.upgrade.classList.remove('hidden');
  }

  function gameOver() {
    state = 'over'; input.active = false; best = Math.max(best, Math.floor(score));
    localStorage.setItem('neon-strike-best', String(best));
    ui.finalScore.textContent = Math.floor(score); ui.finalWave.textContent = wave;
    ui.overlay.classList.remove('hidden'); ui.over.classList.remove('hidden'); ui.menu.classList.add('hidden'); ui.upgrade.classList.add('hidden');
    beep(65, .4, 'sawtooth', .05); render();
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (state !== 'playing') return;
    event.preventDefault(); canvas.setPointerCapture(event.pointerId);
    const p = pointFromEvent(event); Object.assign(input, { x: p.x, y: p.y, startX: p.x, startY: p.y, active: true });
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!input.active) return; event.preventDefault(); const p = pointFromEvent(event); input.x = p.x; input.y = p.y;
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!input.active) return;
    const p = pointFromEvent(event), distance = Math.hypot(p.x - input.startX, p.y - input.startY);
    if (distance > 100 && dashCooldown <= 0) {
      const angle = Math.atan2(p.y - input.startY, p.x - input.startX);
      player.x = Math.max(20, Math.min(W - 20, player.x + Math.cos(angle) * 110));
      player.y = Math.max(110, Math.min(H - 30, player.y + Math.sin(angle) * 110));
      dashCooldown = 4; burst(player.x, player.y, 18, '#9b8cff', 240); beep(220, .08, 'triangle', .035);
    }
    input.active = false;
  });
  canvas.addEventListener('pointercancel', () => input.active = false);

  $('start-btn').addEventListener('click', start);
  $('retry-btn').addEventListener('click', start);
  $('menu-btn').addEventListener('click', () => {
    state = 'menu'; input.active = false; ui.overlay.classList.remove('hidden'); ui.over.classList.add('hidden'); ui.menu.classList.remove('hidden'); ui.upgrade.classList.add('hidden'); render();
  });
  $('loadout-btn').addEventListener('click', () => {
    shipIndex = (shipIndex + 1) % ships.length;
    localStorage.setItem('neon-strike-ship', String(shipIndex)); updateHud(); toast(`${ships[shipIndex].name} SELECTED`);
  });
  $('sound-btn').addEventListener('click', () => {
    soundOn = !soundOn; localStorage.setItem('neon-strike-sound', soundOn ? 'on' : 'off'); updateHud();
    if (soundOn) beep(600, .08);
  });

  updateHud();
  render();
})();
