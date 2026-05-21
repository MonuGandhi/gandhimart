import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collectionGroup, query, orderBy, getDocs, doc, runTransaction } from 'firebase/firestore';
import { Star, Trash2 } from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // collectionGroup fetches all subcollections named 'reviews' across all products
        const q = query(collectionGroup(db, 'reviews'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), path: doc.ref.path }));
        setReviews(data);
      } catch (e) {
        console.error('Error fetching reviews', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleDelete = async (review) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const pathParts = review.path.split('/');
      const productId = pathParts[1];
      
      const productRef = doc(db, 'products', productId);
      const reviewRef = doc(db, review.path);

      await runTransaction(db, async (transaction) => {
        const prodDoc = await transaction.get(productRef);
        if (!prodDoc.exists()) {
          transaction.delete(reviewRef);
          return;
        }

        const currentData = prodDoc.data();
        const currentCount = currentData.reviewCount || 0;
        const currentRating = currentData.rating || 0;

        const newCount = Math.max(0, currentCount - 1);
        const newRating = newCount > 0 ? ((currentRating * currentCount) - review.rating) / newCount : 0;

        transaction.delete(reviewRef);
        transaction.update(productRef, {
          rating: Number(newRating.toFixed(1)),
          reviewCount: newCount
        });
      });

      setReviews(prev => prev.filter(r => r.path !== review.path));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading reviews…</div>;
  if (reviews.length === 0) return <div className="p-8 text-center">No reviews found.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">All Product Reviews</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map(review => (
          <div key={review.id} className="bg-white p-4 rounded-xl shadow">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.userName || 'Anonymous'}</span>
                <span className="text-xs text-gray-500">{review.userEmail}</span>
              </div>
              <button
                onClick={() => handleDelete(review)}
                className="text-red-500 hover:text-red-700"
                title="Delete review"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={14}
                  className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
                />
              ))}
            </div>
            {review.comment && (
              <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
            )}
            <p className="text-xs text-gray-400">{review.date || new Date(review.createdAt?.seconds * 1000).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
