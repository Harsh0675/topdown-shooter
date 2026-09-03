// Top Down Shooter - Touch Only version
(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('start-btn');
  const overlayMenu = document.getElementById('menu');

  // Logical size
  const W = 240;
  const H = 360;
  canvas.width = W;
  canvas.height = H;

  let running = false;
  let last = 0;
  let score = 0;
  let lives = 3;
  let highScore = Number(localStorage.getItem('topdown-shooter-high-score') || 0);

  const input = {
    x:0, y:0, firing:false, targetX:null, targetY:null
  };

  // Player
  const player = {
    x: W/2, y: H - 40, r:8, speed:140, cooldown:0
  };

  const bullets = [];
  const enemies = [];
  const sounds = createSoundBank();

  function reset(){
    score = 0;
    lives = 3;
    player.x = W/2;
    player.y = H - 40;
    bullets.length = 0;
    enemies.length = 0;
    player.cooldown = 0;
    input.targetX = null;
    input.targetY = null;
    input.firing = false;
    updateHud();
  }

  function updateHud(){
    scoreEl.textContent = `Score: ${score} · Best: ${highScore}`;
    livesEl.textContent = 'Lives: ' + lives;
  }

  function saveHighScore(){
    if(score > highScore){
      highScore = score;
      localStorage.setItem('topdown-shooter-high-score', String(highScore));
    }
  }

  function spawnEnemy(){
    const ex = Math.random()*(W-20)+10;
    const difficulty = Math.min(2, score / 500);
    enemies.push({
      x: ex,
      y: -10,
      r:10,
      speed: 30 + Math.random()*40 + difficulty * 25,
      hp: 1
    });
  }

  // Game loop
  function loop(ts){
    if(!running) return;
    const dt = Math.min(0.05, (ts - last)/1000);
    last = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt){
    // Movement toward touch target if present
    if(input.targetX !== null && input.targetY !== null){
      const dx = input.targetX - player.x;
      const dy = input.targetY - player.y;
      const dist = Math.hypot(dx, dy);
      if(dist > 2){
        const nx = dx / dist;
        const ny = dy / dist;
        player.x += nx * player.speed * dt;
        player.y += ny * player.speed * dt;
      }
      input.firing = true; // auto-fire while touching
    } else {
      input.firing = false;
    }

    // clamp
    player.x = Math.max(player.r, Math.min(W-player.r, player.x));
    player.y = Math.max(player.r, Math.min(H-player.r, player.y));

    // Shooting
    player.cooldown -= dt;
    if(input.firing && player.cooldown <= 0){
      shoot();
      player.cooldown = 0.18;
    }

    // Update bullets
    for(let i=bullets.length-1;i>=0;i--){
      const b = bullets[i];
      b.y -= b.speed*dt;
      if(b.y < -10) bullets.splice(i,1);
    }

    // Update enemies. Spawn rate and speed increase as the score grows.
    const difficulty = Math.min(1.8, score / 400);
    if(Math.random() < dt*(0.9 + difficulty * 0.35)) spawnEnemy();
    for(let i=enemies.length-1;i>=0;i--){
      const e = enemies[i];
      e.y += e.speed*dt;
      if(e.y > H+20){
        enemies.splice(i,1);
        lives--;
        sounds.hurt();
        updateHud();
        if(lives <= 0) lose();
      }
    }

    // Collisions bullets vs enemies
    for(let i=enemies.length-1;i>=0;i--){
      const e = enemies[i];
      for(let j=bullets.length-1;j>=0;j--){
        const b = bullets[j];
        const dx = e.x - b.x;
        const dy = e.y - b.y;
        if(dx*dx + dy*dy < (e.r + b.r)*(e.r + b.r)){
          enemies.splice(i,1);
          bullets.splice(j,1);
          score += 10;
          saveHighScore();
          sounds.hit();
          updateHud();
          break;
        }
      }
    }

    // Enemy vs player
    for(let i=enemies.length-1;i>=0;i--){
      const e = enemies[i];
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if(dx*dx + dy*dy < (e.r + player.r)*(e.r + player.r)){
        enemies.splice(i,1);
        lives--;
        sounds.hurt();
        updateHud();
        if(lives <= 0) lose();
      }
    }
  }

  function render(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#071620';
    ctx.fillRect(0,0,W,H);

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = '#7ef4d0';
    roundTri(ctx, 0, -10, 10, 18);
    ctx.restore();

    for(const b of bullets){
      ctx.fillStyle = '#fff';
      circle(ctx, b.x, b.y, b.r);
    }

    for(const e of enemies){
      ctx.fillStyle = '#fb7185';
      circle(ctx, e.x, e.y, e.r);
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(e.x-6, e.y-2, 12,3);
    }
  }

  function shoot(){
    bullets.push({x:player.x, y:player.y-14, r:2.5, speed:260});
    sounds.shoot();
  }

  function lose(){
    running = false;
    saveHighScore();
    overlay.classList.remove('hidden');
    overlayMenu.innerHTML = `<h1>Game Over</h1><p>Score: ${score}</p><p>Best: ${highScore}</p><button id="start-btn">Retry</button>`;
    document.getElementById('start-btn').addEventListener('click', start);
  }

  function circle(ctx,x,y,r){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); }
  function roundTri(ctx, x, y, r, h){
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - r, y + h/2, x, y + h);
    ctx.quadraticCurveTo(x + r, y + h/2, x, y);
    ctx.fill();
  }

  // Touch controls on canvas: pointerdown sets target; pointermove updates; pointerup clears target.
  function clientToCanvas(evt){
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const p = clientToCanvas(e);
    input.targetX = p.x;
    input.targetY = p.y;
  });

  canvas.addEventListener('pointermove', (e) => {
    if(input.targetX === null) return;
    const p = clientToCanvas(e);
    input.targetX = p.x;
    input.targetY = p.y;
  });

  canvas.addEventListener('pointerup', (e) => {
    try { canvas.releasePointerCapture(e.pointerId); } catch(err){}
    input.targetX = null;
    input.targetY = null;
    input.firing = false;
  });

  startBtn.addEventListener('click', start);

  function start(){
    reset();
    overlay.classList.add('hidden');
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function createSoundBank(){
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    function osc(type, freq, dur, vol=0.08, when=0){
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + when);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
      o.stop(ctx.currentTime + when + dur + 0.02);
    }
    return {
      shoot(){ osc('sine', 900, 0.08, 0.03); },
      hit(){ osc('triangle', 420, 0.12, 0.04); },
      hurt(){ osc('sawtooth', 160, 0.28, 0.05); }
    };
  }

  // expose for debugging
  window.__game = { start, reset };
  updateHud();
})();
