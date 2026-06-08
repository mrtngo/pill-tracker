import { useState, useEffect, useCallback } from 'react';

export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse YYYY-MM-DD date string into a local Date object safely to prevent timezone shifting
export const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Calculate dates between two date strings (inclusive)
export const getDaysDifference = (startStr, endStr) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end - start);
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// Use a single static UUID because this is a dedicated single-user app
const getOrCreateDeviceId = () => '00000000-0000-0000-0000-000000000000';

export const usePillData = () => {
  const [deviceId] = useState(() => getOrCreateDeviceId());
  const [isSyncing, setIsSyncing] = useState(false);

  const [logs, setLogs] = useState(() => {
    const stored = localStorage.getItem('aegis_pill_logs');
    return stored ? JSON.parse(stored) : {};
  });

  const [pillName, setPillName] = useState(() => {
    return localStorage.getItem('aegis_pill_name') || 'Pastilla Diaria';
  });

  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('aegis_reminder_time') || '21:00';
  });

  const [startDate, setStartDate] = useState(() => {
    return localStorage.getItem('aegis_start_date') || getLocalDateString();
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aegis_theme') || 'cyan';
  });

  const [pushMessage, setPushMessage] = useState(() => {
    return localStorage.getItem('aegis_push_message') || 'No olvides registrar tu hábito de hoy. Toca para registrar.';
  });

  // Sync state to localstorage
  useEffect(() => {
    localStorage.setItem('aegis_pill_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('aegis_pill_name', pillName);
  }, [pillName]);

  useEffect(() => {
    localStorage.setItem('aegis_reminder_time', reminderTime);
  }, [reminderTime]);

  useEffect(() => {
    localStorage.setItem('aegis_start_date', startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem('aegis_push_message', pushMessage);
  }, [pushMessage]);

  useEffect(() => {
    localStorage.setItem('aegis_theme', theme);
    const themeClasses = ['theme-cyan', 'theme-amber', 'theme-rose', 'theme-lavender', 'theme-sage'];
    document.body.classList.remove(...themeClasses);
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Cloud Sync POST helper
  const syncData = useCallback(async (newLogs, newSettings) => {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          settings: newSettings,
          logs: newLogs
        })
      });
      if (!response.ok) throw new Error('Cloud sync failed');
      return true;
    } catch (err) {
      console.warn('Failed to sync with cloud (offline/error):', err);
      throw err;
    }
  }, [deviceId]);

  // Fetch data from Supabase on startup
  useEffect(() => {
    const loadAndSyncData = async () => {
      setIsSyncing(true);
      try {
        const res = await fetch(`/api/sync?deviceId=${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const isDirty = localStorage.getItem('aegis_settings_dirty') === 'true';
            
            // Read local settings from localStorage as the source of truth if dirty
            const localPillName = localStorage.getItem('aegis_pill_name') || 'Pastilla Diaria';
            const localReminderTime = localStorage.getItem('aegis_reminder_time') || '21:00';
            const localStartDate = localStorage.getItem('aegis_start_date') || getLocalDateString();
            const localTheme = localStorage.getItem('aegis_theme') || 'cyan';
            const localPushMessage = localStorage.getItem('aegis_push_message') || 'No olvides registrar tu hábito de hoy. Toca para registrar.';

            let currentLogs = {};
            // Load local logs first
            const storedLogs = localStorage.getItem('aegis_pill_logs');
            if (storedLogs) {
              currentLogs = JSON.parse(storedLogs);
            }

            if (data.logs) {
              // Merge cloud and local logs (local fills gaps, cloud takes precedence)
              const mergedLogs = { ...currentLogs, ...data.logs };
              setLogs(mergedLogs);
              currentLogs = mergedLogs;
            }

            if (data.settings && !isDirty) {
              setPillName(data.settings.pillName);
              setReminderTime(data.settings.reminderTime);
              setStartDate(data.settings.startDate);
              if (data.settings.theme) {
                setTheme(data.settings.theme);
              }
              if (data.settings.pushMessage) {
                setPushMessage(data.settings.pushMessage);
              }
            }

            // Check if there are any local logs that are not synced to the cloud yet
            const hasNewLogsToUpload = data.logs ? Object.keys(currentLogs).some(date => {
              return !data.logs[date] || data.logs[date].status !== currentLogs[date].status;
            }) : Object.keys(currentLogs).length > 0;

            if (isDirty || hasNewLogsToUpload) {
              const settingsToSync = isDirty ? {
                pillName: localPillName,
                reminderTime: localReminderTime,
                startDate: localStartDate,
                theme: localTheme,
                pushMessage: localPushMessage
              } : {
                pillName: data.settings?.pillName || localPillName,
                reminderTime: data.settings?.reminderTime || localReminderTime,
                startDate: data.settings?.startDate || localStartDate,
                theme: data.settings?.theme || localTheme,
                pushMessage: data.settings?.pushMessage || localPushMessage
              };

              try {
                await syncData(currentLogs, settingsToSync);
                localStorage.removeItem('aegis_settings_dirty');
              } catch (syncErr) {
                console.warn('Failed to sync merged local state on startup:', syncErr);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not load cloud data on startup:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    loadAndSyncData();
  }, [deviceId, syncData]);

  // Log pill for a specific date
  const logPill = useCallback((dateStr, status = 'taken') => {
    setLogs((prev) => {
      const updated = { ...prev };
      if (status && status.startsWith('taken')) {
        updated[dateStr] = {
          taken: true,
          timestamp: Date.now(),
          status: status
        };
      } else if (status === 'skipped') {
        updated[dateStr] = {
          taken: false,
          timestamp: Date.now(),
          status: 'skipped'
        };
      } else {
        delete updated[dateStr];
      }
      // Sync with cloud database
      syncData(updated, { pillName, reminderTime, startDate, theme, pushMessage });
      return updated;
    });
  }, [syncData, pillName, reminderTime, startDate, theme, pushMessage]);

  // Expose a clean way to update settings and sync to cloud
  const updateSettings = useCallback((name, time, start, newPushMsg) => {
    setPillName(name);
    setReminderTime(time);
    setStartDate(start);
    setPushMessage(newPushMsg);
    localStorage.setItem('aegis_settings_dirty', 'true');
    
    syncData(logs, { pillName: name, reminderTime: time, startDate: start, theme, pushMessage: newPushMsg })
      .then(() => {
        localStorage.removeItem('aegis_settings_dirty');
      })
      .catch((err) => {
        console.warn('Failed to sync settings, marked as dirty:', err);
      });
  }, [logs, syncData, theme]);

  const changeTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('aegis_settings_dirty', 'true');
    
    syncData(logs, { pillName, reminderTime, startDate, theme: newTheme, pushMessage })
      .then(() => {
        localStorage.removeItem('aegis_settings_dirty');
      })
      .catch((err) => {
        console.warn('Failed to sync theme, marked as dirty:', err);
      });
  }, [logs, pillName, reminderTime, startDate, pushMessage, syncData]);



  // Bulk set logs (for import)
  const importLogs = useCallback((newLogs, name, time, start, newTheme, newPushMsg) => {
    if (newLogs) setLogs(newLogs);
    if (name) setPillName(name);
    if (time) setReminderTime(time);
    if (start) setStartDate(start);
    if (newTheme) setTheme(newTheme);
    if (newPushMsg) setPushMessage(newPushMsg);
    // Sync all imported data to cloud
    syncData(newLogs || logs, {
      pillName: name || pillName,
      reminderTime: time || reminderTime,
      startDate: start || startDate,
      theme: newTheme || theme,
      pushMessage: newPushMsg || pushMessage
    });
  }, [logs, pillName, reminderTime, startDate, theme, pushMessage, syncData]);

  // Clear all data
  const resetAllData = useCallback(() => {
    setLogs({});
    setPillName('Pastilla Diaria');
    setReminderTime('21:00');
    setStartDate(getLocalDateString());
    setTheme('cyan');
    setPushMessage('No olvides registrar tu hábito de hoy. Toca para registrar.');
    localStorage.removeItem('aegis_last_notified_date');
    // Delete in database by syncing empty states
    syncData({}, {
      pillName: 'Pastilla Diaria',
      reminderTime: '21:00',
      startDate: getLocalDateString(),
      theme: 'cyan',
      pushMessage: 'No olvides registrar tu hábito de hoy. Toca para registrar.'
    });
  }, [syncData]);

  // Calculate streaks
  const calculateStreaks = useCallback(() => {
    const takenDates = Object.keys(logs)
      .filter((date) => logs[date]?.taken)
      .sort((a, b) => new Date(b) - new Date(a)); // Sort descending (newest first)

    if (takenDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const todayStr = getLocalDateString();
    
    // Check yesterday's date string
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    let currentStreak = 0;
    let isCurrentBroken = false;

    // Check if today or yesterday was taken to count current streak
    const hasToday = logs[todayStr]?.taken;
    const hasYesterday = logs[yesterdayStr]?.taken;

    if (hasToday || hasYesterday) {
      let checkStr = hasToday ? todayStr : yesterdayStr;
      while (!isCurrentBroken) {
        if (logs[checkStr]?.taken) {
          currentStreak++;
          const checkDate = parseLocalDate(checkStr);
          checkDate.setDate(checkDate.getDate() - 1);
          checkStr = getLocalDateString(checkDate);
        } else {
          isCurrentBroken = true;
        }
      }
    }

    // Longest streak calculation
    const sortedAsc = Object.keys(logs)
      .filter((date) => logs[date]?.taken)
      .sort((a, b) => new Date(a) - new Date(b));

    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate = null;

    for (const dateStr of sortedAsc) {
      const currentDate = parseLocalDate(dateStr);
      if (previousDate === null) {
        tempStreak = 1;
      } else {
        const diffDays = getDaysDifference(getLocalDateString(previousDate), dateStr) - 1;
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      previousDate = currentDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }, [logs]);

  // General metrics
  const getStats = useCallback(() => {
    const todayStr = getLocalDateString();
    const totalDays = getDaysDifference(startDate, todayStr);
    
    const logsArray = Object.keys(logs).map(date => ({
      date,
      ...logs[date]
    }));

    const takenCount = logsArray.filter(l => l.taken).length;
    const skippedCount = logsArray.filter(l => l.status === 'skipped').length;
    
    const complianceRate = totalDays > 0 ? Math.round((takenCount / totalDays) * 100) : 100;

    return {
      totalDays,
      takenCount,
      skippedCount,
      complianceRate: Math.min(100, Math.max(0, complianceRate))
    };
  }, [logs, startDate]);

  const { currentStreak, longestStreak } = calculateStreaks();
  const stats = getStats();

  return {
    deviceId,
    isSyncing,
    logs,
    pillName,
    setPillName,
    reminderTime,
    setReminderTime,
    startDate,
    setStartDate,
    theme,
    changeTheme,
    pushMessage,
    logPill,
    updateSettings,
    importLogs,
    resetAllData,
    currentStreak,
    longestStreak,
    stats
  };
};
