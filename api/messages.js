/* global process */
import { createClient } from '@supabase/supabase-js';
import { logRequest } from './_utils/logger.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIXED_START_DATE = '2026-06-01';

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
  await logRequest(req, '/api/messages');

  // GET: Fetch custom daily messages
  if (req.method === 'GET') {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId parameter' });
    }

    try {
      const { data, error } = await supabase
        .from('custom_messages')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return res.status(200).json({ success: true, messages: data });
    } catch (err) {
      console.error('Error fetching custom messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
    }
  }

  // POST: Add a new custom daily message
  if (req.method === 'POST') {
    const { deviceId, message } = req.body;

    if (!deviceId || !message) {
      return res.status(400).json({ error: 'Missing required parameters (deviceId, message)' });
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
            pill_name: 'Pastilla Diaria',
            reminder_time: '21:00',
            start_date: FIXED_START_DATE
          });
        if (insertDevError) throw insertDevError;
      }

      // 2. Insert custom message
      const { data, error } = await supabase
        .from('custom_messages')
        .insert({
          device_id: deviceId,
          message: message
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ success: true, message: data });
    } catch (err) {
      console.error('Error adding custom message:', err);
      return res.status(500).json({ error: 'Failed to add message', details: err.message });
    }
  }

  // DELETE: Delete a custom daily message
  if (req.method === 'DELETE') {
    const { deviceId, id } = req.body;

    if (!deviceId || !id) {
      return res.status(400).json({ error: 'Missing required parameters (deviceId, id)' });
    }

    try {
      const { data, error } = await supabase
        .from('custom_messages')
        .delete()
        .eq('device_id', deviceId)
        .eq('id', id)
        .select();

      if (error) throw error;

      return res.status(200).json({ success: true, deleted: data });
    } catch (err) {
      console.error('Error deleting custom message:', err);
      return res.status(500).json({ error: 'Failed to delete message', details: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
