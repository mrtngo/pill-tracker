import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicVapidKey = process.env.VITE_PUBLIC_VAPID_KEY || 'BHS4IqZrtQSFlBUE4IHEp7HR1YeOHa2iTUtP9RUjP_r1Ygb0SeChVvHhufqvPnmdzdnH6GxUttALSXKBICbDyN8';
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

// Configure web-push with VAPID details
if (privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:reminders@aegispill.com',
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn('Warning: PRIVATE_VAPID_KEY is not defined. Web Push notifications will fail.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder');

export default async function handler(req, res) {
  // 1. Authorize Cron trigger (in production)
  const authHeader = req.headers.authorization;
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 2. Fetch all active subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*');

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No subscriptions found.', sentCount: 0 });
    }

    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcTotalMinutes = utcHours * 60 + utcMinutes;

    let sentCount = 0;

    // 3. Filter and send notifications to due subscribers
    for (const sub of subscriptions) {
      const timezoneOffset = sub.timezone_offset; // e.g. 300 minutes for UTC-5
      const reminderTime = sub.reminder_time; // 'HH:MM'
      const pillName = sub.pill_name;

      // Calculate subscriber's current local minutes of the day (0 to 1439)
      const localTotalMinutes = (utcTotalMinutes - timezoneOffset + 1440) % 1440;

      // Convert reminder_time to minutes
      const [remHours, remMinutes] = reminderTime.split(':').map(Number);
      const scheduledMinutes = remHours * 60 + remMinutes;

      // Calculate subscriber's current local date in YYYY-MM-DD
      const localTimeMs = now.getTime() - timezoneOffset * 60 * 1000;
      const localDate = new Date(localTimeMs);
      const year = localDate.getUTCFullYear();
      const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(localDate.getUTCDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;

      // A reminder is due if current local time >= scheduled time
      const isTimeDue = localTotalMinutes >= scheduledMinutes;
      // Also ensure we haven't already notified the user today local-time
      const hasNotifiedToday = sub.last_notified_date === localDateStr;

      if (isTimeDue && !hasNotifiedToday) {
        const payload = JSON.stringify({
          title: `¡Hora de tu ${pillName}!`,
          body: `No olvides registrar tu dosis de hoy. Toca para registrar.`
        });

        try {
          if (!privateVapidKey) {
            throw new Error('VAPID Private Key missing from server environment');
          }
          await webpush.sendNotification(sub.subscription_json, payload);

          // Update last notified date
          await supabase
            .from('subscriptions')
            .update({ last_notified_date: localDateStr })
            .eq('id', sub.id);

          sentCount++;
        } catch (pushErr) {
          // If subscription is expired (410) or not found (404), clean it from database
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            console.log(`Subscription ${sub.id} has expired (status ${pushErr.statusCode}). Removing from database.`);
            await supabase
              .from('subscriptions')
              .delete()
              .eq('id', sub.id);
          } else {
            console.error(`Error sending push notification to subscriber ${sub.id}:`, pushErr);
          }
        }
      }
    }

    return res.status(200).json({ message: 'Cron run completed successfully.', sentCount });
  } catch (error) {
    console.error('Error during send-reminders cron processing:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
