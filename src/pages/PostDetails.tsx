import { useEffect, useState } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/services/supabase';
import type { Post } from '@/features/posts/postsSlice'; 
import { MoveLeft } from 'lucide-react';
import CommentSection from '@/components/CommentSection';

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Try to find post in Redux store first
  const cachedPost = useSelector((state: RootState) => 
    state.posts.list.find((p) => p.id === Number(id))
  );

  const [post, setPost] = useState<Post | null>(cachedPost || null);
  const [loading, setLoading] = useState(!cachedPost);

  useEffect(() => {
   
    if (!post) {
      const fetchSingle = async () => {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          setPost(data);
        }
        setLoading(false);
      };
      fetchSingle();
    }
  }, [id, post]);

  if (loading) return <div className="p-10 text-center">Loading post...</div>;
  if (!post) return <div className="p-10 text-center">Post not found.</div>;

  return (
    <div className="container mx-auto max-w-4xl p-6">
      
      <Card className="overflow-hidden">
        {/* IMAGE DISPLAY */}
        {post.image_url && (
          <div className="w-full h-64 md:h-96 bg-gray-100 relative">
             <img 
               src={post.image_url} 
               alt={post.title} 
               className="w-full h-full object-cover"
             />
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold">{post.title}</CardTitle>
          <p className="text-gray-500 text-sm mt-2">
            Posted by {post.user_email?.split('@')[0]} • {new Date(post.created_at).toLocaleDateString()}
          </p>
        </CardHeader>

        <CardContent>
          <div className="prose max-w-none whitespace-pre-wrap leading-relaxed text-gray-800 text-lg">
            {post.content}
          </div>
        </CardContent>
      </Card>
      
      {/* COMMENT SECTION */}
      {post && <CommentSection postId={post.id} />}

      <Button variant="outline" onClick={() => navigate('/dashboard')} className="mt-4">
        <MoveLeft/>
      </Button>

    </div>
  );
};

export default PostDetails;