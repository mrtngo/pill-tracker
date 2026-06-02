import React, { useState, useEffect } from 'react';
import { 
  getNotificationPermissionState, 
  requestNotificationPermission, 
  sendNotification, 
  isNotificationSupported 
} from '../utils/notifications';
import { getLocalDateString } from '../hooks/usePillData';

export default function SettingsView({
  logs,
  pillName,
  setPillName,
  reminderTime,
  setReminderTime,
  startDate,
  setStartDate,
  importLogs,
  resetAllData,
  showToast
}) {
  const [tempName, setTempName] = useState(pillName);
  const [tempTime, setTempTime] = useState(reminderTime);
  const [tempStart, setTempStart] = useState(startDate);
  const [notifState, setNotifState] = useState('default');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    setNotifState(getNotificationPermissionState());
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setPillName(tempName);
    setReminderTime(tempTime);
    setStartDate(tempStart);
    showToast('Ajustes guardados correctamente');
  };

  const handleToggleNotifications = async () => {
    if (!isNotificationSupported()) {
      showToast('Las notificaciones no están soportadas en este navegador');
      return;
    }

    const state = await requestNotificationPermission();
    setNotifState(state);
    
    if (state === 'granted') {
      showToast('¡Notificaciones activadas!');
      sendNotification('Notificaciones Activas', 'Recibirás un aviso diario a la hora configurada.');
    } else if (state === 'denied') {
      showToast('Notificaciones bloqueadas. Actívalas en los ajustes del navegador.');
    }
  };

  const handleTestNotification = async () => {
    const sent = await sendNotification(
      `Recordatorio: Toma tu ${pillName}`,
      `Esta es una notificación de prueba para tu recordatorio de dosis diaria.`
    );
    if (!sent) {
      showToast('No se pudo enviar la notificación. Verifica los permisos.');
    }
  };

  const handleExportData = () => {
    try {
      const dataObj = {
        app: 'Aegis Pill Tracker',
        version: '1.0.0',
        pillName,
        reminderTime,
        startDate,
        logs
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `aegis_pastilla_logs_${getLocalDateString()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Exportación completa. Guarda el archivo con seguridad.');
    } catch (e) {
      console.error(e);
      showToast('Error al exportar los datos');
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        if (json.app !== 'Aegis Pill Tracker' || !json.logs) {
          showToast('Estructura del archivo de respaldo no válida');
          return;
        }

        importLogs(
          json.logs,
          json.pillName || 'Pastilla Diaria',
          json.reminderTime || '21:00',
          json.startDate || getLocalDateString()
        );

        setTempName(json.pillName || 'Pastilla Diaria');
        setTempTime(json.reminderTime || '21:00');
        setTempStart(json.startDate || getLocalDateString());

        showToast('¡Datos restaurados con éxito!');
      } catch (err) {
        console.error(err);
        showToast('Error al leer el archivo. JSON no válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetAllData();
    setTempName('Pastilla Diaria');
    setTempTime('21:00');
    setTempStart(getLocalDateString());
    setShowConfirmReset(false);
    showToast('Los datos de la aplicación han sido borrados');
  };

  return (
    <div className="fade-in-section">
      
      {/* Configuration Form Panel */}
      <div className="glass-panel">
        <h2>Preferencias del Tratamiento</h2>
        <form onSubmit={handleSaveSettings} className="settings-form">
          <div className="form-group">
            <label htmlFor="pill-name">Nombre de la Pastilla / Tratamiento</label>
            <input 
              id="pill-name" 
              type="text" 
              value={tempName} 
              onChange={(e) => setTempName(e.target.value)}
              required
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="reminder-time">Hora del Recordatorio</label>
              <input 
                id="reminder-time" 
                type="time" 
                value={tempTime} 
                onChange={(e) => setTempTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="start-date">Fecha de Inicio del Tratamiento</label>
              <input 
                id="start-date" 
                type="date" 
                value={tempStart} 
                onChange={(e) => setTempStart(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            Guardar Cambios
          </button>
        </form>
      </div>

      {/* Notifications Management Panel */}
      <div className="glass-panel">
        <h2>Recordatorios y Notificaciones</h2>
        <p className="subtitle">Configura los avisos locales en este dispositivo</p>

        <div className="notif-status-card">
          <div>
            <div className="status-label">Estado del Permiso:</div>
            <div className={`status-val ${notifState}`}>
              {notifState === 'granted' ? 'Activado (Permitido)' : notifState === 'denied' ? 'Bloqueado (Denegado)' : 'Sin configurar (Predeterminado)'}
            </div>
          </div>
          <button 
            onClick={handleToggleNotifications}
            className={`btn-secondary ${notifState === 'granted' ? 'disabled' : ''}`}
            disabled={notifState === 'granted'}
          >
            {notifState === 'granted' ? 'Activo' : 'Activar Avisos'}
          </button>
        </div>

        {notifState === 'granted' && (
          <button 
            onClick={handleTestNotification} 
            className="btn-secondary" 
            style={{ width: '100%', marginTop: '16px' }}
          >
            Enviar Notificación de Prueba
          </button>
        )}
      </div>

      {/* Data Operations Panel */}
      <div className="glass-panel">
        <h2>Operaciones de Datos</h2>
        <p className="subtitle">Resguarda o restaura tus registros para el seguimiento de 10 años</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleExportData} style={{ justifyContent: 'start' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar Copia (.json)
          </button>

          <label className="btn-secondary" style={{ cursor: 'pointer', justifyContent: 'start' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Restaurar Copia (.json)
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportData} 
              style={{ display: 'none' }} 
            />
          </label>

          {showConfirmReset ? (
            <div className="confirm-reset-box">
              <p>Atención: Esto eliminará permanentemente todos tus registros y ajustes. ¿Estás completamente seguro?</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button className="btn-secondary danger" onClick={handleReset} style={{ flex: 1 }}>
                  Sí, restablecer todo
                </button>
                <button className="btn-secondary" onClick={() => setShowConfirmReset(false)} style={{ flex: 1 }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="btn-secondary danger" 
              onClick={() => setShowConfirmReset(true)}
              style={{ justifyContent: 'start', marginTop: '10px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Restablecer Aplicación
            </button>
          )}
        </div>
      </div>

      <style>{`
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .form-group-row {
          display: flex;
          gap: 16px;
        }
        .settings-form label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .settings-form input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .settings-form input:focus {
          border-color: var(--accent-cyan);
        }
        
        .notif-status-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }
        .status-val {
          font-size: 14px;
          font-weight: 700;
        }
        .status-val.granted { color: var(--success); }
        .status-val.denied { color: var(--danger); }
        .status-val.default { color: var(--warning); }
        
        .btn-secondary.danger {
          color: var(--danger);
          border-color: rgba(239, 68, 68, 0.15);
        }
        .btn-secondary.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--danger);
        }
        .confirm-reset-box {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          padding: 16px;
          font-size: 13px;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
