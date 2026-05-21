import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const logWalletTransaction = async (email, amount, type, description) => {
  if (!email) return;
  try {
    const txRef = doc(collection(db, `users/${email}/wallet_transactions`));
    await setDoc(txRef, {
      amount,
      type, // 'credit', 'debit'
      category: type, // 'refund', 'referral', 'admin', 'purchase'
      description,
      date: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log wallet transaction:', error);
  }
};
