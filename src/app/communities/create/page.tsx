'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function CreateCommunityPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Technology',
    avatar_url: '',
    is_private: false,
  });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
      } else {
        setCurrentUser(data.user);
      }
    };
    getUser();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Community name is required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creator_id: currentUser.id,
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        router.push(`/communities/${data.id}`);
      } else {
        const error = await res.json();
        setError(error.error || 'Failed to create community');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Technology', 'Sports', 'Entertainment', 'Business', 'Lifestyle', 'Education', 'Art', 'Music'];

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Create a Community</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Start a community around your interests and build a community of like-minded people
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Community Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
              Community Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Web Development"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What is your community about?"
              rows={4}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
              Community Avatar URL
            </label>
            <input
              type="url"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Private Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_private"
              id="is_private"
              checked={formData.is_private}
              onChange={handleInputChange}
              className="w-4 h-4"
            />
            <label htmlFor="is_private" className="text-sm text-zinc-900 dark:text-white">
              Make this community private (only approved members)
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
