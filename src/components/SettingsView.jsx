import React, { useState, useEffect } from 'react';
import { 
  getNotificationPermissionState, 
  requestNotificationPermission, 
  sendNotification, 
  isNotificationSupported,
  subscribeToPushNotifications
} from '../utils/notifications';
import { getLocalDateString } from '../hooks/usePillData';

export default function SettingsView({
  deviceId,
  logs,
  pillName,
  updateSettings,
  reminderTime,
  startDate,
  importLogs,
  resetAllData,
  showToast
}) {
  const [tempName, setTempName] = useState(pillName);
  const [tempTime, setTempTime] = useState(reminderTime);
  const [tempStart, setTempStart] = useState(startDate);
  const [notifState, setNotifState] = useState('default');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Custom Messages state
  const [customMessages, setCustomMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    setNotifState(getNotificationPermissionState());
  }, []);

  // Fetch custom messages on load
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?deviceId=${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCustomMessages(data.messages);
          }
        }
      } catch (err) {
        console.error('Error fetching custom messages:', err);
      }
    };

    if (deviceId) {
      fetchMessages();
    }
  }, [deviceId]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    updateSettings(tempName, tempTime, tempStart);
    showToast('Ajustes guardados correctamente');
    
    if (getNotificationPermissionState() === 'granted') {
      // Sync the settings with the push backend
      await subscribeToPushNotifications(deviceId, tempTime, tempName);
    }
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
      // Register with the push backend
      await subscribeToPushNotifications(deviceId, reminderTime, pillName);
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

  const handleAddMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          message: newMessage.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCustomMessages((prev) => [...prev, data.message]);
          setNewMessage('');
          showToast('Frase motivacional guardada');
        }
      }
    } catch (err) {
      console.error('Error adding message:', err);
      showToast('Error al guardar el mensaje');
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          id
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCustomMessages((prev) => prev.filter((msg) => msg.id !== id));
          showToast('Frase eliminada');
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      showToast('Error al eliminar el mensaje');
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

      {/* Custom Encouragement Messages Panel */}
      <div className="glass-panel">
        <h2>Mensajes Diarios Personalizados</h2>
        <p className="subtitle">Agrega tus propias frases para inspirarte al registrar tu dosis</p>
        
        <form onSubmit={handleAddMessage} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input 
            type="text" 
            placeholder="Ej: ¡Vamos por un día más de salud! 🌟" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ 
              flex: 1,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '14px',
              outline: 'none'
            }}
            required
          />
          <button type="submit" className="btn-primary" style={{ minWidth: '90px' }}>
            Agregar
          </button>
        </form>

        <div className="custom-messages-list">
          {customMessages.length === 0 ? (
            <p className="subtitle" style={{ fontStyle: 'italic', textAlign: 'center', margin: '12px 0' }}>
              Aún no has agregado frases personalizadas.
            </p>
          ) : (
            customMessages.map((msg) => (
              <div key={msg.id} className="message-item">
                <span className="msg-text">"{msg.message}"</span>
                <button 
                  className="delete-msg-btn"
                  onClick={() => handleDeleteMessage(msg.id)}
                  aria-label="Eliminar mensaje"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
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

        .custom-messages-list {
          max-height: 250px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .message-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13.5px;
        }
        .msg-text {
          font-style: italic;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .delete-msg-btn {
          background: transparent;
          border: none;
          color: var(--danger);
          opacity: 0.7;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .delete-msg-btn:hover {
          opacity: 1;
          background: rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>
  );
}
