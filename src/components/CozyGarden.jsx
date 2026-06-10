import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const PLANT_NAMES = [
  "Sábila (Aloe)", "Suculenta Rosa", "Trébol de la Suerte", "Lirio de la Paz",
  "Cactus del Desierto", "Helecho Frondoso", "Girasol de Verano", "Árbol de Jade",
  "Bonsai de Otoño", "Orquídea Exótica", "Pino Silvestre", "Flor de Pascua"
];

// Helper to get total days in a month
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// Helper to parse logs and count taken pills for a specific year and month
const getMonthlyStats = (logs, year, monthIndex, forceTakenToday = false) => {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(year, monthIndex);
  
  let takenCount = 0;
  Object.entries(logs || {}).forEach(([dateStr, logInfo]) => {
    if (dateStr.startsWith(prefix) && logInfo?.taken) {
      takenCount++;
    }
  });

  // Optimistic update: if forceTakenToday is true, and today hasn't already been counted as taken in logs
  if (forceTakenToday && monthIndex === new Date().getMonth()) {
    const todayStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const todayLog = logs?.[todayStr];
    if (!todayLog || !todayLog.taken) {
      takenCount++;
    }
  }

  const pct = daysInMonth > 0 ? (takenCount / daysInMonth) * 100 : 0;
  
  // Calculate Growth Stage (0 to 5)
  let stage = 0;
  if (takenCount >= 1) {
    if (pct < 20) stage = 1;
    else if (pct < 40) stage = 2;
    else if (pct < 70) stage = 3;
    else if (pct < 90) stage = 4;
    else stage = 5;
  }

  return { takenCount, daysInMonth, pct, stage };
};

