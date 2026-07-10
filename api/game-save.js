/* global process */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { deviceId } = req.query;
    if (!deviceId) return res.status(400).json({ error: 'Missing deviceId' });
    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('state,updated_at')
        .eq('device_id', deviceId)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json({ success: true, save: data || null });
    } catch (error) {
      return res.status(500).json({ error: 'Game save unavailable', details: error.message });
    }
  }

  if (req.method === 'POST') {
    const { deviceId, state } = req.body || {};
    if (!deviceId || !state) return res.status(400).json({ error: 'Missing game save data' });
    try {
      const { error } = await supabase.from('game_saves').upsert({
        device_id: deviceId,
        state,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Could not save game', details: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
