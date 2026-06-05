import React from 'react';
import { getLocalDateString } from '../hooks/usePillData';

export default function StatsView({ logs, startDate, currentStreak, longestStreak, stats }) {
  
  // Calculate compliance since start date (forced Spanish locale)
  const getMonthlyComplianceData = () => {
    const data = [];
    const today = new Date();
    const start = new Date(startDate);
    
    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();

    // Calculate total months difference
    const totalMonths = (todayYear - startYear) * 12 + (todayMonth - startMonth) + 1;
    const monthsToShow = totalMonths > 0 ? totalMonths : 1;

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(todayYear, todayMonth - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const monthLabel = d.toLocaleString('es', { month: 'short' });
      
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      let expectedDays = 0;
      let loggedDays = 0;

      for (let day = 1; day <= endOfMonth.getDate(); day++) {
        const checkDate = new Date(year, month, day);
        const checkDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const isAfterStart = checkDate >= new Date(startDate);
        const isBeforeToday = checkDate <= today;

        if (isAfterStart && isBeforeToday) {
          expectedDays++;
          if (logs[checkDateStr]?.taken) {
            loggedDays++;
          }
        }
      }

      const rate = expectedDays > 0 ? Math.round((loggedDays / expectedDays) * 100) : 100;
      data.push({
        label: `${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`, // Capitalize
        rate: rate,
        expected: expectedDays,
        taken: loggedDays
      });
    }

    return data;
  };

  // Milestone countdown computations
  const getMilestoneData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // 2-Year milestone (Baby Planning)
    const end2Yr = new Date(start);
    end2Yr.setFullYear(end2Yr.getFullYear() + 2);
    const totalDays2Yr = Math.ceil((end2Yr - start) / (1000 * 60 * 60 * 24));
    const diff2Yr = end2Yr - today;
    const remainingDays2Yr = Math.ceil(diff2Yr / (1000 * 60 * 60 * 24));
    const elapsedDays2Yr = totalDays2Yr - Math.max(0, remainingDays2Yr);
    const pct2Yr = Math.min(100, Math.max(0, Math.round((elapsedDays2Yr / totalDays2Yr) * 100)));

    // 10-Year milestone (Regimen Complete)
    const end10Yr = new Date(start);
    end10Yr.setFullYear(end10Yr.getFullYear() + 10);
    const totalDays10Yr = Math.ceil((end10Yr - start) / (1000 * 60 * 60 * 24));
    const diff10Yr = end10Yr - today;
    const remainingDays10Yr = Math.ceil(diff10Yr / (1000 * 60 * 60 * 24));
    const elapsedDays10Yr = totalDays10Yr - Math.max(0, remainingDays10Yr);
    const pct10Yr = Math.min(100, Math.max(0, Math.round((elapsedDays10Yr / totalDays10Yr) * 100)));

    return {
      m2Yr: {
        dateStr: end2Yr.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        remaining: remainingDays2Yr,
        pct: pct2Yr,
        label: 'Meta de 2 Años: Planificación de Bebé 👶'
      },
      m10Yr: {
        dateStr: end10Yr.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        remaining: remainingDays10Yr,
        pct: pct10Yr,
        label: 'Meta de 10 Años: Ritual Completo 🛡️'
      }
    };
  };

  const monthlyData = getMonthlyComplianceData();
  const milestones = getMilestoneData();

  // SVG Chart Dimensions
  const chartWidth = 340;
  const chartHeight = 150;
  const paddingLeft = 35;
  const paddingBottom = 25;
  const graphWidth = chartWidth - paddingLeft;
  const graphHeight = chartHeight - paddingBottom;

  return (
    <div className="fade-in-section">
      {/* Overview Stat Grid */}
      <div className="stats-large-grid">
        <div className="glass-panel stat-big-card">
          <div className="stat-num glow-teal">{stats.complianceRate}%</div>
          <div className="stat-lbl">Constancia General</div>
        </div>
        <div className="glass-panel stat-big-card">
          <div className="stat-num glow-amber">{longestStreak}</div>
          <div className="stat-lbl">Mejor Racha (Días)</div>
        </div>
      </div>

      {/* Milestones Card */}
      <div className="glass-panel">
        <h2>Metas de mi Ritual</h2>
        <p className="subtitle">Cronología de tu ritual y objetivos clave</p>
        
        <div className="milestones-container">
          {/* 2-Year Milestone */}
          <div className="milestone-card">
            <div className="milestone-header">
              <span className="milestone-title">{milestones.m2Yr.label}</span>
              <span className="milestone-badge">
                {milestones.m2Yr.remaining <= 0 ? '¡Logrado!' : `${milestones.m2Yr.remaining} días rest.`}
              </span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill teal" style={{ width: `${milestones.m2Yr.pct}%` }} />
            </div>
            <div className="milestone-footer">
              <span>Progreso: {milestones.m2Yr.pct}%</span>
              <span>Fecha: {milestones.m2Yr.dateStr}</span>
            </div>
          </div>

          {/* 10-Year Milestone */}
          <div className="milestone-card">
            <div className="milestone-header">
              <span className="milestone-title">{milestones.m10Yr.label}</span>
              <span className="milestone-badge">
                {milestones.m10Yr.remaining <= 0 ? '¡Logrado!' : `${milestones.m10Yr.remaining} días rest.`}
              </span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill violet" style={{ width: `${milestones.m10Yr.pct}%` }} />
            </div>
            <div className="milestone-footer">
              <span>Progreso: {milestones.m10Yr.pct}%</span>
              <span>Fecha: {milestones.m10Yr.dateStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="glass-panel">
        <h2>Resumen de mi Ritual</h2>
        <p className="subtitle">Desglose de registros desde la fecha de inicio ({startDate})</p>

        <div className="stats-rows">
          <div className="stat-row">
            <span className="lbl">Total Tomadas</span>
            <span className="val success">{stats.takenCount} pastillas</span>
          </div>
          <div className="stat-row">
            <span className="lbl">Total Olvidadas</span>
            <span className="val danger">{Math.max(0, stats.totalDays - stats.takenCount - stats.skippedCount)} pastillas</span>
          </div>
          <div className="stat-row">
            <span className="lbl">Saltadas / Pausadas</span>
            <span className="val skipped">{stats.skippedCount} días</span>
          </div>
          <div className="stat-row">
            <span className="lbl">Total Días Contados</span>
            <span className="val">{stats.totalDays} días</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart Card */}
      <div className="glass-panel">
        <h2>Constancia Mensual</h2>
        <p className="subtitle">Porcentaje de tomas por mes desde el inicio de tu ritual</p>

        <div className="chart-wrapper">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-bar-chart">
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-cyan)" />
                <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((level) => {
              const y = graphHeight - (level / 100) * graphHeight;
              return (
                <g key={level}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={chartWidth} 
                    y2={y} 
                    stroke="rgba(255,255,255,0.06)" 
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={y + 4} 
                    fill="var(--text-secondary)" 
                    fontSize="9" 
                    textAnchor="end"
                  >
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {monthlyData.map((item, idx) => {
              const barCount = monthlyData.length;
              const spacing = graphWidth / barCount;
              const barWidth = Math.min(24, Math.max(8, spacing * 0.6));
              const x = paddingLeft + idx * spacing + (spacing - barWidth) / 2;
              const barHeight = (item.rate / 100) * graphHeight;
              const y = graphHeight - barHeight;

              return (
                <g key={idx} className="chart-bar-group">
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    className="chart-bar"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 6}
                    fill="var(--text-secondary)"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    fill="var(--accent-cyan)"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    className="bar-value-label"
                  >
                    {item.rate}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <style>{`
        .stats-large-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .stat-big-card {
          text-align: center;
          padding: 24px 16px;
        }
        .stat-num {
          font-size: 38px;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 6px;
          letter-spacing: -1px;
        }
        .glow-teal {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 10px rgba(0, 242, 254, 0.2));
        }
        .glow-amber {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 10px rgba(245, 158, 11, 0.2));
        }
        .stat-lbl {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 600;
        }
        
        /* Milestones Styling */
        .milestones-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .milestone-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 14px 16px;
        }
        .milestone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .milestone-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .milestone-badge {
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-cyan);
          background: rgba(0, 242, 254, 0.1);
          padding: 3px 10px;
          border-radius: 20px;
        }
        .progress-bar-track {
          height: 8px;
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
        }
        .progress-bar-fill.teal {
          background: linear-gradient(90deg, #00f2fe, #4facfe);
          box-shadow: 0 0 8px rgba(0, 242, 254, 0.4);
        }
        .progress-bar-fill.violet {
          background: linear-gradient(90deg, #892cdc, #4facfe);
          box-shadow: 0 0 8px rgba(137, 44, 220, 0.4);
        }
        .milestone-footer {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stats-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .stat-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .stat-row .lbl {
          color: var(--text-secondary);
          font-weight: 500;
        }
        .stat-row .val {
          font-weight: 700;
        }
        .stat-row .val.success { color: var(--success); }
        .stat-row .val.danger { color: var(--danger); }
        .stat-row .val.skipped { color: var(--text-secondary); }

        .chart-wrapper {
          padding: 10px 0;
          display: flex;
          justify-content: center;
        }
        .svg-bar-chart {
          width: 100%;
          max-width: 420px;
          height: auto;
          overflow: visible;
        }
        .chart-bar {
          fill: url(#barGrad);
          transition: fill 0.3s ease;
        }
        .chart-bar-group {
          cursor: pointer;
        }
        .chart-bar-group:hover .chart-bar {
          fill: var(--accent-cyan);
          filter: drop-shadow(0 0 4px var(--accent-gradient-glow));
        }
        .bar-value-label {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .chart-bar-group:hover .bar-value-label {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
