import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { db } from '../../firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function ReviewModal({ isOpen, onClose, product, onSubmitSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    setIsSubmitting(true);
    try {
      const productId = product.id.toString();
      const reviewId = `rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const productRef = doc(db, 'products', productId);
      const reviewRef = doc(db, 'products', productId, 'reviews', reviewId);

      await runTransaction(db, async (transaction) => {
        const prodDoc = await transaction.get(productRef);
        if (!prodDoc.exists()) {
          throw new Error("Product does not exist!");
        }

        const currentData = prodDoc.data();
        const currentRating = currentData.rating || 0;
        const currentCount = currentData.reviewCount || 0;

        // Calculate new average rating
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;

        // Create the review document
        transaction.set(reviewRef, {
          rating,
          comment,
          userName: user.name || 'Anonymous',
          userEmail: user.email.toLowerCase(),
          createdAt: serverTimestamp()
        });

        // Update the product document
        transaction.update(productRef, {
          rating: Number(newRating.toFixed(1)),
          reviewCount: newCount
        });
      });

      toast.success('Review submitted successfully!');
      if (onSubmitSuccess) onSubmitSuccess();
      onClose();
      // Reset form
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900">Write a Review</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <img 
              src={product.image || `https://picsum.photos/seed/${product.id}/100/100`} 
              alt={product.name}
              className="w-12 h-12 rounded-lg object-contain bg-gray-50 p-1 border border-gray-100"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</p>
              <p className="text-xs text-gray-500">{product.brand || 'G Mart'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Your Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        (hoverRating || rating) >= star 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'fill-gray-100 text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Your Review (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike about this product?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1CA672]/20 focus:border-[#1CA672] outline-none transition-all resize-none h-28"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="w-full bg-[#1CA672] hover:bg-[#17905F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl shadow-lg shadow-green-100 active:scale-95 transition-all mt-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
