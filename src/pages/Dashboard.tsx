import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store/store';
import { fetchPosts, createPost, deletePost, updatePost, type Post } from '../features/posts/postsSlice';
import { logoutUser } from '../features/auth/authSlice';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Global State
  const { user } = useSelector((state: RootState) => state.auth);
  const { list, loading, currentPage } = useSelector((state: RootState) => state.posts);

  // Local State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      dispatch(fetchPosts(currentPage));
    }
  }, [dispatch, currentPage, user, navigate]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !user) return;

    if (editingId) {
      // UPDATE 
      await dispatch(updatePost({ id: editingId, title, content }));
      setEditingId(null);
      toast.success("Post Updated", { 
        description: "Your changes have been saved successfully." 
      });
    } else {
      await dispatch(createPost({ 
        title, 
        content, 
        user_id: user.id, 
        user_email: user.email 
      }));
      toast.success("Post Published", { 
        description: "Your new blog post is now live!" 
      });
    }
    
    setTitle('');
    setContent('');
  };

  const handleEdit = (post: Post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info("Editing Mode", { 
      description: "You can update your post details on the left." 
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this?")) {
      await dispatch(deletePost(id));
      toast.error("Post Deleted", { 
        description: "The post has been removed from your feed." 
      });
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    toast("Logged Out", { 
      description: "See you next time!" 
    });
    navigate('/');
  };

  const handlePageChange = (newPage: number) => {
    dispatch(fetchPosts(newPage));
  };

  return (
    <div className="container mx-auto max-w-7xl px-6">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60 py-6 border-b mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your posts and content.</p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pb-10">
        <div className="md:col-span-1 sticky top-32">
          <Card className="shadow-md border-t-4 border-t-black">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Post' : 'Create New Post'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title"
                    placeholder="Enter an engaging title..." 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea 
                    id="content"
                    placeholder="Write your thoughts here..." 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    rows={8}
                    required 
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Saving...' : (editingId ? 'Update Post' : 'Publish Post')}
                  </Button>
                  
                  {editingId && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => { setEditingId(null); setTitle(''); setContent(''); }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Recent Posts</h2>
            <span className="text-sm text-gray-500">Page {currentPage}</span>
          </div>
          
          {loading && <p className="text-gray-500 animate-pulse">Loading posts...</p>}

          {list.length === 0 && !loading ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              No posts yet. Start writing on the left!
            </div>
          ) : (
            <div className="grid gap-6">
              {list.map((post) => (
                <Card key={post.id} className="transition-all hover:shadow-lg border-l-4 border-l-transparent hover:border-l-black">
              
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <span className="font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {post.user_email ? post.user_email.split('@')[0] : 'Unknown User'}
                          </span>
                          <span>•</span>
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </CardContent>
                  
                  {/* ACTIONS */}
                  {user && user.id === post.user_id && (
                    <CardFooter className="flex justify-end gap-2 bg-gray-50/30 p-3">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)}>
                        Delete
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          <div className="flex justify-center items-center gap-4 pt-4 pb-8">
            <Button 
              variant="outline"
              disabled={currentPage === 1 || loading} 
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline"
              disabled={list.length < 3 || loading} 
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;