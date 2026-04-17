import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Confetti from 'react-confetti';
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
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check for payment success parameter
    if (params.get('payment_success') === 'true') {
      setShowPaymentSuccess(true);
      // Remove it from URL cleanly so it doesn't trigger again on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_success');
      window.history.replaceState({}, '', url);
    }

    // Check for public course ID in URL
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
      
      {/* Payment Success Modal */}
      <AnimatePresence>
        {showPaymentSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          >
            <Confetti 
              width={window.innerWidth} 
              height={window.innerHeight} 
              recycle={false} 
              numberOfPieces={600} 
              gravity={0.12} 
              colors={['#22ff88', '#00ffcc', '#ffffff', '#10b981']}
            />
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-[#050505] border border-[#22ff88]/30 p-10 rounded-3xl shadow-[0_0_50px_rgba(34,255,136,0.15)] max-w-md w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#22ff88]/50 via-[#22ff88] to-[#22ff88]/50"></div>
              <div className="w-24 h-24 bg-[#22ff88]/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                  <div className="absolute inset-0 rounded-full animate-ping bg-[#22ff88]/20 opacity-75"></div>
                  <svg className="w-12 h-12 text-[#22ff88] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Pagamento Aprovado!</h2>
              <p className="text-zinc-400 mb-8 max-w-sm mx-auto text-[1.05rem] leading-relaxed">
                Sua matrícula foi concluída com sucesso. O seu <strong>The Creator Masterclass</strong> acaba de ser destrancado.
              </p>
              <button
                  onClick={() => setShowPaymentSuccess(false)}
                  className="w-full bg-[#22ff88] hover:bg-[#1ee077] text-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#22ff88]/20 hover:shadow-[#22ff88]/40 active:scale-[0.98] text-lg uppercase tracking-wider"
              >
                  Acessar meu Treinamento
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster 
        theme="dark" 
        position="top-right" 
        closeButton 
        toastOptions={{
          style: {
            background: 'rgba(5, 5, 5, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(34, 255, 136, 0.2)',
            color: '#fff',
            borderRadius: '1rem',
          },
        }}
      />
    </AnimatePresence>
  );
}
