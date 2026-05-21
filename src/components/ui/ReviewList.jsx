import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Star, MessageCircle, User } from 'lucide-react';

export default function ReviewList({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    const q = query(
      collection(db, 'products', productId.toString(), 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Format date safely
        date: doc.data().createdAt?.toDate().toLocaleDateString('en-IN', {
          year: 'numeric', month: 'short', day: 'numeric'
        }) || 'Just now'
      }));
      setReviews(fetchedReviews);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [productId]);

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-50 h-24 rounded-2xl w-full"></div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
        <MessageCircle size={40} className="text-gray-300 mb-3" />
        <h4 className="text-gray-800 font-bold text-sm">No reviews yet</h4>
        <p className="text-gray-400 text-xs mt-1">Be the first to review this product!</p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-row overflow-x-auto gap-4 snap-x scrollbar-hide pb-3">
      {reviews.map((review) => (
        <div 
          key={review.id} 
          className="flex-shrink-0 w-[280px] md:w-[320px] bg-white p-5 rounded-3xl border border-gray-100 shadow-sm shadow-gray-100/50 snap-start flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-[#1CA672] font-black text-sm">
                  {getInitials(review.userName)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{review.userName || 'Anonymous'}</h4>
                  <p className="text-[10px] font-bold text-gray-400">{review.date}</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg flex-shrink-0">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={10}
                    className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
                  />
                ))}
              </div>
            </div>

            {review.comment && (
              <p className="text-sm text-gray-600 leading-relaxed font-semibold ml-[52px] break-words">
                {review.comment}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
