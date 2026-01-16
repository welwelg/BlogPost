import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchComments, addComment, updateComment, deleteComment } from '@/features/comments/commentsSlice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Trash2, MessageSquare, Pencil, ImageIcon, XCircle } from "lucide-react";

interface CommentSectionProps {
  postId: number;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { list } = useSelector((state: RootState) => state.comments);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // NEW COMMENT STATE
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // EDIT COMMENT STATE
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  useEffect(() => {
    dispatch(fetchComments(postId));
  }, [dispatch, postId]);

  //Format Date nicely
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !imageFile) || !user || !user.email) return;

    setIsSubmitting(true);
    await dispatch(addComment({ 
      postId, 
      content, 
      userId: user.id, 
      userEmail: user.email,
      imageFile: imageFile || undefined 
    }));
    
    setContent('');
    setImageFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
    
    setIsSubmitting(false);
    toast.success("Comment added!");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this comment?")) {
      await dispatch(deleteComment(id));
      toast.success("Comment deleted");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditImageFile(e.target.files[0]);
    }
  };

  const startEditing = (id: number, currentContent: string) => {
    setEditingId(id);
    setEditContent(currentContent);
    setEditImageFile(null);
  };

  const handleUpdate = async () => {
    if (!editContent.trim() || !editingId) return;
    
    await dispatch(updateComment({ 
        id: editingId, 
        content: editContent,
        imageFile: editImageFile 
    }));
    
    setEditingId(null);
    setEditContent('');
    setEditImageFile(null);
    toast.success("Comment updated!");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditImageFile(null);
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
            placeholder={editingId ? "Finish editing first..." : "What are your thoughts?"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-25"
            disabled={!!editingId}
          />

          {imageFile && (
            <div className="relative w-fit">
              <img 
                src={URL.createObjectURL(imageFile)} 
                alt="Preview" 
                className="h-20 w-20 object-cover rounded-md border"
              />
              <button 
                type="button"
                aria-label="Remove image preview"
                onClick={() => {
                   setImageFile(null);
                   if(fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow-sm hover:text-red-700"
              >
                <XCircle className="w-5 h-5 fill-current" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
                aria-label="Attach image"
                disabled={!!editingId}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="gap-2 text-gray-600"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!editingId}
              >
                <ImageIcon className="w-4 h-4" />
                {imageFile ? "Change Image" : "Add Image"}
              </Button>
            </div>
            <Button type="submit" disabled={isSubmitting || (!content.trim() && !imageFile) || !!editingId}>
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
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
                    {/* Date & Edit Time Display */}
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {formatDate(comment.created_at)}
                      {comment.updated_at && (
                        <span className="italic text-gray-400 text-[10px] ml-1">
                          (Edited {formatDate(comment.updated_at)})
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {user && user.id === comment.user_id && !editingId && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-blue-500"
                        onClick={() => startEditing(comment.id, comment.content)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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

                {/* SHOW ORIGINAL IMAGE If not editing) */}
                {comment.image_url && !editingId && (
                   <div className="mt-3 mb-2">
                     <img 
                       src={comment.image_url} 
                       alt="Attachment" 
                       className="max-h-48 rounded-lg border object-cover"
                     />
                   </div>
                )}
                
                {/* EDIT MODE */}
                {editingId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    
                    {(comment.image_url || editImageFile) && (
                      <div className="mb-2 p-2 bg-gray-100 rounded border w-fit relative">
                        <span className="text-xs text-gray-500 mb-1 block">
                          {editImageFile ? "New Image Selected:" : "Current Image:"}
                        </span>
                        <img 
                          src={editImageFile ? URL.createObjectURL(editImageFile) : comment.image_url} 
                          alt="Attachment preview" 
                          className="h-24 w-auto rounded object-cover opacity-90"
                        />
                      </div>
                    )}

                     <div>
                      <input 
                        type="file" 
                        ref={editFileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleEditFileChange}
                        aria-label="Change comment image"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="gap-2 text-xs h-7 mb-2"
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        <ImageIcon className="w-3 h-3" />
                        {(editImageFile || comment.image_url) ? "Change Image" : "Add Image"}
                      </Button>
                    </div>

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
                  <p className="mt-1 text-gray-700 text-sm whitespace-pre-wrap">
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