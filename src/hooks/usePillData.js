import { useState, useEffect, useCallback } from 'react';

// Get YYYY-MM-DD representation of a local Date object
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate dates between two date strings (inclusive)
export const getDaysDifference = (startStr, endStr) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// Generate a random UUID for authentication-free device identification
const getOrCreateDeviceId = () => {
  let id = localStorage.getItem('aegis_device_id');
  if (!id) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem('aegis_device_id', id);
  }
  return id;
};

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
    } catch (err) {
      console.warn('Failed to sync with cloud (offline/error):', err);
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
            if (data.settings) {
              setPillName(data.settings.pillName);
              setReminderTime(data.settings.reminderTime);
              setStartDate(data.settings.startDate);
            }
            if (data.logs) {
              setLogs((prev) => {
                // Merge cloud and local logs (cloud takes precedence, local fills gaps)
                return { ...prev, ...data.logs };
              });
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
  }, [deviceId]);

  // Log pill for a specific date
  const logPill = useCallback((dateStr, status = 'taken') => {
    setLogs((prev) => {
      const updated = { ...prev };
      if (status === 'taken') {
        updated[dateStr] = {
          taken: true,
          timestamp: Date.now(),
          status: 'taken'
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
      syncData(updated, { pillName, reminderTime, startDate });
      return updated;
    });
  }, [syncData, pillName, reminderTime, startDate]);

  // Expose a clean way to update settings and sync to cloud
  const updateSettings = useCallback((name, time, start) => {
    setPillName(name);
    setReminderTime(time);
    setStartDate(start);
    syncData(logs, { pillName: name, reminderTime: time, startDate: start });
  }, [logs, syncData]);

  // Link another device by copying its ID
  const linkDevice = useCallback((newDeviceId) => {
    if (!newDeviceId || newDeviceId.length < 10) return;
    localStorage.setItem('aegis_device_id', newDeviceId.trim());
    window.location.reload();
  }, []);

  // Bulk set logs (for import)
  const importLogs = useCallback((newLogs, name, time, start) => {
    if (newLogs) setLogs(newLogs);
    if (name) setPillName(name);
    if (time) setReminderTime(time);
    if (start) setStartDate(start);
    // Sync all imported data to cloud
    syncData(newLogs || logs, {
      pillName: name || pillName,
      reminderTime: time || reminderTime,
      startDate: start || startDate
    });
  }, [logs, pillName, reminderTime, startDate, syncData]);

  // Clear all data
  const resetAllData = useCallback(() => {
    setLogs({});
    setPillName('Pastilla Diaria');
    setReminderTime('21:00');
    setStartDate(getLocalDateString());
    localStorage.removeItem('aegis_last_notified_date');
    // Delete in database by syncing empty states
    syncData({}, {
      pillName: 'Pastilla Diaria',
      reminderTime: '21:00',
      startDate: getLocalDateString()
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
      let checkDate = new Date(hasToday ? todayStr : yesterdayStr);
      while (!isCurrentBroken) {
        const checkStr = getLocalDateString(checkDate);
        if (logs[checkStr]?.taken) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
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
      const currentDate = new Date(dateStr);
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
    logPill,
    updateSettings,
    linkDevice,
    importLogs,
    resetAllData,
    currentStreak,
    longestStreak,
    stats
  };
};
