const ONESIGNAL_APP_ID = "5d76f007-2e38-4843-ade6-55e034235a92";
const ONESIGNAL_API_KEY = "xkcpvhnhve5vmy2wq45d5ty3w";

async function testCorsX2u() {
  try {
    console.log("Testing cors.x2u.in...");
    const url = "https://cors.x2u.in/https://onesignal.com/api/v1/notifications";
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
        headings: { en: "🚨 TEST CORS.X2U.IN 🚨" },
        contents: { en: "Checking if cors.x2u.in CORS proxy works!" },
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

testCorsX2u();