export default function CozyGarden({ currentStreak, isTakenToday, logs, theme }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth(); // 0-11

  // State to track which month and year's plant is being viewed in the main pot
  const [viewMonth, setViewMonth] = useState(currentMonthIdx);
  const [viewYear, setViewYear] = useState(currentYear);
  const [isWatering, setIsWatering] = useState(false);
  const [isWateringModalOpen, setIsWateringModalOpen] = useState(false);
  const [wobble, setWobble] = useState(false);
  const [showWateringAlert, setShowWateringAlert] = useState(false);
  const [showShelf, setShowShelf] = useState(false);

  const prevTakenRef = useRef(isTakenToday);

  // Auto-watering detection on mark taken
  useEffect(() => {
    if (isTakenToday && !prevTakenRef.current) {
      // Only auto-water if we are currently viewing the active month/year
      if (viewMonth === currentMonthIdx && viewYear === currentYear) {
        triggerWatering(true);
      }
    }
    prevTakenRef.current = isTakenToday;
  }, [isTakenToday, viewMonth, viewYear]);

  const triggerWatering = (showModal = false) => {
    if (isWatering) return;
    setIsWatering(true);
    setWobble(true);
    if (showModal) {
      setIsWateringModalOpen(true);
    }
    setTimeout(() => {
      setIsWatering(false);
      setIsWateringModalOpen(false);
    }, 3500);
    setTimeout(() => setWobble(false), 800);
  };

  const handlePotClick = () => {
    const isViewingCurrent = viewMonth === currentMonthIdx && viewYear === currentYear;
    
    if (!isViewingCurrent) {
      // Past plant just wiggles
      setWobble(true);
      setTimeout(() => setWobble(false), 600);
      return;
    }

    if (!isTakenToday) {
      setShowWateringAlert(true);
      setTimeout(() => setShowWateringAlert(false), 3000);
    }
    
    setWobble(true);
    setTimeout(() => setWobble(false), 600);
    
    if (isTakenToday && !isWatering) {
      triggerWatering(false);
    }
  };

  // 1. Get previous months data for the shelf from live database logs
  const getShelfMonths = () => {
    const monthlyData = {};
    
    // Group logs by year-month
    Object.entries(logs || {}).forEach(([dateStr, logInfo]) => {
      if (logInfo?.taken) {
        const [year, month] = dateStr.split('-');
        if (year && month) {
          const key = `${year}-${month}`; // e.g. "2026-06"
          monthlyData[key] = (monthlyData[key] || 0) + 1;
        }
      }
    });

    // Always ensure the active current month is present in the list
    const currentKey = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
    if (!monthlyData[currentKey]) {
      monthlyData[currentKey] = 0;
    }

    // Convert keys into shelf items
    const shelfItems = [];
    Object.entries(monthlyData).forEach(([key, takenCount]) => {
      const [year, month] = key.split('-').map(Number);
      const mIdx = month - 1;
      
      const stats = getMonthlyStats(logs, year, mIdx, (mIdx === currentMonthIdx && year === currentYear) && (isTakenToday || isWatering));
      
      shelfItems.push({
        monthIndex: mIdx,
        year: year,
        stats: stats
      });
    });

    // Sort chronologically descending (most recent on the left)
    shelfItems.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.monthIndex - a.monthIndex;
    });

    return shelfItems;
  };

  const shelfMonths = getShelfMonths();
  // Show the shelf if we have at least one month with logs
  const hasItemsOnShelf = shelfMonths.length > 0;

  const isViewingCurrentMonth = viewMonth === currentMonthIdx && viewYear === currentYear;

  // 2. Get stats for the viewed month (pulls from shelf if we are in testing/mock mode for historical months)
  const viewMonthStats = (() => {
    if (isViewingCurrentMonth) {
      const optimisticTaken = isTakenToday || isWatering;
      return getMonthlyStats(logs, viewYear, viewMonth, optimisticTaken);
    }
    const shelfItem = shelfMonths.find(m => m.monthIndex === viewMonth && m.year === viewYear);
    if (shelfItem) {
      return shelfItem.stats;
    }
    return getMonthlyStats(logs, viewYear, viewMonth);
  })();

  const viewStage = viewMonthStats.stage;
  const viewTakenCount = viewMonthStats.takenCount;
  const viewDaysInMonth = viewMonthStats.daysInMonth;

  // Helper text describing the plant status for the viewed month
  const getGardenStatusText = () => {
    const monthName = MONTH_NAMES[viewMonth];
    const yearStr = viewYear;
    
    if (!isViewingCurrentMonth) {
      // Historical plant text
      if (viewStage === 5) {
        return `¡Tu planta de ${monthName} ${yearStr} floreció con éxito! Lograste un ${Math.round(viewMonthStats.pct)}% de constancia. 🌸`;
      }
      if (viewStage > 0) {
        return `Tu planta de ${monthName} ${yearStr} creció hasta la etapa ${viewStage} con un ${Math.round(viewMonthStats.pct)}% de constancia. 🌿`;
      }
      return `No se registraron tomas para el mes de ${monthName} ${yearStr}. 🏜️`;
    }
    
    // Active month text
    if (!isTakenToday) {
      if (viewTakenCount === 0) {
        return `Tu maceta está vacía. ¡Registra tu ritual hoy para sembrar tu semilla de ${monthName} ${yearStr}! 🌱`;
      }
      return `Tu planta de ${monthName} ${yearStr} tiene algo de sed. ¡Regístrala hoy para mantenerla fresca! 🏜️`;
    } else {
      if (viewStage === 0) {
        return `¡Semilla sembrada! Tu planta de ${monthName} ${yearStr} brotará mañana si mantienes tu ritual. ✨`;
      }
      if (viewStage === 1) {
        return `¡Brote regado! Sigue así para ver crecer tu planta de ${monthName} ${yearStr}. 💦`;
      }
      if (viewStage === 5) {
        return `¡Tu planta de ${monthName} ${yearStr} está en flor! Una constancia hermosa e inspiradora. 🌸`;
      }
      return `¡Planta de ${monthName} ${yearStr} regada y feliz! Sigue cultivando tu rutina. 💧`;
    }
  };

  // Renders the plant vectors based on species (monthIndex) and stage (0-5)
  const renderPlantSVG = (monthIndex, plantStage, isMini = false) => {
    const scale = isMini ? 0.6 : 1.0;
    const yCoord = isMini ? 130 : 122; // Aligns plant inside pot (no longer floats above soil rim)
    const transformStr = `translate(100, ${yCoord}) scale(${scale})`;
    
    // Plant outline glow mapping
    const glowFilter = isMini ? "" : "url(#plantGlow)";
    const glowClass = (isTakenToday || !isViewingCurrentMonth) && !isMini ? "watered-glow" : "dry-fade";

    // Generic Sprout (Stage 1)
    if (plantStage === 1) {
      return (
        <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
          <path d="M0 0 Q -3 -16 2 -24" stroke="var(--plant-stem-color)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M0 -12 Q -12 -22 -14 -16 Q -7 -9 0 -12" fill="var(--plant-leaf-color)" />
          <path d="M1 -17 Q 12 -25 14 -18 Q 7 -12 1 -18" fill="var(--plant-leaf-color-light)" />
        </g>
      );
    }

    // Month-specific vectors (Stages 2 to 5)
    switch (monthIndex) {
      case 0: // Enero: Aloe Vera
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && <path d="M0 0 L-10 -30 Q-2 -18 0 0" fill="var(--plant-leaf-color)" />}
            {plantStage >= 2 && <path d="M0 0 L10 -30 Q2 -18 0 0" fill="var(--plant-leaf-color-light)" />}
            {plantStage >= 3 && <path d="M0 0 L-22 -20 Q-10 -10 0 0" fill="var(--plant-leaf-color)" />}
            {plantStage >= 3 && <path d="M0 0 L22 -20 Q10 -10 0 0" fill="var(--plant-leaf-color-light)" />}
            {plantStage >= 4 && <path d="M0 0 L0 -42 Q4 -22 0 0" fill="var(--plant-leaf-color-light)" />}
            {plantStage >= 4 && <path d="M0 0 L-28 -5 Q-14 0 0 0" fill="var(--plant-leaf-color)" />}
            {plantStage >= 4 && <path d="M0 0 L28 -5 Q14 0 0 0" fill="var(--plant-leaf-color-light)" />}
            {plantStage === 5 && (
              <g className="flower-bloom">
                <path d="M0 0 Q-3 -35 2 -52" stroke="var(--plant-stem-color)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx="2" cy="-52" r="5" fill="var(--flower-petal-color)" />
                <circle cx="-2" cy="-45" r="3" fill="var(--flower-petal-color)" />
                <circle cx="5" cy="-40" r="3" fill="var(--flower-petal-color)" />
              </g>
            )}
          </g>
        );

      case 1: // Febrero: Suculenta Rosa
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && (
              <g>
                <path d="M0 0 C-12 5 -20 -10 -20 -20 C-14 -25 -5 -15 0 0 Z" fill="var(--plant-leaf-color)" />
                <path d="M0 0 C 12 5  20 -10  20 -20 C 14 -25  5 -15 0 0 Z" fill="var(--plant-leaf-color)" />
              </g>
            )}
            {plantStage >= 3 && (
              <g>
                <path d="M0 0 C-5 10 -15 15 -25 8 C-25 0 -12 0 0 0 Z" fill="var(--plant-leaf-color)" opacity="0.9" />
                <path d="M0 0 C 5 10  15 15  25 8 C 25 0  12 0 0 0 Z" fill="var(--plant-leaf-color)" opacity="0.9" />
              </g>
            )}
            {plantStage >= 4 && (
              <g>
                <path d="M0 0 C-6 -8 -10 -24 -4 -30 C 2 -24 5 -15 0 0 Z" fill="var(--plant-leaf-color-light)" />
                <path d="M0 0 C 6 -8  10 -24  4 -30 C-2 -24 -5 -15 0 0 Z" fill="var(--plant-leaf-color-light)" />
              </g>
            )}
            {plantStage === 5 && (
              <g transform="translate(0, -32)">
                <g className="flower-bloom">
                  <circle cx="0" cy="0" r="8" fill="var(--flower-petal-color)" />
                  <circle cx="0" cy="0" r="4.5" fill="var(--flower-center-color)" />
                </g>
              </g>
            )}
          </g>
        );

      case 2: // Marzo: Trébol
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && (
              <g transform="translate(-10, -5)">
                <path d="M0 0 Q-5 -15 -10 -15 Q-15 -15 -10 -5 Z" fill="var(--plant-leaf-color)" />
                <path d="M0 0 Q-15 -5 -15 -10 Q-15 -15 -5 -10 Z" fill="var(--plant-leaf-color)" />
                <path d="M0 0 Q-10 0 -5 -8 Q 0 -15 -10 -5 Z" fill="var(--plant-leaf-color)" />
                <path d="M0 0 Q-5 10 0 15" stroke="var(--plant-stem-color)" strokeWidth="1.5" fill="none" />
              </g>
            )}
            {plantStage >= 3 && (
              <g transform="translate(10, -8)">
                <path d="M0 0 Q5 -15 10 -15 Q15 -15 10 -5 Z" fill="var(--plant-leaf-color-light)" />
                <path d="M0 0 Q15 -5 15 -10 Q15 -15 5 -10 Z" fill="var(--plant-leaf-color-light)" />
                <path d="M0 0 Q10 0 5 -8 Q 0 -15 10 -5 Z" fill="var(--plant-leaf-color-light)" />
                <path d="M0 0 Q5 10 0 15" stroke="var(--plant-stem-color)" strokeWidth="1.5" fill="none" />
              </g>
            )}
            {plantStage >= 4 && (
              <g transform="translate(0, -15)">
                <path d="M0 0 Q-5 -15 -10 -15 Q-15 -15 -10 -5 Z" fill="var(--plant-leaf-color)" />
                <path d="M0 0 Q15 -5 15 -10 Q15 -15 5 -10 Z" fill="var(--plant-leaf-color)" />
                <path d="M0 0 Q0 -18 3 -24 Q6 -18 0 0 Z" fill="var(--plant-leaf-color-light)" />
                <path d="M0 0 Q0 15 0 22" stroke="var(--plant-stem-color)" strokeWidth="1.5" fill="none" />
              </g>
            )}
            {plantStage === 5 && (
              <g transform="translate(3, -25)" filter="drop-shadow(0 0 4px #fbbf24)">
                <g className="flower-bloom">
                  <path d="M0 0 Q-8 -8 -8 -14 C-8 -18 -2 -18 0 -10" fill="#fbbf24" />
                  <path d="M0 0 Q8 -8 8 -14 C8 -18 2 -18 0 -10" fill="#fbbf24" />
                  <path d="M0 0 Q8 8 14 8 C18 8 18 2 10 0" fill="#fbbf24" />
                  <path d="M0 0 Q-8 8 -14 8 C-18 8 -18 2 -10 0" fill="#fbbf24" />
                  <path d="M0 0 Q-2 12 -5 16" stroke="#d97706" strokeWidth="1.5" fill="none" />
                </g>
              </g>
            )}
          </g>
        );

      case 3: // Abril: Lirio
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && <path d="M0 0 Q-15 -18 -22 -22 C-15 -12 -5 -5 0 0" fill="var(--plant-leaf-color)" />}
            {plantStage >= 2 && <path d="M0 0 Q15 -18 22 -22 C15 -12 5 -5 0 0" fill="var(--plant-leaf-color-light)" />}
            {plantStage >= 3 && <path d="M0 0 Q-8 -26 -10 -36 C-4 -24 0 -12 0 0" fill="var(--plant-leaf-color)" />}
            {plantStage >= 3 && <path d="M0 0 Q8 -26 10 -36 C4 -24 0 -12 0 0" fill="var(--plant-leaf-color-light)" />}
            {plantStage >= 4 && <path d="M0 0 Q-22 -8 -30 -10 C-18 -2 -8 0 0 0" fill="var(--plant-leaf-color)" />}
            {plantStage >= 4 && <path d="M0 0 Q22 -8 30 -10 C18 -2 8 0 0 0" fill="var(--plant-leaf-color-light)" />}
            {plantStage === 5 && (
              <g className="flower-bloom">
                <path d="M0 0 Q-5 -35 -2 -52" stroke="var(--plant-stem-color)" strokeWidth="2" fill="none" />
                <path d="M-2 -52 C-10 -65 -4 -75 -2 -80 C4 -75 10 -65 2 -52 Z" fill="#ffffff" />
                <line x1="-1" y1="-55" x2="-1" y2="-66" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
              </g>
            )}
          </g>
        );

      case 4: // Mayo: Cactus
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && <ellipse cx="0" cy="-18" rx="14" ry="18" fill="var(--plant-leaf-color)" />}
            {plantStage >= 2 && (
              <g stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none">
                <line x1="-8" y1="-22" x2="-12" y2="-24" />
                <line x1="8" y1="-22" x2="12" y2="-24" />
                <line x1="0" y1="-28" x2="0" y2="-33" />
                <line x1="-6" y1="-12" x2="-10" y2="-10" />
                <line x1="6" y1="-12" x2="10" y2="-10" />
              </g>
            )}
            {plantStage >= 3 && <ellipse cx="-15" cy="-30" rx="7" ry="10" fill="var(--plant-leaf-color-light)" transform="rotate(-30, -15, -30)" />}
            {plantStage >= 4 && <ellipse cx="15" cy="-30" rx="7" ry="10" fill="var(--plant-leaf-color-light)" transform="rotate(30, 15, -30)" />}
            {plantStage === 5 && (
              <g transform="translate(0, -37)">
                <g className="flower-bloom">
                  <path d="M0 0 L-6 -8 L0 -4 L6 -8 L0 0 Z" fill="var(--flower-petal-color)" />
                  <path d="M0 0 L-8 -2 L-4 4 L0 0 Z" fill="var(--flower-petal-color)" />
                  <path d="M0 0 L8 -2 L4 4 L0 0 Z" fill="var(--flower-petal-color)" />
                  <circle cx="0" cy="-2" r="3.5" fill="var(--flower-center-color)" />
                </g>
              </g>
            )}
          </g>
        );

      case 5: // Junio: Helecho
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && <path d="M0 0 Q-18 -12 -32 5 Q-14 -5 0 0" stroke="var(--plant-leaf-color)" strokeWidth="3" fill="none" strokeLinecap="round" />}
            {plantStage >= 2 && <path d="M0 0 Q18 -12 32 5 Q14 -5 0 0" stroke="var(--plant-leaf-color-light)" strokeWidth="3" fill="none" strokeLinecap="round" />}
            {plantStage >= 3 && <path d="M0 0 Q-24 -20 -38 -12 Q-18 -10 0 0" stroke="var(--plant-leaf-color)" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
            {plantStage >= 3 && <path d="M0 0 Q24 -20 38 -12 Q18 -10 0 0" stroke="var(--plant-leaf-color-light)" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
            {plantStage >= 4 && <path d="M0 0 Q-10 -28 -18 -42 Q-6 -22 0 0" stroke="var(--plant-leaf-color-light)" strokeWidth="4" fill="none" strokeLinecap="round" />}
            {plantStage >= 4 && <path d="M0 0 Q10 -28 18 -42 Q6 -22 0 0" stroke="var(--plant-leaf-color-light)" strokeWidth="4" fill="none" strokeLinecap="round" />}
            {plantStage === 5 && (
              <g className="flower-bloom">
                <path d="M0 0 Q-2 -32 -4 -50" stroke="var(--flower-petal-color)" strokeWidth="2.5" fill="none" />
                <path d="M0 0 Q2 -32 4 -50" stroke="var(--flower-petal-color)" strokeWidth="2.5" fill="none" />
                <circle cx="-4" cy="-50" r="3" fill="var(--flower-center-color)" />
                <circle cx="4" cy="-50" r="3" fill="var(--flower-center-color)" />
              </g>
            )}
          </g>
        );

      case 6: // Julio: Girasol
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && <path d="M0 0 Q-2 -20 0 -38" stroke="var(--plant-stem-color)" strokeWidth="3" fill="none" />}
            {plantStage >= 2 && <path d="M-1 -14 Q-12 -18 -15 -12 Q-8 -8 -1 -14" fill="var(--plant-leaf-color)" />}
            {plantStage >= 3 && <path d="M1 -22 Q12 -26 15 -20 Q8 -16 1 -22" fill="var(--plant-leaf-color)" />}
            {plantStage === 3 && <circle cx="0" cy="-39" r="6" fill="var(--plant-leaf-color-light)" />}
            {plantStage === 4 && <circle cx="0" cy="-40" r="10" fill="var(--flower-petal-color)" />}
            {plantStage === 5 && (
              <g transform="translate(0, -42)">
                <g className="flower-bloom">
                  <circle cx="0" cy="0" r="15" fill="#f59e0b" />
                  <circle cx="0" cy="0" r="10" fill="#fbbf24" />
                  <circle cx="0" cy="0" r="7.5" fill="#78350f" />
                  <circle cx="0" cy="0" r="5" fill="#451a03" />
                </g>
              </g>
            )}
          </g>
        );

      case 7: // Agosto: Jade
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && (
              <g>
                <path d="M0 0 Q -4 -16 -8 -22" stroke="var(--plant-stem-color)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <ellipse cx="-8" cy="-24" rx="7" ry="5" fill="var(--plant-leaf-color)" transform="rotate(-15, -8, -24)" />
              </g>
            )}
            {plantStage >= 3 && (
              <g>
                <path d="M0 0 Q 4 -12 8 -18" stroke="var(--plant-stem-color)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <ellipse cx="8" cy="-20" rx="7" ry="5" fill="var(--plant-leaf-color-light)" transform="rotate(15, 8, -20)" />
              </g>
            )}
            {plantStage >= 4 && (
              <g>
                <path d="M-4 -12 Q0 -28 0 -36" stroke="var(--plant-stem-color)" strokeWidth="3" strokeLinecap="round" fill="none" />
                <ellipse cx="0" cy="-38" rx="8" ry="6" fill="var(--plant-leaf-color-light)" />
                <ellipse cx="-12" cy="-16" rx="6" ry="4" fill="var(--plant-leaf-color)" />
                <ellipse cx="12" cy="-14" rx="6" ry="4" fill="var(--plant-leaf-color-light)" />
              </g>
            )}
            {plantStage === 5 && (
              <g className="flower-bloom">
                <circle cx="-12" cy="-24" r="2.5" fill="var(--flower-petal-color)" />
                <circle cx="12" cy="-20" r="2.5" fill="var(--flower-petal-color)" />
                <circle cx="0" cy="-45" r="3.5" fill="var(--flower-petal-color)" />
                <circle cx="0" cy="-45" r="1.5" fill="#fff" />
              </g>
            )}
          </g>
        );

      case 8: // Septiembre: Bonsai
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && <path d="M0 0 Q-10 -15 -4 -26 Q2 -35 -4 -42" stroke="#5c4033" strokeWidth="6" strokeLinecap="round" fill="none" />}
            {plantStage === 2 && <circle cx="-4" cy="-42" r="8" fill="#e28743" />}
            {plantStage >= 3 && (
              <g>
                <path d="M-6 -20 Q-16 -24 -20 -28" stroke="#5c4033" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="-20" cy="-28" r="9" fill="#e28743" />
                <circle cx="-4" cy="-42" r="11" fill="#e28743" />
              </g>
            )}
            {plantStage >= 4 && (
              <g>
                <path d="M-2 -30 Q12 -28 18 -32" stroke="#5c4033" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="18" cy="-32" r="10" fill="#cd5c5c" />
                <circle cx="-4" cy="-42" r="13" fill="#cd5c5c" />
                <circle cx="-10" cy="-35" r="9" fill="#e28743" />
              </g>
            )}
            {plantStage === 5 && (
              <g className="flower-bloom">
                <circle cx="12" cy="-42" r="8" fill="#fbbf24" opacity="0.9" />
                <circle cx="-16" cy="-44" r="8" fill="#d97706" opacity="0.9" />
                <ellipse cx="-22" cy="-10" rx="1.5" ry="3.5" fill="#e28743" transform="rotate(45, -22, -10)" />
                <ellipse cx="20" cy="-8" rx="1.5" ry="3.5" fill="#cd5c5c" transform="rotate(-30, 20, -8)" />
              </g>
            )}
          </g>
        );

      case 9: // Octubre: Orquídea
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && <ellipse cx="-12" cy="-3" rx="15" ry="5" fill="var(--plant-leaf-color)" transform="rotate(-10, -12, -3)" />}
            {plantStage >= 2 && <ellipse cx="12" cy="-3" rx="15" ry="5" fill="var(--plant-leaf-color-light)" transform="rotate(10, 12, -3)" />}
            {plantStage >= 3 && <path d="M0 -3 Q10 -35 4 -52 Q-2 -68 1 -78" stroke="var(--plant-stem-color)" strokeWidth="2" strokeLinecap="round" fill="none" />}
            {plantStage === 3 && <circle cx="1" cy="-78" r="4" fill="var(--plant-leaf-color-light)" />}
            {plantStage >= 4 && (
              <g>
                <circle cx="1" cy="-78" r="4.5" fill="var(--flower-petal-color)" />
                <circle cx="5" cy="-62" r="5" fill="var(--flower-petal-color)" opacity="0.8" />
              </g>
            )}
            {plantStage === 5 && (
              <g className="flower-bloom">
                <g transform="translate(1, -78)">
                  <circle cx="-4" cy="0" r="4.5" fill="var(--flower-petal-color)" />
                  <circle cx="4" cy="0" r="4.5" fill="var(--flower-petal-color)" />
                  <circle cx="0" cy="-4" r="4" fill="var(--flower-petal-color)" />
                  <circle cx="0" cy="0" r="2.5" fill="var(--flower-center-color)" />
                </g>
                <g transform="translate(5, -62)">
                  <circle cx="-4" cy="0" r="4.5" fill="var(--flower-petal-color)" />
                  <circle cx="4" cy="0" r="4.5" fill="var(--flower-petal-color)" />
                  <circle cx="0" cy="-4" r="4" fill="var(--flower-petal-color)" />
                  <circle cx="0" cy="0" r="2.5" fill="var(--flower-center-color)" />
                </g>
                <g transform="translate(8, -44)">
                  <circle cx="-4" cy="0" r="4" fill="var(--flower-petal-color)" />
                  <circle cx="4" cy="0" r="4" fill="var(--flower-petal-color)" />
                  <circle cx="0" cy="0" r="2.5" fill="var(--flower-center-color)" />
                </g>
              </g>
            )}
          </g>
        );

      case 10: // Noviembre: Pino
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && <line x1="0" y1="0" x2="0" y2="-44" stroke="#5c4033" strokeWidth="4" strokeLinecap="round" />}
            {plantStage >= 2 && <polygon points="0,-24 -15,-10 15,-10" fill="var(--plant-leaf-color)" />}
            {plantStage >= 3 && <polygon points="0,-36 -12,-22 12,-22" fill="var(--plant-leaf-color-light)" />}
            {plantStage >= 4 && <polygon points="0,-46 -8,-32 8,-32" fill="var(--plant-leaf-color-light)" />}
            {plantStage === 5 && (
              <g transform="translate(0, -49)" filter="drop-shadow(0 0 5px #fbbf24)">
                <g className="flower-bloom">
                  <path d="M0,-6 L1.5,-1.5 L6,-1.5 L2.5,1 L4,5.5 L0,3 L-4,5.5 L-2.5,1 L-6,-1.5 L-1.5,-1.5 Z" fill="#fbbf24" />
                </g>
              </g>
            )}
          </g>
        );

      case 11: // Diciembre: Flor de Pascua
        return (
          <g className={`plant-group ${wobble && !isMini ? 'wiggle' : ''} ${glowClass}`} transform={transformStr} filter={glowFilter}>
            {plantStage >= 2 && (
              <g fill="var(--plant-leaf-color)">
                <ellipse cx="-12" cy="-6" rx="14" ry="7" transform="rotate(-25, -12, -6)" />
                <ellipse cx="12" cy="-6" rx="14" ry="7" transform="rotate(25, 12, -6)" />
              </g>
            )}
            {plantStage >= 3 && (
              <g fill="var(--plant-leaf-color-light)">
                <ellipse cx="0" cy="-14" rx="14" ry="6" transform="rotate(90, 0, -14)" />
                <ellipse cx="-6" cy="-12" rx="12" ry="6" transform="rotate(-60, -6, -12)" />
                <ellipse cx="6" cy="-12" rx="12" ry="6" transform="rotate(60, 6, -12)" />
              </g>
            )}
            {plantStage >= 4 && (
              <g fill="var(--flower-petal-color)" filter="drop-shadow(0 0 3px rgba(244,63,94,0.4))">
                <ellipse cx="-8" cy="-14" rx="12" ry="5" transform="rotate(-30, -8, -14)" />
                <ellipse cx="8" cy="-14" rx="12" ry="5" transform="rotate(30, 8, -14)" />
                <ellipse cx="0" cy="-22" rx="12" ry="5" transform="rotate(90, 0, -22)" />
              </g>
            )}
            {plantStage === 5 && (
              <g transform="translate(0, -16)">
                <g className="flower-bloom">
                  <circle cx="-2" cy="-2" r="2" fill="#fbbf24" />
                  <circle cx="2" cy="-2" r="2" fill="#f59e0b" />
                  <circle cx="0" cy="2" r="2" fill="#fbbf24" />
                  <circle cx="-1" cy="0" r="1.5" fill="#fff" />
                </g>
              </g>
            )}
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <div className="glass-panel garden-card" style={{ marginTop: '20px', padding: '20px', textAlign: 'center' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🌱</span> {isViewingCurrentMonth ? 'Mi Jardín' : 'Colección'}: {PLANT_NAMES[viewMonth]} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>({MONTH_NAMES[viewMonth]} {viewYear})</span>
        </h3>
        <span style={{ 
          fontSize: '11px', 
          background: 'rgba(255,255,255,0.08)', 
          padding: '4px 8px', 
          borderRadius: '12px',
          color: 'var(--text-secondary)'
        }}>
          Régimen: <strong>{viewTakenCount}/{viewDaysInMonth} d</strong>
        </span>
      </div>

      {/* Main pot display */}
      <div style={{ position: 'relative', height: '190px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', overflow: 'hidden' }}>
        <svg 
          viewBox="0 0 200 200" 
          width="200" 
          height="200" 
          style={{ cursor: 'pointer', overflow: 'visible' }}
          onClick={handlePotClick}
        >
          <defs>
            <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
            
            <linearGradient id="soilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={(isTakenToday || !isViewingCurrentMonth) ? "#3d2216" : "#634739"} />
              <stop offset="100%" stopColor={(isTakenToday || !isViewingCurrentMonth) ? "#2b160d" : "#452f24"} />
            </linearGradient>

            <filter id="plantGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Wooden windowsill lines */}
          <rect x="15" y="165" width="170" height="6" rx="3" fill="rgba(255, 255, 255, 0.15)" />
          <rect x="25" y="171" width="150" height="4" rx="2" fill="rgba(0, 0, 0, 0.2)" />

          {/* Soil */}
          <ellipse cx="100" cy="122" rx="23" ry="5" fill="url(#soilGradient)" />
          
          {/* Water Ripple on Soil */}
          {isWatering && (
            <ellipse cx="100" cy="122" rx="0" ry="0" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" className="water-ripple" />
          )}

          {/* Dry crack lines */}
          {(!isTakenToday && isViewingCurrentMonth) && viewStage === 0 && (
            <path d="M90 121 L98 124 L104 122 M108 123 L113 121" stroke="rgba(0,0,0,0.3)" strokeWidth="1" fill="none" />
          )}

          {/* Render active plant */}
          {renderPlantSVG(viewMonth, viewStage, false)}

          {/* Soil Overlay */}
          <ellipse cx="100" cy="122" rx="27" ry="2" fill="rgba(0,0,0,0.15)" />

          {/* Glass Pot */}
          <path d="M73 122 L77 155 C78 159, 122 159, 123 155 L127 122 Z" fill="url(#potGradient)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <ellipse cx="100" cy="122" rx="27" ry="3.5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />

          {/* Watering can (only animate for current month) */}
          {isViewingCurrentMonth && (
            <g>
              {isWatering && (
                <g className="water-droplets">
                  <circle cx="88" cy="90" r="1.5" fill="var(--accent-cyan)" className="drop-1" />
                  <circle cx="93" cy="90" r="1.8" fill="var(--accent-cyan)" className="drop-2" />
                  <circle cx="98" cy="90" r="1.5" fill="var(--accent-cyan)" className="drop-3" />
                </g>
              )}
              
              <g className={`watering-can ${isWatering ? 'pouring' : ''}`}>
                <g transform="translate(145, 55) scale(0.7)">
                  <rect x="0" y="5" width="28" height="18" rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <path d="M28 8 C34 8 34 20 28 20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0 16 L-15 10 L-18 12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </g>
            </g>
          )}
        </svg>

        {showWateringAlert && (
          <div style={{
            position: 'absolute',
            bottom: '60px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            ¡Registra tu ritual hoy para poder regarla! 🏜️
          </div>
        )}
      </div>

      <p className="garden-status-text" style={{ 
        marginTop: '12px', 
        fontSize: '13px', 
        color: 'var(--text-secondary)',
        lineHeight: '1.4',
        minHeight: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {getGardenStatusText()}
      </p>

      {/* Water Action / Navigation Back Button */}
      {isViewingCurrentMonth ? (
        isTakenToday ? (
          <button 
            onClick={triggerWatering} 
            disabled={isWatering}
            className="water-btn"
            style={{
              marginTop: '8px',
              background: 'var(--accent-gradient)',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              padding: '8px 18px',
              borderRadius: '16px',
              cursor: 'pointer',
              boxShadow: '0 0 10px var(--accent-gradient-glow)',
              opacity: isWatering ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {isWatering ? 'Regando... 💦' : '¡Regar de nuevo! 💧'}
          </button>
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Completa tu ritual de hoy para regar tu planta
          </div>
        )
      ) : (
        <button 
          onClick={() => {
            setViewMonth(currentMonthIdx);
            setViewYear(currentYear);
          }}
          className="water-btn"
          style={{
            marginTop: '8px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--accent-cyan)',
            fontSize: '13px',
            fontWeight: '600',
            padding: '8px 18px',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          ← Volver al Mes Actual
        </button>
      )}

      {/* COLLAPSIBLE WINDOWSILL SHELF SECTION */}
      {hasItemsOnShelf && (
        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px' }}>
          <button
            onClick={() => setShowShelf(!showShelf)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <span>🏠</span> {showShelf ? 'Ocultar Repisa' : 'Ver Repisa de Colección'}
            <span style={{ fontSize: '10px', transform: showShelf ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
          </button>

          {showShelf && (
            <div 
              className="shelf-panel"
              style={{
                marginTop: '15px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '16px',
                padding: '16px 0 24px 0',
                border: '1px solid rgba(255,255,255,0.04)',
                position: 'relative',
                animation: 'scaleUp 0.3s ease-out'
              }}
            >
              {/* Shelf Scroll Container */}
              <div 
                className="shelf-scroll-container"
                style={{
                  display: 'flex',
                  gap: '24px',
                  overflowX: 'auto',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingBottom: '16px',
                  paddingTop: '10px',
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  position: 'relative',
                  zIndex: 2
                }}
              >
                {shelfMonths.map(({ monthIndex, year, stats }) => {
                  const hasHistory = stats.takenCount > 0;
                  const isSelected = viewMonth === monthIndex && viewYear === year;
                  
                  return (
                    <div 
                      key={`${monthIndex}-${year}`} 
                      onClick={() => {
                        setViewMonth(monthIndex);
                        setViewYear(year);
                      }}
                      style={{ 
                        flex: '0 0 75px', 
                        scrollSnapAlign: 'start',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1.0)',
                        opacity: isSelected ? 1 : 0.7,
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {/* Miniature Plant Pot */}
                      <div style={{ height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
                        <svg viewBox="0 0 200 200" width="70" height="70" style={{ overflow: 'visible' }}>
                          {/* Pot shadows and base */}
                          <ellipse cx="100" cy="158" rx="20" ry="4" fill="rgba(0,0,0,0.15)" />
                          
                          {/* Soil inside pot */}
                          <ellipse cx="100" cy="130" rx="18" ry="4" fill="#5c4538" />

                          {/* Plant SVG Mini */}
                          {hasHistory ? (
                            renderPlantSVG(monthIndex, stats.stage, true)
                          ) : (
                            <path d="M100 130 L100 125" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                          )}

                          {/* Clay pot front (Highlights if selected) */}
                          <path 
                            d="M78 130 L81 158 C82 160, 118 160, 119 158 L122 130 Z" 
                            fill={isSelected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"} 
                            stroke={isSelected ? "var(--accent-cyan)" : "rgba(255,255,255,0.15)"} 
                            strokeWidth="1" 
                          />
                          <ellipse 
                            cx="100" 
                            cy="130" 
                            rx="22" 
                            ry="2.5" 
                            fill="rgba(255,255,255,0.05)" 
                            stroke={isSelected ? "var(--accent-cyan)" : "rgba(255,255,255,0.2)"} 
                            strokeWidth="0.75" 
                          />
                        </svg>
                      </div>
                      {/* Month Label */}
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        marginTop: '6px', 
                        color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' 
                      }}>
                        {MONTH_NAMES[monthIndex].substring(0, 3)} '{String(year).substring(2)}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                        {hasHistory ? `${stats.takenCount}/${stats.daysInMonth} d` : 'Sin datos'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay Modal Celebration when registering the pill */}
      {isWateringModalOpen && createPortal(
        <div className="garden-card" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 10, 20, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-out',
          padding: '20px',
          textAlign: 'center',
          color: '#fff'
        }}>
          {/* Ambient glowing background circles */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--plant-glow-color) 0%, rgba(0,0,0,0) 70%)',
            zIndex: -1,
            opacity: 0.65,
            animation: 'pulseGlow 3s infinite alternate'
          }} />

          <h2 style={{
            fontSize: '25px',
            fontWeight: '800',
            marginBottom: '6px',
            background: 'linear-gradient(to right, #00f2fe, #4facfe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'slideDown 0.4s ease-out'
          }}>
            ¡Ritual Completado! 🌱
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '20px',
            maxWidth: '300px',
            lineHeight: '1.4',
            animation: 'slideDown 0.4s ease-out 0.1s forwards',
            opacity: 0,
            fillMode: 'forwards'
          }}>
            Tu constancia de hoy riega y cuida de tu jardín interior.
          </p>

          {/* Large Pot display in modal */}
          <div style={{
            animation: 'scaleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '20px 0'
          }}>
            <svg 
              viewBox="0 0 200 200" 
              width="260" 
              height="260" 
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="modalPotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                </linearGradient>
                
                <linearGradient id="modalSoilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3d2216" />
                  <stop offset="100%" stopColor="#2b160d" />
                </linearGradient>

                <filter id="modalPlantGlow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Shadow */}
              <ellipse cx="100" cy="160" rx="36" ry="6" fill="rgba(0, 0, 0, 0.4)" />

              {/* Soil base */}
              <ellipse cx="100" cy="122" rx="23" ry="5" fill="url(#modalSoilGradient)" />

              {/* Water Ripple on Soil */}
              {isWatering && (
                <ellipse cx="100" cy="122" rx="0" ry="0" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" className="water-ripple" />
              )}

              {/* Render Plant SVG */}
              {renderPlantSVG(currentMonthIdx, viewStage, false)}

              {/* Soil Overlay */}
              <ellipse cx="100" cy="122" rx="27" ry="2" fill="rgba(0,0,0,0.15)" />

              {/* Glass Pot */}
              <path d="M73 122 L77 155 C78 159, 122 159, 123 155 L127 122 Z" fill="url(#modalPotGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <ellipse cx="100" cy="122" rx="27" ry="3.5" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />

              {/* Watering can animation */}
              <g>
                {isWatering && (
                  <g className="water-droplets">
                    <circle cx="88" cy="90" r="1.5" fill="var(--accent-cyan)" className="drop-1" />
                    <circle cx="93" cy="90" r="1.8" fill="var(--accent-cyan)" className="drop-2" />
                    <circle cx="98" cy="90" r="1.5" fill="var(--accent-cyan)" className="drop-3" />
                  </g>
                )}
                
                <g className={`watering-can ${isWatering ? 'pouring' : ''}`}>
                  <g transform="translate(145, 55) scale(0.7)">
                    <rect x="0" y="5" width="28" height="18" rx="3" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                    <path d="M28 8 C34 8 34 20 28 20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0 16 L-15 10 L-18 12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                </g>
              </g>
            </svg>
          </div>

          <div style={{
            marginTop: '15px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#00f2fe',
            animation: 'fadeIn 0.3s ease-out 0.3s forwards',
            opacity: 0,
            fillMode: 'forwards'
          }}>
            {getGardenStatusText()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
