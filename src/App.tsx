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

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setView('dashboard');
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setView('dashboard');
      } else {
        setView('landing');
      }
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
          <Dashboard />
          <div className="fixed bottom-12 right-12 flex gap-4 z-50">
            <button 
              onClick={() => setView('landing')}
              className="px-6 py-2 bg-[#141414] text-[#E4E3E0] rounded-full text-[10px] font-mono uppercase tracking-[0.2em] shadow-xl hover:scale-110 active:scale-95 transition-all border border-[#E4E3E0]/20"
            >
              ← Public View
            </button>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="px-6 py-2 bg-red-500/10 text-red-400 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] shadow-xl hover:scale-110 active:scale-95 transition-all border border-red-500/20"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
