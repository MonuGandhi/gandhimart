const ONESIGNAL_APP_ID = "5d76f007-2e38-4843-ade6-55e034235a92";
const ONESIGNAL_API_KEY = "xkcpvhnhve5vmy2wq45d5ty3w";

const proxies = [
  { name: "corsproxy.org", url: "https://corsproxy.org/?https://onesignal.com/api/v1/notifications" },
  { name: "thingproxy", url: "https://thingproxy.freeboard.io/fetch/https://onesignal.com/api/v1/notifications" },
  { name: "allorigins raw", url: "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://onesignal.com/api/v1/notifications") }
];

async function testProxy(proxy) {
  try {
    console.log(`\nTesting proxy: ${proxy.name}...`);
    const response = await fetch(proxy.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: "tag", key: "role", relation: "=", value: "admin" }
        ],
        headings: { en: `🚨 TEST ${proxy.name.toUpperCase()} 🚨` },
        contents: { en: `This is a test notification to check if ${proxy.name} works!` },
        priority: 10,
        android_sound: "notification",
        ios_sound: "notification.wav",
        data: { orderId: "test_123", type: "new_order" }
      })
    });

    const text = await response.text();
    console.log(`[${proxy.name}] Status:`, response.status);
    console.log(`[${proxy.name}] Response text (truncated):`, text.substring(0, 300));
  } catch (error) {
    console.error(`[${proxy.name}] Error during test:`, error);
  }
}

async function runAll() {
  for (const proxy of proxies) {
    await testProxy(proxy);
  }
}

runAll();
