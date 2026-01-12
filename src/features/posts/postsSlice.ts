import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabase';

// Define Types
export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  user_email?: string;
  image_url?: string;
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

// HELPER: Upload Image Function
const uploadImage = async (file: File) => {
  const fileName = `${Date.now()}-${file.name}`;
  
  // FIX #1: Removed 'data' because it was unused
  const { error } = await supabase.storage
    .from('blog-images')
    .upload(fileName, file);

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(fileName);

  return publicUrl;
};

// FETCH POSTS with PAGINATION
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (page: number, { rejectWithValue }) => {
    const ITEMS_PER_PAGE = 3;
    
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' }) 
      .order('created_at', { ascending: false }) 
      .range(from, to);

    if (error) return rejectWithValue(error.message);
    
    return { data, count, page };
  }
);

// CREATE POST
export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ title, content, user_id, user_email, imageFile }: { title: string; content: string, user_id: string, user_email?: string, imageFile?: File | null }, { rejectWithValue }) => {
    
    let image_url = null; 
    
    try {
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{ title, content, user_id, user_email, image_url }])
        .select()
        .single(); 

      if (error) return rejectWithValue(error.message);
      return data;
    } catch (err) {
      // FIX #2: Cast error safely instead of using 'any'
      return rejectWithValue((err as Error).message);
    }
  }
);

// DELETE POST
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
    async ({ id, title, content, imageFile }: { id: number; title: string; content: string, imageFile?: File | null }, { rejectWithValue }) => {
      
      let image_url;
      
      try {
        if (imageFile) {
          image_url = await uploadImage(imageFile);
        }

        // FIX #3: Use 'Partial<Post>' instead of 'any' for better type safety
        const updates: Partial<Post> = { title, content };
        if (image_url) updates.image_url = image_url;
        
        const { data, error } = await supabase
          .from('posts')
          .update(updates) 
          .eq('id', id)
          .select()
          .single();
  
        if (error) return rejectWithValue(error.message);
        return data;

      } catch (err) {
        // FIX #4: Cast error safely instead of using 'any'
        return rejectWithValue((err as Error).message);
      }
    }
  );

// SLICE & REDUCERS
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
        state.list.unshift(action.payload); 
      })

      // Delete Post 
      .addCase(deletePost.fulfilled, (state, action) => {
        state.list = state.list.filter((post) => post.id !== action.payload);
      })

      // Update Post 
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.list.findIndex(post => post.id === action.payload.id);
        if (index !== -1) {
            state.list[index] = action.payload;
        }
      });
  },
});

export default postsSlice.reducer;