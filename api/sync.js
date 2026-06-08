/* global process */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder');

export default async function handler(req, res) {
  // Add CORS headers for testing
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET Request: Retrieve settings and logs
  if (req.method === 'GET') {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId parameter' });
    }

    try {
      // 1. Fetch settings from devices table
      const { data: device, error: deviceErr } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .maybeSingle();

      if (deviceErr) throw deviceErr;

      // 2. Fetch logs from pill_logs table
      const { data: logsData, error: logsErr } = await supabase
        .from('pill_logs')
        .select('*')
        .eq('device_id', deviceId);

      if (logsErr) throw logsErr;

      // Convert logs to client format
      const logs = {};
      if (logsData) {
        logsData.forEach((row) => {
          logs[row.log_date] = {
            taken: row.status ? row.status.startsWith('taken') : false,
            status: row.status,
            timestamp: new Date(row.logged_at).getTime()
          };
        });
      }

      const settings = device ? {
        pillName: device.pill_name,
        reminderTime: device.reminder_time,
        startDate: device.start_date,
        theme: device.theme || 'cyan',
        pushMessage: device.push_message || 'No olvides registrar tu hábito de hoy. Toca para registrar.'
      } : null;

      return res.status(200).json({ success: true, settings, logs });
    } catch (err) {
      console.error('Error in GET sync:', err);
      return res.status(500).json({ error: 'Failed to fetch data', details: err.message });
    }
  }

  // POST Request: Sync settings and logs
  if (req.method === 'POST') {
    const { deviceId, settings, logs } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId parameter' });
    }

    try {
      // 1. Ensure the device exists in the devices table
      const { data: device, error: devError } = await supabase
        .from('devices')
        .select('id')
        .eq('id', deviceId)
        .maybeSingle();

      if (devError) throw devError;

      if (!device) {
        // Create default device settings if not present
        const { error: insertDevError } = await supabase
          .from('devices')
          .insert({
            id: deviceId,
            pill_name: settings ? settings.pillName : 'Pastilla Diaria',
            reminder_time: settings ? settings.reminderTime : '21:00',
            start_date: settings ? settings.startDate : new Date().toISOString().split('T')[0],
            theme: settings ? (settings.theme || 'cyan') : 'cyan',
            push_message: settings ? (settings.pushMessage || 'No olvides registrar tu hábito de hoy. Toca para registrar.') : 'No olvides registrar tu hábito de hoy. Toca para registrar.'
          });
        if (insertDevError) throw insertDevError;
      }

      // 2. Sync settings if provided (will overwrite the default above)
      if (settings) {
        const { error: settingsErr } = await supabase
          .from('devices')
          .upsert({
            id: deviceId,
            pill_name: settings.pillName,
            reminder_time: settings.reminderTime,
            start_date: settings.startDate,
            theme: settings.theme || 'cyan',
            push_message: settings.pushMessage || 'No olvides registrar tu hábito de hoy. Toca para registrar.'
          });

        if (settingsErr) throw settingsErr;
      }

      // 2. Sync logs if provided
      if (logs) {
        // Collect rows to insert or update
        const logRows = [];
        const activeDates = [];

        Object.entries(logs).forEach(([dateStr, logInfo]) => {
          if (logInfo && logInfo.status && (logInfo.status.startsWith('taken') || logInfo.status === 'skipped')) {
            logRows.push({
              device_id: deviceId,
              log_date: dateStr,
              status: logInfo.status
            });
            activeDates.push(dateStr);
          }
        });

        // Upsert new/modified logs
        if (logRows.length > 0) {
          const { error: upsertErr } = await supabase
            .from('pill_logs')
            .upsert(logRows, { onConflict: 'device_id,log_date' });

          if (upsertErr) throw upsertErr;
        }

        // Delete logs that are no longer active (handling deletions)
        let deleteQuery = supabase
          .from('pill_logs')
          .delete()
          .eq('device_id', deviceId);

        if (activeDates.length > 0) {
          deleteQuery = deleteQuery.not('log_date', 'in', `(${activeDates.map(d => `"${d}"`).join(',')})`);
        }

        const { error: deleteErr } = await deleteQuery;
        if (deleteErr) throw deleteErr;
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error in POST sync:', err);
      return res.status(500).json({ error: 'Failed to sync data', details: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
