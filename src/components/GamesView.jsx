import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

const DachshundHouse3D = lazy(() => import('./DachshundHouse3D'));

const GAME_CARDS = [
  {
    id: 'tetris',
    eyebrow: 'Rompecabezas',
    title: 'Torres Salchicha',
    description: 'Perros largos, huecos pequeños y mucha maña.',
    accent: '#ffb15c',
    icon: '🐕'
  },
  {
    id: 'memory',
    eyebrow: 'Memoria',
    title: 'Encuentra la Manada',
    description: 'Voltea las cartas y reúne seis parejas perrunas.',
    accent: '#ff758f',
    icon: '🃏'
  },
  {
    id: 'breakout',
    eyebrow: 'Acción',
    title: 'Rebote Salchicha',
    description: 'Un perro salchicha, una pelota y muchísimos huesos.',
    accent: '#7ce8d5',
    icon: '🎾'
  },
  {
    id: 'vida',
    eyebrow: 'Simulación',
    title: 'Mi Vida Salchicha',
    description: 'Cuida, viste y decora el hogar de tu perro salchicha.',
    accent: '#c7a7ff',
    icon: '🏡'
  }
];

const MiniDoxie = ({ color = '#c98248' }) => (
  <span className="mini-doxie" aria-hidden="true" style={{ '--doxie-color': color }}>
    <i className="mini-doxie-tail" />
    <i className="mini-doxie-body" />
    <i className="mini-doxie-head" />
    <i className="mini-doxie-ear" />
    <i className="mini-doxie-leg leg-one" />
    <i className="mini-doxie-leg leg-two" />
  </span>
);

const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]]
];
const DOXIE_COLORS = ['#d68b52', '#f3b562', '#9c5f3c', '#e7a06c', '#bd7444'];
const ROWS = 16;
const COLS = 10;
const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const randomPiece = () => {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return {
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: -1,
    color: DOXIE_COLORS[Math.floor(Math.random() * DOXIE_COLORS.length)]
  };
};

function DoxieTetris({ onBack }) {
  const [board, setBoard] = useState(emptyBoard);
  const [piece, setPiece] = useState(randomPiece);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [status, setStatus] = useState('ready');

  const collides = useCallback((candidate, targetBoard = board) => {
    return candidate.shape.some((row, py) => row.some((filled, px) => {
      if (!filled) return false;
      const x = candidate.x + px;
      const y = candidate.y + py;
      return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && targetBoard[y][x]);
    }));
  }, [board]);

  const reset = () => {
    setBoard(emptyBoard());
    setPiece(randomPiece());
    setScore(0);
    setLines(0);
    setStatus('playing');
  };

  const lockPiece = useCallback(() => {
    const nextBoard = board.map((row) => [...row]);
    let toppedOut = false;
    piece.shape.forEach((row, py) => row.forEach((filled, px) => {
      if (!filled) return;
      const y = piece.y + py;
      if (y < 0) toppedOut = true;
      else nextBoard[y][piece.x + px] = piece.color;
    }));
    if (toppedOut) {
      setStatus('over');
      return;
    }
    const kept = nextBoard.filter((row) => row.some((cell) => !cell));
    const cleared = ROWS - kept.length;
    while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
    setBoard(kept);
    if (cleared) {
      setLines((value) => value + cleared);
      setScore((value) => value + [0, 100, 300, 500, 800][cleared]);
    } else {
      setScore((value) => value + 5);
    }
    const next = randomPiece();
    if (collides(next, kept)) setStatus('over');
    setPiece(next);
  }, [board, collides, piece]);

  const move = useCallback((dx, dy) => {
    if (status !== 'playing') return;
    const candidate = { ...piece, x: piece.x + dx, y: piece.y + dy };
    if (!collides(candidate)) {
      setPiece(candidate);
      return;
    }
    if (dy > 0) lockPiece();
  }, [collides, lockPiece, piece, status]);

  const rotate = useCallback(() => {
    if (status !== 'playing') return;
    const shape = piece.shape[0].map((_, index) => piece.shape.map((row) => row[index]).reverse());
    const candidate = { ...piece, shape };
    if (!collides(candidate)) setPiece(candidate);
    else if (!collides({ ...candidate, x: candidate.x - 1 })) setPiece({ ...candidate, x: candidate.x - 1 });
    else if (!collides({ ...candidate, x: candidate.x + 1 })) setPiece({ ...candidate, x: candidate.x + 1 });
  }, [collides, piece, status]);

  const drop = useCallback(() => {
    if (status !== 'playing') return;
    let candidate = { ...piece };
    while (!collides({ ...candidate, y: candidate.y + 1 })) candidate.y += 1;
    setPiece(candidate);
    setTimeout(() => {
      setPiece((current) => current);
    }, 0);
  }, [collides, piece, status]);

  useEffect(() => {
    if (status !== 'playing') return undefined;
    const timer = window.setInterval(() => move(0, 1), Math.max(260, 650 - lines * 12));
    return () => window.clearInterval(timer);
  }, [lines, move, status]);

  useEffect(() => {
    const handleKey = (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) event.preventDefault();
      if (event.key === 'ArrowLeft') move(-1, 0);
      if (event.key === 'ArrowRight') move(1, 0);
      if (event.key === 'ArrowDown') move(0, 1);
      if (event.key === 'ArrowUp') rotate();
      if (event.key === ' ') drop();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drop, move, rotate]);

  const visible = board.map((row) => [...row]);
  if (status === 'playing') {
    piece.shape.forEach((row, py) => row.forEach((filled, px) => {
      const y = piece.y + py;
      const x = piece.x + px;
      if (filled && y >= 0 && y < ROWS && x >= 0 && x < COLS) visible[y][x] = piece.color;
    }));
  }

  return (
    <GameShell title="Torres Salchicha" kicker="Tetris perruno" onBack={onBack} score={`${score} puntos`}>
      <div className="tetris-wrap">
        <div className="tetris-board" aria-label="Tablero de Torres Salchicha">
          {visible.flatMap((row, y) => row.map((color, x) => (
            <div className={`tetris-cell ${color ? 'filled' : ''}`} key={`${y}-${x}`}>
              {color && <MiniDoxie color={color} />}
            </div>
          )))}
          {status !== 'playing' && (
            <div className="game-overlay">
              <span className="overlay-dog">🐕</span>
              <strong>{status === 'over' ? '¡La perrera está llena!' : 'Apila la manada'}</strong>
              <small>{status === 'over' ? `${lines} líneas completadas` : 'Usa las flechas o los botones'}</small>
              <button onClick={reset}>{status === 'over' ? 'Jugar de nuevo' : 'Empezar juego'}</button>
            </div>
          )}
        </div>
        <div className="game-stat-strip">
          <span><small>Puntos</small><strong>{score}</strong></span>
          <span><small>Líneas</small><strong>{lines}</strong></span>
        </div>
        <div className="arcade-controls tetris-controls">
          <button onClick={() => move(-1, 0)} aria-label="Mover a la izquierda">←</button>
          <button onClick={rotate} aria-label="Girar">↻</button>
          <button onClick={() => move(1, 0)} aria-label="Mover a la derecha">→</button>
          <button onClick={() => move(0, 1)} aria-label="Mover hacia abajo">↓</button>
        </div>
      </div>
    </GameShell>
  );
}

