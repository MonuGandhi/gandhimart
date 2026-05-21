export default async function handler(req, res) {
  // 1. Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { notification } = req.body;

  if (!notification) {
    return res.status(400).json({ error: 'No notification data provided' });
  }

  // 2. Setup OneSignal credentials
  // We'll use environment variables for security
  const ONESIGNAL_APP_ID = process.env.VITE_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

  if (!ONESIGNAL_REST_API_KEY) {
    return res.status(500).json({ 
      error: 'ONESIGNAL_REST_API_KEY is not configured on the server.' 
    });
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        ...notification,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0] || 'OneSignal API Error');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Push Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
