#!/usr/bin/env node
// Automated tests for Firestore rules (emulator).
// Tests: rating decimal, order status creation, stock +20 protection, stock decrease/return.

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';

import admin from 'firebase-admin';
import fetch from 'node-fetch';

(async function main(){
  try {
    console.log('Starting Firestore rules tests (emulator):');

    const PROJECT = process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'g-mart-live-b07a0';
    admin.initializeApp({ projectId: PROJECT });
    const adminDb = admin.firestore();

    // Use a unique run ID so every test run uses fresh documents (avoids stale state)
    const RUN = Date.now();
    const testEmail = 'tester@example.com';

    // Seed product with stock=10 (fresh reset each run)
    await adminDb.doc('products/test-prod').set({ id: 'test-prod', name: 'Test Product', stock: 10 });
    console.log('Admin: seeded product with stock=10');

    // Get or create test user in Auth emulator
    let uid;
    const existing = await admin.auth().getUserByEmail(testEmail).catch(() => null);
    if (existing) {
      uid = existing.uid;
    } else {
      const created = await admin.auth().createUser({ email: testEmail });
      uid = created.uid;
    }
    console.log('Admin: test user uid =', uid);

    // Sign in using a custom token exchanged for an ID token.
    // The custom token carries standard Auth claims but we need the Auth emulator
    // to mint an idToken that has `email` as a standard claim.
    // Approach: use the REST signInWithCustomToken endpoint — this gives us a real
    // Firebase ID token, and we verify the token carries the email claim.
    const AUTH_EMU = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;

    // Create a custom token WITHOUT extra claims — the email will come from the 
    // Auth emulator's user record (which has email from createUser)
    const customToken = await admin.auth().createCustomToken(uid);

    const signInResp = await fetch(
      `${AUTH_EMU}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true })
      }
    );
    const signInJson = await signInResp.json();
    if (!signInResp.ok) {
      console.error('Auth emulator sign-in failed:', signInJson);
      throw new Error('Auth sign-in failed: ' + JSON.stringify(signInJson));
    }
    const idToken = signInJson.idToken;
    console.log('Auth emulator: got idToken via custom token sign-in');

    // The emulator's custom token sign-in does NOT put `email` into request.auth.token
    // automatically. We need to fetch the user's ID token with a lookup call
    // to get it to include the email. Instead, set email verified via Admin SDK
    // and then use a lookup to refresh the token claims.
    // Simplest fix: use the emulator REST to get user info and confirm email is present
    const lookupResp = await fetch(
      `${AUTH_EMU}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=fake`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );
    const lookupJson = await lookupResp.json();
    const userInfo = lookupJson.users?.[0];
    console.log('Token user email:', userInfo?.email, '| emailVerified:', userInfo?.emailVerified);

    // --- REST helpers ---
    function jsToFields(obj) {
      const fields = {};
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v === null) fields[k] = { nullValue: null };
        else if (typeof v === 'string') fields[k] = { stringValue: v };
        else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
        else if (typeof v === 'number') {
          if (Number.isInteger(v)) fields[k] = { integerValue: String(v) };
          else fields[k] = { doubleValue: v };
        } else if (Array.isArray(v)) {
          fields[k] = { arrayValue: { values: v.map(x => ({ stringValue: String(x) })) } };
        } else if (typeof v === 'object') {
          fields[k] = { mapValue: { fields: jsToFields(v) } };
        } else {
          fields[k] = { stringValue: String(v) };
        }
      }
      return fields;
    }

    const BASE = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;

    // PATCH (update) with field mask — expects existing doc
    async function tryUpdate(description, docPath, dataObj, expectReject = true) {
      const keys = Object.keys(dataObj);
      const qp = keys.map(k => `updateMask.fieldPaths=${k}`).join('&');
      const url = `${BASE}/${docPath}?${qp}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ fields: jsToFields(dataObj) })
      });
      const j = await res.json().catch(() => ({}));
      const status = res.ok ? 'ALLOWED' : 'REJECTED';
      const expected = (res.ok === !expectReject) ? '(expected)' : '(UNEXPECTED - FAIL)';
      console.log(`[UPDATE] ${description}: ${status} ${expected}${!res.ok ? ` -> ${j.error?.message || JSON.stringify(j)}` : ''}`);
      return res.ok;
    }

    // POST (create) — always creates a new document
    async function tryCreate(description, docPath, dataObj, expectReject = true) {
      // Use the document path as collection + docId split
      const parts = docPath.split('/');
      const docId = parts.pop();
      const collPath = parts.join('/');
      const url = `${BASE}/${collPath}?documentId=${docId}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ fields: jsToFields(dataObj) })
      });
      const j = await res.json().catch(() => ({}));
      const status = res.ok ? 'ALLOWED' : 'REJECTED';
      const expected = (res.ok === !expectReject) ? '(expected)' : '(UNEXPECTED - FAIL)';
      console.log(`[CREATE] ${description}: ${status} ${expected}${!res.ok ? ` -> ${j.error?.message || JSON.stringify(j)}` : ''}`);
      return res.ok;
    }

    console.log('\n--- Test Results ---');

    // 1) Review with decimal rating (4.5) should be REJECTED — only integers allowed
    await tryCreate(
      'Review with decimal rating 4.5 (should reject)',
      `products/test-prod/reviews/test-decimal-${RUN}`,
      { userEmail: testEmail.toLowerCase(), rating: 4.5, comment: 'decimal test' },
      true  // expectReject = true
    );

    // 2) Review with integer rating 4 should be ALLOWED
    await tryCreate(
      'Review with integer rating 4 (should allow)',
      `products/test-prod/reviews/test-int-${RUN}`,
      { userEmail: testEmail.toLowerCase(), rating: 4, comment: 'integer test' },
      false  // expectReject = false
    );

    // 3) Order creation with status 'delivered' should be REJECTED
    await tryCreate(
      'Order create with status=delivered (should reject)',
      `orders/test-order-${RUN}`,
      { customerEmail: testEmail.toLowerCase(), status: 'delivered', totalAmount: 100 },
      true
    );

    // 4) Order creation with status 'placed' should be ALLOWED
    await tryCreate(
      'Order create with status=placed (should allow)',
      `orders/test-order-placed-${RUN}`,
      { customerEmail: testEmail.toLowerCase(), status: 'placed', totalAmount: 100 },
      false
    );

    // 5) Stock increase to 1000 (hacker) should be REJECTED (increase > 20)
    await tryUpdate(
      'Stock increase to 1000 - hacker attempt (should reject)',
      'products/test-prod',
      { stock: 1000 },
      true
    );

    // 6) Stock decrease to 5 (purchase) should be ALLOWED
    await tryUpdate(
      'Stock decrease to 5 - purchase (should allow)',
      'products/test-prod',
      { stock: 5 },
      false
    );

    // 7) Small stock increase to 7 (return +2) should be ALLOWED
    await tryUpdate(
      'Stock increase to 7 - return +2 (should allow)',
      'products/test-prod',
      { stock: 7 },
      false
    );

    console.log('\nAll tests finished. Check above for (expected) vs (UNEXPECTED - FAIL).');
    process.exit(0);
  } catch (err) {
    console.error('Test script failed:', err);
    process.exit(2);
  }
})();
