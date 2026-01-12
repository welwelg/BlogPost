import { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux'; 
import PostDetails from './pages/PostDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import { setUser } from './features/auth/authSlice'; 
import { supabase } from './services/supabase'; 
import type { AppDispatch } from './store/store'; 
import Dashboard from './pages/Dashboard';
import { Toaster } from "@/components/ui/sonner"

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    //  Check kung may existing session pag-load ng page
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        dispatch(setUser(session.user));
      }
      setIsAuthChecked(true);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        dispatch(setUser(session.user));
      } else {
        dispatch(setUser(null));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);
  if (!isAuthChecked) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  return (
    <Router>
      <Routes>
        {/* Default page is Login */}
        <Route path="/" element={<Login />} />
        
        {/* Registration page */}
        <Route path="/register" element={<Register />} />
        
        {/* Protected Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/post/:id" element={<PostDetails />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  );
}

export default App;