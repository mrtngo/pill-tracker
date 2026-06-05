import React, { useState, useEffect } from 'react';
import { usePillData, getLocalDateString } from './hooks/usePillData';
import { startReminderCheck } from './utils/notifications';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import SettingsView from './components/SettingsView';

export default function App() {
  const {
    deviceId,
    logs,
    pillName,
    reminderTime,
    startDate,
    logPill,
    updateSettings,
    importLogs,
    resetAllData,
    currentStreak,
    longestStreak,
    stats
  } = usePillData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = (message) => {
    setToast({ message, visible: true });
  };

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Handle URL query parameters on startup (e.g. ?action=confirm)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'confirm') {
      const todayStr = getLocalDateString();
      logPill(todayStr, 'taken');
      showToast(`¡Tu ${pillName} de hoy ha sido registrada!`);
      // Clean up URL parameters so it doesn't log again on page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [logPill, pillName]);

  // Listen to messages from the Service Worker
  useEffect(() => {
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'LOG_PILL_TAKEN') {
        const todayStr = getLocalDateString();
        logPill(todayStr, 'taken');
        showToast(`¡Tu ${pillName} de hoy ha sido registrada!`);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, [logPill, pillName]);

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
            logs={logs}
            logPill={logPill}
            pillName={pillName}
            reminderTime={reminderTime}
            currentStreak={currentStreak}
            stats={stats}
            showToast={showToast}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            logs={logs}
            logPill={logPill}
            startDate={startDate}
            showToast={showToast}
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
      case 'settings':
        return (
          <SettingsView
            deviceId={deviceId}
            logs={logs}
            pillName={pillName}
            updateSettings={updateSettings}
            reminderTime={reminderTime}
            startDate={startDate}
            importLogs={importLogs}
            resetAllData={resetAllData}
            showToast={showToast}
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
          <div className="brand-logo">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <span className="brand-name">Aegis</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Tratamiento
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

    </div>
  );
}
