import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { PublicCourseView } from './components/PublicCourseView';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Toaster } from 'sonner';

type View = 'landing' | 'auth' | 'dashboard';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [publicCourseId, setPublicCourseId] = useState<string | null>(null);

  useEffect(() => {
    // Check for public course ID in URL
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('c');
    if (courseId) {
      setPublicCourseId(courseId);
    }

    const handleSession = (session: Session | null) => {
      setSession(session);
      if (session) {
        // Only allow dashboard if email is confirmed
        if (!session.user.email_confirmed_at) {
          setUserData(null);
          setView('auth');
          return;
        }

        const email = session.user.email;
        const baseRole = session.user.user_metadata.role || 'membro';
        
        // Elevate danielribeirodasilvajnr@gmail.com to master
        const role = email === 'danielribeirodasilvajnr@gmail.com' ? 'master' : baseRole;

        setUserData({
          id: session.user.id,
          email: email,
          role: role,
          name: session.user.user_metadata.full_name || email?.split('@')[0],
          avatar_url: session.user.user_metadata.avatar_url,
          phone: session.user.user_metadata.phone,
          bio: session.user.user_metadata.bio,
        });
        setView('dashboard');
      } else {
        setUserData(null);
        // Only set to landing if not viewing a public course
        if (!new URLSearchParams(window.location.search).get('c')) {
          setView('landing');
        }
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <LandingPage onExplore={() => setView(session ? 'dashboard' : 'auth')} />
        </motion.div>
      ) : publicCourseId ? (
        <motion.div
          key="public-course"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PublicCourseView 
            courseId={publicCourseId} 
            session={session}
            onBack={() => {
              setPublicCourseId(null);
              // Remove ?c= parameter without refreshing
              const url = new URL(window.location.href);
              url.searchParams.delete('c');
              window.history.replaceState({}, '', url);
              setView(session ? 'dashboard' : 'landing');
            }}
            onAuth={() => setView('auth')}
          />
        </motion.div>
      ) : view === 'auth' ? (
        <motion.div
          key="auth"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Auth onSuccess={() => {
            setView('dashboard');
            // If was on a public course, the session check will handle it, 
            // but we might want to keep the public ID to show the checkout
          }} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-screen w-full"
        >
          <Dashboard userData={userData} session={session} />
        </motion.div>
      )}
      <Toaster 
        theme="dark" 
        position="top-right" 
        closeButton 
        toastOptions={{
          style: {
            background: 'rgba(10, 11, 14, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            borderRadius: '1rem',
          },
        }}
      />
    </AnimatePresence>
  );
}
