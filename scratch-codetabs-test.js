const ONESIGNAL_APP_ID = "5d76f007-2e38-4843-ade6-55e034235a92";
const ONESIGNAL_API_KEY = "xkcpvhnhve5vmy2wq45d5ty3w";

async function testCodetabs() {
  try {
    console.log("Testing proxy: api.codetabs.com...");
    const url = "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent("https://onesignal.com/api/v1/notifications");
    const response = await fetch(url, {
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
        headings: { en: "🚨 TEST CODETABS PROXY 🚨" },
        contents: { en: "This is a test notification to check if Codetabs CORS proxy works!" },
        priority: 10,
        android_sound: "notification",
        ios_sound: "notification.wav",
        data: { orderId: "test_123", type: "new_order" }
      })
    });

    const text = await response.text();
    console.log("Codetabs Status:", response.status);
    console.log("Codetabs Response:", text);
  } catch (error) {
    console.error("Codetabs Error:", error);
  }
}

testCodetabs();
