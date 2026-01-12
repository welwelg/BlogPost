import { createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import { supabase } from '../../services/supabase';

// Define Types (Para alam ni TS kung ano ang itsura ng Post)
export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  user_email?: string;
  created_at: string;
}

interface PostsState {
  list: Post[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalCount: number; 
}

const initialState: PostsState = {
  list: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalCount: 0,
};

// FETCH POSTS with PAGINATION
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (page: number, { rejectWithValue }) => {
    const ITEMS_PER_PAGE = 3;
    
    // Logic: Calculate range based on page
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' }) 
      .order('created_at', { ascending: false }) 
      .range(from, to);

    if (error) return rejectWithValue(error.message);
    
    // Return both data and count
    return { data, count, page };
  }
);

// CREATE POST
export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ title, content, user_id, user_email }: { title: string; content: string, user_id: string, user_email?: string }, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ title, content, user_id, user_email }])
      .select()
      .single(); 

    if (error) return rejectWithValue(error.message);
    return data;
  }
);

//  DELETE POST
export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId: number, { rejectWithValue }) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) return rejectWithValue(error.message);
    return postId; 
  }
);

// UPDATE POST
export const updatePost = createAsyncThunk(
    'posts/updatePost',
    async ({ id, title, content }: { id: number; title: string; content: string }, { rejectWithValue }) => {
      const { data, error } = await supabase
        .from('posts')
        .update({ title, content })
        .eq('id', id)
        .select()
        .single();
  
      if (error) return rejectWithValue(error.message);
      return data;
    }
  );

//  SLICE & REDUCERS
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => { state.loading = true; })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.totalCount = action.payload.count || 0;
        state.currentPage = action.payload.page;
      })

      // Create Post 
      .addCase(createPost.fulfilled, (state, action) => {
        // Add the new post to the top of the list
        state.list.unshift(action.payload); 
      })

      // Delete Post 
      .addCase(deletePost.fulfilled, (state, action) => {
        // Filter out the deleted post
        state.list = state.list.filter((post) => post.id !== action.payload);
      })

      // Update Post 
      .addCase(updatePost.fulfilled, (state, action) => {
        // Find and replace the updated post
        const index = state.list.findIndex(post => post.id === action.payload.id);
        if (index !== -1) {
            state.list[index] = action.payload;
        }
      });
  },
});

export default postsSlice.reducer;