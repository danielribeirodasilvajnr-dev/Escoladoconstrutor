import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

type View = 'landing' | 'auth' | 'dashboard';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const handleSession = (session: Session | null) => {
      setSession(session);
      if (session) {
        setUserData({
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata.role || 'membro',
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata.avatar_url,
          phone: session.user.user_metadata.phone,
        });
        setView('dashboard');
      } else {
        setUserData(null);
        setView('landing');
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
      ) : view === 'auth' ? (
        <motion.div
          key="auth"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Auth onSuccess={() => setView('dashboard')} />
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
          <Dashboard userData={userData} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
