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
  const ONESIGNAL_APP_ID = (process.env.ONESIGNAL_APP_ID || "").trim();
  const ONESIGNAL_REST_API_KEY = (process.env.ONESIGNAL_REST_API_KEY || "").trim();

  if (!ONESIGNAL_REST_API_KEY || !ONESIGNAL_APP_ID) {
    return res.status(500).json({ 
      error: `Config Missing: Check Vercel Env Variables. API_KEY length: ${ONESIGNAL_REST_API_KEY.length}`
    });
  }

  try {
    console.log(`Sending to OneSignal App: ${ONESIGNAL_APP_ID}`);
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
      // Return a clearer error to the user
      const errMsg = (data.errors && data.errors[0]) || JSON.stringify(data);
      throw new Error(`OneSignal Says: ${errMsg} (Check if your REST API Key is correct in Vercel)`);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Push Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
