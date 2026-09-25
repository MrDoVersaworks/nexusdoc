'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface Review {
  id: string;
  name: string;
  profession: string | null;
  rating: number;
  feedback: string;
  status: string;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await apiRequest<{ success: true; data: Review[] }>({ method: 'GET', path: '/api/admin/reviews' });
      if (response.success) setReviews(response.data);
    } catch {
      toast.error('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    try {
      await apiRequest({ method: 'PATCH', path: `/api/admin/reviews/${id}/approve` });
      setReviews((items) => items.map((review) => review.id === id ? { ...review, status: 'approved' } : review));
      toast.success('Review approved.');
    } catch { toast.error('Failed to approve review.'); }
  }

  async function remove(id: string) {
    try {
      await apiRequest({ method: 'DELETE', path: `/api/admin/reviews/${id}` });
      setReviews((items) => items.filter((review) => review.id !== id));
      toast.success('Review removed.');
    } catch { toast.error('Failed to remove review.'); }
  }

  if (loading) return <div className="p-8 text-white">Loading reviews…</div>;

  return (
    <div className="min-h-screen bg-[#05050a] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Review Moderation</h1>
          <p className="text-sm text-[#8a99ad] mt-1">Public reviews remain hidden until explicitly approved.</p>
        </header>
        <div className="grid gap-4">
          {reviews.map((review) => (
            <article key={review.id} className="bg-[#0c0f1d] border border-white/10 rounded-xl p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <div className="font-semibold">{review.name} <span className="text-[#06b6d4] font-normal">• {review.profession || 'User'}</span></div>
                  <div className="text-yellow-400 my-2">{'★'.repeat(review.rating)}</div>
                  <p className="text-[#e2e8f0] whitespace-pre-wrap">{review.feedback}</p>
                  <p className="text-xs text-[#64748b] mt-3">{review.status} · {new Date(review.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 h-fit">
                  {review.status !== 'approved' && <button className="px-3 py-2 rounded bg-emerald-600" onClick={() => approve(review.id)}>Approve</button>}
                  <button className="px-3 py-2 rounded bg-rose-600" onClick={() => remove(review.id)}>Remove</button>
                </div>
              </div>
            </article>
          ))}
          {reviews.length === 0 && <p className="text-[#8a99ad]">No reviews awaiting moderation.</p>}
        </div>
      </div>
    </div>
  );
}
