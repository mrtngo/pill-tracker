/* global process */
import { createClient } from '@supabase/supabase-js';
import { logRequest } from './_utils/logger.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIXED_START_DATE = '2026-06-01';

// Check configuration
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
}

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

  // Log the request
  await logRequest(req, '/api/subscribe');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { deviceId, subscription, reminderTime, timezoneOffset, pillName } = req.body;

  if (!deviceId || !subscription || !subscription.endpoint || !reminderTime || timezoneOffset === undefined || !pillName) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // 1. Ensure the device settings exist in the devices table
    const { error: deviceError } = await supabase
      .from('devices')
      .upsert(
        {
          id: deviceId,
          pill_name: pillName,
          reminder_time: reminderTime,
          start_date: FIXED_START_DATE
        }
      );

    if (deviceError) {
      throw deviceError;
    }

    // 2. Upsert the push subscription linked to the deviceId
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          device_id: deviceId,
          endpoint: subscription.endpoint,
          subscription_json: subscription,
          timezone_offset: timezoneOffset
        },
        { onConflict: 'endpoint' }
      )
      .select();

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return res.status(500).json({ error: 'Failed to save subscription', details: error.message });
  }
}
