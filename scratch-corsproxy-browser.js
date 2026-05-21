const ONESIGNAL_APP_ID = "5d76f007-2e38-4843-ade6-55e034235a92";
const ONESIGNAL_API_KEY = "xkcpvhnhve5vmy2wq45d5ty3w";

async function testCorsProxyIo() {
  try {
    console.log("Testing corsproxy.io with browser headers...");
    const response = await fetch("https://corsproxy.io/?https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_API_KEY}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9"
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: "tag", key: "role", relation: "=", value: "admin" }
        ],
        headings: { en: "🚨 TEST BROWSER HEADERS 🚨" },
        contents: { en: "Checking if browser headers bypass Cloudflare on corsproxy.io!" },
        priority: 10,
        android_sound: "notification",
        ios_sound: "notification.wav",
        data: { orderId: "test_123", type: "new_order" }
      })
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (error) {
    console.error("Error:", error);
  }
}

testCorsProxyIo();