const DOG_PAIRS = [
  { id: 'red', name: 'Frijol', emoji: '🐶', color: '#ff758f' },
  { id: 'blue', name: 'Milo', emoji: '🐕', color: '#65c7f7' },
  { id: 'cream', name: 'Churro', emoji: '🌭', color: '#f3b562' },
  { id: 'green', name: 'Pepinillo', emoji: '🦴', color: '#65d6a6' },
  { id: 'purple', name: 'Pimienta', emoji: '🐾', color: '#aa8cf2' },
  { id: 'yellow', name: 'Fideo', emoji: '🎾', color: '#f7d154' }
];
const shuffledDeck = () => [...DOG_PAIRS, ...DOG_PAIRS]
  .map((card, index) => ({ ...card, uid: `${card.id}-${index}`, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort);

function MemoryGame({ onBack }) {
  const [cards, setCards] = useState(shuffledDeck);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCards(shuffledDeck());
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setBusy(false);
  };

  const flip = (card) => {
    if (busy || open.includes(card.uid) || matched.includes(card.id)) return;
    const nextOpen = [...open, card.uid];
    setOpen(nextOpen);
    if (nextOpen.length !== 2) return;
    setMoves((value) => value + 1);
    const pair = nextOpen.map((uid) => cards.find((item) => item.uid === uid));
    if (pair[0].id === pair[1].id) {
      setMatched((value) => [...value, pair[0].id]);
      window.setTimeout(() => setOpen([]), 450);
    } else {
      setBusy(true);
      window.setTimeout(() => {
        setOpen([]);
        setBusy(false);
      }, 850);
    }
  };

  const won = matched.length === DOG_PAIRS.length;

  return (
    <GameShell title="Encuentra la Manada" kicker="Memoria perruna" onBack={onBack} score={`${moves} movimientos`}>
      <div className="memory-area">
        <div className="memory-grid">
          {cards.map((card) => {
            const showing = open.includes(card.uid) || matched.includes(card.id);
            return (
              <button
                className={`memory-card ${showing ? 'is-flipped' : ''} ${matched.includes(card.id) ? 'is-matched' : ''}`}
                key={card.uid}
                onClick={() => flip(card)}
                aria-label={showing ? card.name : 'Carta boca abajo'}
              >
                <span className="memory-card-inner">
                  <span className="memory-card-back"><MiniDoxie color="#e5a36a" /><i>?</i></span>
                  <span className="memory-card-front" style={{ '--card-accent': card.color }}>
                    <b>{card.emoji}</b>
                    <small>{card.name}</small>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {won && (
          <div className="memory-win">
            <span>🐾</span>
            <div><strong>¡Manada reunida!</strong><small>Encontraste a todos en {moves} movimientos.</small></div>
            <button onClick={reset}>Otra vez</button>
          </div>
        )}
        <button className="game-text-button" onClick={reset}>Mezclar cartas</button>
      </div>
    </GameShell>
  );
}

function drawDoxiePaddle(ctx, x, y, width) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#c98248';
  ctx.beginPath();
  ctx.roundRect(8, 3, width - 25, 15, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width - 12, 8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a462b';
  ctx.beginPath();
  ctx.ellipse(width - 16, 6, 5, 8, -.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(width - 9, 6, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c98248';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(9, 7);
  ctx.lineTo(0, 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(18, 15);
  ctx.lineTo(16, 21);
  ctx.moveTo(width - 28, 15);
  ctx.lineTo(width - 26, 21);
  ctx.stroke();
  ctx.restore();
}

function BreakoutGame({ onBack }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const gameRef = useRef(null);
  const [status, setStatus] = useState('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const createGame = () => ({
    ball: { x: 180, y: 320, dx: 3, dy: -3, r: 7 },
    paddle: { x: 142, y: 382, width: 76 },
    bricks: Array.from({ length: 24 }, (_, index) => ({
      x: 16 + (index % 6) * 56,
      y: 50 + Math.floor(index / 6) * 33,
      width: 46,
      height: 17,
      alive: true,
      color: ['#ff758f', '#f3b562', '#65d6a6', '#65c7f7'][Math.floor(index / 6)]
    })),
    keys: { left: false, right: false },
    score: 0,
    lives: 3
  });

  const start = () => {
    gameRef.current = createGame();
    setScore(0);
    setLives(3);
    setStatus('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#182139');
      gradient.addColorStop(1, '#090d16');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      for (let i = 0; i < 24; i += 1) ctx.fillRect((i * 67) % 360, (i * 41) % 330, 1.5, 1.5);

      const game = gameRef.current;
      if (!game) return;
      game.bricks.forEach((brick) => {
        if (!brick.alive) return;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🦴', brick.x + brick.width / 2, brick.y + 14);
      });
      drawDoxiePaddle(ctx, game.paddle.x, game.paddle.y, game.paddle.width);
      ctx.fillStyle = '#d9f16f';
      ctx.beginPath();
      ctx.arc(game.ball.x, game.ball.y, game.ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,100,20,.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(game.ball.x, game.ball.y, 4, -1.2, 1.2);
      ctx.stroke();
    };

    const tick = () => {
      const game = gameRef.current;
      if (!game || status !== 'playing') {
        draw();
        return;
      }
      const { ball, paddle } = game;
      if (game.keys.left) paddle.x -= 5;
      if (game.keys.right) paddle.x += 5;
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
      ball.x += ball.dx;
      ball.y += ball.dy;
      if (ball.x < ball.r || ball.x > canvas.width - ball.r) ball.dx *= -1;
      if (ball.y < ball.r) ball.dy *= -1;
      if (
        ball.dy > 0 &&
        ball.y + ball.r >= paddle.y &&
        ball.y < paddle.y + 22 &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
      ) {
        ball.dy = -Math.abs(ball.dy) - 0.08;
        ball.dx += ((ball.x - paddle.x) / paddle.width - 0.5) * 1.6;
      }
      game.bricks.forEach((brick) => {
        if (
          brick.alive &&
          ball.x + ball.r > brick.x &&
          ball.x - ball.r < brick.x + brick.width &&
          ball.y + ball.r > brick.y &&
          ball.y - ball.r < brick.y + brick.height
        ) {
          brick.alive = false;
          ball.dy *= -1;
          game.score += 10;
          setScore(game.score);
        }
      });
      if (game.bricks.every((brick) => !brick.alive)) setStatus('won');
      if (ball.y > canvas.height + ball.r) {
        game.lives -= 1;
        setLives(game.lives);
        if (game.lives <= 0) setStatus('over');
        else Object.assign(ball, { x: 180, y: 320, dx: Math.random() > .5 ? 3 : -3, dy: -3 });
      }
      draw();
      animationRef.current = requestAnimationFrame(tick);
    };

    draw();
    if (status === 'playing') animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, [status]);

  useEffect(() => {
    const key = (down) => (event) => {
      if (!gameRef.current) return;
      if (event.key === 'ArrowLeft') gameRef.current.keys.left = down;
      if (event.key === 'ArrowRight') gameRef.current.keys.right = down;
      if (event.key.startsWith('Arrow')) event.preventDefault();
    };
    const down = key(true);
    const up = key(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const steer = (event) => {
    if (!gameRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvasRef.current.width / rect.width);
    gameRef.current.paddle.x = x - gameRef.current.paddle.width / 2;
  };

  const setDirection = (direction, value) => {
    if (gameRef.current) gameRef.current.keys[direction] = value;
  };

  return (
    <GameShell title="Rebote Salchicha" kicker="Rompehuesos perruno" onBack={onBack} score={`${score} puntos`}>
      <div className="breakout-wrap">
        <div className="breakout-canvas-wrap">
          <canvas ref={canvasRef} width="360" height="420" onPointerMove={steer} />
          {status !== 'playing' && (
            <div className="game-overlay breakout-overlay">
              <span className="overlay-dog">{status === 'won' ? '🏆' : '🎾'}</span>
              <strong>{status === 'won' ? '¡Atrapaste todos los huesos!' : status === 'over' ? '¡Se escapó la pelota!' : '¿Listo, perro largo?'}</strong>
              <small>{status === 'ready' ? 'Muévete con el dedo o las flechas' : `${score} puntos`}</small>
              <button onClick={start}>{status === 'ready' ? 'Lanzar pelota' : 'Jugar de nuevo'}</button>
            </div>
          )}
        </div>
        <div className="game-stat-strip">
          <span><small>Puntos</small><strong>{score}</strong></span>
          <span><small>Vidas</small><strong>{'♥'.repeat(lives) || '—'}</strong></span>
        </div>
        <div className="arcade-controls">
          <button
            onPointerDown={() => setDirection('left', true)}
            onPointerUp={() => setDirection('left', false)}
            onPointerLeave={() => setDirection('left', false)}
          >←</button>
          <span>mueve al salchicha</span>
          <button
            onPointerDown={() => setDirection('right', true)}
            onPointerUp={() => setDirection('right', false)}
            onPointerLeave={() => setDirection('right', false)}
          >→</button>
        </div>
      </div>
    </GameShell>
  );
}

const SIM_STORAGE_KEY = 'vida_salchicha_state_v1';
const LEGACY_SIM_STORAGE_KEY = 'chuchi_sim_state_v1';
const SIM_SLOTS_STORAGE_KEY = 'vida_salchicha_partidas_v1';
const SIM_ACTIVE_SLOT_KEY = 'vida_salchicha_partida_activa_v1';
const SIM_SCREEN_MODE_KEY = 'vida_salchicha_screen_mode_v1';
const SIM_ONBOARDING_KEY = 'vida_salchicha_onboarding_done_v1';
const SIM_DEFAULTS = {
  name: 'Salchi',
  hunger: 78,
  energy: 82,
  hygiene: 70,
  happiness: 86,
  cookies: 30,
  owned: ['room-sunny', 'outfit-none', 'tool-wall', 'tool-bed', 'tool-rug', 'tool-plant'],
  room: 'room-sunny',
  outfit: 'outfit-none',
  skills: { inteligencia: 0, social: 0, cocina: 0 },
  progress: {
    careerLevel: 1,
    schoolLevel: 1,
    careerXP: 0,
    schoolXP: 0,
    careerTrack: 'design',
    careerPerformance: 50,
    schoolPerformance: 50,
    homework: 0,
    workDays: 0,
    schoolDays: 0
  },
  appearance: { size: 1, pattern: 'solid', ears: 'classic', personality: 'juguetón' },
  world: { time: 'auto', weather: 'sunny' },
  clock: { day: 1, minute: 480, speed: 1, paused: false },
  autonomy: { enabled: true, actions: 0, lastAction: 'Explorando su nuevo hogar.' },
  roomNames: { main: 'Sala', garage: 'Garaje', garden: 'Jardín' },
  vehicle: 'car',
  relationships: { Luna: 0, Bruno: 0, Coco: 0 },
  garden: { plantedAt: null, watered: false, harvests: 0 },
  quests: { care: 0, build: 0, social: 0, claimed: [] },
  aspiration: { id: 'designer', claimed: [] },
  dailyWants: { date: '', claimed: [] },
  traits: ['juguetón'],
  preferences: { favoriteActivity: 'park', favoriteColor: '#c7a7ff' },
  collections: ['Foto de la primera casa'],
  story: { chapter: 0, choices: [], log: ['Salchi llegó al vecindario.'] },
  memories: [],
  customGoals: [],
  savedLayouts: [],
  visits: { work: 0, school: 0, park: 0, beach: 0, vet: 0, downtown: 0 },
  stats: { wantsCompleted: 0, aspirationMilestones: 0, calendarEvents: 0, furnitureUses: {} },
  legacy: { generation: 1, familyName: 'Salchicha', milestones: [] },
  activity: null,
  colors: {
    dog: '#a96338',
    walls: '#ffe7bd',
    floor: '#ba8059',
    car: '#ef5350'
  },
  layout: [
    { id: 'starter-bed', type: 'bed', x: -2, z: 2, rotation: 0 },
    { id: 'starter-rug', type: 'rug', x: 0, z: 0, rotation: 0 },
    { id: 'starter-plant', type: 'plant', x: 2, z: -2, rotation: 0 }
  ],
  updatedAt: Date.now()
};

const SIM_SHOP = [
  { id: 'room-night', type: 'room', name: 'Noche estrellada', icon: '🌙', price: 40 },
  { id: 'room-rose', type: 'room', name: 'Atardecer rosa', icon: '🌸', price: 35 },
  { id: 'tool-sofa', type: 'furniture', name: 'Sofá de diseño', icon: '🛋️', price: 24 },
  { id: 'tool-table', type: 'furniture', name: 'Mesa de madera', icon: '🪵', price: 18 },
  { id: 'tool-lamp', type: 'furniture', name: 'Lámpara cálida', icon: '💡', price: 16 },
  { id: 'tool-fridge', type: 'furniture', name: 'Nevera retro', icon: '🧊', price: 30 },
  { id: 'tool-stove', type: 'furniture', name: 'Cocina completa', icon: '🍳', price: 32 },
  { id: 'tool-sink', type: 'furniture', name: 'Lavaplatos', icon: '🚰', price: 22 },
  { id: 'tool-desk', type: 'furniture', name: 'Escritorio de estudio', icon: '📝', price: 26 },
  { id: 'tool-bookshelf', type: 'furniture', name: 'Biblioteca perruna', icon: '📚', price: 28 },
  { id: 'tool-shower', type: 'furniture', name: 'Ducha moderna', icon: '🚿', price: 34 },
  { id: 'tool-tree', type: 'furniture', name: 'Árbol de jardín', icon: '🌳', price: 20 },
  { id: 'tool-flowers', type: 'furniture', name: 'Jardín de flores', icon: '🌷', price: 18 },
  { id: 'tool-fence', type: 'furniture', name: 'Cerca blanca', icon: '🏡', price: 16 },
  { id: 'tool-bench', type: 'furniture', name: 'Banco exterior', icon: '🪑', price: 22 },
  { id: 'tool-door', type: 'furniture', name: 'Puerta de madera', icon: '🚪', price: 18 },
  { id: 'tool-window', type: 'furniture', name: 'Ventana panorámica', icon: '🪟', price: 20 },
  { id: 'tool-roof', type: 'furniture', name: 'Sección de techo', icon: '🏠', price: 24 },
  { id: 'tool-garden', type: 'furniture', name: 'Huerto casero', icon: '🥕', price: 16 },
  { id: 'outfit-bandana', type: 'outfit', name: 'Pañuelo rojo', icon: '🧣', price: 20 },
  { id: 'outfit-crown', type: 'outfit', name: 'Corona real', icon: '👑', price: 32 },
  { id: 'outfit-sweater', type: 'outfit', name: 'Suéter violeta', icon: '🧶', price: 26 },
  { id: 'outfit-glasses', type: 'outfit', name: 'Gafas redondas', icon: '👓', price: 18 },
  { id: 'outfit-hat', type: 'outfit', name: 'Sombrero elegante', icon: '🎩', price: 24 },
  { id: 'outfit-cape', type: 'outfit', name: 'Capa de héroe', icon: '🦸', price: 30 },
  { id: 'vehicle-car', type: 'vehicle', vehicle: 'car', name: 'Auto clásico', icon: '🚗', price: 0 },
  { id: 'vehicle-scooter', type: 'vehicle', vehicle: 'scooter', name: 'Motoneta urbana', icon: '🛵', price: 0 },
  { id: 'vehicle-van', type: 'vehicle', vehicle: 'van', name: 'Camioneta familiar', icon: '🚐', price: 0 }
];

const clampNeed = (value) => Math.max(0, Math.min(100, value));

const WEEK_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const CAREER_TRACKS = [
  { id: 'design', icon: '🏡', title: 'Diseño de interiores', skill: 'inteligencia', levels: ['Ayudante de obra', 'Decorador junior', 'Diseñador del barrio', 'Arquitecto canino', 'Leyenda del diseño'] },
  { id: 'chef', icon: '🍳', title: 'Cocina perruna', skill: 'cocina', levels: ['Lavaplatos', 'Ayudante de cocina', 'Chef de croquetas', 'Chef ejecutivo', 'Estrella gastronómica'] },
  { id: 'social', icon: '🎤', title: 'Entretenimiento', skill: 'social', levels: ['Animador de parque', 'Presentador local', 'Estrella vecinal', 'Ídolo salchicha', 'Leyenda del escenario'] }
];

const SCHOOL_GRADES = ['Cachorro nuevo', 'Alumno curioso', 'Buen estudiante', 'Alumno brillante', 'Graduado con honores'];

const formatSimTime = (minute) => {
  const normalized = ((minute % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getSimDayIndex = (clock) => ((clock.day - 1) % 7 + 7) % 7;

const BUILD_TOOLS = [
  { id: 'floorTile', icon: '▦', label: 'Baldosa' },
  { id: 'stairs', icon: '🪜', label: 'Escalera' },
  { id: 'wall', unlock: 'tool-wall', icon: '🧱', label: 'Pared' },
  { id: 'bed', unlock: 'tool-bed', icon: '🛏️', label: 'Cama' },
  { id: 'rug', unlock: 'tool-rug', icon: '🟣', label: 'Alfombra' },
  { id: 'plant', unlock: 'tool-plant', icon: '🪴', label: 'Planta' },
  { id: 'sofa', unlock: 'tool-sofa', icon: '🛋️', label: 'Sofá' },
  { id: 'table', unlock: 'tool-table', icon: '🪵', label: 'Mesa' },
  { id: 'lamp', unlock: 'tool-lamp', icon: '💡', label: 'Lámpara' },
  { id: 'fridge', unlock: 'tool-fridge', icon: '🧊', label: 'Nevera' },
  { id: 'stove', unlock: 'tool-stove', icon: '🍳', label: 'Cocina' },
  { id: 'sink', unlock: 'tool-sink', icon: '🚰', label: 'Lavaplatos' },
  { id: 'desk', unlock: 'tool-desk', icon: '📝', label: 'Escritorio' },
  { id: 'bookshelf', unlock: 'tool-bookshelf', icon: '📚', label: 'Biblioteca' },
  { id: 'shower', unlock: 'tool-shower', icon: '🚿', label: 'Ducha' },
  { id: 'tree', unlock: 'tool-tree', icon: '🌳', label: 'Árbol' },
  { id: 'flowers', unlock: 'tool-flowers', icon: '🌷', label: 'Flores' },
  { id: 'fence', unlock: 'tool-fence', icon: '🏡', label: 'Cerca' },
  { id: 'bench', unlock: 'tool-bench', icon: '🪑', label: 'Banco' },
  { id: 'door', unlock: 'tool-door', icon: '🚪', label: 'Puerta' },
  { id: 'window', unlock: 'tool-window', icon: '🪟', label: 'Ventana' },
  { id: 'roof', unlock: 'tool-roof', icon: '🏠', label: 'Techo' },
  { id: 'garden', unlock: 'tool-garden', icon: '🥕', label: 'Huerto' },
  { id: 'move', icon: '✋', label: 'Mover' },
  { id: 'rotate', icon: '↻', label: 'Girar' },
  { id: 'resize', icon: '↔️', label: 'Tamaño' },
  { id: 'duplicate', icon: '⧉', label: 'Duplicar' },
  { id: 'paint', icon: '🎨', label: 'Pintar' },
  { id: 'delete', icon: '🗑️', label: 'Borrar' }
];

const PERSONALITY_TRAITS = [
  { id: 'juguetón', icon: '🎾', label: 'Juguetón', bonus: 'Disfruta más los juegos y el parque.' },
  { id: 'curioso', icon: '🔎', label: 'Curioso', bonus: 'Encuentra coleccionables con mayor facilidad.' },
  { id: 'sociable', icon: '💬', label: 'Sociable', bonus: 'Hace amistades más rápido.' },
  { id: 'casero', icon: '🛋️', label: 'Casero', bonus: 'Recupera más energía en casa.' },
  { id: 'aventurero', icon: '🧭', label: 'Aventurero', bonus: 'Obtiene mejores recuerdos al viajar.' },
  { id: 'travieso', icon: '😈', label: 'Travieso', bonus: 'Provoca historias inesperadas.' }
];

const ASPIRATIONS = [
  {
    id: 'designer',
    icon: '🏡',
    title: 'Diseñador del barrio',
    description: 'Convierte el terreno en una casa con estilo y valor propio.',
    milestones: [
      { id: 'objects8', label: 'Colocar 8 objetos', reward: 'Desbloquea una placa de diseño', check: (pet) => (pet.layout || []).length >= 8 },
      { id: 'score120', label: 'Llegar a 120 de valor de casa', reward: '+felicidad y memoria', check: (pet, houseScore) => houseScore.total >= 120 },
      { id: 'saveLayout', label: 'Guardar un diseño', reward: 'Título de decorador', check: (pet) => pet.savedLayouts.length > 0 }
    ]
  },
  {
    id: 'social',
    icon: '🌟',
    title: 'Estrella del vecindario',
    description: 'Haz amigos, arma historias y vuelve al barrio más vivo.',
    milestones: [
      { id: 'friend45', label: 'Tener una amistad de 45+', reward: '+social', check: (pet) => Object.values(pet.relationships).some((value) => value >= 45) },
      { id: 'social6', label: 'Subir social a nivel 6', reward: 'Interacciones mejores', check: (pet) => pet.skills.social >= 6 },
      { id: 'friend80', label: 'Tener un mejor amigo 80+', reward: 'Recuerdo especial', check: (pet) => Object.values(pet.relationships).some((value) => value >= 80) }
    ]
  },
  {
    id: 'explorer',
    icon: '🧭',
    title: 'Explorador salchicha',
    description: 'Visita lugares, junta tesoros y llena el álbum.',
    milestones: [
      { id: 'visits3', label: 'Hacer 3 salidas', reward: '+energía', check: (pet) => Object.values(pet.visits).reduce((sum, value) => sum + value, 0) >= 3 },
      { id: 'collections5', label: 'Conseguir 5 coleccionables', reward: 'Insignia de explorador', check: (pet) => pet.collections.length >= 5 },
      { id: 'allplaces', label: 'Visitar parque, playa y centro', reward: 'Mapa del barrio', check: (pet) => ['park', 'beach', 'downtown'].every((id) => (pet.visits[id] || 0) > 0) }
    ]
  },
  {
    id: 'genius',
    icon: '🧠',
    title: 'Genio perruno',
    description: 'Estudia, resuelve tareas y desbloquea objetos útiles.',
    milestones: [
      { id: 'int3', label: 'Inteligencia nivel 3', reward: 'Biblioteca más útil', check: (pet) => pet.skills.inteligencia >= 3 },
      { id: 'school3', label: 'Escuela nivel 3', reward: 'Diploma de cachorro', check: (pet) => pet.progress.schoolLevel >= 3 },
      { id: 'int7', label: 'Inteligencia nivel 7', reward: 'Mente brillante', check: (pet) => pet.skills.inteligencia >= 7 }
    ]
  },
  {
    id: 'career',
    icon: '💼',
    title: 'Profesional trabajador',
    description: 'Construye una carrera, compra cosas y deja legado.',
    milestones: [
      { id: 'work2', label: 'Ir al trabajo 2 veces', reward: '+energía', check: (pet) => (pet.visits.work || 0) >= 2 },
      { id: 'career3', label: 'Trabajo nivel 3', reward: 'Ascenso perruno', check: (pet) => pet.progress.careerLevel >= 3 },
      { id: 'legacyReady', label: 'Estar listo para legado', reward: 'Nueva generación disponible', check: (pet) => pet.progress.careerLevel >= 3 || pet.progress.schoolLevel >= 3 }
    ]
  }
];

const SKILL_UNLOCKS = [
  { id: 'social-party', skill: 'social', level: 3, icon: '🎉', label: 'Invitar vecinos mejora más amistad' },
  { id: 'social-gift', skill: 'social', level: 5, icon: '🎁', label: 'Regalos dan recuerdos extra' },
  { id: 'int-desk', skill: 'inteligencia', level: 2, unlock: 'tool-desk', icon: '📝', label: 'Escritorio de estudio' },
  { id: 'int-books', skill: 'inteligencia', level: 4, unlock: 'tool-bookshelf', icon: '📚', label: 'Biblioteca perruna' },
  { id: 'cook-stove', skill: 'cocina', level: 2, unlock: 'tool-stove', icon: '🍳', label: 'Cocina completa' },
  { id: 'cook-fridge', skill: 'cocina', level: 3, unlock: 'tool-fridge', icon: '🧊', label: 'Nevera retro' }
];

const HOUSE_SCORE_WEIGHTS = {
  floorTile: { comfort: 2, style: 2 },
  stairs: { comfort: 8, style: 6 },
  bed: { comfort: 18 },
  sofa: { comfort: 16, style: 6 },
  rug: { comfort: 8, style: 12 },
  plant: { style: 8, garden: 4 },
  table: { comfort: 8, style: 8 },
  lamp: { style: 10, luxury: 4 },
  fridge: { kitchen: 18, luxury: 3 },
  stove: { kitchen: 22, luxury: 5 },
  sink: { kitchen: 12 },
  desk: { fun: 8, luxury: 8 },
  bookshelf: { fun: 12, luxury: 8 },
  shower: { comfort: 10, luxury: 12 },
  tree: { garden: 18 },
  flowers: { garden: 14, style: 8 },
  fence: { garden: 8, style: 4 },
  bench: { garden: 10, comfort: 5 },
  door: { style: 7 },
  window: { style: 9, luxury: 3 },
  roof: { style: 12, luxury: 5 },
  garden: { garden: 20, fun: 4 },
  wall: { style: 4 }
};

const DAILY_WANTS = [
  { id: 'needs-good', icon: '💗', label: 'Mantener todas las necesidades en 75+', reward: 8, check: (pet) => [pet.hunger, pet.energy, pet.hygiene, pet.happiness].every((value) => value >= 75) },
  { id: 'build-8', icon: '🔨', label: 'Tener 8 objetos en casa', reward: 8, check: (pet) => (pet.layout || []).length >= 8 },
  { id: 'social-once', icon: '💬', label: 'Socializar una vez', reward: 7, check: (pet) => pet.quests.social >= 1 },
  { id: 'visit-park', icon: '🌳', label: 'Ir al parque', reward: 7, check: (pet) => (pet.visits.park || 0) > 0 },
  { id: 'study', icon: '🧠', label: 'Subir inteligencia a 2', reward: 9, check: (pet) => pet.skills.inteligencia >= 2 },
  { id: 'cook', icon: '🍳', label: 'Aprender cocina nivel 1', reward: 9, check: (pet) => pet.skills.cocina >= 1 },
  { id: 'wardrobe', icon: '👗', label: 'Usar ropa o accesorio', reward: 6, check: (pet) => pet.outfit !== 'outfit-none' },
  { id: 'house-value', icon: '🏠', label: 'Casa con valor 90+', reward: 10, check: (pet, houseScore) => houseScore.total >= 90 },
  { id: 'garden', icon: '🥕', label: 'Cosechar el huerto', reward: 10, check: (pet) => pet.garden.harvests > 0 }
];

const CALENDAR_EVENTS = [
  { day: 0, icon: '🥕', title: 'Domingo de jardín', description: 'Cosechar o plantar da más felicidad.', activity: 'garden', skill: null, bonus: 8 },
  { day: 1, icon: '💼', title: 'Lunes de ascenso', description: 'El trabajo da progreso extra.', activity: 'work', skill: 'inteligencia', bonus: 1 },
  { day: 2, icon: '🎓', title: 'Martes de estudio', description: 'La escuela da inteligencia extra.', activity: 'school', skill: 'inteligencia', bonus: 1 },
  { day: 3, icon: '🛍️', title: 'Miércoles de mercado', description: 'El centro puede soltar coleccionables.', activity: 'downtown', collectible: 'Ticket del mercado' },
  { day: 4, icon: '🏡', title: 'Jueves de diseño', description: 'Construir mejora el valor del hogar.', activity: 'build', bonus: 10 },
  { day: 5, icon: '🎉', title: 'Viernes social', description: 'Las amistades suben más rápido.', activity: 'social', bonus: 8 },
  { day: 6, icon: '🧭', title: 'Sábado de aventura', description: 'Parque y playa dan más recuerdos.', activity: 'explore', collectible: 'Foto de aventura' }
];

const COLLECTION_SETS = [
  { id: 'park', icon: '🌳', title: 'Tesoros del parque', items: ['Piña perfecta', 'Placa del parque'] },
  { id: 'beach', icon: '🏖️', title: 'Recuerdos de playa', items: ['Concha nacarada', 'Postal de la playa'] },
  { id: 'city', icon: '🏙️', title: 'Hallazgos del centro', items: ['Reloj diminuto', 'Entrada de teatro', 'Ticket del mercado'] },
  { id: 'story', icon: '📖', title: 'Historias especiales', items: ['Foto de la primera casa', 'Cachorro de peluche', 'Foto de la gran fiesta', 'Mapa del barrio'] }
];

const SOCIAL_DRAMAS = [
  {
    id: 'partyInvite',
    icon: '🎉',
    friend: 'Luna',
    title: 'Invitación vecinal',
    text: 'Luna quiere organizar una mini fiesta en tu jardín. Puede mejorar amistades, pero cansará a todos.',
    choices: [
      { label: 'Aceptar la fiesta', mood: 14, social: 9, energy: -8, memory: 'Organizó una fiesta vecinal.' },
      { label: 'Hacer algo tranquilo', mood: 6, social: 4, memory: 'Prefirió una tarde tranquila con Luna.' }
    ]
  },
  {
    id: 'friendlyRivalry',
    icon: '🏁',
    friend: 'Bruno',
    title: 'Rivalidad amistosa',
    text: 'Bruno propone una competencia de trucos. Ganar sube autoestima; perder igual deja historia.',
    choices: [
      { label: 'Competir', mood: 10, skill: 'social', social: 5, memory: 'Compitió con Bruno en el barrio.' },
      { label: 'Animar a Bruno', mood: 7, social: 12, memory: 'Animó a Bruno como buen amigo.' }
    ]
  },
  {
    id: 'mysteryMap',
    icon: '🗺️',
    friend: 'Coco',
    title: 'Rumor del mapa',
    text: 'Coco escuchó que hay una pista escondida cerca de la carretera.',
    choices: [
      { label: 'Investigar', mood: 8, skill: 'inteligencia', collectible: 'Mapa del barrio', memory: 'Investigó un rumor misterioso con Coco.' },
      { label: 'Preguntar a vecinos', mood: 5, social: 8, memory: 'Preguntó por pistas en el vecindario.' }
    ]
  }
];

const getDateKey = (time) => new Date(time).toISOString().slice(0, 10);

const getSkillUnlocks = (skills) => SKILL_UNLOCKS.filter((unlock) => (skills[unlock.skill] || 0) >= unlock.level);

const calculateHouseScore = (pet) => {
  const scores = { comfort: 0, style: 0, garden: 0, kitchen: 0, fun: 0, luxury: 0 };
  (pet.layout || []).forEach((item) => {
    const weights = HOUSE_SCORE_WEIGHTS[item.type] || {};
    Object.entries(weights).forEach(([key, value]) => {
      scores[key] += Math.round(value * (item.scale || 1));
    });
    if (item.color) scores.style += 2;
    if ((item.level || 0) > 0) scores.luxury += 3;
  });
  if (pet.savedLayouts.length) scores.style += 8;
  if (pet.garden.harvests) scores.garden += Math.min(25, pet.garden.harvests * 5);
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const rank = total >= 220 ? 'Mansión perruna'
    : total >= 150 ? 'Casa soñada'
      : total >= 90 ? 'Hogar cómodo'
        : 'Primer hogar';
  return { ...scores, total, rank };
};

const getSimCalendarEvent = (clock) => CALENDAR_EVENTS[getSimDayIndex(clock)];

const getDailyWantItems = (pet, houseScore, time) => {
  const dateKey = getDateKey(time);
  const seed = dateKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + pet.legacy.generation;
  const rotated = DAILY_WANTS.map((want, index) => DAILY_WANTS[(index + seed) % DAILY_WANTS.length]);
  const picked = [];
  rotated.forEach((want) => {
    if (!picked.some((item) => item.id === want.id) && picked.length < 3) picked.push(want);
  });
  return picked.map((want) => ({ ...want, done: want.check(pet, houseScore), dateKey }));
};

const getCollectionSetProgress = (pet) => COLLECTION_SETS.map((set) => ({
  ...set,
  found: set.items.filter((item) => pet.collections.includes(item))
}));

const STORY_EVENTS = [
  {
    title: 'La caja misteriosa',
    icon: '📦',
    text: 'Apareció una caja frente al garaje. Desde dentro se escucha un pequeño “guau”.',
    choices: [
      { label: 'Abrir con cuidado', result: 'Encontraste un cachorro de peluche antiguo.', collectible: 'Cachorro de peluche', mood: 12 },
      { label: 'Llamar a Luna', result: 'Luna ayudó a abrirla y vuestra amistad creció.', friend: 'Luna', mood: 7 }
    ]
  },
  {
    title: 'Fiesta improvisada',
    icon: '🎉',
    text: 'Bruno propone organizar una fiesta esta misma noche. La casa todavía no está lista.',
    choices: [
      { label: 'Decorar toda la sala', result: 'La fiesta fue preciosa y todos recuerdan la decoración.', collectible: 'Foto de la gran fiesta', mood: 15 },
      { label: 'Hacer un pícnic', result: 'El jardín terminó lleno de mantas, comida y nuevos amigos.', friend: 'Bruno', mood: 12 }
    ]
  },
  {
    title: 'El mapa del parque',
    icon: '🗺️',
    text: 'Coco encontró medio mapa enterrado junto a un árbol del parque.',
    choices: [
      { label: 'Buscar el tesoro', result: 'Tras muchas vueltas apareció una placa dorada.', collectible: 'Placa del parque', mood: 18 },
      { label: 'Donarlo al museo', result: 'El museo nombró a Salchi explorador honorario.', friend: 'Coco', mood: 10 }
    ]
  },
  {
    title: 'Un sueño enorme',
    icon: '🌟',
    text: 'Salchi quiere dejar una huella en el vecindario. ¿Qué debería perseguir ahora?',
    choices: [
      { label: 'Ser una estrella', result: 'Comienza la aspiración de popularidad.', goal: 'Conseguir tres amistades de nivel alto', mood: 10 },
      { label: 'Crear el hogar perfecto', result: 'Comienza una gran aspiración de diseño.', goal: 'Construir una casa con 15 objetos', mood: 10 }
    ]
  }
];

const VENUE_TASKS = {
  work: [
    { icon: '📊', label: 'Preparar el informe', skill: 'inteligencia' },
    { icon: '☕', label: 'Ayudar a un compañero', skill: 'social' },
    { icon: '💡', label: 'Proponer una idea', skill: 'inteligencia' }
  ],
  school: [
    { icon: '📚', label: 'Resolver la lección', skill: 'inteligencia' },
    { icon: '🧪', label: 'Hacer un experimento', skill: 'inteligencia' },
    { icon: '🎨', label: 'Presentar un proyecto', skill: 'social' }
  ],
  park: [
    { icon: '🐕', label: 'Conocer otra mascota', skill: 'social' },
    { icon: '🎾', label: 'Jugar a buscar', skill: 'social' },
    { icon: '🔎', label: 'Explorar los arbustos', collectible: 'Piña perfecta' }
  ],
  beach: [
    { icon: '🏊', label: 'Nadar entre las olas', skill: 'social' },
    { icon: '🏰', label: 'Construir un castillo', collectible: 'Concha nacarada' },
    { icon: '🌅', label: 'Mirar el atardecer', collectible: 'Postal de la playa' }
  ],
  vet: [
    { icon: '🩺', label: 'Chequeo general', skill: 'inteligencia' },
    { icon: '🦷', label: 'Revisión dental', collectible: 'Cepillo brillante' },
    { icon: '💉', label: 'Vacuna valiente', skill: 'social' }
  ],
  downtown: [
    { icon: '☕', label: 'Visitar el café', skill: 'social' },
    { icon: '🛍️', label: 'Buscar antigüedades', collectible: 'Reloj diminuto' },
    { icon: '🎭', label: 'Ver un espectáculo', collectible: 'Entrada de teatro' }
  ]
};

const AWAY_ACTIVITIES = [
  {
    id: 'work',
    icon: '💼',
    title: 'Ir al trabajo',
    subtitle: 'Oficina perruna',
    seconds: 180,
    reward: 22,
    energy: -16,
    hunger: -10
  },
  {
    id: 'school',
    icon: '🎓',
    title: 'Ir a estudiar',
    subtitle: 'Escuela de cachorros',
    seconds: 120,
    reward: 8,
    skill: 'inteligencia',
    energy: -10,
    hunger: -7
  },
  {
    id: 'park',
    icon: '🌳',
    title: 'Ir al parque',
    subtitle: 'Amigos y carreras',
    seconds: 60,
    reward: 5,
    skill: 'social',
    energy: -6,
    happiness: 18
  },
  {
    id: 'beach',
    icon: '🏖️',
    title: 'Ir a la playa',
    subtitle: 'Arena y olas',
    seconds: 90,
    reward: 10,
    skill: 'social',
    energy: -8,
    happiness: 22
  },
  {
    id: 'vet',
    icon: '🩺',
    title: 'Ir al veterinario',
    subtitle: 'Chequeo saludable',
    seconds: 75,
    reward: 6,
    hygiene: 12,
    energy: -4
  },
  {
    id: 'downtown',
    icon: '🏙️',
    title: 'Ir al centro',
    subtitle: 'Cafés y compras',
    seconds: 105,
    reward: 12,
    skill: 'social',
    energy: -9,
    happiness: 14
  }
];

const createFreshSimState = () => JSON.parse(JSON.stringify({ ...SIM_DEFAULTS, updatedAt: Date.now() }));

const loadSaveSlots = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(SIM_SLOTS_STORAGE_KEY) || 'null');
    if (Array.isArray(stored) && stored.length) return stored;
    const existing = JSON.parse(localStorage.getItem(SIM_STORAGE_KEY) || localStorage.getItem(LEGACY_SIM_STORAGE_KEY) || 'null');
    const now = Date.now();
    return [{
      id: 'partida-1',
      name: 'Partida 1',
      state: existing || createFreshSimState(),
      createdAt: existing?.updatedAt || now,
      updatedAt: existing?.updatedAt || now,
      isNew: !existing
    }];
  } catch {
    return [{ id: 'partida-1', name: 'Partida 1', state: createFreshSimState(), createdAt: Date.now(), updatedAt: Date.now(), isNew: true }];
  }
};

const getInitialSlotId = (slots) => {
  const storedId = localStorage.getItem(SIM_ACTIVE_SLOT_KEY);
  return slots.some((slot) => slot.id === storedId) ? storedId : slots[0].id;
};

const loadSimState = (savedOverride) => {
  try {
    const saved = savedOverride || JSON.parse(localStorage.getItem(SIM_STORAGE_KEY) || localStorage.getItem(LEGACY_SIM_STORAGE_KEY));
    if (!saved) return SIM_DEFAULTS;
    const elapsedHours = Math.min(72, Math.max(0, (Date.now() - (saved.updatedAt || Date.now())) / 3600000));
    return {
      ...SIM_DEFAULTS,
      ...saved,
      name: saved.name === 'Chuchi' ? 'Salchi' : saved.name,
      owned: [...new Set([...SIM_DEFAULTS.owned, ...(saved.owned || [])])],
      skills: { ...SIM_DEFAULTS.skills, ...(saved.skills || {}) },
      progress: { ...SIM_DEFAULTS.progress, ...(saved.progress || {}) },
      appearance: { ...SIM_DEFAULTS.appearance, ...(saved.appearance || {}) },
      world: { ...SIM_DEFAULTS.world, ...(saved.world || {}) },
      clock: { ...SIM_DEFAULTS.clock, ...(saved.clock || {}) },
      autonomy: { ...SIM_DEFAULTS.autonomy, ...(saved.autonomy || {}) },
      roomNames: { ...SIM_DEFAULTS.roomNames, ...(saved.roomNames || {}) },
      relationships: { ...SIM_DEFAULTS.relationships, ...(saved.relationships || {}) },
      garden: { ...SIM_DEFAULTS.garden, ...(saved.garden || {}) },
      quests: { ...SIM_DEFAULTS.quests, ...(saved.quests || {}) },
      aspiration: { ...SIM_DEFAULTS.aspiration, ...(saved.aspiration || {}) },
      dailyWants: { ...SIM_DEFAULTS.dailyWants, ...(saved.dailyWants || {}) },
      preferences: { ...SIM_DEFAULTS.preferences, ...(saved.preferences || {}) },
      visits: { ...SIM_DEFAULTS.visits, ...(saved.visits || {}) },
      stats: { ...SIM_DEFAULTS.stats, ...(saved.stats || {}), furnitureUses: { ...SIM_DEFAULTS.stats.furnitureUses, ...(saved.stats?.furnitureUses || {}) } },
      legacy: { ...SIM_DEFAULTS.legacy, ...(saved.legacy || {}) },
      traits: saved.traits || SIM_DEFAULTS.traits,
      collections: saved.collections || SIM_DEFAULTS.collections,
      story: { ...SIM_DEFAULTS.story, ...(saved.story || {}) },
      memories: saved.memories || [],
      customGoals: saved.customGoals || [],
      savedLayouts: saved.savedLayouts || [],
      colors: { ...SIM_DEFAULTS.colors, ...(saved.colors || {}) },
      hunger: Math.max(35, clampNeed(saved.hunger - elapsedHours * 1.4)),
      energy: Math.max(35, clampNeed(saved.energy - elapsedHours * 0.9)),
      hygiene: Math.max(35, clampNeed(saved.hygiene - elapsedHours * 0.7)),
      happiness: Math.max(45, clampNeed(saved.happiness - elapsedHours * 0.6)),
      updatedAt: Date.now()
    };
  } catch {
    return SIM_DEFAULTS;
  }
};

function VidaSalchicha({ onBack, deviceId, currentStreak }) {
  const [saveSlots, setSaveSlots] = useState(loadSaveSlots);
  const [activeSlotId, setActiveSlotId] = useState(() => getInitialSlotId(loadSaveSlots()));
  const [pet, setPet] = useState(() => {
    const slots = loadSaveSlots();
    const slotId = getInitialSlotId(slots);
    return loadSimState(slots.find((slot) => slot.id === slotId)?.state);
  });
  const [slotPickerOpen, setSlotPickerOpen] = useState(true);
  const [pendingDeleteSlotId, setPendingDeleteSlotId] = useState(null);
  const [view, setView] = useState('home');
  const [buildTool, setBuildTool] = useState('wall');
  const buildRotation = 0;
  const [buildColor, setBuildColor] = useState('#c7a7ff');
  const [activeFloor, setActiveFloor] = useState(0);
  const [dogFloor, setDogFloor] = useState(0);
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [buildHistory, setBuildHistory] = useState({ past: [], future: [] });
  const [fullscreen, setFullscreen] = useState(true);
  const [fullscreenMenuOpen, setFullscreenMenuOpen] = useState(false);
  const [fullscreenSection, setFullscreenSection] = useState('inicio');
  const [screenMode, setScreenMode] = useState(() => localStorage.getItem(SIM_SCREEN_MODE_KEY) || 'auto');
  const [dogMenu, setDogMenu] = useState(false);
  const [departureActivity, setDepartureActivity] = useState(null);
  const [venueGame, setVenueGame] = useState(null);
  const [venueOpen, setVenueOpen] = useState(false);
  const [storyEvent, setStoryEvent] = useState(null);
  const [dramaEvent, setDramaEvent] = useState(null);
  const [goalDraft, setGoalDraft] = useState('');
  const [selectedNeighbor, setSelectedNeighbor] = useState(null);
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    const slots = loadSaveSlots();
    return Boolean(slots.find((slot) => slot.id === getInitialSlotId(slots))?.isNew);
  });
  const [welcomeBack, setWelcomeBack] = useState(() => !onboardingOpen);
  const [now, setNow] = useState(() => Date.now());
  const [reaction, setReaction] = useState('¡Hola!');
  const [animation, setAnimation] = useState('');
  const [cloudReady, setCloudReady] = useState(false);
  const reactionTimer = useRef(null);
  const departureTimer = useRef(null);
  const cloudSaveTimer = useRef(null);
  const fullscreenToolsRef = useRef(null);
  const initialSlotTimestampRef = useRef(Math.max(0, ...saveSlots.map((slot) => slot.updatedAt || 0)));

  useEffect(() => {
    const updatedAt = Date.now();
    const state = { ...pet, updatedAt };
    localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(SIM_ACTIVE_SLOT_KEY, activeSlotId);
    const nextSlots = loadSaveSlots().map((slot) => (
      slot.id === activeSlotId ? { ...slot, state, updatedAt } : slot
    ));
    localStorage.setItem(SIM_SLOTS_STORAGE_KEY, JSON.stringify(nextSlots));
  }, [activeSlotId, pet]);

  useEffect(() => {
    localStorage.setItem(SIM_SLOTS_STORAGE_KEY, JSON.stringify(saveSlots));
  }, [saveSlots]);

  useEffect(() => {
    localStorage.setItem(SIM_SCREEN_MODE_KEY, screenMode);
  }, [screenMode]);

  useEffect(() => {
    if (!deviceId) return undefined;
    let cancelled = false;
    const loadCloudSave = async () => {
      try {
        const response = await fetch(`/api/game-save?deviceId=${encodeURIComponent(deviceId)}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && data.save?.state) {
          const cloudTime = new Date(data.save.updated_at).getTime();
          const localTime = initialSlotTimestampRef.current;
          if (cloudTime > localTime) {
            const saved = data.save.state;
            if (saved.saveSlotsVersion === 1 && Array.isArray(saved.slots) && saved.slots.length) {
              const cloudSlotId = saved.slots.some((slot) => slot.id === saved.activeSlotId)
                ? saved.activeSlotId
                : saved.slots[0].id;
              const cloudSlot = saved.slots.find((slot) => slot.id === cloudSlotId) || saved.slots[0];
              localStorage.setItem(SIM_SLOTS_STORAGE_KEY, JSON.stringify(saved.slots));
              localStorage.setItem(SIM_ACTIVE_SLOT_KEY, cloudSlotId);
              setSaveSlots(saved.slots);
              setActiveSlotId(cloudSlotId);
              setPet(loadSimState(cloudSlot.state));
              setOnboardingOpen(Boolean(cloudSlot.isNew));
              setWelcomeBack(!cloudSlot.isNew);
              setSlotPickerOpen(true);
              return;
            }
            localStorage.setItem(SIM_ONBOARDING_KEY, 'done');
            setOnboardingOpen(false);
            setPet((current) => ({
              ...current,
              ...saved,
              skills: { ...current.skills, ...(saved.skills || {}) },
              progress: { ...current.progress, ...(saved.progress || {}) },
              appearance: { ...current.appearance, ...(saved.appearance || {}) },
              world: { ...current.world, ...(saved.world || {}) },
              clock: { ...current.clock, ...(saved.clock || {}) },
              autonomy: { ...current.autonomy, ...(saved.autonomy || {}) },
              roomNames: { ...current.roomNames, ...(saved.roomNames || {}) },
              relationships: { ...current.relationships, ...(saved.relationships || {}) },
              garden: { ...current.garden, ...(saved.garden || {}) },
              quests: { ...current.quests, ...(saved.quests || {}) },
              aspiration: { ...current.aspiration, ...(saved.aspiration || {}) },
              dailyWants: { ...current.dailyWants, ...(saved.dailyWants || {}) },
              preferences: { ...current.preferences, ...(saved.preferences || {}) },
              visits: { ...current.visits, ...(saved.visits || {}) },
              stats: { ...current.stats, ...(saved.stats || {}), furnitureUses: { ...current.stats.furnitureUses, ...(saved.stats?.furnitureUses || {}) } },
              legacy: { ...current.legacy, ...(saved.legacy || {}) },
              story: { ...current.story, ...(saved.story || {}) },
              traits: saved.traits || current.traits,
              collections: saved.collections || current.collections,
              memories: saved.memories || current.memories,
              customGoals: saved.customGoals || current.customGoals,
              savedLayouts: saved.savedLayouts || current.savedLayouts,
              colors: { ...current.colors, ...(saved.colors || {}) }
            }));
          }
        }
      } catch {
        // Local save remains authoritative while offline.
      } finally {
        if (!cancelled) setCloudReady(true);
      }
    };
    loadCloudSave();
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId || !cloudReady) return undefined;
    window.clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = window.setTimeout(async () => {
      try {
        const slotsForCloud = loadSaveSlots();
        await fetch('/api/game-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId,
            state: {
              saveSlotsVersion: 1,
              slots: slotsForCloud,
              activeSlotId,
              updatedAt: Date.now()
            }
          })
        });
      } catch {
        // The local save will retry on the next change.
      }
    }, 1600);
    return () => window.clearTimeout(cloudSaveTimer.current);
  }, [activeSlotId, cloudReady, deviceId, pet, saveSlots]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPet((current) => {
        if (current.clock.paused) return current;
        const minutesToAdd = 10 * current.clock.speed;
        const totalMinutes = current.clock.minute + minutesToAdd;
        const dayAdvance = Math.floor(totalMinutes / 1440);
        const asleep = current.energy < 8;
        return {
          ...current,
          clock: {
            ...current.clock,
            minute: totalMinutes % 1440,
            day: current.clock.day + dayAdvance
          },
          hunger: clampNeed(current.hunger - 0.42 * current.clock.speed),
          energy: clampNeed(current.energy + (asleep ? 1.6 : -0.28) * current.clock.speed),
          hygiene: clampNeed(current.hygiene - 0.18 * current.clock.speed),
          happiness: clampNeed(current.happiness - (Math.min(current.hunger, current.energy, current.hygiene) < 25 ? 0.55 : 0.15) * current.clock.speed)
        };
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(reactionTimer.current);
    window.clearTimeout(departureTimer.current);
    window.clearTimeout(cloudSaveTimer.current);
  }, []);

  const react = useCallback((message, motion) => {
    setReaction(message);
    setAnimation(motion);
    window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => {
      setReaction('');
      setAnimation('');
    }, 1800);
  }, []);

  const toggleScreenMode = () => {
    setScreenMode((current) => current === 'landscape' ? 'auto' : 'landscape');
    react(screenMode === 'landscape' ? 'Vista automática activada.' : 'Vista horizontal activada.', 'jump');
  };

  const resetTransientGameState = () => {
    window.clearTimeout(departureTimer.current);
    setView('home');
    setDogFloor(0);
    setActiveFloor(0);
    setBuildHistory({ past: [], future: [] });
    setDogMenu(false);
    setDepartureActivity(null);
    setVenueGame(null);
    setVenueOpen(false);
    setStoryEvent(null);
    setDramaEvent(null);
    setFullscreenMenuOpen(false);
    setCameraResetKey((value) => value + 1);
  };

  const openSaveSlot = (slot) => {
    const storedSlot = loadSaveSlots().find((item) => item.id === slot.id) || slot;
    localStorage.setItem(SIM_ACTIVE_SLOT_KEY, storedSlot.id);
    setActiveSlotId(storedSlot.id);
    setPet(loadSimState(storedSlot.state));
    setOnboardingOpen(Boolean(storedSlot.isNew));
    setWelcomeBack(!storedSlot.isNew);
    setSlotPickerOpen(false);
    setPendingDeleteSlotId(null);
    resetTransientGameState();
  };

  const createSaveSlot = () => {
    const nowTime = Date.now();
    const storedSlots = loadSaveSlots();
    const slot = {
      id: `partida-${nowTime}`,
      name: `Partida ${storedSlots.length + 1}`,
      state: createFreshSimState(),
      createdAt: nowTime,
      updatedAt: nowTime,
      isNew: true
    };
    setSaveSlots([...storedSlots, slot]);
    openSaveSlot(slot);
  };

  const renameSaveSlot = (slotId, name) => {
    setSaveSlots(loadSaveSlots().map((slot) => (
      slot.id === slotId ? { ...slot, name: name.slice(0, 24) } : slot
    )));
  };

  const deleteSaveSlot = (slotId) => {
    if (saveSlots.length <= 1) {
      react('Debe existir al menos una partida.', 'shake');
      return;
    }
    if (pendingDeleteSlotId !== slotId) {
      setPendingDeleteSlotId(slotId);
      return;
    }
    const remaining = loadSaveSlots().filter((slot) => slot.id !== slotId);
    setSaveSlots(remaining);
    setPendingDeleteSlotId(null);
    if (slotId === activeSlotId) openSaveSlot(remaining[0]);
  };

  const setClockSpeed = (speed) => {
    setPet((current) => ({
      ...current,
      clock: { ...current.clock, speed, paused: speed === 0 ? true : false }
    }));
  };

  const runAutonomousAction = useCallback(() => {
    if (view !== 'home' || dogMenu || departureActivity) return;
    setPet((current) => {
      if (!current.autonomy.enabled || current.clock.paused || current.activity) return current;
      const available = new Set((current.layout || []).map((item) => item.type));
      const candidates = [
        { key: 'hunger', value: current.hunger, canUse: available.has('fridge') || available.has('stove'), label: 'Preparó algo para comer.', motion: 'eat', changes: { hunger: 24, hygiene: -2 } },
        { key: 'energy', value: current.energy, canUse: available.has('bed') || available.has('sofa'), label: 'Fue a descansar por su cuenta.', motion: 'sleep', changes: { energy: 25, hunger: -4 } },
        { key: 'hygiene', value: current.hygiene, canUse: available.has('shower') || available.has('sink'), label: 'Decidió asearse.', motion: 'shake', changes: { hygiene: 27, happiness: 2 } },
        { key: 'happiness', value: current.happiness, canUse: available.has('rug') || available.has('sofa'), label: 'Se puso a jugar en casa.', motion: 'jump', changes: { happiness: 20, energy: -5 } }
      ];
      const choice = candidates.filter((item) => item.canUse).sort((a, b) => a.value - b.value)[0];
      if (!choice || choice.value > 62) return current;
      const next = { ...current };
      Object.entries(choice.changes).forEach(([key, amount]) => {
        next[key] = clampNeed(current[key] + amount);
      });
      next.autonomy = {
        ...current.autonomy,
        actions: current.autonomy.actions + 1,
        lastAction: choice.label
      };
      window.setTimeout(() => react(choice.label, choice.motion), 0);
      return next;
    });
  }, [departureActivity, dogMenu, react, view]);

  useEffect(() => {
    const timer = window.setInterval(runAutonomousAction, 12000);
    return () => window.clearInterval(timer);
  }, [runAutonomousAction]);

  const houseScore = calculateHouseScore(pet);
  const activeSaveSlot = saveSlots.find((slot) => slot.id === activeSlotId) || saveSlots[0];
  const activeCalendarEvent = getSimCalendarEvent(pet.clock);
  const simDayName = WEEK_DAYS[getSimDayIndex(pet.clock)];
  const simHour = Math.floor(pet.clock.minute / 60);
  const currentCareer = CAREER_TRACKS.find((track) => track.id === pet.progress.careerTrack) || CAREER_TRACKS[0];
  const careerTitle = currentCareer.levels[Math.min(currentCareer.levels.length - 1, pet.progress.careerLevel - 1)];
  const schoolTitle = SCHOOL_GRADES[Math.min(SCHOOL_GRADES.length - 1, pet.progress.schoolLevel - 1)];
  const criticalNeed = [pet.hunger, pet.energy, pet.hygiene, pet.happiness].some((value) => value < 20);
  const skillUnlocks = getSkillUnlocks(pet.skills);
  const effectiveOwned = new Set([...pet.owned, ...skillUnlocks.map((unlock) => unlock.unlock).filter(Boolean)]);
  const hasOwned = (id) => effectiveOwned.has(id);
  const selectedAspiration = ASPIRATIONS.find((aspiration) => aspiration.id === pet.aspiration.id) || ASPIRATIONS[0];
  const aspirationMilestones = selectedAspiration.milestones.map((milestone) => ({
    ...milestone,
    done: milestone.check(pet, houseScore, currentStreak),
    claimed: pet.aspiration.claimed.includes(milestone.id)
  }));
  const dailyWantItems = getDailyWantItems(pet, houseScore, now).map((want) => ({
    ...want,
    claimed: pet.dailyWants.date === want.dateKey && pet.dailyWants.claimed.includes(want.id)
  }));
  const collectionSetProgress = getCollectionSetProgress(pet);

  const commitLayout = (nextLayout) => {
    if (dogFloor === 1 && !nextLayout.some((item) => item.type === 'floorTile' && (item.level || 0) === 1)) {
      setDogFloor(0);
    }
    setBuildHistory((current) => ({
      past: [...current.past.slice(-19), pet.layout],
      future: []
    }));
    setPet((current) => ({
      ...current,
      layout: nextLayout,
      quests: { ...current.quests, build: current.quests.build + 1 }
    }));
  };

  const undoBuild = () => {
    if (!buildHistory.past.length) return;
    const previous = buildHistory.past[buildHistory.past.length - 1];
    setBuildHistory((current) => ({
      past: current.past.slice(0, -1),
      future: [pet.layout, ...current.future].slice(0, 20)
    }));
    setPet((current) => ({ ...current, layout: previous }));
  };

  const redoBuild = () => {
    if (!buildHistory.future.length) return;
    const next = buildHistory.future[0];
    setBuildHistory((current) => ({
      past: [...current.past, pet.layout].slice(-20),
      future: current.future.slice(1)
    }));
    setPet((current) => ({ ...current, layout: next }));
  };

  const saveHouseLayout = () => {
    const savedLayout = {
      id: `${pet.savedLayouts.length + 1}-${pet.layout.length}`,
      name: `Diseño ${pet.savedLayouts.length + 1}`,
      layout: pet.layout.map((item) => ({ ...item }))
    };
    setPet((current) => ({ ...current, savedLayouts: [...current.savedLayouts, savedLayout].slice(-6) }));
    react('¡Diseño guardado!', 'jump');
  };

  const loadHouseLayout = (savedLayout) => {
    commitLayout(savedLayout.layout.map((item) => ({ ...item, id: `${item.type}-${Date.now()}-${Math.random()}` })));
    react(`Cargué ${savedLayout.name}.`, 'jump');
  };

  const toggleTrait = (traitId) => {
    setPet((current) => {
      const hasTrait = current.traits.includes(traitId);
      const traits = hasTrait
        ? current.traits.filter((trait) => trait !== traitId)
        : [...current.traits, traitId].slice(-2);
      return { ...current, traits: traits.length ? traits : ['juguetón'] };
    });
  };

  const care = (action) => {
    const actions = {
      feed: {
        message: '¡Ñam, ñam!',
        motion: 'eat',
        changes: { hunger: 25, happiness: 3, hygiene: -2, cookies: -2 },
        needsCookies: 2
      },
      play: {
        message: '¡Otra vez!',
        motion: 'jump',
        changes: { happiness: 22, energy: -9, hunger: -5, cookies: 4 }
      },
      bath: {
        message: '¡Quedé brillante!',
        motion: 'shake',
        changes: { hygiene: 30, happiness: -3, energy: -2 }
      },
      sleep: {
        message: 'Zzz…',
        motion: 'sleep',
        changes: { energy: 34, hunger: -7, happiness: 3 }
      },
      walk: {
        message: '¡A pasear!',
        motion: 'walk',
        changes: { happiness: 16, energy: -7, hunger: -5, hygiene: -4, cookies: 6 }
      }
    };
    const selected = actions[action];
    setPet((current) => {
      const next = { ...current };
      Object.entries(selected.changes).forEach(([key, amount]) => {
        const traitBonus = (action === 'play' && current.traits.includes('juguetón') && key === 'happiness')
          || (action === 'sleep' && current.traits.includes('casero') && key === 'energy')
          ? 7
          : 0;
        next[key] = key === 'cookies' ? current[key] : clampNeed(current[key] + amount + traitBonus);
      });
      next.quests = { ...current.quests, care: current.quests.care + 1 };
      return next;
    });
    setDogMenu(false);
    react(selected.message, selected.motion);
  };

  const buy = (item) => {
    if (hasOwned(item.id)) {
      if (item.type === 'room') setPet((current) => ({ ...current, room: item.id }));
      if (item.type === 'outfit') setPet((current) => ({ ...current, outfit: item.id }));
      if (item.type === 'vehicle') setPet((current) => ({ ...current, vehicle: item.vehicle }));
      react('¡Se ve genial!', 'jump');
      return;
    }
    setPet((current) => ({
      ...current,
      cookies: current.cookies,
      owned: [...current.owned, item.id],
      ...(item.type === 'room' ? { room: item.id } : {}),
      ...(item.type === 'outfit' ? { outfit: item.id } : {}),
      ...(item.type === 'vehicle' ? { vehicle: item.vehicle } : {})
    }));
    react('¡Es mío!', 'jump');
  };

  const startActivity = (activity) => {
    if (pet.energy < 20 || pet.hunger < 20) {
      react('Necesito comer y descansar primero…', 'sad');
      return;
    }
    const isWeekday = getSimDayIndex(pet.clock) >= 1 && getSimDayIndex(pet.clock) <= 5;
    if (['work', 'school'].includes(activity.id) && !isWeekday) {
      react('Hoy es día libre. ¡Toca disfrutar!', 'jump');
      return;
    }
    setDepartureActivity(activity);
    setView('home');
    setDogMenu(false);
    react('¡Voy por las llaves!', 'jump');
    window.clearTimeout(departureTimer.current);
    departureTimer.current = window.setTimeout(() => {
      const startedAt = Date.now();
      setPet((current) => ({
        ...current,
        activity: {
          ...activity,
          startedAt,
          endsAt: startedAt + activity.seconds * 1000
        }
      }));
      setVenueGame({ activity, completed: [], score: 0 });
      setVenueOpen(true);
      setDepartureActivity(null);
    }, 3200);
  };

  const finishActivity = () => {
    if (!pet.activity || (now < pet.activity.endsAt && (venueGame?.completed.length || 0) < 2)) return;
    const activity = pet.activity;
    setPet((current) => {
      const eventApplies = activeCalendarEvent.activity === activity.id
        || (activeCalendarEvent.activity === 'explore' && ['park', 'beach'].includes(activity.id));
      const nextSkills = { ...current.skills };
      if (activity.skill) nextSkills[activity.skill] = (nextSkills[activity.skill] || 0) + 1;
      if (eventApplies && activeCalendarEvent.skill) {
        nextSkills[activeCalendarEvent.skill] = (nextSkills[activeCalendarEvent.skill] || 0) + 1;
      }
      const nextCollections = eventApplies && activeCalendarEvent.collectible && !current.collections.includes(activeCalendarEvent.collectible)
        ? [...current.collections, activeCalendarEvent.collectible]
        : current.collections;
      const venueBonus = Math.min(2, venueGame?.score || 0);
      const needPenalty = Math.min(current.energy, current.hunger, current.happiness) < 35 ? 8 : 0;
      const performanceGain = 7 + venueBonus * 3 - needPenalty;
      const careerGain = 1 + venueBonus + (eventApplies && activeCalendarEvent.activity === 'work' ? 1 : 0);
      const schoolGain = 1 + venueBonus + (current.progress.homework >= 50 ? 1 : 0);
      const nextProgress = activity.id === 'work'
        ? {
            ...current.progress,
            careerXP: current.progress.careerXP + careerGain,
            careerLevel: Math.min(5, Math.max(current.progress.careerLevel, Math.floor((current.progress.careerXP + careerGain) / 5) + 1)),
            careerPerformance: clampNeed(current.progress.careerPerformance + performanceGain),
            workDays: current.progress.workDays + 1
          }
        : activity.id === 'school'
          ? {
              ...current.progress,
              schoolXP: current.progress.schoolXP + schoolGain,
              schoolLevel: Math.min(5, Math.max(current.progress.schoolLevel, Math.floor((current.progress.schoolXP + schoolGain) / 5) + 1)),
              schoolPerformance: clampNeed(current.progress.schoolPerformance + performanceGain),
              homework: Math.max(0, current.progress.homework - 50),
              schoolDays: current.progress.schoolDays + 1
            }
          : current.progress;
      return {
        ...current,
        activity: null,
        cookies: current.cookies,
        energy: clampNeed(current.energy + (activity.energy || 0)),
        hunger: clampNeed(current.hunger + (activity.hunger || 0)),
        happiness: clampNeed(current.happiness + (activity.happiness || 4) + (current.preferences.favoriteActivity === activity.id ? 10 : 0) + (eventApplies ? 6 : 0)),
        hygiene: clampNeed(current.hygiene + (activity.hygiene || 0)),
        skills: nextSkills,
        progress: nextProgress,
        collections: nextCollections,
        quests: {
          ...current.quests,
          social: current.quests.social + (['park', 'beach', 'downtown'].includes(activity.id) ? 1 : 0)
        },
        visits: { ...current.visits, [activity.id]: (current.visits[activity.id] || 0) + 1 },
        stats: { ...current.stats, calendarEvents: current.stats.calendarEvents + (eventApplies ? 1 : 0) },
        memories: [
          {
            id: `visit-${Date.now()}`,
            icon: eventApplies ? activeCalendarEvent.icon : activity.icon,
            text: eventApplies ? `${activeCalendarEvent.title}: ${activity.subtitle}.` : `Visitó ${activity.subtitle.toLowerCase()}.`,
            at: Date.now()
          },
          ...current.memories
        ].slice(0, 20)
      };
    });
    const completedVisits = Object.values(pet.visits).reduce((total, count) => total + count, 0) + 1;
    if (completedVisits % 2 === 0 && pet.story.chapter < STORY_EVENTS.length) {
      setStoryEvent(STORY_EVENTS[pet.story.chapter]);
    }
    setVenueGame(null);
    setVenueOpen(false);
    react(activity.id === 'work' ? `¡Terminó otro día como ${careerTitle}!` : activity.id === 'school' ? '¡Volví de la escuela!' : `¡Volví de ${activity.subtitle.toLowerCase()}!`, 'jump');
  };

  const doHomework = () => {
    if (pet.energy < 15) {
      react('Estoy demasiado cansado para estudiar.', 'sad');
      return;
    }
    setPet((current) => ({
      ...current,
      energy: clampNeed(current.energy - 8),
      happiness: clampNeed(current.happiness - 2),
      skills: { ...current.skills, inteligencia: current.skills.inteligencia + 1 },
      progress: { ...current.progress, homework: clampNeed(current.progress.homework + 35) },
      autonomy: { ...current.autonomy, lastAction: 'Hizo sus deberes escolares.' }
    }));
    react('¡Deberes adelantados!', 'jump');
  };

  const performVenueTask = (task, index) => {
    if (!venueGame || venueGame.completed.includes(index)) return;
    const curiousBonus = pet.traits.includes('curioso') && task.collectible;
    setVenueGame((current) => ({
      ...current,
      completed: [...current.completed, index],
      score: current.score + (curiousBonus ? 2 : 1)
    }));
    setPet((current) => {
      const nextCollections = task.collectible && !current.collections.includes(task.collectible)
        ? [...current.collections, task.collectible]
        : current.collections;
      return {
        ...current,
        skills: task.skill
          ? { ...current.skills, [task.skill]: (current.skills[task.skill] || 0) + 1 }
          : current.skills,
        collections: nextCollections,
        happiness: clampNeed(current.happiness + (curiousBonus ? 8 : 4))
      };
    });
    react(task.collectible ? `¡Encontré: ${task.collectible}!` : '¡Tarea completada!', task.collectible ? 'jump' : 'shake');
  };

  const openVenue = () => {
    if (!venueGame && pet.activity) {
      setVenueGame({ activity: pet.activity, completed: [], score: 0 });
    }
    setVenueOpen(true);
  };

  const resolveStoryChoice = (choice) => {
    setPet((current) => {
      const collections = choice.collectible && !current.collections.includes(choice.collectible)
        ? [...current.collections, choice.collectible]
        : current.collections;
      const customGoals = choice.goal
        ? [...current.customGoals, { id: Date.now(), text: choice.goal, done: false }]
        : current.customGoals;
      return {
        ...current,
        happiness: clampNeed(current.happiness + (choice.mood || 0)),
        collections,
        customGoals,
        relationships: choice.friend
          ? { ...current.relationships, [choice.friend]: Math.min(100, current.relationships[choice.friend] + 20) }
          : current.relationships,
        story: {
          chapter: Math.min(STORY_EVENTS.length, current.story.chapter + 1),
          choices: [...current.story.choices, choice.label],
          log: [choice.result, ...current.story.log].slice(0, 12)
        },
        memories: [{ id: `story-${Date.now()}`, icon: storyEvent?.icon || '📖', text: choice.result, at: Date.now() }, ...current.memories].slice(0, 20)
      };
    });
    setStoryEvent(null);
    react(choice.result, 'jump');
  };

  const useFurniture = (type) => {
    if (type === 'stairs') {
      const hasUpperFloor = pet.layout.some((item) => item.type === 'floorTile' && (item.level || 0) === 1);
      if (!hasUpperFloor) {
        react('Construye al menos una baldosa en el piso 2 antes de subir.', 'shake');
        return;
      }
      setDogFloor((current) => current === 0 ? 1 : 0);
      react(dogFloor === 0 ? '¡Subiendo al piso 2!' : '¡Bajando al piso 1!', 'walk');
      return;
    }
    const interactions = {
      fridge: { message: '¡Qué fresquito!', changes: { hunger: 12, cookies: -1 } },
      stove: { message: '¡Cociné algo rico!', changes: { hunger: 20, cocina: 1, cookies: -2 }, collectible: 'Receta de croquetas' },
      sink: { message: 'Todo limpio.', changes: { hygiene: 5 } },
      desk: { message: '¡Tarea terminada!', changes: { inteligencia: 1, energy: -4 } },
      bookshelf: { message: 'Un capítulo más…', changes: { inteligencia: 1, happiness: 4 } },
      shower: { message: '¡Baño de espuma!', changes: { hygiene: 28, energy: -2 } },
      bed: { message: 'Zzz…', changes: { energy: 18, hunger: -4 } },
      sofa: { message: 'Qué cómodo.', changes: { energy: 9, happiness: 7 } },
      plant: { message: 'Está creciendo.', changes: { happiness: 3 } },
      tree: { message: '¡Qué buena sombra!', changes: { happiness: 5 } },
      flowers: { message: 'Huelen increíble.', changes: { happiness: 6 } },
      bench: { message: 'Un descansito.', changes: { energy: 6 } },
      car: { message: '¡Vamos de paseo!', changes: { happiness: 12, energy: -2 } }
    };
    const interaction = interactions[type];
    if (!interaction) return;
    setPet((current) => {
      const next = {
        ...current,
        skills: { ...current.skills },
        stats: {
          ...current.stats,
          furnitureUses: {
            ...current.stats.furnitureUses,
            [type]: (current.stats.furnitureUses[type] || 0) + 1
          }
        },
        quests: { ...current.quests, care: current.quests.care + 1 }
      };
      Object.entries(interaction.changes).forEach(([key, amount]) => {
        if (key === 'cookies') return;
        if (Object.hasOwn(next.skills, key)) next.skills[key] += amount;
        else next[key] = clampNeed(next[key] + amount);
      });
      if (interaction.collectible && !current.collections.includes(interaction.collectible) && (next.stats.furnitureUses[type] || 0) >= 2) {
        next.collections = [...current.collections, interaction.collectible];
      }
      if (['stove', 'desk', 'bookshelf', 'shower', 'bed'].includes(type)) {
        next.memories = [{ id: `object-${Date.now()}`, icon: '🏠', text: `Usó ${type === 'stove' ? 'la cocina' : type === 'desk' ? 'el escritorio' : type === 'bookshelf' ? 'la biblioteca' : type === 'shower' ? 'la ducha' : 'la cama'}.`, at: Date.now() }, ...current.memories].slice(0, 20);
      }
      return next;
    });
    react(interaction.message, type === 'bed' ? 'sleep' : 'jump');
  };

  const befriend = (name) => {
    const socialBonus = (pet.traits.includes('sociable') ? 18 : 12) + (activeCalendarEvent.activity === 'social' ? activeCalendarEvent.bonus : 0);
    setPet((current) => ({
      ...current,
      relationships: { ...current.relationships, [name]: Math.min(100, current.relationships[name] + socialBonus) },
      skills: { ...current.skills, social: current.skills.social + 1 },
      quests: { ...current.quests, social: current.quests.social + 1 },
      happiness: clampNeed(current.happiness + 8),
      memories: [{ id: `friend-${Date.now()}`, icon: '🐾', text: `Pasó un rato con ${name}.`, at: Date.now() }, ...current.memories].slice(0, 20)
    }));
    if (!dramaEvent && (pet.relationships[name] || 0) + socialBonus >= 35) {
      setDramaEvent(SOCIAL_DRAMAS.find((event) => event.friend === name) || SOCIAL_DRAMAS[0]);
    }
    react(`¡${name} quiere volver a jugar!`, 'jump');
  };

  const interactNeighbor = (name, interaction) => {
    const interactions = {
      chat: { amount: 8, message: `Una charla larguísima con ${name}.`, icon: '💬' },
      play: { amount: 14, message: `${name} y ${pet.name} jugaron hasta cansarse.`, icon: '🎾' },
      gift: { amount: 20, message: `${pet.name} le dio un regalo a ${name}.`, icon: '🎁' },
      prank: { amount: pet.traits.includes('travieso') ? 12 : -6, message: `La broma a ${name} tuvo consecuencias.`, icon: '😈' }
    };
    const selected = interactions[interaction];
    const eventBonus = activeCalendarEvent.activity === 'social' ? activeCalendarEvent.bonus : 0;
    setPet((current) => ({
      ...current,
      relationships: {
        ...current.relationships,
        [name]: Math.max(0, Math.min(100, current.relationships[name] + selected.amount + (selected.amount > 0 ? eventBonus : 0)))
      },
      skills: { ...current.skills, social: current.skills.social + 1 },
      memories: [{ id: `social-${Date.now()}`, icon: selected.icon, text: selected.message, at: Date.now() }, ...current.memories].slice(0, 20)
    }));
    if (!dramaEvent && ['play', 'gift', 'prank'].includes(interaction)) {
      setDramaEvent(SOCIAL_DRAMAS.find((event) => event.friend === name) || SOCIAL_DRAMAS[1]);
    }
    react(selected.message, interaction === 'prank' ? 'shake' : 'jump');
  };

  const addCustomGoal = () => {
    const text = goalDraft.trim();
    if (!text) return;
    setPet((current) => ({
      ...current,
      customGoals: [...current.customGoals, { id: Date.now(), text, done: false }].slice(-12)
    }));
    setGoalDraft('');
  };

  const toggleCustomGoal = (id) => {
    setPet((current) => ({
      ...current,
      customGoals: current.customGoals.map((goal) => (
        goal.id === id ? { ...goal, done: !goal.done } : goal
      ))
    }));
  };

  const beginNewGeneration = () => {
    if (pet.progress.careerLevel < 3 && pet.progress.schoolLevel < 3) {
      react('Completa más trabajo o estudios para crear un legado.', 'sad');
      return;
    }
    setPet((current) => ({
      ...current,
      legacy: {
        ...current.legacy,
        generation: current.legacy.generation + 1,
        milestones: [...current.legacy.milestones, `Generación ${current.legacy.generation} completada`]
      },
      skills: {
        inteligencia: Math.floor(current.skills.inteligencia / 2),
        social: Math.floor(current.skills.social / 2),
        cocina: Math.floor(current.skills.cocina / 2)
      },
      story: { ...current.story, log: [`Comenzó la generación ${current.legacy.generation + 1}.`, ...current.story.log] },
      memories: [{ id: `legacy-${Date.now()}`, icon: '🌳', text: 'La familia Salchicha inició una nueva generación.', at: Date.now() }, ...current.memories]
    }));
    react('¡Comienza una nueva generación!', 'jump');
  };

  const plantGarden = () => {
    setPet((current) => ({
      ...current,
      garden: { ...current.garden, plantedAt: Date.now(), watered: false }
    }));
    react('¡Semillas plantadas!', 'jump');
  };

  const waterGarden = () => {
    if (!pet.garden.plantedAt) return;
    setPet((current) => ({ ...current, garden: { ...current.garden, watered: true } }));
    react('¡Huerto regado!', 'shake');
  };

  const harvestGarden = () => {
    if (!pet.garden.plantedAt || !pet.garden.watered || now - pet.garden.plantedAt < 60000) return;
    const eventApplies = activeCalendarEvent.activity === 'garden';
    setPet((current) => ({
      ...current,
      garden: { plantedAt: null, watered: false, harvests: current.garden.harvests + 1 },
      happiness: clampNeed(current.happiness + 12 + (eventApplies ? activeCalendarEvent.bonus : 0)),
      stats: { ...current.stats, calendarEvents: current.stats.calendarEvents + (eventApplies ? 1 : 0) },
      memories: [{ id: `garden-${Date.now()}`, icon: '🥕', text: eventApplies ? 'Ganó el domingo de jardín con una cosecha preciosa.' : 'Cosechó el huerto de casa.', at: Date.now() }, ...current.memories].slice(0, 20)
    }));
    react('¡Cosecha lista!', 'jump');
  };

  const claimQuest = (id) => {
    setPet((current) => ({
      ...current,
      quests: { ...current.quests, claimed: [...current.quests.claimed, id] },
      happiness: clampNeed(current.happiness + 8),
      memories: [{ id: `quest-${Date.now()}`, icon: '🏆', text: 'Reclamó una misión del hogar.', at: Date.now() }, ...current.memories].slice(0, 20)
    }));
  };

  const claimDailyWant = (want) => {
    if (!want.done || want.claimed) return;
    setPet((current) => {
      const sameDay = current.dailyWants.date === want.dateKey;
      return {
        ...current,
        dailyWants: {
          date: want.dateKey,
          claimed: [...new Set([...(sameDay ? current.dailyWants.claimed : []), want.id])]
        },
        stats: { ...current.stats, wantsCompleted: current.stats.wantsCompleted + 1 },
        happiness: clampNeed(current.happiness + want.reward),
        memories: [{ id: `want-${Date.now()}`, icon: want.icon, text: `Deseo cumplido: ${want.label}.`, at: Date.now() }, ...current.memories].slice(0, 20)
      };
    });
    react(`Deseo cumplido: ${want.label}`, 'jump');
  };

  const chooseAspiration = (id) => {
    setPet((current) => ({
      ...current,
      aspiration: { id, claimed: current.aspiration.id === id ? current.aspiration.claimed : [] },
      memories: current.aspiration.id === id
        ? current.memories
        : [{ id: `aspiration-${Date.now()}`, icon: '🌟', text: `Nueva aspiración: ${ASPIRATIONS.find((aspiration) => aspiration.id === id)?.title}.`, at: Date.now() }, ...current.memories].slice(0, 20)
    }));
    react('Aspiración elegida.', 'jump');
  };

  const claimAspirationMilestone = (milestone) => {
    if (!milestone.done || milestone.claimed) return;
    setPet((current) => ({
      ...current,
      aspiration: { ...current.aspiration, claimed: [...new Set([...current.aspiration.claimed, milestone.id])] },
      stats: { ...current.stats, aspirationMilestones: current.stats.aspirationMilestones + 1 },
      happiness: clampNeed(current.happiness + 12),
      collections: milestone.id === 'objects8' && !current.collections.includes('Placa de diseño')
        ? [...current.collections, 'Placa de diseño']
        : milestone.id === 'allplaces' && !current.collections.includes('Mapa del barrio')
          ? [...current.collections, 'Mapa del barrio']
          : current.collections,
      memories: [{ id: `aspiration-${Date.now()}`, icon: selectedAspiration.icon, text: `Aspiración: ${milestone.label}.`, at: Date.now() }, ...current.memories].slice(0, 20)
    }));
    react('¡Meta de aspiración completada!', 'jump');
  };

  const joinCalendarEvent = () => {
    if (activeCalendarEvent.activity === 'work') startActivity(AWAY_ACTIVITIES.find((activity) => activity.id === 'work'));
    else if (activeCalendarEvent.activity === 'school') startActivity(AWAY_ACTIVITIES.find((activity) => activity.id === 'school'));
    else if (activeCalendarEvent.activity === 'social') setFullscreenSection('social');
    else if (activeCalendarEvent.activity === 'build') setView('build');
    else if (activeCalendarEvent.activity === 'garden') setFullscreenSection('mundo');
    else startActivity(AWAY_ACTIVITIES.find((activity) => activity.id === 'park'));
  };

  const resolveDramaChoice = (choice) => {
    if (!dramaEvent) return;
    setPet((current) => {
      const nextSkills = { ...current.skills };
      if (choice.skill) nextSkills[choice.skill] = (nextSkills[choice.skill] || 0) + 1;
      const nextCollections = choice.collectible && !current.collections.includes(choice.collectible)
        ? [...current.collections, choice.collectible]
        : current.collections;
      return {
        ...current,
        happiness: clampNeed(current.happiness + (choice.mood || 0)),
        energy: clampNeed(current.energy + (choice.energy || 0)),
        skills: nextSkills,
        collections: nextCollections,
        relationships: dramaEvent.friend
          ? { ...current.relationships, [dramaEvent.friend]: Math.min(100, current.relationships[dramaEvent.friend] + (choice.social || 0)) }
          : current.relationships,
        memories: [{ id: `drama-${Date.now()}`, icon: dramaEvent.icon, text: choice.memory, at: Date.now() }, ...current.memories].slice(0, 20)
      };
    });
    setDramaEvent(null);
    react(choice.memory, 'jump');
  };

  const claimWelcomeBack = () => {
    setPet((current) => ({
      ...current,
      hunger: Math.max(current.hunger, 72),
      energy: Math.max(current.energy, 72),
      hygiene: Math.max(current.hygiene, 65),
      happiness: Math.max(current.happiness, 80)
    }));
    setWelcomeBack(false);
    react('¡Qué bueno que volviste!', 'jump');
  };

  const finishOnboarding = () => {
    localStorage.setItem(SIM_ONBOARDING_KEY, 'done');
    setSaveSlots(loadSaveSlots().map((slot) => (
      slot.id === activeSlotId ? { ...slot, isNew: false } : slot
    )));
    setPet((current) => ({
      ...current,
      name: current.name.trim() || 'Salchi',
      happiness: Math.max(current.happiness, 88),
      energy: Math.max(current.energy, 82)
    }));
    setOnboardingOpen(false);
    setWelcomeBack(false);
    react('¡Bienvenido al vecindario!', 'jump');
  };

  const needLevel = Math.round((pet.hunger + pet.energy + pet.hygiene + pet.happiness) / 4);
  const needData = [
    { key: 'hunger', icon: '🍗', label: 'Comida', value: pet.hunger, color: '#ffb15c' },
    { key: 'energy', icon: '⚡', label: 'Energía', value: pet.energy, color: '#c7a7ff' },
    { key: 'hygiene', icon: '🫧', label: 'Higiene', value: pet.hygiene, color: '#65c7f7' },
    { key: 'happiness', icon: '💗', label: 'Felicidad', value: pet.happiness, color: '#ff758f' }
  ];
  const skillData = [
    { key: 'inteligencia', icon: '🧠', label: 'Inteligencia', value: pet.skills.inteligencia, color: '#65c7f7' },
    { key: 'social', icon: '🤝', label: 'Social', value: pet.skills.social, color: '#65d6a6' },
    { key: 'cocina', icon: '🍳', label: 'Cocina', value: pet.skills.cocina, color: '#ffb15c' }
  ];
  const progressData = [
    { key: 'work', icon: '💼', label: 'Trabajo', level: pet.progress.careerLevel, value: pet.progress.careerXP, color: '#ffd36e' },
    { key: 'school', icon: '🎓', label: 'Escuela', level: pet.progress.schoolLevel, value: pet.progress.schoolXP, color: '#c7a7ff' }
  ];

  return (
    <GameShell title="Mi Vida Salchicha" kicker="Simulador de vida perruna" onBack={onBack} score="🍪 ∞">
      <div className="sim-tabs">
        <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>🏠 Hogar</button>
        <button className={view === 'build' ? 'active' : ''} onClick={() => setView('build')}>🔨 Construir</button>
        <button className={view === 'life' ? 'active' : ''} onClick={() => setView('life')}>📋 Vida</button>
        <button className={view === 'shop' ? 'active' : ''} onClick={() => setView('shop')}>🛍️ Tienda</button>
      </div>

      {slotPickerOpen && (
        <div className="sim-overlay sim-save-overlay">
          <div className="sim-save-picker">
            <header>
              <div><span>🏘️</span><div><small>TUS MUNDOS</small><h3>Elige una partida</h3></div></div>
              <button onClick={onBack} aria-label="Cerrar selector de partidas">×</button>
            </header>
            <p>Cada partida conserva su propio perro, casa, familia, historia y progreso.</p>
            <div className="sim-save-slot-list">
              {saveSlots.map((slot) => {
                const slotState = slot.id === activeSlotId ? pet : slot.state;
                return <article className={slot.id === activeSlotId ? 'active' : ''} key={slot.id}>
                  <span className="sim-save-dog">🐕</span>
                  <div>
                    <input aria-label={`Nombre de ${slot.name}`} value={slot.name} onChange={(event) => renameSaveSlot(slot.id, event.target.value)} />
                    <strong>{slotState?.name || 'Salchi'} · Día {slotState?.clock?.day || 1}</strong>
                    <small>🏠 {(slotState?.layout || []).length} objetos · Generación {slotState?.legacy?.generation || 1}</small>
                    <small>Guardada {new Date(slot.updatedAt || slot.createdAt || SIM_DEFAULTS.updatedAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}</small>
                  </div>
                  <div className="sim-save-slot-actions">
                    <button className="primary" onClick={() => openSaveSlot(slot)}>{slot.isNew ? 'Crear perro' : slot.id === activeSlotId ? 'Continuar' : 'Abrir'}</button>
                    {saveSlots.length > 1 && (
                      <button className={pendingDeleteSlotId === slot.id ? 'confirm-delete' : ''} onClick={() => deleteSaveSlot(slot.id)}>
                        {pendingDeleteSlotId === slot.id ? 'Confirmar' : 'Borrar'}
                      </button>
                    )}
                  </div>
                </article>;
              })}
            </div>
            <button className="sim-new-save-btn" onClick={createSaveSlot}>＋ Crear una partida nueva</button>
          </div>
        </div>
      )}

      {welcomeBack && !slotPickerOpen && (
        <div className="sim-overlay">
          <div className="sim-event-card welcome">
            <span>🏡</span>
            <small>EL VECINDARIO TE EXTRAÑABA</small>
            <h3>¡Bienvenido de vuelta!</h3>
            <p>Nada malo ocurrió mientras estabas fuera. La casa y tus recuerdos siguen aquí, y {pet.name} conservó sus necesidades básicas.</p>
            <button onClick={claimWelcomeBack}>Entrar con energía renovada</button>
          </div>
        </div>
      )}

      {onboardingOpen && !slotPickerOpen && (
        <div className="sim-overlay">
          <div className="sim-onboarding-card">
            <span>🐕</span>
            <small>PRIMER DÍA EN EL VECINDARIO</small>
            <h3>Crea tu perro salchicha</h3>
            <p>Antes de entrar, elige su nombre y estilo. Después puedes cambiar ropa, colores y casa desde el menú ☰.</p>
            <label className="onboarding-name-field">
              Nombre
              <input
                maxLength="14"
                value={pet.name}
                onChange={(event) => setPet((current) => ({ ...current, name: event.target.value }))}
                placeholder="Salchi"
              />
            </label>
            <strong>Color de pelaje</strong>
            <div className="onboarding-color-row">
              {['#a96338', '#5c392a', '#d8ad79', '#242126', '#d9c4a4', '#f4e5cc'].map((color) => (
                <button
                  aria-label={`Elegir pelaje ${color}`}
                  className={pet.colors.dog === color ? 'active' : ''}
                  key={color}
                  onClick={() => setPet((current) => ({ ...current, colors: { ...current.colors, dog: color } }))}
                  style={{ '--swatch': color }}
                />
              ))}
              <input aria-label="Color personalizado" type="color" value={pet.colors.dog} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, dog: event.target.value } }))} />
            </div>
            <strong>Estilo</strong>
            <div className="onboarding-choice-row">
              {['solid', 'dapple', 'piebald'].map((pattern) => (
                <button className={pet.appearance.pattern === pattern ? 'active' : ''} key={pattern} onClick={() => setPet((current) => ({ ...current, appearance: { ...current.appearance, pattern } }))}>
                  {pattern === 'solid' ? 'Liso' : pattern === 'dapple' ? 'Manchado' : 'Pío'}
                </button>
              ))}
            </div>
            <strong>Aspiración inicial</strong>
            <div className="onboarding-aspiration-grid">
              {ASPIRATIONS.map((aspiration) => (
                <button className={pet.aspiration.id === aspiration.id ? 'active' : ''} key={aspiration.id} onClick={() => chooseAspiration(aspiration.id)}>
                  <span>{aspiration.icon}</span><b>{aspiration.title}</b><small>{aspiration.description}</small>
                </button>
              ))}
            </div>
            <div className="onboarding-tutorial">
              <div><b>1</b><span>Toca el suelo para mover a tu perro.</span></div>
              <div><b>2</b><span>Toca al perro para abrir acciones, estado y progreso.</span></div>
              <div><b>3</b><span>Usa ☰ para construir, viajar, vestirlo y cambiar colores.</span></div>
              <div><b>4</b><span>En la planta 2, construye primero baldosas y coloca una escalera desde la planta 1.</span></div>
            </div>
            <button className="onboarding-start-btn" onClick={finishOnboarding}>Entrar al juego</button>
          </div>
        </div>
      )}

      {storyEvent && (
        <div className="sim-overlay">
          <div className="sim-event-card">
            <button className="sim-event-close" onClick={() => setStoryEvent(null)} aria-label="Cerrar historia">×</button>
            <span>{storyEvent.icon}</span>
            <small>HISTORIA DEL VECINDARIO</small>
            <h3>{storyEvent.title}</h3>
            <p>{storyEvent.text}</p>
            <div>
              {storyEvent.choices.map((choice) => (
                <button key={choice.label} onClick={() => resolveStoryChoice(choice)}>{choice.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {dramaEvent && (
        <div className="sim-overlay">
          <div className="sim-event-card">
            <button className="sim-event-close" onClick={() => setDramaEvent(null)} aria-label="Cerrar evento">×</button>
            <span>{dramaEvent.icon}</span>
            <small>DRAMA DEL VECINDARIO</small>
            <h3>{dramaEvent.title}</h3>
            <p>{dramaEvent.text}</p>
            <div>
              {dramaEvent.choices.map((choice) => (
                <button key={choice.label} onClick={() => resolveDramaChoice(choice)}>{choice.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {venueOpen && venueGame && pet.activity && (
        <div className="sim-overlay">
          <div className="sim-venue-card">
            <button className="sim-venue-close" onClick={() => setVenueOpen(false)} aria-label="Cerrar actividad">×</button>
            <span>{venueGame.activity.icon}</span>
            <small>ACOMPAÑAR A {pet.name.toUpperCase()}</small>
            <h3>{venueGame.activity.subtitle}</h3>
            <p>Completa al menos dos acciones. Puedes cerrar esta vista y volver cuando quieras.</p>
            <div className="sim-venue-progress">
              <i><b style={{ width: `${(venueGame.completed.length / 2) * 100}%` }} /></i>
              <strong>{Math.min(2, venueGame.completed.length)}/2</strong>
            </div>
            <div className="sim-venue-tasks">
              {(VENUE_TASKS[venueGame.activity.id] || []).map((task, index) => (
                <button
                  className={venueGame.completed.includes(index) ? 'done' : ''}
                  disabled={venueGame.completed.includes(index)}
                  key={task.label}
                  onClick={() => performVenueTask(task, index)}
                >
                  <span>{venueGame.completed.includes(index) ? '✅' : task.icon}</span>
                  <strong>{task.label}</strong>
                  <small>{task.collectible ? 'Puede revelar un objeto especial' : 'Mejora habilidades y recuerdos'}</small>
                </button>
              ))}
            </div>
            <button className="sim-venue-finish" disabled={venueGame.completed.length < 2} onClick={finishActivity}>
              Volver a casa
            </button>
          </div>
        </div>
      )}

      {view === 'home' || view === 'build' ? (
        <>
          <div className={`sim-3d-stage ${fullscreen ? 'is-fullscreen' : ''} ${screenMode === 'landscape' ? 'force-landscape' : ''}`}>
            <Suspense fallback={<div className="sim-3d-loading">Construyendo tu casa 3D…</div>}>
              <DachshundHouse3D
                layout={pet.layout || SIM_DEFAULTS.layout}
                room={pet.room}
                outfit={pet.outfit}
              colors={pet.colors}
              appearance={pet.appearance}
              world={{ ...pet.world, simHour }}
              garden={pet.garden}
              vehicle={pet.vehicle}
              animation={animation}
              away={Boolean(pet.activity)}
              departing={Boolean(departureActivity)}
              carAway={Boolean(pet.activity)}
              buildMode={view === 'build'}
                activeFloor={activeFloor}
                selectedTool={buildTool}
                rotation={buildRotation}
                placementColor={buildColor}
              onLayoutChange={commitLayout}
              onInteract={useFurniture}
              onDogClick={() => setDogMenu((value) => !value)}
              autonomous={view === 'home' && !dogMenu}
              landscapeMode={screenMode === 'landscape'}
              resetCameraKey={cameraResetKey}
              dogFloor={dogFloor}
              onBuildFeedback={(message) => react(message, 'shake')}
            />
            </Suspense>
            <button
              className="sim-fullscreen-btn"
              onClick={() => {
                setFullscreen((value) => !value);
                setFullscreenMenuOpen(false);
              }}
            >
              {fullscreen ? '✕ Salir' : '⛶ Ampliar'}
            </button>
            {fullscreen && (
              <>
                <button
                  className={`sim-burger-btn ${fullscreenMenuOpen ? 'open' : ''}`}
                  onClick={() => setFullscreenMenuOpen((value) => !value)}
                  aria-label={fullscreenMenuOpen ? 'Cerrar menú completo' : 'Abrir menú completo'}
                >
                  {fullscreenMenuOpen ? '×' : '☰'}
                </button>
                {fullscreenMenuOpen && (
                  <aside className="sim-fullscreen-drawer">
                    <header>
                      <div><small>MI VIDA SALCHICHA · {activeSaveSlot?.name}</small><strong>Todo el juego</strong></div>
                      <div className="drawer-header-actions">
                        <span>🍪 ∞</span>
                        <button
                          onClick={() => {
                            setFullscreen(false);
                            setFullscreenMenuOpen(false);
                            onBack();
                          }}
                        >
                          ↩ Salir del juego
                        </button>
                      </div>
                    </header>
                    <nav>
                      {[
                        ['inicio', '🏠', 'Inicio'],
                        ['partidas', '💾', 'Partidas'],
                        ['progreso', '🌟', 'Progreso'],
                        ['construir', '🔨', 'Construir'],
                        ['viajar', '🚗', 'Viajar'],
                        ['mundo', '🌤️', 'Mundo'],
                        ['personaje', '🐕', 'Personaje'],
                        ['armario', '👗', 'Armario'],
                        ['social', '🏘️', 'Vecinos'],
                        ['historias', '📖', 'Historias'],
                        ['tutorial', '❔', 'Tutorial'],
                        ['tienda', '🛍️', 'Tienda']
                      ].map(([section, icon, label]) => (
                        <button className={fullscreenSection === section ? 'active' : ''} key={section} onClick={() => setFullscreenSection(section)}>
                          <span>{icon}</span><small>{label}</small>
                        </button>
                      ))}
                    </nav>
                    <div className="sim-fullscreen-drawer-content">
                      {fullscreenSection === 'inicio' && (
                        <section>
                          <h3>🏠 Hogar y cuidados</h3>
                          <div className="drawer-sim-clock">
                            <span>🗓️ Día {pet.clock.day} · {simDayName}</span>
                            <strong>{formatSimTime(pet.clock.minute)}</strong>
                            <div>
                              <button className={pet.clock.paused ? 'active' : ''} onClick={() => setClockSpeed(0)}>Ⅱ</button>
                              {[1, 2, 3].map((speed) => <button className={!pet.clock.paused && pet.clock.speed === speed ? 'active' : ''} key={speed} onClick={() => setClockSpeed(speed)}>×{speed}</button>)}
                            </div>
                          </div>
                          {criticalNeed && <p className="drawer-warning">⚠️ Una necesidad está crítica. El ánimo y el rendimiento bajarán hasta que la atiendas.</p>}
                          <div className="drawer-house-score">
                            <span>Valor del hogar</span>
                            <strong>{houseScore.total}</strong>
                            <small>{houseScore.rank}</small>
                          </div>
                          <div className="drawer-primary-actions">
                            <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>🏠 Vivir</button>
                            <button className={view === 'build' ? 'active' : ''} onClick={() => setView('build')}>🔨 Construir</button>
                            <button onClick={() => setDogMenu((value) => !value)}>🐕 Acciones del perro</button>
                            <button className={screenMode === 'landscape' ? 'active' : ''} onClick={toggleScreenMode}>
                              {screenMode === 'landscape' ? '↕ Vista automática' : '↔ Vista horizontal'}
                            </button>
                          </div>
                          <p>{screenMode === 'landscape' ? 'Modo horizontal activo: si tu teléfono está vertical, el juego se gira dentro de la pantalla.' : 'Puedes rotar el teléfono o activar la vista horizontal desde aquí.'}</p>
                          <div className="drawer-needs">
                            {needData.map((need) => (
                              <span key={need.key}><b>{need.icon}</b><i><em style={{ width: `${need.value}%`, background: need.color }} /></i><small>{Math.round(need.value)}</small></span>
                            ))}
                          </div>
                          <div className="drawer-care-grid">
                            <button onClick={() => care('feed')}>🍗<small>Comer</small></button>
                            <button onClick={() => care('play')}>🎾<small>Jugar</small></button>
                            <button onClick={() => care('bath')}>🛁<small>Bañarse</small></button>
                            <button onClick={() => care('sleep')}>🌙<small>Dormir</small></button>
                            <button onClick={() => care('walk')}>🦮<small>Pasear</small></button>
                          </div>
                          <div className="drawer-autonomy-card">
                            <div><strong>🧠 Libre albedrío</strong><small>{pet.autonomy.lastAction}</small></div>
                            <button
                              className={pet.autonomy.enabled ? 'active' : ''}
                              onClick={() => setPet((current) => ({ ...current, autonomy: { ...current.autonomy, enabled: !current.autonomy.enabled } }))}
                            >{pet.autonomy.enabled ? 'Activado' : 'Desactivado'}</button>
                          </div>
                        </section>
                      )}

                      {fullscreenSection === 'partidas' && (
                        <section>
                          <h3>💾 Partidas guardadas</h3>
                          <p>Puedes cambiar de mundo sin perder el estado de esta partida.</p>
                          <div className="drawer-save-list">
                            {saveSlots.map((slot) => {
                              const slotState = slot.id === activeSlotId ? pet : slot.state;
                              return <article className={slot.id === activeSlotId ? 'active' : ''} key={slot.id}>
                                <div>
                                  <input aria-label={`Renombrar ${slot.name}`} value={slot.name} onChange={(event) => renameSaveSlot(slot.id, event.target.value)} />
                                  <small>{slotState?.name || 'Salchi'} · Día {slotState?.clock?.day || 1} · {(slotState?.layout || []).length} objetos</small>
                                </div>
                                <button onClick={() => openSaveSlot(slot)}>{slot.id === activeSlotId ? 'Activa' : 'Abrir'}</button>
                                {saveSlots.length > 1 && (
                                  <button className={pendingDeleteSlotId === slot.id ? 'confirm-delete' : ''} onClick={() => deleteSaveSlot(slot.id)}>
                                    {pendingDeleteSlotId === slot.id ? 'Confirmar borrado' : 'Borrar'}
                                  </button>
                                )}
                              </article>;
                            })}
                          </div>
                          <div className="drawer-primary-actions">
                            <button onClick={createSaveSlot}>＋ Nueva partida</button>
                            <button onClick={() => setSlotPickerOpen(true)}>🏘️ Abrir selector grande</button>
                          </div>
                        </section>
                      )}

                      {fullscreenSection === 'progreso' && (
                        <section>
                          <h3>🌟 Progreso con sentido</h3>
                          <strong>Carrera</strong>
                          <div className="drawer-career-card">
                            <span>{currentCareer.icon}</span>
                            <div><b>{careerTitle}</b><small>{currentCareer.title} · Nivel {pet.progress.careerLevel}</small><i><em style={{ width: `${pet.progress.careerPerformance}%` }} /></i></div>
                          </div>
                          <div className="drawer-choice-row">
                            {CAREER_TRACKS.map((track) => (
                              <button className={pet.progress.careerTrack === track.id ? 'active' : ''} key={track.id} onClick={() => setPet((current) => ({ ...current, progress: { ...current.progress, careerTrack: track.id } }))}>{track.icon} {track.title}</button>
                            ))}
                          </div>
                          <strong>Escuela</strong>
                          <div className="drawer-career-card">
                            <span>🎓</span>
                            <div><b>{schoolTitle}</b><small>Rendimiento {Math.round(pet.progress.schoolPerformance)} · Deberes {Math.round(pet.progress.homework)}%</small><i><em style={{ width: `${pet.progress.homework}%` }} /></i></div>
                            <button onClick={doHomework}>Hacer deberes</button>
                          </div>
                          <strong>Aspiración</strong>
                          <div className="drawer-aspiration-card">
                            <span>{selectedAspiration.icon}</span>
                            <div><b>{selectedAspiration.title}</b><small>{selectedAspiration.description}</small></div>
                          </div>
                          <div className="drawer-choice-row">
                            {ASPIRATIONS.map((aspiration) => (
                              <button className={pet.aspiration.id === aspiration.id ? 'active' : ''} key={aspiration.id} onClick={() => chooseAspiration(aspiration.id)}>
                                {aspiration.icon} {aspiration.title}
                              </button>
                            ))}
                          </div>
                          <div className="drawer-progress-list">
                            {aspirationMilestones.map((milestone) => (
                              <button disabled={!milestone.done || milestone.claimed} key={milestone.id} onClick={() => claimAspirationMilestone(milestone)}>
                                <span>{milestone.claimed ? '✅' : milestone.done ? '🎁' : '◻️'}</span>
                                <div><strong>{milestone.label}</strong><small>{milestone.reward}</small></div>
                              </button>
                            ))}
                          </div>
                          <strong>Deseos de hoy</strong>
                          <div className="drawer-progress-list">
                            {dailyWantItems.map((want) => (
                              <button disabled={!want.done || want.claimed} key={want.id} onClick={() => claimDailyWant(want)}>
                                <span>{want.claimed ? '✅' : want.icon}</span>
                                <div><strong>{want.label}</strong><small>{want.done ? `Reclamar +${want.reward}` : 'Pendiente'}</small></div>
                              </button>
                            ))}
                          </div>
                          <strong>Desbloqueos por habilidad</strong>
                          <div className="drawer-unlock-list">
                            {SKILL_UNLOCKS.map((unlock) => {
                              const unlocked = (pet.skills[unlock.skill] || 0) >= unlock.level;
                              return <span className={unlocked ? 'unlocked' : ''} key={unlock.id}>{unlocked ? '✅' : '🔒'} {unlock.icon} {unlock.label}<small>{unlock.skill} nivel {unlock.level}</small></span>;
                            })}
                          </div>
                        </section>
                      )}

                      {fullscreenSection === 'construir' && (
                        <section>
                          <h3>🔨 Construcción completa</h3>
                          <p>En el piso 2, coloca primero baldosas. Sin suelo debajo no podrás poner ni mover muebles. Las escaleras se construyen desde el piso 1.</p>
                          <div className="drawer-primary-actions">
                            <button className={view === 'build' ? 'active' : ''} onClick={() => setView('build')}>Activar construcción</button>
                            <button onClick={undoBuild} disabled={!buildHistory.past.length}>↶ Deshacer</button>
                            <button onClick={redoBuild} disabled={!buildHistory.future.length}>↷ Rehacer</button>
                            <button onClick={saveHouseLayout}>💾 Guardar diseño</button>
                            <button onClick={() => setCameraResetKey((value) => value + 1)}>🎥 Centrar cámara</button>
                          </div>
                          <div className="drawer-choice-row">
                            <button className={activeFloor === 0 ? 'active' : ''} onClick={() => setActiveFloor(0)}>Piso 1</button>
                            <button className={activeFloor === 1 ? 'active' : ''} onClick={() => setActiveFloor(1)}>Piso 2</button>
                            <button className={buildTool === 'move' ? 'active' : ''} onClick={() => setBuildTool('move')}>✋ Mover</button>
                            <button className={buildTool === 'rotate' ? 'active' : ''} onClick={() => setBuildTool('rotate')}>↻ Girar</button>
                            <button className={buildTool === 'resize' ? 'active' : ''} onClick={() => setBuildTool('resize')}>↔️ Tamaño</button>
                            <button className={buildTool === 'duplicate' ? 'active' : ''} onClick={() => setBuildTool('duplicate')}>⧉ Duplicar</button>
                          </div>
                          {pet.savedLayouts.length > 0 && (
                            <div className="drawer-list">
                              <strong>Diseños guardados</strong>
                              {pet.savedLayouts.map((savedLayout) => (
                                <button key={savedLayout.id} onClick={() => loadHouseLayout(savedLayout)}>🏠 {savedLayout.name}</button>
                              ))}
                            </div>
                          )}
                        </section>
                      )}

                      {fullscreenSection === 'viajar' && (
                        <section>
                          <h3>🚗 Salir y acompañar</h3>
                          <p>Trabajo, estudios y lugares visitables sin abandonar la vista completa.</p>
                          {pet.activity ? (
                            <div className="drawer-away-active">
                              <span>{pet.activity.icon}</span>
                              <div><strong>{pet.activity.title}</strong><small>{pet.activity.subtitle}</small></div>
                              {now >= pet.activity.endsAt
                                ? <button onClick={finishActivity}>Volver a casa</button>
                                : <button onClick={openVenue}>🎮 Acompañar</button>}
                            </div>
                          ) : departureActivity ? (
                            <div className="drawer-away-active"><span>🚗</span><strong>Saliendo del garaje…</strong></div>
                          ) : (
                            <div className="drawer-travel-list">
                              {AWAY_ACTIVITIES.map((activity) => (
                                <button key={activity.id} onClick={() => startActivity(activity)}>
                                  <span>{activity.icon}</span><div><strong>{activity.title}</strong><small>{activity.subtitle}</small></div><b>+{activity.reward} 🍪</b>
                                </button>
                              ))}
                            </div>
                          )}
                        </section>
                      )}

                      {fullscreenSection === 'mundo' && (
                        <section>
                          <h3>🌤️ Mundo y jardín</h3>
                          <div className="drawer-sim-clock">
                            <span>🗓️ Día {pet.clock.day} · {simDayName}</span>
                            <strong>{formatSimTime(pet.clock.minute)}</strong>
                            <div>
                              <button className={pet.clock.paused ? 'active' : ''} onClick={() => setClockSpeed(0)}>Pausa</button>
                              {[1, 2, 3].map((speed) => <button className={!pet.clock.paused && pet.clock.speed === speed ? 'active' : ''} key={speed} onClick={() => setClockSpeed(speed)}>×{speed}</button>)}
                            </div>
                          </div>
                          <div className="drawer-calendar-card">
                            <span>{activeCalendarEvent.icon}</span>
                            <div><strong>{activeCalendarEvent.title}</strong><small>{activeCalendarEvent.description}</small></div>
                            <button onClick={joinCalendarEvent}>Ir</button>
                          </div>
                          <strong>Hora</strong>
                          <div className="drawer-choice-row">
                            {['auto', 'day', 'night'].map((time) => (
                              <button className={pet.world.time === time ? 'active' : ''} key={time} onClick={() => setPet((current) => ({ ...current, world: { ...current.world, time } }))}>
                                {time === 'auto' ? 'Automático' : time === 'day' ? 'Día' : 'Noche'}
                              </button>
                            ))}
                          </div>
                          <strong>Clima</strong>
                          <div className="drawer-choice-row">
                            {['sunny', 'rain', 'snow'].map((weather) => (
                              <button className={pet.world.weather === weather ? 'active' : ''} key={weather} onClick={() => setPet((current) => ({ ...current, world: { ...current.world, weather } }))}>
                                {weather === 'sunny' ? '☀️ Sol' : weather === 'rain' ? '🌧️ Lluvia' : '❄️ Nieve'}
                              </button>
                            ))}
                          </div>
                          <strong>Huerto</strong>
                          <p>{!pet.garden.plantedAt ? 'La tierra está lista.' : pet.garden.watered && now - pet.garden.plantedAt >= 60000 ? '¡La cosecha está lista!' : pet.garden.watered ? 'Está creciendo…' : 'Necesita agua.'}</p>
                          <div className="drawer-choice-row">
                            {!pet.garden.plantedAt && <button onClick={plantGarden}>🌱 Plantar</button>}
                            {pet.garden.plantedAt && !pet.garden.watered && <button onClick={waterGarden}>💧 Regar</button>}
                            {pet.garden.plantedAt && pet.garden.watered && <button disabled={now - pet.garden.plantedAt < 60000} onClick={harvestGarden}>🥕 Cosechar</button>}
                          </div>
                        </section>
                      )}

                      {fullscreenSection === 'personaje' && (
                        <section>
                          <h3>🐕 Personaje</h3>
                          <label className="drawer-range">Tamaño <input type="range" min=".75" max="1.3" step=".05" value={pet.appearance.size} onChange={(event) => setPet((current) => ({ ...current, appearance: { ...current.appearance, size: Number(event.target.value) } }))} /></label>
                          <div className="drawer-choice-row">
                            {['solid', 'dapple', 'piebald'].map((pattern) => <button className={pet.appearance.pattern === pattern ? 'active' : ''} key={pattern} onClick={() => setPet((current) => ({ ...current, appearance: { ...current.appearance, pattern } }))}>{pattern === 'solid' ? 'Liso' : pattern === 'dapple' ? 'Manchado' : 'Pío'}</button>)}
                          </div>
                          <div className="drawer-traits">
                            {PERSONALITY_TRAITS.map((trait) => (
                              <button className={pet.traits.includes(trait.id) ? 'active' : ''} key={trait.id} onClick={() => toggleTrait(trait.id)}>
                                <span>{trait.icon}</span><strong>{trait.label}</strong><small>{trait.bonus}</small>
                              </button>
                            ))}
                          </div>
                          <p>La ropa, el pelaje y los colores ahora están organizados en el Armario.</p>
                        </section>
                      )}

                      {fullscreenSection === 'armario' && (
                        <section>
                          <h3>👗 Armario y personalización</h3>
                          <label className="drawer-name-field">
                            Nombre
                            <input
                              value={pet.name}
                              maxLength="14"
                              onChange={(event) => setPet((current) => ({ ...current, name: event.target.value || 'Salchi' }))}
                            />
                          </label>
                          <label className="drawer-range">Tamaño <input type="range" min=".75" max="1.3" step=".05" value={pet.appearance.size} onChange={(event) => setPet((current) => ({ ...current, appearance: { ...current.appearance, size: Number(event.target.value) } }))} /></label>
                          <strong>Pelaje</strong>
                          <div className="drawer-color-swatches">
                            {['#a96338', '#5c392a', '#d8ad79', '#242126', '#d9c4a4', '#f4e5cc'].map((color) => (
                              <button
                                aria-label={`Pelaje ${color}`}
                                className={pet.colors.dog === color ? 'active' : ''}
                                key={color}
                                onClick={() => setPet((current) => ({ ...current, colors: { ...current.colors, dog: color } }))}
                                style={{ '--swatch': color }}
                              />
                            ))}
                            <input aria-label="Color de pelaje personalizado" type="color" value={pet.colors.dog} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, dog: event.target.value } }))} />
                          </div>
                          <strong>Patrón</strong>
                          <div className="drawer-choice-row">
                            {['solid', 'dapple', 'piebald'].map((pattern) => (
                              <button className={pet.appearance.pattern === pattern ? 'active' : ''} key={pattern} onClick={() => setPet((current) => ({ ...current, appearance: { ...current.appearance, pattern } }))}>
                                {pattern === 'solid' ? 'Liso' : pattern === 'dapple' ? 'Manchado' : 'Pío'}
                              </button>
                            ))}
                          </div>
                          <strong>Orejas</strong>
                          <div className="drawer-choice-row">
                            {['classic', 'floppy', 'tiny'].map((ears) => (
                              <button className={pet.appearance.ears === ears ? 'active' : ''} key={ears} onClick={() => setPet((current) => ({ ...current, appearance: { ...current.appearance, ears } }))}>
                                {ears === 'classic' ? 'Clásicas' : ears === 'floppy' ? 'Caídas' : 'Pequeñas'}
                              </button>
                            ))}
                          </div>
                          <strong>Ropa</strong>
                          <div className="drawer-shop-grid drawer-wardrobe-grid">
                            {[
                              { id: 'outfit-none', icon: '🐕', name: 'Sin accesorios', type: 'outfit' },
                              ...SIM_SHOP.filter((item) => item.type === 'outfit')
                            ].map((item) => (
                              <button className={pet.outfit === item.id ? 'selected' : ''} key={item.id} onClick={() => item.id === 'outfit-none' ? setPet((current) => ({ ...current, outfit: item.id })) : buy(item)}>
                                <span>{item.icon}</span><small>{item.name}</small><b>{pet.outfit === item.id ? 'En uso' : hasOwned(item.id) ? 'Usar' : 'Gratis'}</b>
                              </button>
                            ))}
                          </div>
                          <strong>Vehículo</strong>
                          <div className="drawer-shop-grid">
                            {SIM_SHOP.filter((item) => item.type === 'vehicle').map((item) => (
                              <button className={pet.vehicle === item.vehicle ? 'selected' : ''} key={item.id} onClick={() => buy(item)}>
                                <span>{item.icon}</span><small>{item.name}</small><b>{pet.vehicle === item.vehicle ? 'En uso' : 'Usar'}</b>
                              </button>
                            ))}
                          </div>
                        </section>
                      )}

                      {fullscreenSection === 'social' && (
                        <section>
                          <h3>🏘️ Vecinos y relaciones</h3>
                          <div className="drawer-neighbor-list">
                            {Object.entries(pet.relationships).map(([name, friendship]) => (
                              <div key={name}>
                                <button className={selectedNeighbor === name ? 'active' : ''} onClick={() => setSelectedNeighbor(selectedNeighbor === name ? null : name)}>
                                  <span>🐶</span><strong>{name}</strong><small>{friendship}/100</small>
                                </button>
                                {selectedNeighbor === name && (
                                  <div>
                                    <button onClick={() => interactNeighbor(name, 'chat')}>💬</button>
                                    <button onClick={() => interactNeighbor(name, 'play')}>🎾</button>
                                    <button onClick={() => interactNeighbor(name, 'gift')}>🎁</button>
                                    <button onClick={() => interactNeighbor(name, 'prank')}>😈</button>
                                    <button onClick={() => befriend(name)}>🏡</button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {fullscreenSection === 'historias' && (
                        <section>
                          <h3>📖 Historias, metas y legado</h3>
                          {pet.story.chapter < STORY_EVENTS.length && (
                            <button className="drawer-story-btn" onClick={() => setStoryEvent(STORY_EVENTS[pet.story.chapter])}>
                              {STORY_EVENTS[pet.story.chapter].icon} Continuar: {STORY_EVENTS[pet.story.chapter].title}
                            </button>
                          )}
                          <div className="sim-goal-create">
                            <input value={goalDraft} maxLength="55" onChange={(event) => setGoalDraft(event.target.value)} placeholder="Nueva meta personal…" />
                            <button onClick={addCustomGoal}>Añadir</button>
                          </div>
                          <div className="sim-custom-goals">
                            {pet.customGoals.map((goal) => <button className={goal.done ? 'done' : ''} key={goal.id} onClick={() => toggleCustomGoal(goal.id)}>{goal.done ? '✅' : '◻️'} {goal.text}</button>)}
                          </div>
                          <strong>Colecciones · {pet.collections.length}</strong>
                          <div className="drawer-collections">
                            {pet.collections.map((item) => <span key={item}>✨ {item}</span>)}
                          </div>
                          <button className="drawer-story-btn" onClick={beginNewGeneration}>🌳 Nueva generación · actual {pet.legacy.generation}</button>
                        </section>
                      )}

                      {fullscreenSection === 'tutorial' && (
                        <section>
                          <h3>❔ Cómo jugar</h3>
                          <div className="drawer-tutorial-list">
                            <div><b>1</b><span><strong>Moverse</strong>Toca cualquier parte libre del terreno para que {pet.name} camine hasta allí.</span></div>
                            <div><b>2</b><span><strong>Necesidades</strong>Toca a {pet.name} para ver comida, energía, higiene, felicidad y acciones disponibles.</span></div>
                            <div><b>3</b><span><strong>Construir</strong>Elige un objeto y toca el terreno. Para el piso 2, coloca primero baldosas y una escalera en el piso 1.</span></div>
                            <div><b>4</b><span><strong>Mover y girar</strong>Con Mover, toca el objeto resaltado y luego su nuevo lugar. Con Girar, selecciónalo una vez y vuelve a tocarlo para girar.</span></div>
                            <div><b>5</b><span><strong>Cámara</strong>Arrastra para girar la vista y usa dos dedos para acercar. “Centrar cámara” recupera la vista inicial.</span></div>
                            <div><b>6</b><span><strong>Vida</strong>El reloj, trabajo, escuela, vecinos, aspiraciones y viajes están siempre disponibles desde ☰.</span></div>
                          </div>
                          <div className="drawer-primary-actions">
                            <button onClick={() => { setView('home'); setFullscreenMenuOpen(false); }}>🐕 Probar movimiento</button>
                            <button onClick={() => { setView('build'); setBuildTool('floorTile'); setFullscreenMenuOpen(false); }}>▦ Probar baldosas</button>
                            <button onClick={() => setCameraResetKey((value) => value + 1)}>🎥 Centrar cámara</button>
                          </div>
                        </section>
                      )}

                      {fullscreenSection === 'tienda' && (
                        <section>
                          <h3>🛍️ Tienda completa</h3>
                          <div className="drawer-color-row">
                            <label>🐕 <input type="color" value={pet.colors.dog} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, dog: event.target.value } }))} /></label>
                            <label>🧱 <input type="color" value={pet.colors.walls} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, walls: event.target.value } }))} /></label>
                            <label>🟫 <input type="color" value={pet.colors.floor} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, floor: event.target.value } }))} /></label>
                            <label>🚗 <input type="color" value={pet.colors.car} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, car: event.target.value } }))} /></label>
                          </div>
                          <div className="drawer-shop-grid">
                            {SIM_SHOP.map((item) => (
                              <button key={item.id} onClick={() => buy(item)}>
                                <span>{item.icon}</span><small>{item.name}</small><b>{hasOwned(item.id) ? '✓' : 'Gratis'}</b>
                              </button>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  </aside>
                )}
              </>
            )}
            {fullscreen && (
              <div className="sim-fullscreen-hud">
                <div className="fullscreen-clock-strip">
                  <span>{simHour >= 19 || simHour < 6 ? '🌙' : '☀️'} {simDayName} · {formatSimTime(pet.clock.minute)}</span>
                  <button className={pet.clock.paused ? 'active' : ''} onClick={() => setClockSpeed(0)}>Ⅱ</button>
                  {[1, 2, 3].map((speed) => <button className={!pet.clock.paused && pet.clock.speed === speed ? 'active' : ''} key={speed} onClick={() => setClockSpeed(speed)}>▶{speed}</button>)}
                </div>
                <div className="fullscreen-mode-tabs">
                  <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>🏠 Hogar</button>
                  <button className={view === 'build' ? 'active' : ''} onClick={() => setView('build')}>🔨 Construir</button>
                  <button className={screenMode === 'landscape' ? 'active' : ''} onClick={toggleScreenMode}>{screenMode === 'landscape' ? '↕ Auto' : '↔ Horizontal'}</button>
                  <button onClick={() => setCameraResetKey((value) => value + 1)}>🎥 Centrar</button>
                  {view === 'home' && !pet.activity && !departureActivity && <button onClick={() => setDogMenu((value) => !value)}>🐕 Acciones</button>}
                  {view === 'build' && <button className={buildTool === 'move' ? 'active' : ''} onClick={() => setBuildTool('move')}>✋ Mover objeto</button>}
                  {view === 'build' && <button className={buildTool === 'rotate' ? 'active' : ''} onClick={() => setBuildTool('rotate')}>↻ Girar objeto</button>}
                </div>
                {view === 'home' && (pet.activity || departureActivity) && (
                  <div className="fullscreen-away-status">
                    <span>{(pet.activity || departureActivity).icon}</span>
                    <div>
                      <strong>{departureActivity ? `${pet.name} está saliendo` : `${pet.name} está fuera`}</strong>
                      <small>{(pet.activity || departureActivity).subtitle}</small>
                    </div>
                    {departureActivity ? (
                      <b>🚗 Saliendo…</b>
                    ) : now >= pet.activity.endsAt ? (
                      <button onClick={finishActivity}>Recibir 🍪 {pet.activity.reward}</button>
                    ) : (
                      <button onClick={openVenue}>🎮 Acompañar</button>
                    )}
                  </div>
                )}
                {view === 'build' && (
                  <>
                    <div className="fullscreen-build-meta">
                      <button className={activeFloor === 0 ? 'active' : ''} onClick={() => setActiveFloor(0)}>Piso 1</button>
                      <button className={activeFloor === 1 ? 'active' : ''} onClick={() => setActiveFloor(1)}>Piso 2</button>
                      <span className="fullscreen-floor-rule">{activeFloor === 1 ? '▦ Se necesita baldosa debajo' : '🪜 Escaleras desde aquí'}</span>
                      <button disabled={!buildHistory.past.length} onClick={undoBuild}>↶ Deshacer</button>
                      <button disabled={!buildHistory.future.length} onClick={redoBuild}>↷ Rehacer</button>
                      <button onClick={saveHouseLayout}>💾 Guardar diseño</button>
                    </div>
                    <div className="fullscreen-tools-row">
                      <button className="fullscreen-tools-arrow" onClick={() => fullscreenToolsRef.current?.scrollBy({ left: -260, behavior: 'smooth' })} aria-label="Ver herramientas anteriores">‹</button>
                      <div className="fullscreen-build-tools" ref={fullscreenToolsRef}>
                        {BUILD_TOOLS.map((tool) => {
                          const locked = tool.unlock && !hasOwned(tool.unlock);
                          return (
                            <button
                              className={buildTool === tool.id ? 'active' : ''}
                              disabled={locked}
                              key={tool.id}
                              onClick={() => setBuildTool(tool.id)}
                            >
                              <span>{locked ? '🔒' : tool.icon}</span><small>{tool.label}</small>
                            </button>
                          );
                        })}
                      </div>
                      <button className="fullscreen-tools-arrow" onClick={() => fullscreenToolsRef.current?.scrollBy({ left: 260, behavior: 'smooth' })} aria-label="Ver más herramientas">›</button>
                    </div>
                    <div className="fullscreen-color-tools">
                      {['#c7a7ff', '#ff758f', '#65c7f7', '#65d6a6', '#ffb15c', '#f5eee1', '#4b5563'].map((color) => (
                        <button
                          aria-label={`Usar color ${color}`}
                          className={buildColor === color ? 'active' : ''}
                          key={color}
                          onClick={() => setBuildColor(color)}
                          style={{ '--paint-color': color }}
                        />
                      ))}
                      <input aria-label="Elegir color personalizado" type="color" value={buildColor} onChange={(event) => setBuildColor(event.target.value)} />
                    </div>
                  </>
                )}
              </div>
            )}
            {dogMenu && !pet.activity && !departureActivity && view === 'home' && (
              <div className="sim-dog-menu">
                <div className="sim-dog-menu-header">
                  <strong>{pet.name}</strong>
                  <span>Estado y acciones</span>
                  <button onClick={() => setDogMenu(false)} aria-label="Cerrar acciones">×</button>
                </div>
                <div className="sim-dog-status-grid">
                  <section>
                    <span>Estado</span>
                    {needData.map((need) => (
                      <label key={need.key}>
                        <b>{need.icon} {need.label}</b>
                        <i><em style={{ width: `${need.value}%`, background: need.color }} /></i>
                        <small>{Math.round(need.value)}/100</small>
                      </label>
                    ))}
                  </section>
                  <section>
                    <span>Habilidades</span>
                    {skillData.map((skill) => (
                      <label key={skill.key}>
                        <b>{skill.icon} {skill.label}</b>
                        <i><em style={{ width: `${Math.min(100, skill.value * 10)}%`, background: skill.color }} /></i>
                        <small>Nivel {skill.value}</small>
                      </label>
                    ))}
                  </section>
                  <section>
                    <span>Progreso</span>
                    {progressData.map((progress) => (
                      <label key={progress.key}>
                        <b>{progress.icon} {progress.label}</b>
                        <i><em style={{ width: `${(progress.value % 3) * 33.3}%`, background: progress.color }} /></i>
                        <small>Nivel {progress.level}</small>
                      </label>
                    ))}
                  </section>
                </div>
                <div className="sim-dog-care-actions">
                  <button onClick={() => care('feed')}>🍗<small>Comer</small></button>
                  <button onClick={() => care('play')}>🎾<small>Jugar</small></button>
                  <button onClick={() => care('bath')}>🛁<small>Bañarse</small></button>
                  <button onClick={() => care('sleep')}>🌙<small>Dormir</small></button>
                  <button onClick={() => care('walk')}>🦮<small>Pasear</small></button>
                </div>
                {fullscreen && (
                  <>
                    <strong className="sim-dog-menu-section-title">Salir de casa</strong>
                    <div className="sim-dog-away-actions">
                      {AWAY_ACTIVITIES.map((activity) => (
                        <button key={activity.id} onClick={() => startActivity(activity)}>
                          <span>{activity.icon}</span>
                          <span><b>{activity.title}</b><small>{activity.subtitle}</small></span>
                          <i>+{activity.reward} 🍪</i>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {reaction && <span className="sim-speech sim-speech-3d">{reaction}</span>}
            <div className="sim-room-label sim-room-label-3d">
              <strong>{pet.name}</strong>
              <small>{view === 'build' ? 'Modo construir' : needLevel > 75 ? 'Está de maravilla' : needLevel > 45 ? 'Quiere un poco de cariño' : 'Necesita cuidados'}</small>
            </div>
            <span className="sim-camera-tip">{view === 'home' ? `Piso ${dogFloor + 1} · toca el suelo para mover a ${pet.name} · toca la escalera para subir o bajar` : buildTool === 'move' ? 'Toca un objeto para resaltarlo y luego toca el lugar nuevo' : buildTool === 'rotate' ? 'Toca una vez para seleccionar y otra para girar' : 'Arrastra para girar · toca el suelo para colocar'}</span>
          </div>

          {view === 'home' ? (
            <>
              <div className="sim-life-panel">
                {pet.activity || departureActivity ? (
                  <div className="sim-away-card">
                    <span>{(pet.activity || departureActivity).icon}</span>
                    <div>
                      <strong>{departureActivity ? `${pet.name} está saliendo` : `${pet.name} está fuera`}</strong>
                      <small>{(pet.activity || departureActivity).subtitle}</small>
                    </div>
                    {departureActivity ? (
                      <b>🚗 Saliendo…</b>
                    ) : now >= pet.activity.endsAt ? (
                      <button onClick={finishActivity}>Recibir 🍪 {pet.activity.reward}</button>
                    ) : (
                      <button onClick={openVenue}>
                        🎮 Acompañar · {Math.floor(Math.max(0, pet.activity.endsAt - now) / 60000)}:{String(Math.floor(Math.max(0, pet.activity.endsAt - now) / 1000) % 60).padStart(2, '0')}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="sim-life-heading">
                      <div><strong>¿Qué hacemos hoy?</strong><small>Trabajo, estudios y vida social</small></div>
                      <div className="sim-skills">
                        <span>🧠 {pet.skills.inteligencia}</span>
                        <span>🤝 {pet.skills.social}</span>
                        <span>🍳 {pet.skills.cocina}</span>
                      </div>
                    </div>
                    <div className="sim-away-actions">
                      {AWAY_ACTIVITIES.map((activity) => (
                        <button key={activity.id} onClick={() => startActivity(activity)}>
                          <span>{activity.icon}</span>
                          <div><strong>{activity.title}</strong><small>{activity.subtitle} · {Math.ceil(activity.seconds / 60)} min</small></div>
                          <b>+{activity.reward} 🍪</b>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="sim-needs">
                {needData.map((need) => (
                  <div className="sim-need" key={need.key}>
                    <span>{need.icon}</span>
                    <div><small>{need.label}</small><i><b style={{ width: `${need.value}%`, background: need.color }} /></i></div>
                    <strong>{Math.round(need.value)}</strong>
                  </div>
                ))}
              </div>

              <div className="sim-actions">
                <button onClick={() => care('feed')}><span>🍗</span>Dar comida<small>Gratis</small></button>
                <button onClick={() => care('play')}><span>🎾</span>Jugar<small>🍪 ∞</small></button>
                <button onClick={() => care('bath')}><span>🛁</span>Bañar</button>
                <button onClick={() => care('sleep')}><span>🌙</span>Dormir</button>
                <button onClick={() => care('walk')}><span>🦮</span>Pasear<small>🍪 ∞</small></button>
              </div>
            </>
          ) : (
            <div className="house-builder">
              <div className="builder-heading">
                <div>
                  <strong>Catálogo de construcción</strong>
                  <small>{(pet.layout || SIM_DEFAULTS.layout).length} elementos · para girar, toca una vez para resaltar y otra para rotar</small>
                </div>
                <div className="builder-history-actions">
                  <button disabled={!buildHistory.past.length} onClick={undoBuild}>↶</button>
                  <button disabled={!buildHistory.future.length} onClick={redoBuild}>↷</button>
                  <button onClick={saveHouseLayout}>💾</button>
                  <button className={buildTool === 'rotate' ? 'active' : ''} onClick={() => setBuildTool('rotate')}>↻ Girar</button>
                </div>
              </div>
              <div className="builder-floor-row">
                <span>Planta activa</span>
                <button className={activeFloor === 0 ? 'active' : ''} onClick={() => setActiveFloor(0)}>Piso 1</button>
                <button className={activeFloor === 1 ? 'active' : ''} onClick={() => setActiveFloor(1)}>Piso 2</button>
                <small>{activeFloor === 1 ? 'Coloca baldosas antes de poner muebles. Sin suelo debajo, la colocación se bloquea.' : 'Las escaleras se colocan en este piso y conectan con la planta 2.'}</small>
              </div>
              <div className="builder-color-row">
                <span>Color</span>
                {['#c7a7ff', '#ff758f', '#65c7f7', '#65d6a6', '#ffb15c', '#f5eee1', '#4b5563'].map((color) => (
                  <button
                    aria-label={`Usar color ${color}`}
                    className={buildColor === color ? 'active' : ''}
                    key={color}
                    onClick={() => setBuildColor(color)}
                    style={{ '--paint-color': color }}
                  />
                ))}
                <input aria-label="Elegir color personalizado" type="color" value={buildColor} onChange={(event) => setBuildColor(event.target.value)} />
              </div>
              <div className="builder-tools">
                {BUILD_TOOLS.map((tool) => {
                          const locked = tool.unlock && !hasOwned(tool.unlock);
                  return (
                    <button
                      className={buildTool === tool.id ? 'active' : ''}
                      disabled={locked}
                      key={tool.id}
                      onClick={() => setBuildTool(tool.id)}
                    >
                      <span>{locked ? '🔒' : tool.icon}</span>
                      <small>{tool.label}</small>
                    </button>
                  );
                })}
              </div>
              {pet.savedLayouts.length > 0 && (
                <div className="builder-saved-layouts">
                  <strong>Diseños guardados</strong>
                  {pet.savedLayouts.map((savedLayout) => (
                    <button key={savedLayout.id} onClick={() => loadHouseLayout(savedLayout)}>🏠 {savedLayout.name}</button>
                  ))}
                </div>
              )}
              <p>Los muebles bloqueados se desbloquean en la tienda.</p>
            </div>
          )}
        </>
      ) : view === 'life' ? (
        <div className="sim-life-dashboard">
          <section className="sim-aspiration-panel">
            <h3>{selectedAspiration.icon} Aspiración</h3>
            <p><strong>{selectedAspiration.title}</strong> · {selectedAspiration.description}</p>
            <div className="sim-choice-row">
              {ASPIRATIONS.map((aspiration) => (
                <button className={pet.aspiration.id === aspiration.id ? 'active' : ''} key={aspiration.id} onClick={() => chooseAspiration(aspiration.id)}>
                  {aspiration.icon} {aspiration.title}
                </button>
              ))}
            </div>
            <div className="sim-milestone-list">
              {aspirationMilestones.map((milestone) => (
                <button disabled={!milestone.done || milestone.claimed} key={milestone.id} onClick={() => claimAspirationMilestone(milestone)}>
                  <span>{milestone.claimed ? '✅' : milestone.done ? '🎁' : '◻️'}</span>
                  <div><strong>{milestone.label}</strong><small>{milestone.reward}</small></div>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>☀️ Deseos de hoy</h3>
            <div className="sim-milestone-list">
              {dailyWantItems.map((want) => (
                <button disabled={!want.done || want.claimed} key={want.id} onClick={() => claimDailyWant(want)}>
                  <span>{want.claimed ? '✅' : want.icon}</span>
                  <div><strong>{want.label}</strong><small>{want.done ? `Reclamar +${want.reward}` : 'Pendiente'}</small></div>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>🏠 Valor del hogar</h3>
            <div className="sim-house-score-card">
              <strong>{houseScore.total}</strong>
              <span>{houseScore.rank}</span>
            </div>
            <div className="sim-score-bars">
              {[
                ['Comodidad', houseScore.comfort],
                ['Estilo', houseScore.style],
                ['Jardín', houseScore.garden],
                ['Cocina', houseScore.kitchen],
                ['Diversión', houseScore.fun],
                ['Lujo', houseScore.luxury]
              ].map(([label, value]) => (
                <span key={label}><b>{label}</b><i><em style={{ width: `${Math.min(100, value)}%` }} /></i><small>{value}</small></span>
              ))}
            </div>
          </section>
          <section>
            <h3>{activeCalendarEvent.icon} Evento de hoy</h3>
            <p><strong>{activeCalendarEvent.title}</strong> · {activeCalendarEvent.description}</p>
            <button className="sim-story-launch" onClick={joinCalendarEvent}>Participar</button>
          </section>
          <section>
            <h3>🌤️ Mundo</h3>
            <div className="sim-choice-row">
              {['auto', 'day', 'night'].map((time) => <button className={pet.world.time === time ? 'active' : ''} key={time} onClick={() => setPet((current) => ({ ...current, world: { ...current.world, time } }))}>{time === 'auto' ? 'Automático' : time === 'day' ? 'Día' : 'Noche'}</button>)}
            </div>
            <div className="sim-choice-row">
              {['sunny', 'rain', 'snow'].map((weather) => <button className={pet.world.weather === weather ? 'active' : ''} key={weather} onClick={() => setPet((current) => ({ ...current, world: { ...current.world, weather } }))}>{weather === 'sunny' ? '☀️ Sol' : weather === 'rain' ? '🌧️ Lluvia' : '❄️ Nieve'}</button>)}
            </div>
          </section>
          <section className="sim-neighborhood-map">
            <h3>🗺️ Lugares del vecindario</h3>
            <p>Cada lugar tiene interiores y actividades propias. El barrio cambia según la hora.</p>
            <div>
              {AWAY_ACTIVITIES.map((activity) => {
                const isOpen = activity.id === 'park' || activity.id === 'beach' || (simHour >= 7 && simHour < 23);
                return (
                  <button disabled={!isOpen || Boolean(pet.activity)} key={activity.id} onClick={() => startActivity(activity)}>
                    <span>{activity.icon}</span>
                    <strong>{activity.subtitle}</strong>
                    <small>{isOpen ? `Abierto · ${pet.visits[activity.id] || 0} visitas` : 'Cerrado hasta las 7:00'}</small>
                  </button>
                );
              })}
            </div>
          </section>
          <section>
            <h3>🐕 Crear personaje</h3>
            <label>Tamaño <input type="range" min=".75" max="1.3" step=".05" value={pet.appearance.size} onChange={(event) => setPet((current) => ({ ...current, appearance: { ...current.appearance, size: Number(event.target.value) } }))} /></label>
            <div className="sim-choice-row">
              {['solid', 'dapple', 'piebald'].map((pattern) => <button className={pet.appearance.pattern === pattern ? 'active' : ''} key={pattern} onClick={() => setPet((current) => ({ ...current, appearance: { ...current.appearance, pattern } }))}>{pattern === 'solid' ? 'Liso' : pattern === 'dapple' ? 'Manchado' : 'Pío'}</button>)}
            </div>
            <div className="sim-choice-row">
              {['classic', 'floppy', 'tiny'].map((ears) => <button className={pet.appearance.ears === ears ? 'active' : ''} key={ears} onClick={() => setPet((current) => ({ ...current, appearance: { ...current.appearance, ears } }))}>{ears === 'classic' ? 'Clásicas' : ears === 'floppy' ? 'Caídas' : 'Pequeñas'}</button>)}
            </div>
            <p>Elige hasta dos rasgos. Cambian bonificaciones y resultados sociales.</p>
            <div className="sim-trait-grid">
              {PERSONALITY_TRAITS.map((trait) => (
                <button className={pet.traits.includes(trait.id) ? 'active' : ''} key={trait.id} onClick={() => toggleTrait(trait.id)}>
                  <span>{trait.icon}</span><strong>{trait.label}</strong><small>{trait.bonus}</small>
                </button>
              ))}
            </div>
            <label>Actividad favorita
              <select
                value={pet.preferences.favoriteActivity}
                onChange={(event) => setPet((current) => ({ ...current, preferences: { ...current.preferences, favoriteActivity: event.target.value } }))}
              >
                <option value="park">Parque</option>
                <option value="beach">Playa</option>
                <option value="downtown">Centro</option>
                <option value="school">Escuela</option>
              </select>
            </label>
          </section>
          <section>
            <h3>💼 Progreso</h3>
            <div className="sim-progress-card"><span>{currentCareer.icon} {currentCareer.title}</span><strong>{careerTitle} · Nivel {pet.progress.careerLevel}</strong><i><b style={{ width: `${pet.progress.careerPerformance}%` }} /></i></div>
            <div className="sim-progress-card"><span>🎓 Escuela</span><strong>{schoolTitle} · Nivel {pet.progress.schoolLevel}</strong><i><b style={{ width: `${pet.progress.schoolPerformance}%` }} /></i></div>
            <button className="sim-story-launch" onClick={doHomework}>📚 Hacer deberes · {Math.round(pet.progress.homework)}%</button>
          </section>
          <section>
            <h3>🔓 Desbloqueos por habilidad</h3>
            <div className="sim-unlock-list">
              {SKILL_UNLOCKS.map((unlock) => {
                const unlocked = (pet.skills[unlock.skill] || 0) >= unlock.level;
                return (
                  <span className={unlocked ? 'unlocked' : ''} key={unlock.id}>
                    <b>{unlocked ? '✅' : '🔒'} {unlock.icon}</b>
                    <small>{unlock.label} · {unlock.skill} nivel {unlock.level}</small>
                  </span>
                );
              })}
            </div>
          </section>
          <section>
            <h3>🚪 Habitaciones</h3>
            {Object.entries(pet.roomNames).map(([roomId, name]) => (
              <label key={roomId}>{roomId === 'main' ? 'Sala' : roomId === 'garage' ? 'Garaje' : 'Jardín'}
                <input
                  type="text"
                  maxLength="18"
                  value={name}
                  onChange={(event) => setPet((current) => ({ ...current, roomNames: { ...current.roomNames, [roomId]: event.target.value } }))}
                />
              </label>
            ))}
          </section>
          <section>
            <h3>🥕 Huerto</h3>
            <p>{!pet.garden.plantedAt ? 'La tierra está lista.' : pet.garden.watered && now - pet.garden.plantedAt >= 60000 ? '¡La cosecha está lista!' : pet.garden.watered ? 'Está creciendo…' : 'Necesita agua.'}</p>
            <div className="sim-choice-row">
              {!pet.garden.plantedAt && <button onClick={plantGarden}>Plantar</button>}
              {pet.garden.plantedAt && !pet.garden.watered && <button onClick={waterGarden}>Regar</button>}
              {pet.garden.plantedAt && pet.garden.watered && <button disabled={now - pet.garden.plantedAt < 60000} onClick={harvestGarden}>Cosechar</button>}
            </div>
            <small>Cosechas: {pet.garden.harvests}</small>
          </section>
          <section>
            <h3>🏘️ Vecinos</h3>
            <div className="sim-neighbor-list">
              {Object.entries(pet.relationships).map(([name, friendship]) => (
                <button className={selectedNeighbor === name ? 'active' : ''} key={name} onClick={() => setSelectedNeighbor(selectedNeighbor === name ? null : name)}><span>🐶</span><div><strong>{name}</strong><i><b style={{ width: `${friendship}%` }} /></i></div><small>{friendship >= 80 ? 'Mejor amistad' : friendship >= 45 ? 'Amistad' : friendship >= 15 ? 'Conocido' : 'Nuevo'} · {friendship}</small></button>
              ))}
            </div>
            {selectedNeighbor && (
              <div className="sim-neighbor-actions">
                <button onClick={() => interactNeighbor(selectedNeighbor, 'chat')}>💬 Charlar</button>
                <button onClick={() => interactNeighbor(selectedNeighbor, 'play')}>🎾 Jugar</button>
                <button onClick={() => interactNeighbor(selectedNeighbor, 'gift')}>🎁 Regalo</button>
                <button onClick={() => interactNeighbor(selectedNeighbor, 'prank')}>😈 Broma</button>
                <button onClick={() => befriend(selectedNeighbor)}>🏡 Invitar a casa</button>
              </div>
            )}
          </section>
          <section>
            <h3>🏆 Misiones y logros</h3>
            {[
              { id: 'care3', label: 'Cuidar 3 veces', done: pet.quests.care >= 3 },
              { id: 'social3', label: 'Socializar 3 veces', done: pet.quests.social >= 3 },
              { id: 'streak3', label: 'Ritual de 3 días', done: currentStreak >= 3 }
            ].map((quest) => (
              <div className="sim-quest" key={quest.id}><span>{quest.done ? '✅' : '◻️'} {quest.label}</span>{quest.done && !pet.quests.claimed.includes(quest.id) && <button onClick={() => claimQuest(quest.id)}>Reclamar</button>}</div>
            ))}
            <div className="sim-goal-create">
              <input value={goalDraft} maxLength="55" onChange={(event) => setGoalDraft(event.target.value)} placeholder="Escribe tu propia meta…" />
              <button onClick={addCustomGoal}>Añadir</button>
            </div>
            <div className="sim-custom-goals">
              {pet.customGoals.map((goal) => (
                <button className={goal.done ? 'done' : ''} key={goal.id} onClick={() => toggleCustomGoal(goal.id)}>
                  {goal.done ? '✅' : '◻️'} {goal.text}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>📖 Historias del vecindario</h3>
            <p>Capítulo {Math.min(STORY_EVENTS.length, pet.story.chapter + 1)} de {STORY_EVENTS.length}</p>
            {pet.story.chapter < STORY_EVENTS.length ? (
              <button className="sim-story-launch" onClick={() => setStoryEvent(STORY_EVENTS[pet.story.chapter])}>
                {STORY_EVENTS[pet.story.chapter].icon} Continuar: {STORY_EVENTS[pet.story.chapter].title}
              </button>
            ) : (
              <p>La primera temporada está completa. Tus decisiones permanecen en el diario.</p>
            )}
            <div className="sim-story-log">
              {pet.story.log.slice(0, 4).map((entry, index) => <small key={`${entry}-${index}`}>• {entry}</small>)}
            </div>
          </section>
          <section>
            <h3>🗃️ Colecciones</h3>
            <p>{pet.collections.length} objetos descubiertos explorando lugares e historias.</p>
            <div className="sim-collection-sets">
              {collectionSetProgress.map((set) => (
                <div key={set.id}>
                  <strong>{set.icon} {set.title}</strong>
                  <small>{set.found.length}/{set.items.length}</small>
                  <i><b style={{ width: `${(set.found.length / set.items.length) * 100}%` }} /></i>
                </div>
              ))}
            </div>
            <div className="sim-collection-grid">
              {pet.collections.map((item) => <span key={item}>✨ <small>{item}</small></span>)}
            </div>
          </section>
          <section>
            <h3>🧠 Recuerdos</h3>
            <div className="sim-memory-log">
              {pet.memories.length ? pet.memories.slice(0, 6).map((memory) => (
                <span key={memory.id}><b>{memory.icon}</b><small>{memory.text}</small></span>
              )) : <p>Las aventuras de {pet.name} aparecerán aquí.</p>}
            </div>
          </section>
          <section>
            <h3>🌳 Legado familiar</h3>
            <p>Familia {pet.legacy.familyName} · Generación {pet.legacy.generation}</p>
            <button className="sim-story-launch" onClick={beginNewGeneration}>Comenzar nueva generación</button>
            <small>Se desbloquea al alcanzar nivel 3 en trabajo o escuela. La casa, colecciones y relaciones se heredan.</small>
          </section>
          <section className="sim-cloud-card">
            <h3>☁️ Guardado</h3>
            <p>{deviceId ? 'El juego se guarda localmente y sincroniza cuando hay conexión.' : 'Guardado local activo.'}</p>
          </section>
        </div>
      ) : (
        <div className="sim-shop">
          <div className="sim-name-card">
            <label htmlFor="sim-pet-name">Nombre de tu salchicha</label>
            <input
              id="sim-pet-name"
              value={pet.name}
              maxLength="14"
              onChange={(event) => setPet((current) => ({ ...current, name: event.target.value || 'Salchi' }))}
            />
          </div>
          <div className="sim-color-customizer">
            <strong>Personalizar colores</strong>
            <label>🐕 Pelaje <input type="color" value={pet.colors.dog} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, dog: event.target.value } }))} /></label>
            <label>🧱 Paredes <input type="color" value={pet.colors.walls} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, walls: event.target.value } }))} /></label>
            <label>🟫 Suelo <input type="color" value={pet.colors.floor} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, floor: event.target.value } }))} /></label>
            <label>🚗 Carro <input type="color" value={pet.colors.car} onChange={(event) => setPet((current) => ({ ...current, colors: { ...current.colors, car: event.target.value } }))} /></label>
          </div>
          <div className="sim-shop-grid">
            {SIM_SHOP.map((item) => {
              const owned = hasOwned(item.id);
              const selected = (item.type === 'room' && pet.room === item.id)
                || (item.type === 'outfit' && pet.outfit === item.id)
                || (item.type === 'vehicle' && pet.vehicle === item.vehicle);
              return (
                <button className={`sim-shop-item ${selected ? 'selected' : ''}`} key={item.id} onClick={() => buy(item)}>
                  <span>{item.icon}</span>
                  <strong>{item.name}</strong>
                  <small>{selected ? 'En uso' : owned ? (item.type === 'furniture' ? 'Comprado' : 'Usar') : 'Gratis · 🍪 ∞'}</small>
                </button>
              );
            })}
          </div>
          <p className="sim-shop-tip">Gana galletas jugando y paseando con {pet.name}.</p>
        </div>
      )}
    </GameShell>
  );
}

function GameShell({ title, kicker, score, onBack, children }) {
  return (
    <section className="game-shell fade-in-section">
      <div className="game-shell-header">
        <button className="game-back" onClick={onBack} aria-label="Volver a juegos">←</button>
        <div><small>{kicker}</small><h2>{title}</h2></div>
        <span className="game-score-pill">{score}</span>
      </div>
      {children}
    </section>
  );
}

export default function GamesView({ deviceId, currentStreak = 0 }) {
  const [activeGame, setActiveGame] = useState(null);
  if (activeGame === 'tetris') return <DoxieTetris onBack={() => setActiveGame(null)} />;
  if (activeGame === 'memory') return <MemoryGame onBack={() => setActiveGame(null)} />;
  if (activeGame === 'breakout') return <BreakoutGame onBack={() => setActiveGame(null)} />;
  if (activeGame === 'vida') return <VidaSalchicha onBack={() => setActiveGame(null)} deviceId={deviceId} currentStreak={currentStreak} />;

  return (
    <section className="games-view fade-in-section">
      <div className="games-hero">
        <div className="games-hero-copy">
          <span className="games-eyebrow">La sala del perro largo</span>
          <h1>Patas cortas.<br />Juegos grandes.</h1>
          <p>Cuatro pequeñas aventuras para celebrar que cumpliste tu ritual.</p>
        </div>
        <div className="hero-doxie" aria-hidden="true">
          <span className="hero-doxie-tail" />
          <span className="hero-doxie-body" />
          <span className="hero-doxie-head">•</span>
          <span className="hero-doxie-ear" />
          <span className="hero-doxie-leg one" />
          <span className="hero-doxie-leg two" />
          <span className="hero-ball">●</span>
        </div>
      </div>
      <div className="game-card-list">
        {GAME_CARDS.map((game, index) => (
          <button
            className="game-launch-card"
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            style={{ '--game-accent': game.accent }}
          >
            <span className="game-card-number">0{index + 1}</span>
            <span className="game-card-icon">{game.icon}</span>
            <span className="game-card-copy">
              <small>{game.eyebrow}</small>
              <strong>{game.title}</strong>
              <p>{game.description}</p>
            </span>
            <span className="game-card-arrow">↗</span>
          </button>
        ))}
      </div>
      <p className="games-footer-note">Ningún perro salchicha fue estirado durante el desarrollo.</p>
    </section>
  );
}
