import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

const ONESIGNAL_APP_ID = "5d76f007-2e38-4843-ade6-55e034235a92";

// Internal helper using our Vercel Serverless Function
const fetchWithServer = async (notification) => {
  try {
    const response = await fetch('/api/send-notification', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ notification })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Server Error' };
    }
    return { success: true, data };
  } catch (err) {
    console.error(`[Push] Server function error:`, err);
    return { success: false, error: "Push service contact fail. Vercel pe deploy kiya?" };
  }
};

export const sendGeneralNotification = async (title, message, targetType, targetPhone = null, uids = []) => {
  try {
    const notification = {
      headings: { en: title },
      contents: { en: message },
      priority: 10,
      android_sound: "notification",
      data: { type: "general" }
    };

    if (targetType === 'all') {
      // Broadcast to All Active Users
      notification.included_segments = ["Total Subscriptions"];
    } else if (uids && uids.length > 0) {
      // Send only to specific user UIDs (OneSignal REST API expects this field)
      notification.include_external_user_ids = uids;
    } else {
      return { success: false, error: "Target (All or User ID) fail." };
    }

    const { success, data, error } = await fetchWithServer(notification);
    return success ? { success: true, notificationId: data.id } : { success: false, error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendOfferNotification = async (offerText, segment, targetedUsers) => {
  const uids = targetedUsers.map(u => u.uid).filter(Boolean);
  if (uids.length === 0) return { success: false, error: "No UIDs" };
  
  return await sendGeneralNotification("🎁 Special Offer!", offerText, 'specific', null, uids);
};

export const sendAdminOrderNotification = async (orderId, totalAmount, customerName) => {
  try {
    const notification = {
      filters: [{ field: "tag", key: "role", relation: "=", value: "admin" }],
      headings: { en: "🚨 NEW ORDER! 🚨" },
      contents: { en: `Order #${orderId} for ₹${totalAmount}` }
    };
    const { success } = await fetchWithServer(notification);
    return { success };
  } catch (error) {
    return { success: false };
  }
};
