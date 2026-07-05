import React, { useState, useEffect, useRef } from 'react';
import { getLocalDateString, THEME_PRICES } from '../hooks/usePillData';
import CozyGarden, { COLLECTIBLE_PRICES, calculateEarnedTokens } from './CozyGarden';
import DashboardPet from './DashboardPet';
import WeeklyPostcard from './WeeklyPostcard';
import { isPWA } from '../utils/pwa';

export default function Dashboard({
  deviceId,
  clientId,
  logs,
  logPill,
  pillName,
  reminderTime,
  currentStreak,
  stats,
  showToast,
  promptMood,
  theme,
  unlockedCollectibles = {},
  visibleCollectibles = {},
  unlockedThemes = {},
  toggleCollectible,
  availableTokens,
  totalTokens,
  onGoToStore
}) {
  const todayStr = getLocalDateString();
  const isTakenToday = !!logs[todayStr]?.taken;
  
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDue, setIsDue] = useState(false);
  const [customPhrases, setCustomPhrases] = useState([]);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isShelfOpen, setIsShelfOpen] = useState(false);

  const items = [
    { key: 'snail', name: 'Caracolito', icon: '🐌', desc: 'Un caracol sabio que da consejos al tocarlo.' },
    { key: 'ladybug', name: 'Mariquita', icon: '🐞', desc: 'Una mariquita que agita sus alas al hacerle click.' },
    { key: 'lights', name: 'Luces de Hada', icon: '✨', desc: 'Luces brillantes de colores alrededor de la maceta.' },
    { key: 'goldPot', name: 'Maceta de Oro', icon: '🏺', desc: 'Una cubierta de oro pulido para tu maceta.' },
    { key: 'vines', name: 'Enredaderas', icon: '🌿', desc: 'Hojas trepadoras que decoran los bordes de la pantalla.' },
    { key: 'crystal', name: 'Cristal Místico', icon: '💎', desc: 'Un cristal mágico que destella al presionarlo.' },
    { key: 'magicSky', name: 'Cielo Estrellado', icon: '🌌', desc: 'Estrellas titilantes y polvillo mágico flotando.' },
    { key: 'dog', name: 'Perro', icon: '🐶', desc: 'El perrito te acompaña al pie del jardín.' },
    { key: 'gnome', name: 'Gnomito Guardián', icon: '🧑‍🌾', desc: 'Un gnomo adorable que sostiene carteles motivacionales.' },
    { key: 'bluebird', name: 'Pajarito Cantor', icon: '🐦', desc: 'Un pajarito azul que canta y aletea al tocarlo.' },
    { key: 'goldCan', name: 'Regadora de Estrellas', icon: '✨', desc: 'Cambia las gotas de agua al regar por un polvillo dorado.' }
  ];

  const hasAnyUnlocked = Object.values(unlockedCollectibles).some(val => val === true);

  const todayLog = logs[todayStr];
  const todayMood = todayLog?.status && todayLog.status.includes(':') 
    ? todayLog.status.split(':')[1] 
    : '';
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const confettiParticles = useRef([]);

  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(!!checkStandalone);
  }, []);

  // Fetch custom daily messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?deviceId=${deviceId}&clientId=${clientId}&pwa=${isPWA()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.messages.length > 0) {
            setCustomPhrases(data.messages.map(m => m.message));
          }
        }
      } catch (err) {
        console.error('Error fetching custom messages for dashboard:', err);
      }
    };

    if (deviceId) {
      fetchMessages();
    }
  }, [deviceId, clientId]);

  // List of Spanish encouragement phrases (with fallback)
  const getDailyPhrase = () => {
    const defaultPhrases = [
      "¡Un día más cuidando de tu salud! Sigue así.",
      "La constancia es la clave para un bienestar duradero.",
      "¡Excelente trabajo! Tu dedicación de hoy es tu bienestar de mañana.",
      "Cuidar de ti hoy es el mejor regalo para tu futuro.",
      "Cada día que cumples es una victoria para tu salud.",
      "La disciplina de hoy es tu tranquilidad de mañana. ¡Estás haciéndolo genial!",
      "Tu bienestar es una prioridad, gracias por cuidarte hoy.",
      "Pequeños hábitos consistentes crean grandes resultados.",
      "Mantén encendido ese fuego de la constancia. ¡Vamos por más!",
      "¡Racha increíble! Cuidar de ti es el primer paso para todo."
    ];
    
    const pool = customPhrases.length > 0 ? customPhrases : defaultPhrases;
    
    // Hash based on current date string to get the same phrase all day, changing daily
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash += todayStr.charCodeAt(i);
    }
    return pool[hash % pool.length];
  };

  // Calculate time remaining to reminder in Spanish
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      
      if (now > target && isTakenToday) {
        target.setDate(target.getDate() + 1);
      }

      const diffMs = target - now;

      if (diffMs < 0) {
        setIsDue(true);
        setTimeRemaining('¡Toca tomar la dosis esta noche!');
      } else {
        setIsDue(false);
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        let timerStr = '';
        if (diffHrs > 0) timerStr += `${diffHrs}h `;
        timerStr += `${diffMins}m ${diffSecs}s`;
        
        setTimeRemaining(`Próximo aviso en ${timerStr}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [reminderTime, isTakenToday, todayStr]);

  // Confetti Particle Class
  class Confetti {
    constructor(canvasWidth, canvasHeight) {
      this.x = canvasWidth / 2;
      this.y = canvasHeight / 2 - 20;
      this.size = Math.random() * 8 + 4;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 2;
      
      this.color = [
        '#00f2fe',
        '#4facfe',
        '#10b981',
        '#892cdc',
        '#ff007f'
      ][Math.floor(Math.random() * 5)];
      
      this.alpha = 1;
      this.decay = Math.random() * 0.015 + 0.01;
      this.gravity = 0.25;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.alpha -= this.decay;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    confettiParticles.current = Array.from({ length: 120 }, () => new Confetti(canvas.width, canvas.height));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      confettiParticles.current.forEach((p, idx) => {
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0) {
          confettiParticles.current.splice(idx, 1);
        }
      });

      if (confettiParticles.current.length > 0) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    cancelAnimationFrame(animationFrameId.current);
    animate();
  };

  const handlePillClick = () => {
    if (isTakenToday) {
      logPill(todayStr, 'none');
      showToast('Registro de hoy eliminado');
    } else {
      promptMood(todayStr, (mood) => {
        const statusVal = mood ? `taken:${mood}` : 'taken';
        logPill(todayStr, statusVal);
        showToast('¡Toma registrada! Excelente trabajo.');
        setTimeout(triggerConfetti, 50);
      });
    }
  };

  const handleYesterdayLog = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    
    if (logs[yesterdayStr]?.taken) {
      logPill(yesterdayStr, 'none');
      showToast('Registro de ayer eliminado');
    } else {
      logPill(yesterdayStr, 'taken');
      showToast('¡Toma de ayer registrada!');
    }
  };

  return (
    <div className="fade-in-section" style={{ position: 'relative' }}>
      
      {/* Cozy Garden Component (Unified Centerpiece) */}
      <CozyGarden 
        currentStreak={currentStreak} 
        isTakenToday={isTakenToday} 
        logs={logs}
        theme={theme} 
        pillName={pillName}
        isDue={isDue}
        timeRemaining={timeRemaining}
        onPotClick={handlePillClick}
        canvasRef={canvasRef}
        todayMood={todayMood}
        unlockedCollectibles={unlockedCollectibles}
        visibleCollectibles={visibleCollectibles}
      />

      {/* Repisa de Colección Card */}
      <div className="glass-panel shelf-card" style={{ padding: '20px 24px' }}>
        <div 
          onClick={() => setIsShelfOpen(!isShelfOpen)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🎒</span>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Repisa de Colección</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Tienes 🪙 <strong style={{ color: 'var(--accent-cyan)' }}>{availableTokens}</strong> tokens (Total ganados: 🪙 {totalTokens})
              </p>
            </div>
          </div>
          <div style={{
            transform: isShelfOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--text-secondary)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {isShelfOpen && (
          <div style={{ marginTop: '20px' }}>
            {hasAnyUnlocked ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {items
                  .filter(item => unlockedCollectibles[item.key])
                  .map(item => {
                    const isVisible = visibleCollectibles[item.key] !== false;
                    return (
                      <div 
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '16px',
                          background: isVisible ? 'rgba(0, 242, 254, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                          border: isVisible ? '1px solid rgba(0, 242, 254, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                          <span style={{ fontSize: '22px' }}>{item.icon}</span>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</span>
                            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{item.desc}</p>
                          </div>
                        </div>
                        {/* Styled Toggle Switch */}
                        <button
                          onClick={() => toggleCollectible(item.key, !isVisible)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer',
                            background: isVisible ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.08)',
                            color: isVisible ? '#fff' : 'var(--text-secondary)',
                            boxShadow: isVisible ? '0 0 8px var(--accent-gradient-glow)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isVisible ? 'Activo' : 'Activar'}
                        </button>
                      </div>
                    );
                  })
                }
              </div>
            ) : (
              <div style={{ 
                padding: '24px', 
                textAlign: 'center', 
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                borderRadius: '18px'
              }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  No tienes decoraciones en tu repisa todavía.<br/>
                  ¡Visita la Tienda para comprar tu primer compañero o decoración mágica!
                </p>
                <button
                  onClick={onGoToStore}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    boxShadow: '0 4px 12px var(--accent-gradient-glow)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  Ir a la Tienda ➔
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weekly Postcard */}
      <WeeklyPostcard
        logs={logs}
        unlockedCollectibles={unlockedCollectibles}
        visibleCollectibles={visibleCollectibles}
        showToast={showToast}
      />

      {/* Daily Motivation Card */}
      <div className="glass-panel motivation-card">
        <div className="motivation-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z"/>
            <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"/>
          </svg>
        </div>
        <div className="motivation-content">
          <div className="motivation-lbl">Frase de Motivación</div>
          <p className="motivation-text">"{getDailyPhrase()}"</p>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="stat-summary-grid">
        <div className="mini-stat-card streak-card">
          <div className="icon-container">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>
          <div>
            <div className="val">{currentStreak} {currentStreak === 1 ? 'día' : 'días'}</div>
            <div className="lbl">Racha Actual</div>
          </div>
        </div>

        <div className="mini-stat-card compliance-card">
          <div className="icon-container">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <div className="val">{stats.complianceRate}%</div>
            <div className="lbl">Constancia</div>
          </div>
        </div>
      </div>


      {/* Install App Guide (only shown when not running as standalone PWA) */}
      {!isStandalone && (
        <div className="glass-panel install-guide-panel" style={{ marginTop: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📲</span> Cómo instalar en tu iPhone
          </h2>
          <p className="subtitle" style={{ marginBottom: '22px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Para poder recibir recordatorios diarios y abrir la aplicación a pantalla completa, añádela a tu pantalla de inicio siguiendo estos pasos:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              <div style={{
                background: 'var(--accent-gradient)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 0 10px var(--accent-gradient-glow)',
                flexShrink: 0,
                zIndex: 2
              }}>1</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Abre en Safari</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Asegúrate de estar visitando esta página usando el navegador <strong style={{ color: 'var(--accent-cyan)' }}>Safari</strong> de Apple.
                </p>
              </div>
            </div>
            
            {/* Vertical connector line */}
            <div style={{
              position: 'absolute',
              left: '15px',
              top: '32px',
              bottom: '32px',
              width: '2px',
              background: 'linear-gradient(to bottom, var(--accent-cyan), rgba(0, 242, 254, 0.1))',
              zIndex: 1
            }} />

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              <div style={{
                background: 'var(--accent-gradient)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 0 10px var(--accent-gradient-glow)',
                flexShrink: 0,
                zIndex: 2
              }}>2</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Toca "Compartir"</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  Presiona el botón de compartir
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.08)', 
                    padding: '4px 6px', 
                    borderRadius: '6px', 
                    color: 'var(--text-primary)'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </span>
                  en la barra de navegación de Safari.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              <div style={{
                background: 'var(--accent-gradient)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 0 10px var(--accent-gradient-glow)',
                flexShrink: 0,
                zIndex: 2
              }}>3</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Añadir a pantalla de inicio</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Desplázate hacia abajo en la lista de opciones y selecciona <strong style={{ color: '#fff' }}>"Añadir a pantalla de inicio"</strong>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              <div style={{
                background: 'var(--accent-gradient)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 0 10px var(--accent-gradient-glow)',
                flexShrink: 0,
                zIndex: 2
              }}>4</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Confirma la acción</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Pulsa <strong style={{ color: 'var(--accent-cyan)' }}>"Añadir"</strong> en la parte superior derecha. ¡Y listo! Accede a la app desde tu pantalla.
                </p>
              </div>
            </div>
          </div>

          {/* Notification Reminder Notice */}
          <div style={{ 
            marginTop: '22px',
            padding: '12px 16px',
            background: 'rgba(0, 242, 254, 0.05)',
            border: '1px dashed rgba(0, 242, 254, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '18px' }}>🔔</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
              <strong style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: '600' }}>Importante: Activa las notificaciones</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Una vez abierta desde la pantalla de inicio, ve a la sección de <strong>Ajustes</strong> y pulsa en <strong>"Activar Avisos"</strong> para recibir tus avisos diarios.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .status-pill {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }
        .status-pill.completed {
          background: rgba(16, 185, 129, 0.15);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-pill.due {
          background: rgba(239, 68, 68, 0.15);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.3);
          animation: pulseRed 1.8s infinite alternate;
        }
        .status-pill.waiting {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Motivation Card CSS */
        .motivation-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(22, 28, 38, 0.7) 0%, rgba(137, 44, 220, 0.05) 100%);
          border-left: 3px solid var(--accent-cyan);
        }
        .motivation-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 242, 254, 0.1);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          color: var(--accent-cyan);
          flex-shrink: 0;
        }
        .motivation-lbl {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 2px;
        }
        .motivation-text {
          font-size: 13px;
          line-height: 1.4;
          font-weight: 500;
          color: var(--text-primary);
          font-style: italic;
        }
        
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.3); }
          100% { box-shadow: 0 0 12px 3px rgba(239, 68, 68, 0.15); }
        }
      `}</style>
    </div>
  );
}
