import React, { useState } from 'react';
import { getLocalDateString, getDaysDifference } from '../hooks/usePillData';

export default function CalendarView({ logs, logPill, startDate, showToast }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Helper: Get days in a month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper: Get first day of week (0 = Sunday, 6 = Saturday)
  const getFirstDayOfWeek = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfWeek(currentYear, currentMonth);

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const getDayStatus = (day) => {
    if (!day) return 'empty';
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const todayStr = getLocalDateString();
    
    if (new Date(dateStr) > new Date(todayStr)) {
      return 'future';
    }

    const log = logs[dateStr];
    if (log?.taken) return 'taken';
    if (log?.status === 'skipped') return 'skipped';
    
    if (new Date(dateStr) < new Date(startDate)) {
      return 'inactive';
    }

    return 'missed';
  };

  const handleDateClick = (day) => {
    if (!day) return;
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const todayStr = getLocalDateString();
    
    if (new Date(dateStr) > new Date(todayStr)) {
      showToast('No puedes registrar tomas futuras');
      return;
    }

    const status = getDayStatus(day);
    if (status === 'taken') {
      logPill(dateStr, 'none');
      showToast(`Toma eliminada para el ${day} de ${monthNames[currentMonth]}`);
    } else {
      logPill(dateStr, 'taken');
      showToast(`Toma registrada para el ${day} de ${monthNames[currentMonth]}`);
    }
  };

  const renderYearHeatmap = () => {
    const today = new Date();
    const heatmapDays = [];
    
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);
      
      let level = 'empty';
      const log = logs[dateStr];
      const isPastStart = new Date(dateStr) >= new Date(startDate);
      
      if (log?.taken) {
        level = 'taken';
      } else if (d <= today && isPastStart) {
        level = 'missed';
      } else if (d <= today && !isPastStart) {
        level = 'before-start';
      }

      heatmapDays.push({
        dateStr,
        level,
        dayOfWeek: d.getDay()
      });
    }

    return (
      <div className="heatmap-container">
        <div className="heatmap-grid">
          {heatmapDays.map((item, idx) => (
            <div 
              key={idx}
              className={`heatmap-cell ${item.level}`}
              title={`${item.dateStr}: ${item.level === 'taken' ? 'Tomada' : item.level === 'missed' ? 'Olvidada' : 'Sin registro'}`}
            />
          ))}
        </div>
        <div className="heatmap-legend">
          <span>Menor constancia</span>
          <div className="legend-cells">
            <div className="heatmap-cell before-start" />
            <div className="heatmap-cell missed" />
            <div className="heatmap-cell taken" />
          </div>
          <span>Mayor constancia</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in-section">
      {/* Month Picker Calendar */}
      <div className="glass-panel">
        <div className="calendar-header">
          <button className="nav-btn" onClick={handlePrevMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h2>{monthNames[currentMonth]} {currentYear}</h2>
          <button className="nav-btn" onClick={handleNextMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div className="calendar-grid">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
            <div key={i} className="calendar-day-header">{d}</div>
          ))}
          
          {daysArray.map((day, idx) => {
            const status = getDayStatus(day);
            return (
              <button
                key={idx}
                className={`calendar-cell ${status}`}
                disabled={!day || status === 'future'}
                onClick={() => handleDateClick(day)}
              >
                {day}
                {day && <span className={`cell-indicator ${status}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Year Heatmap Contribution Card */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Mapa de Constancia Anual</h2>
        <p className="subtitle" style={{ marginBottom: '16px' }}>Visualización de tu constancia en los últimos 12 meses</p>
        {renderYearHeatmap()}
      </div>

      <style>{`
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .calendar-header h2 {
          margin-bottom: 0;
          font-size: 18px;
        }
        .nav-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          text-align: center;
        }
        .calendar-day-header {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          padding-bottom: 6px;
        }
        .calendar-cell {
          aspect-ratio: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .calendar-cell:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .calendar-cell:disabled {
          background: transparent;
          border-color: transparent;
          color: rgba(255, 255, 255, 0.15);
          cursor: default;
        }
        .calendar-cell.future {
          color: rgba(255, 255, 255, 0.25);
        }
        .calendar-cell.empty {
          background: transparent;
          border-color: transparent;
          cursor: default;
        }
        .cell-indicator {
          position: absolute;
          bottom: 5px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .cell-indicator.taken {
          background-color: var(--success);
          box-shadow: 0 0 6px var(--success);
        }
        .cell-indicator.missed {
          background-color: var(--danger);
          box-shadow: 0 0 6px var(--danger);
        }
        .cell-indicator.skipped {
          background-color: var(--skipped);
        }
        .calendar-cell.taken {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.25);
        }
        .calendar-cell.missed {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.25);
        }

        /* Heatmap Grid */
        .heatmap-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .heatmap-grid {
          display: grid;
          grid-template-rows: repeat(7, 1fr);
          grid-auto-flow: column;
          gap: 4px;
          justify-content: start;
        }
        .heatmap-cell {
          width: 9px;
          height: 9px;
          border-radius: 2px;
          background-color: rgba(255, 255, 255, 0.05);
        }
        .heatmap-cell.taken {
          background-color: var(--accent-cyan);
          box-shadow: 0 0 4px rgba(0, 242, 254, 0.3);
        }
        .heatmap-cell.missed {
          background-color: var(--danger);
        }
        .heatmap-cell.before-start {
          background-color: rgba(255, 255, 255, 0.02);
        }
        .heatmap-legend {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        .legend-cells {
          display: flex;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}
