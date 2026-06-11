/* global process */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder');

export async function logRequest(req, endpoint, customDeviceId = null) {
  try {
    const method = req.method;
    
    // Extract client IP
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : (req.socket?.remoteAddress || '');

    // Extract User Agent
    const userAgent = req.headers['user-agent'] || '';

    // Simple parser for device/OS/browser
    let deviceType = 'desktop';
    let osName = 'unknown';
    let browserName = 'unknown';

    const uaLower = userAgent.toLowerCase();

    // Check device type
    if (uaLower.includes('mobi') || uaLower.includes('phone')) {
      deviceType = 'mobile';
    } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
      deviceType = 'tablet';
    }

    // Check OS name
    if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ipod')) {
      osName = 'iOS';
    } else if (uaLower.includes('android')) {
      osName = 'Android';
    } else if (uaLower.includes('macintosh') || uaLower.includes('mac os x')) {
      osName = 'macOS';
    } else if (uaLower.includes('windows')) {
      osName = 'Windows';
    } else if (uaLower.includes('linux')) {
      osName = 'Linux';
    }

    // Check browser name
    if (uaLower.includes('edg/')) {
      browserName = 'Edge';
    } else if (uaLower.includes('chrome') && !uaLower.includes('chromium')) {
      browserName = 'Chrome';
    } else if (uaLower.includes('safari') && !uaLower.includes('chrome')) {
      browserName = 'Safari';
    } else if (uaLower.includes('firefox')) {
      browserName = 'Firefox';
    } else if (uaLower.includes('opera') || uaLower.includes('opr/')) {
      browserName = 'Opera';
    }

    // Extract Vercel GeoIP headers
    const country = req.headers['x-vercel-ip-country'] || null;
    const region = req.headers['x-vercel-ip-country-region'] || null;
    const city = req.headers['x-vercel-ip-city'] || null;
    const latitude = req.headers['x-vercel-ip-latitude'] || null;
    const longitude = req.headers['x-vercel-ip-longitude'] || null;

    // Determine deviceId
    let deviceId = customDeviceId;
    if (!deviceId) {
      // Try to parse deviceId from query or body
      if (req.query && req.query.deviceId) {
        deviceId = req.query.deviceId;
      } else if (req.body && req.body.deviceId) {
        deviceId = req.body.deviceId;
      }
    }

    // Determine clientId
    let clientId = null;
    if (req.query && req.query.clientId) {
      clientId = req.query.clientId;
    } else if (req.body && req.body.clientId) {
      clientId = req.body.clientId;
    }

    // Determine isPwa
    let isPwa = false;
    if (req.query && req.query.pwa === 'true') {
      isPwa = true;
    } else if (req.body && req.body.pwa === true) {
      isPwa = true;
    }

    // Validate UUID format before inserting to avoid Postgres UUID cast errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (deviceId && !uuidRegex.test(deviceId)) {
      deviceId = null; // fallback to null rather than crash
    }

    // Insert log row
    const { error } = await supabase.from('request_logs').insert({
      device_id: deviceId,
      client_id: clientId,
      endpoint,
      method,
      ip,
      user_agent: userAgent,
      device_type: deviceType,
      os_name: osName,
      browser_name: browserName,
      country,
      region,
      city,
      latitude,
      longitude,
      is_pwa: isPwa
    });

    if (error) {
      console.error('Failed to save request log to database:', error);
    }
  } catch (err) {
    console.error('Error in request logging helper:', err);
  }
}
