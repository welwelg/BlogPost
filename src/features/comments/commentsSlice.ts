import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabase';

export interface Comment {
  id: number;
  content: string;
  post_id: number;
  user_id: string;
  user_email: string;
  created_at: string;
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

//  FETCH COMMENTS (By Post ID)
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (postId: number, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }); // Oldest first

    if (error) return rejectWithValue(error.message);
    return data;
  }
);

//  ADD COMMENT
export const addComment = createAsyncThunk(
  'comments/addComment',
  async ({ postId, content, userId, userEmail }: { postId: number, content: string, userId: string, userEmail: string }, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, content, user_id: userId, user_email: userEmail }])
      .select()
      .single();

    if (error) return rejectWithValue(error.message);
    return data;
  }
);

//  UPDATE COMMENT
export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ id, content }: { id: number, content: string }, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single();

    if (error) return rejectWithValue(error.message);
    return data;
  }
);

//  DELETE COMMENT
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