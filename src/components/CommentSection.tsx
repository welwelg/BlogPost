import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchComments, addComment, updateComment , deleteComment } from '@/features/comments/commentsSlice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Trash2, MessageSquare, Pencil } from "lucide-react";


interface CommentSectionProps {
  postId: number;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { list } = useSelector((state: RootState) => state.comments);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // NEW COMMENT
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // EDIT COMMENT
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    dispatch(fetchComments(postId));
  }, [dispatch, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !user.email) return;

    setIsSubmitting(true);
    await dispatch(addComment({ 
      postId, 
      content, 
      userId: user.id, 
      userEmail: user.email 
    }));
    
    setContent('');
    setIsSubmitting(false);
    toast.success("Comment added!");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this comment?")) {
      await dispatch(deleteComment(id));
      toast.success("Comment deleted");
    }
  };

  const startEditing = (id: number, currentContent: string) => {
    setEditingId(id);
    setEditContent(currentContent);
  };

  const handleUpdate = async () => {
    if (!editContent.trim() || !editingId) return;
    
    await dispatch(updateComment({ id: editingId, content: editContent }));
    setEditingId(null);
    setEditContent('');
    toast.success("Comment updated!");
  };

  // CANCEL EDIT FUNCTION
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div className="mt-10 border-t pt-8">
      <h3 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6" />
        Comments ({list.length})
      </h3>

      {/* COMMENT FORM */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <Textarea 
            placeholder="What are your thoughts?" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-25"
          />
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      ) : (
        <div className="bg-gray-100 p-4 rounded-lg mb-8 text-center text-gray-600">
          Please login to leave a comment.
        </div>
      )}

      {/* COMMENTS LIST */}
      <div className="space-y-6">
        {list.length === 0 ? (
          <p className="text-gray-500 italic">No comments yet. Be the first!</p>
        ) : (
          list.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl border">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.user_email}`} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-sm block">
                      {comment.user_email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {user && user.id === comment.user_id && (
                    <div className="flex gap-1">
                      {/* EDIT BUTTON */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-blue-500"
                        onClick={() => startEditing(comment.id, comment.content)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {/* DELETE BUTTON */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* CONTENT DISPLAY LOGIC */}
                {editingId === comment.id ? (
                  // EDIT MODE
                  <div className="mt-2 space-y-2">
                    <Textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-20"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdate} className="flex gap-1">
                         Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="flex gap-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                <p className="mt-2 text-gray-700 text-sm whitespace-pre-wrap">
                  {comment.content}
                </p>

                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;