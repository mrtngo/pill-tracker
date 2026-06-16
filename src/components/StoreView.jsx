import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLLECTIBLE_PRICES, calculateEarnedTokens } from './CozyGarden';
import { THEME_PRICES } from '../App';

export default function StoreView({
  logs,
  unlockedCollectibles,
  visibleCollectibles,
  buyCollectible,
  toggleCollectible,
  unlockedThemes = {},
  buyTheme,
  availableTokens,
  onGoToGarden
}) {
  const [successItem, setSuccessItem] = useState(null);

  const items = [
    { key: 'snail', name: 'Caracolito', icon: '🐌', desc: 'Un caracol sabio que da consejos al tocarlo.' },
    { key: 'ladybug', name: 'Mariquita', icon: '🐞', desc: 'Una mariquita que agita sus alas al hacerle click.' },
    { key: 'lights', name: 'Luces de Hada', icon: '✨', desc: 'Luces brillantes de colores alrededor de la maceta.' },
    { key: 'goldPot', name: 'Maceta de Oro', icon: '🏺', desc: 'Una hermosa cubierta de oro pulido y brillante para tu maceta.' },
    { key: 'vines', name: 'Enredaderas', icon: '🌿', desc: 'Hojas trepadoras que decoran los bordes de la pantalla.' },
    { key: 'crystal', name: 'Cristal Místico', icon: '💎', desc: 'Un cristal mágico que destella al presionarlo.' },
    { key: 'magicSky', name: 'Cielo Estrellado', icon: '🌌', desc: 'Estrellas titilantes y polvillo mágico flotando en tu panel.' },
    { key: 'dog', name: 'Doggo', icon: '🐶', desc: 'El perrito Doggo te acompaña al pie del jardín.' },
    { key: 'gnome', name: 'Gnomito Guardián', icon: '🧑‍🌾', desc: 'Un gnomo adorable que sostiene carteles motivacionales.' },
    { key: 'bluebird', name: 'Pajarito Cantor', icon: '🐦', desc: 'Un pajarito azul que canta y aletea al tocarlo.' },
    { key: 'goldCan', name: 'Regadora de Estrellas', icon: '✨', desc: 'Cambia las gotas de agua al regar por un polvillo dorado brillante.' }
  ];

  const handleBuy = (key, name, icon, price) => {
    const success = buyCollectible(key, price);
    if (success) {
      setSuccessItem({ name, icon, price });
    }
  };

  const handleBuyTheme = (themeId, name, price) => {
    const success = buyTheme(themeId, price);
    if (success) {
      setSuccessItem({ name, icon: '🎨', price });
    }
  };

  // Auto-hide success notification after 4 seconds
  useEffect(() => {
    if (successItem) {
      const timer = setTimeout(() => {
        setSuccessItem(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successItem]);

  return (
    <div className="fade-in-section" style={{ padding: '8px 4px 100px 4px', position: 'relative' }}>
      
      {/* SUCCESS POPUP NOTIFICATION */}
      {successItem && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div className="glass-panel glow" style={{
            width: '90%',
            maxWidth: '340px',
            padding: '24px',
            textAlign: 'center',
            borderRadius: '24px',
            border: '2px solid var(--accent-cyan)',
            boxShadow: '0 20px 50px rgba(0, 242, 254, 0.25)',
            transform: 'scale(1)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Sparkles / Confetti Background */}
            <div style={{
              fontSize: '48px',
              margin: '10px 0',
              animation: 'wiggle 1s ease-in-out infinite alternate',
              display: 'inline-block'
            }}>
              {successItem.icon}
            </div>

            <h3 style={{ margin: '12px 0 6px 0', color: 'var(--text-primary)', fontWeight: '800', fontSize: '18px' }}>
              ¡Compra Exitosa! 🎉
            </h3>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Has desbloqueado al <strong>{successItem.name}</strong> por 🪙 {successItem.price} tokens.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={onGoToGarden}
                style={{
                  background: 'var(--accent-gradient)',
                  color: '#08090d',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0, 242, 254, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                Ver en mi Jardín 🌸
              </button>
              
              <button
                onClick={() => setSuccessItem(null)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  padding: '8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* STORE PAGE HEADER */}
      <div className="glass-panel glow" style={{ marginBottom: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Mercado del Jardín</h2>
          <span style={{
            fontSize: '13px',
            fontWeight: '700',
            color: 'var(--accent-cyan)',
            background: 'rgba(0, 242, 254, 0.08)',
            padding: '6px 14px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            border: '1px solid rgba(0, 242, 254, 0.15)'
          }}>
            🪙 <strong style={{ fontSize: '15px' }}>{availableTokens}</strong> Tokens
          </span>
        </div>
        
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
          Gana 🪙 1 token cada día que marques tu ritual de toma y 🪙 10 tokens adicionales por cada mes que logres completar (etapa 5 de crecimiento). ¡Canjéalos por decoraciones mágicas para tu jardín!
        </p>
      </div>

      {/* ITEMS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {items.map(({ key, name, icon, desc }) => {
          const price = COLLECTIBLE_PRICES[key] || 0;
          const isUnlocked = !!unlockedCollectibles[key];
          const isVisible = !!visibleCollectibles[key];
          const canAfford = availableTokens >= price;

          return (
            <div
              key={key}
              className={`glass-panel ${isUnlocked ? 'unlocked-row' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderRadius: '18px',
                background: isUnlocked ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: isUnlocked ? '1px solid rgba(16, 185, 129, 0.18)' : '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Item Icon Circle */}
              <div style={{
                fontSize: '24px',
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isUnlocked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                boxShadow: isUnlocked ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none',
                flexShrink: 0
              }}>
                {icon}
              </div>

              {/* Item description & actions */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {name}
                    {isUnlocked && (
                      <span style={{
                        color: '#10b981',
                        fontSize: '9px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: 'rgba(16, 185, 129, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '6px'
                      }}>
                        Comprado
                      </span>
                    )}
                  </span>
                </div>
                
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 10px 0', lineHeight: '1.4' }}>
                  {desc}
                </p>

                {isUnlocked ? (
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#10b981', 
                    fontWeight: '700', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    width: 'fit-content'
                  }}>
                    <span>✓</span> Ya Comprado
                  </div>
                ) : (
                  /* Buy Button */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleBuy(key, name, icon, price)}
                      disabled={!canAfford}
                      style={{
                        background: canAfford ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.03)',
                        color: canAfford ? '#08090d' : 'var(--text-muted)',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        boxShadow: canAfford ? '0 3px 10px rgba(0, 242, 254, 0.15)' : 'none'
                      }}
                    >
                      Comprar por 🪙 {price}
                    </button>
                    {!canAfford && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Faltan {price - availableTokens} tokens
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* THEMES SECTION */}
      <div className="glass-panel glow" style={{ marginTop: '24px', marginBottom: '20px', padding: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Temas del Sitio 🎨</h2>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
          Personaliza todo el aspecto visual de la aplicación. ¡Desbloquea nuevos ambientes!
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' }}>
        {[
          { id: 'amber', name: 'Atardecer', price: 15, color: 'linear-gradient(135deg, #ff6b6b 0%, #ff9f43 100%)', desc: 'Un ambiente cálido y vibrante con matices naranjas y rojizos.' },
          { id: 'rose', name: 'Cerezo', price: 25, color: 'linear-gradient(135deg, #ff85a1 0%, #ff758f 100%)', desc: 'Tonos rosados reconfortantes inspirados en las flores de sakura.' },
          { id: 'lavender', name: 'Ensueño', price: 40, color: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', desc: 'Un aura mágica morada y lavanda para inspirar calma.' },
          { id: 'sage', name: 'Bosque', price: 60, color: 'linear-gradient(135deg, #059669 0%, #34d399 100%)', desc: 'Follaje verde profundo y menta para un aspecto natural.' }
        ].map((t) => {
          const isUnlocked = !!unlockedThemes[t.id];
          const price = THEME_PRICES[t.id] || 0;
          const canAfford = availableTokens >= price;

          return (
            <div
              key={t.id}
              className={`glass-panel ${isUnlocked ? 'unlocked-row' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderRadius: '18px',
                background: isUnlocked ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: isUnlocked ? '1px solid rgba(16, 185, 129, 0.18)' : '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Theme Color Circle Preview */}
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: t.color,
                boxShadow: isUnlocked ? '0 0 12px rgba(255,255,255,0.15)' : 'none',
                flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.2)'
              }} />

              {/* Theme info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Tema {t.name}
                    {isUnlocked && (
                      <span style={{
                        color: '#10b981',
                        fontSize: '9px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: 'rgba(16, 185, 129, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '6px'
                      }}>
                        Desbloqueado
                      </span>
                    )}
                  </span>
                </div>
                
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 10px 0', lineHeight: '1.4' }}>
                  {t.desc}
                </p>

                {isUnlocked ? (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Ajustable en la pestaña de <strong>Ajustes</strong>
                  </div>
                ) : (
                  /* Buy Button */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleBuyTheme(t.id, `Tema ${t.name}`, price)}
                      disabled={!canAfford}
                      style={{
                        background: canAfford ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.03)',
                        color: canAfford ? '#08090d' : 'var(--text-muted)',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        boxShadow: canAfford ? '0 3px 10px rgba(0, 242, 254, 0.15)' : 'none'
                      }}
                    >
                      Comprar por 🪙 {price}
                    </button>
                    {!canAfford && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Faltan {price - availableTokens} tokens
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
