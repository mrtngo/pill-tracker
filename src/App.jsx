import React, { useCallback, useState, useEffect } from 'react';
import { usePillData, getLocalDateString, parseLocalDate } from './hooks/usePillData';
import { startReminderCheck, subscribeToPushNotifications } from './utils/notifications';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import SettingsView from './components/SettingsView';
import StoreView from './components/StoreView';
import GamesView from './components/GamesView';
import WeeklyPostcard from './components/WeeklyPostcard';
import { COLLECTIBLE_PRICES, calculateEarnedTokens } from './components/CozyGarden';

export const THEME_PRICES = {
  amber: 15,
  rose: 25,
  lavender: 40,
  sage: 60
};

export default function App() {
  const {
    deviceId,
    clientId,
    logs,
    pillName,
    reminderTime,
    startDate,
    theme,
    changeTheme,
    pushMessage,
    logPill,
    updateSettings,
    importLogs,
    resetAllData,
    currentStreak,
    longestStreak,
    stats,
    unlockedCollectibles,
    visibleCollectibles,
    unlockedThemes,
    toggleCollectible,
    buyCollectible,
    buyTheme,
    availableTokens,
    totalTokens
  } = usePillData();

  const [activeTab, setActiveTab] = useState('dashboard');

  const [toast, setToast] = useState({ message: '', visible: false });
  const [moodModal, setMoodModal] = useState({ visible: false, dateStr: '', onSelect: null });
  const [dogPromptVisible, setDogPromptVisible] = useState(false);
  const [weeklyPostcardModalVisible, setWeeklyPostcardModalVisible] = useState(false);

  const dogPrice = COLLECTIBLE_PRICES.dog;

  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  const promptMood = (dateStr, onSelect) => {
    setMoodModal({ visible: true, dateStr, onSelect });
  };

  const logPillWithSundayPostcard = useCallback((dateStr, status = 'taken') => {
    logPill(dateStr, status);

    const isTaken = status && status.startsWith('taken');
    const isSunday = parseLocalDate(dateStr).getDay() === 0;

    if (isTaken && isSunday) {
      setTimeout(() => {
        setWeeklyPostcardModalVisible(true);
      }, 700);
    }
  }, [logPill]);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  useEffect(() => {
    const hasSeenDogPrompt = localStorage.getItem('aegis_dog_prompt_seen') === 'true';
    if (!hasSeenDogPrompt && !unlockedCollectibles.dog && availableTokens >= dogPrice) {
      const timer = setTimeout(() => setDogPromptVisible(true), 900);
      return () => clearTimeout(timer);
    }
  }, [availableTokens, dogPrice, unlockedCollectibles.dog]);

  const dismissDogPrompt = () => {
    localStorage.setItem('aegis_dog_prompt_seen', 'true');
    setDogPromptVisible(false);
  };

  const buyDogFromPrompt = () => {
    const success = buyCollectible('dog', dogPrice);
    localStorage.setItem('aegis_dog_prompt_seen', 'true');
    setDogPromptVisible(false);
    if (success) {
      showToast('¡Perro se unió a tu jardín!');
      setActiveTab('dashboard');
    }
  };

  // Handle URL query parameters on startup (e.g. ?action=confirm)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'confirm') {
      const todayStr = getLocalDateString();
      logPillWithSundayPostcard(todayStr, 'taken');
      showToast(`¡Tu ${pillName} de hoy ha sido registrada!`);
      // Clean up URL parameters so it doesn't log again on page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [logPillWithSundayPostcard, pillName]);

  // Listen to messages from the Service Worker
  useEffect(() => {
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'LOG_PILL_TAKEN') {
        const todayStr = getLocalDateString();
        logPillWithSundayPostcard(todayStr, 'taken');
        showToast(`¡Tu ${pillName} de hoy ha sido registrada!`);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, [logPillWithSundayPostcard, pillName]);

  // Auto-sync push subscription if local timezone offset changes (e.g. user travels)
  useEffect(() => {
    const syncTimezone = async () => {
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        const currentOffset = new Date().getTimezoneOffset();
        const lastSyncedOffset = localStorage.getItem('aegis_last_synced_offset');
        
        if (lastSyncedOffset !== String(currentOffset)) {
          const success = await subscribeToPushNotifications(deviceId, reminderTime, pillName);
          if (success) {
            localStorage.setItem('aegis_last_synced_offset', String(currentOffset));
          }
        }
      }
    };
    
    const timer = setTimeout(syncTimezone, 3000);
    return () => clearTimeout(timer);
  }, [deviceId, reminderTime, pillName]);

  useEffect(() => {
    const stopChecking = startReminderCheck(reminderTime, logs, pillName);
    return () => {
      if (stopChecking) stopChecking();
    };
  }, [reminderTime, logs, pillName]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            deviceId={deviceId}
            clientId={clientId}
            logs={logs}
            logPill={logPillWithSundayPostcard}
            pillName={pillName}
            reminderTime={reminderTime}
            currentStreak={currentStreak}
            stats={stats}
            showToast={showToast}
            promptMood={promptMood}
            theme={theme}
            unlockedCollectibles={unlockedCollectibles}
            visibleCollectibles={visibleCollectibles}
            unlockedThemes={unlockedThemes}
            toggleCollectible={toggleCollectible}
            availableTokens={availableTokens}
            totalTokens={totalTokens}
            onGoToStore={() => setActiveTab('store')}
          />
        );
      case 'store':
        return (
          <StoreView
            logs={logs}
            unlockedCollectibles={unlockedCollectibles}
            visibleCollectibles={visibleCollectibles}
            buyCollectible={buyCollectible}
            toggleCollectible={toggleCollectible}
            unlockedThemes={unlockedThemes}
            buyTheme={buyTheme}
            availableTokens={availableTokens}
            totalTokens={totalTokens}
            onGoToGarden={() => setActiveTab('dashboard')}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            logs={logs}
            logPill={logPillWithSundayPostcard}
            startDate={startDate}
            showToast={showToast}
            promptMood={promptMood}
          />
        );
      case 'stats':
        return (
          <StatsView
            logs={logs}
            startDate={startDate}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            stats={stats}
          />
        );
      case 'games':
        return <GamesView deviceId={deviceId} currentStreak={currentStreak} />;
      case 'settings':
        return (
          <SettingsView
            deviceId={deviceId}
            clientId={clientId}
            logs={logs}
            pillName={pillName}
            updateSettings={updateSettings}
            reminderTime={reminderTime}
            startDate={startDate}
            theme={theme}
            changeTheme={changeTheme}
            pushMessage={pushMessage}
            importLogs={importLogs}
            resetAllData={resetAllData}
            showToast={showToast}
            unlockedThemes={unlockedThemes}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      
      {/* Toast Alert Popup */}
      {toast.visible && (
        <div className="toast-msg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          {toast.message}
        </div>
      )}

      {/* Brand Top Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo" style={{ background: 'linear-gradient(135deg, #ff4d6d 0%, #ff758f 100%)', boxShadow: '0 0 15px rgba(255, 77, 109, 0.4)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#fff"/>
              <circle cx="8" cy="9.5" r="1.5" fill="#ff4d6d"/>
              <circle cx="16" cy="9.5" r="1.5" fill="#ff4d6d"/>
              <path d="M10 13c1 1 3 1 4 0" stroke="#ff4d6d" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">ChuchiTracker</span>
        </div>
        
        {/* Token Balance */}
        <div 
          onClick={() => setActiveTab('store')}
          className="header-token-badge"
        >
          <span>🪙</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{availableTokens}</span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Mi Ritual
        </div>
      </header>

      {/* Dynamic Tab Body */}
      <main style={{ flex: 1 }}>
        {renderContent()}
      </main>

      {/* iOS & Android friendly Fixed Bottom Nav Bar */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          aria-label="Panel"
        >
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          Panel
        </button>

        <button 
          className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
          aria-label="Calendario"
        >
          <svg viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Calendario
        </button>

        <button 
          className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
          aria-label="Estadísticas"
        >
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Estadísticas
        </button>

        <button 
          className={`nav-item ${activeTab === 'store' ? 'active' : ''}`}
          onClick={() => setActiveTab('store')}
          aria-label="Tienda"
        >
          <svg viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          Tienda
        </button>

        <button 
          className={`nav-item ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
          aria-label="Juegos"
        >
          <svg viewBox="0 0 24 24">
            <path d="M7 8h10a5 5 0 0 1 4.7 6.7l-1 2.8a2.3 2.3 0 0 1-3.9.7l-1.3-1.7h-9L5.2 18.2a2.3 2.3 0 0 1-3.9-.7l-1-2.8A5 5 0 0 1 5 8h2z" />
            <line x1="7" y1="11" x2="7" y2="15" />
            <line x1="5" y1="13" x2="9" y2="13" />
            <circle cx="16" cy="12" r=".7" fill="currentColor" />
            <circle cx="18.5" cy="14.5" r=".7" fill="currentColor" />
          </svg>
          Juegos
        </button>

        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          aria-label="Ajustes"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Ajustes
        </button>
      </nav>

      {/* Mood Selector Modal Overlay */}
      {moodModal.visible && (
        <div className="mood-modal-overlay">
          <div className="mood-modal-card glass-panel glow">
            <h3>¿Cómo te sientes hoy?</h3>
            <p className="subtitle" style={{ marginBottom: '20px' }}>Selecciona tu humor o síntoma al tomar la dosis</p>
            
            <div className="mood-grid">
              <button className="mood-option-btn" onClick={() => { moodModal.onSelect('😊'); setMoodModal({ visible: false, dateStr: '', onSelect: null }); }}>
                <span className="mood-emoji">😊</span>
                <span className="mood-lbl-text">Alegre / Bien</span>
              </button>
              <button className="mood-option-btn" onClick={() => { moodModal.onSelect('😐'); setMoodModal({ visible: false, dateStr: '', onSelect: null }); }}>
                <span className="mood-emoji">😐</span>
                <span className="mood-lbl-text">Neutral</span>
              </button>
              <button className="mood-option-btn" onClick={() => { moodModal.onSelect('😴'); setMoodModal({ visible: false, dateStr: '', onSelect: null }); }}>
                <span className="mood-emoji">😴</span>
                <span className="mood-lbl-text">Cansado</span>
              </button>
              <button className="mood-option-btn" onClick={() => { moodModal.onSelect('🤢'); setMoodModal({ visible: false, dateStr: '', onSelect: null }); }}>
                <span className="mood-emoji">🤢</span>
                <span className="mood-lbl-text">Náusea / Mal</span>
              </button>
            </div>

            <div className="mood-modal-actions">
              <button className="mood-action-btn skip" onClick={() => { moodModal.onSelect(''); setMoodModal({ visible: false, dateStr: '', onSelect: null }); }}>
                Omitir humor
              </button>
              <button className="mood-action-btn cancel" onClick={() => setMoodModal({ visible: false, dateStr: '', onSelect: null })}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {dogPromptVisible && (
        <div className="mood-modal-overlay">
          <div className="mood-modal-card glass-panel glow dog-prompt-card">
            <div className="dog-prompt-icon">🐶</div>
            <h3>Ya puedes desbloquear a Perro</h3>
            <p className="subtitle dog-prompt-copy">
              Tienes 🪙 {availableTokens} tokens. Perro puede acompañarte en el jardín por 🪙 {dogPrice}.
            </p>

            <div className="mood-modal-actions">
              <button className="mood-action-btn skip" onClick={buyDogFromPrompt}>
                Desbloquear Perro
              </button>
              <button className="mood-action-btn cancel" onClick={dismissDogPrompt}>
                Después
              </button>
            </div>
          </div>
        </div>
      )}

      {weeklyPostcardModalVisible && (
        <div className="mood-modal-overlay postcard-modal-overlay">
          <WeeklyPostcard
            logs={logs}
            unlockedCollectibles={unlockedCollectibles}
            visibleCollectibles={visibleCollectibles}
            variant="modal"
            onClose={() => setWeeklyPostcardModalVisible(false)}
          />
        </div>
      )}

    </div>
  );
}
