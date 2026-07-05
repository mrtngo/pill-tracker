import React from 'react';
import { getLocalDateString } from '../hooks/usePillData';
import { PLANT_NAMES } from './CozyGarden';

export const getWeeklyPostcardData = (logs, unlockedCollectibles = {}, visibleCollectibles = {}) => {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - idx));
    const dateStr = getLocalDateString(date);
    const entry = logs[dateStr];
    const mood = entry?.status?.includes(':') ? entry.status.split(':')[1] : '';

    return {
      date,
      dateStr,
      label: date.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2),
      taken: !!entry?.taken,
      mood
    };
  });

  const completedCount = weekDays.filter((day) => day.taken).length;
  const moodCounts = weekDays.reduce((acc, day) => {
    if (day.taken && day.mood) {
      acc[day.mood] = (acc[day.mood] || 0) + 1;
    }
    return acc;
  }, {});

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '✨';
  const currentPlant = PLANT_NAMES[today.getMonth()] || 'Jardín';
  const hasPerro = unlockedCollectibles.dog && visibleCollectibles.dog !== false;

  let caption = 'Una semana suave. Volver también es parte del ritual.';
  if (completedCount === 7) {
    caption = 'Una semana completa. Tu jardín se nota constante y cuidado.';
  } else if (topMood === '😊' && completedCount >= 4) {
    caption = 'Una semana luminosa. Poquito a poco, tu jardín sigue creciendo.';
  } else if (topMood === '😐') {
    caption = 'No todos los días tienen que brillar para que algo siga creciendo.';
  } else if (topMood === '😴') {
    caption = 'Una semana suave. Descansar también cuenta como cuidarte.';
  } else if (topMood === '🤢') {
    caption = 'Una semana de pasitos pequeños. Cuidarte también puede ser ir lento.';
  }

  return {
    title: `${weekDays[0].date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekDays[6].date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`,
    completedCount,
    topMood,
    currentPlant,
    hasPerro,
    caption,
    weekDays
  };
};

export default function WeeklyPostcard({
  logs,
  unlockedCollectibles = {},
  visibleCollectibles = {},
  showToast,
  variant = 'card',
  onClose
}) {
  const postcard = getWeeklyPostcardData(logs, unlockedCollectibles, visibleCollectibles);

  const copyWeeklyPostcard = async () => {
    const moodLine = postcard.weekDays
      .map((day) => `${day.label}: ${day.taken ? (day.mood || '✓') : '·'}`)
      .join('  ');
    const text = [
      `Postal de la semana (${postcard.title})`,
      `${postcard.currentPlant}: ${postcard.completedCount}/7 rituales completados`,
      `Mood más común: ${postcard.topMood}`,
      postcard.hasPerro ? 'Perro acompañó el jardín.' : '',
      moodLine,
      postcard.caption
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(text);
      showToast?.('Postal copiada');
    } catch (err) {
      console.warn('Failed to copy weekly postcard:', err);
      showToast?.('No se pudo copiar la postal');
    }
  };

  return (
    <div className={`glass-panel weekly-postcard ${variant === 'modal' ? 'postcard-modal-card' : ''}`}>
      {onClose && (
        <button className="postcard-close-btn" onClick={onClose} aria-label="Cerrar postal">
          ×
        </button>
      )}

      <div className="postcard-header">
        <div>
          <div className="postcard-eyebrow">Postal de la semana</div>
          <h3>{postcard.title}</h3>
        </div>
        <div className="postcard-stamp">{postcard.topMood}</div>
      </div>

      <div className="postcard-body">
        <div className="postcard-plant">
          <span>🌻</span>
          <div>
            <strong>{postcard.currentPlant}</strong>
            <small>{postcard.completedCount}/7 rituales completados</small>
          </div>
        </div>

        <div className="postcard-mood-row" aria-label="Resumen de moods de la semana">
          {postcard.weekDays.map((day) => (
            <div key={day.dateStr} className={`postcard-day ${day.taken ? 'taken' : ''}`}>
              <span>{day.taken ? (day.mood || '✓') : '·'}</span>
              <small>{day.label}</small>
            </div>
          ))}
        </div>

        <p>{postcard.caption}</p>

        {postcard.hasPerro && (
          <div className="postcard-companion">
            <span>🐶</span>
            <span>Perro estuvo cerquita del jardín esta semana.</span>
          </div>
        )}
      </div>

      <button className="postcard-copy-btn" onClick={copyWeeklyPostcard}>
        Copiar postal
      </button>
    </div>
  );
}
