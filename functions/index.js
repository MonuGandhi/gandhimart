const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const ONESIGNAL_APP_ID = "5d76f007-2e38-4843-ade6-55e034235a92";
const ONESIGNAL_REST_API_KEY = "xkcpvhnhve5vmy2wq45d5ty3w";

// Professional Backend Push Caller
exports.sendPush = functions.https.onCall(async (data, context) => {
  // 1. Security Check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { title, message, targetType, uids, tags } = data;

  // 2. Build OneSignal Body
  const body = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: title },
    contents: { en: message },
    priority: 10,
    android_sound: "notification",
    ios_sound: "notification.wav"
  };

  if (targetType === 'all') {
    body.included_segments = ["All"];
  } else if (uids && uids.length > 0) {
    body.include_aliases = {
      external_id: uids
    };
    body.target_channel = "push";
  } else if (tags) {
    // For admin alerts or specific tags
    body.filters = Object.keys(tags).map((key, idx) => ({
      field: "tag",
      key: key,
      relation: "=",
      value: tags[key],
      ...(idx > 0 ? { operator: "OR" } : {})
    }));
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'No target users specified');
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    console.error("OneSignal Error:", error);
    return { success: false, error: error.message };
  }
});

exports.sendOfferNotification = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    // Verify user is admin
    const userDoc = await admin.firestore().collection('users').doc(context.auth.token.email).get();
    const userData = userDoc.data();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'pro_admin')) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can send offers');
    }

    // Validate input
    const { offerText, segment, targetedUsers } = data;

    if (!offerText || !segment || !targetedUsers || targetedUsers.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const phones = targetedUsers.map(u => u.phone);

    // Build filters for batch notification
    const filters = phones.map((phone, idx) => {
      const filter = {
        field: "tag",
        key: "phone",
        relation: "=",
        value: phone
      };
      if (idx > 0) filter.operator = "OR";
      return filter;
    });

    // Call OneSignal API
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: filters,
        headings: { en: "🎁 Special Offer Just For You!" },
        contents: { en: offerText },
        priority: 8,
        android_sound: "notification",
        ios_sound: "notification.wav",
        data: { type: "offer", segment },
        content_available: true
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('OneSignal Error:', responseData);
      throw new functions.https.HttpsError('internal', 'Failed to send notification via OneSignal');
    }

    // Log success
    console.log(`Notification sent to ${phones.length} users for ${segment} segment`);

    return {
      success: true,
      notificationId: responseData.id,
      recipientCount: phones.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Cloud Function Error:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', error.message || 'Unknown error occurred');
  }
});

exports.logOfferSent = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { offerId, notificationId, recipientCount } = data;

    // Update offer document with sent info
    await admin.firestore().collection('offers').doc(offerId).update({
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      notificationId: notificationId,
      recipientsSent: recipientCount
    });

    return { success: true };

  } catch (error) {
    console.error('Log Offer Error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
