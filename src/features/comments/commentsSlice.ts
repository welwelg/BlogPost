import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabase';

export interface Comment {
  id: number;
  content: string;
  post_id: number;
  user_id: string;
  user_email: string;
  image_url?: string;
  created_at: string;
  updated_at?: string; 
}

interface CommentsState {
  list: Comment[];
  loading: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  list: [],
  loading: false,
  error: null,
};

// Upload Image Function
const uploadCommentImage = async (file: File) => {
  const fileName = `comment-${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('blog-images')
    .upload(fileName, file);

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(fileName);

  return publicUrl;
};

// FETCH COMMENTS
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (postId: number, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) return rejectWithValue(error.message);
    return data;
  }
);

// ADD COMMENT
export const addComment = createAsyncThunk(
  'comments/addComment',
  async ({ postId, content, userId, userEmail, imageFile }: { postId: number, content: string, userId: string, userEmail: string, imageFile?: File | undefined }, { rejectWithValue }) => {
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadCommentImage(imageFile);
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, content, user_id: userId, user_email: userEmail, image_url: imageUrl }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// UPDATE COMMENT/
export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ id, content, imageFile }: { id: number, content: string, imageFile?: File | null }, { rejectWithValue }) => {
    try {
      const updates: { content: string; image_url?: string; updated_at: string } = { 
        content,
        updated_at: new Date().toISOString()
      };

      if (imageFile) {
        const imageUrl = await uploadCommentImage(imageFile);
        updates.image_url = imageUrl;
      }

      const { data, error } = await supabase
        .from('comments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// DELETE COMMENT
export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId: number, { rejectWithValue }) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) return rejectWithValue(error.message);
    return commentId;
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.list = action.payload;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = state.list.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.list = state.list.filter(c => c.id !== action.payload);
      });
  },
});

export default commentsSlice.reducer;