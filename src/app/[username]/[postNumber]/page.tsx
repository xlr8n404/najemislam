'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/PostCard';
import { BottomNav } from '@/components/BottomNav';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  user_id: string;
  post_number: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const postNumber = parseInt(params.postNumber as string);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        
        // First, get the user by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (profileError || !profileData) {
          setNotFound(true);
          return;
        }

        // Then fetch the post by user_id and post_number
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            user:profiles(id, full_name, username, avatar_url)
          `)
          .eq('user_id', profileData.id)
          .eq('post_number', postNumber)
          .single();

        if (postError || !postData) {
          setNotFound(true);
          return;
        }

        setPost(postData);
      } catch (error) {
        toast.error('Failed to load post');
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [username, postNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Post not found</h1>
          <p className="text-neutral-500 mb-8">
            This post may have been deleted or the link is incorrect.
          </p>
          <Link
            href={`/${username}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Profile
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Link
            href={`/${username}`}
            className="flex items-center gap-2 text-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </Link>
          <span className="text-sm text-neutral-500">Post #{post.post_number}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PostCard
            id={post.id}
            user_id={post.user_id}
            post_number={post.post_number}
            user={post.user || { id: '', full_name: '', username: '', avatar_url: null }}
            content={post.content}
            media_url={post.media_url}
            media_type={post.media_type as 'image' | 'video' | null}
            created_at={post.created_at}
          />
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
