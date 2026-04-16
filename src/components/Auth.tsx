import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Globe, AlertCircle, Loader2 } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

type AuthMode = 'login' | 'register';
type AccessLevel = 'membro' | 'administrador';

export function Auth({ onSuccess }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('membro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: accessLevel,
            },
          },
        });
        if (error) throw error;
        alert('Confirme seu e-mail para ativar sua conta!');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0f1115]">
      {/* Immersive Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[60%] bg-[#2a1d17] rounded-full blur-[120px] opacity-40 rotate-[15deg]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[60%] bg-[#1a2f2f] rounded-full blur-[120px] opacity-40 rotate-[-15deg]" />
      </div>

      {/* Header Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-12 left-12 z-20"
      >
        <h1 className="text-[28px] font-bold tracking-tight text-[#22ff88] font-display">
          Aurora
        </h1>
      </motion.div>

      {/* Main Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] bg-[#1a1c22] rounded-[12px] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] z-10 border border-white/5"
      >
        <div className="mb-8">
          <h2 className="text-[32px] font-bold text-white mb-2">
            {mode === 'login' ? 'Login' : 'Criar conta'}
          </h2>
          <p className="text-[#94a3b8] text-sm">
            Selecione seu nível de acesso para continuar
          </p>
        </div>

        {/* Access Level Toggle */}
        <div className="flex bg-[#0f1115] p-1 rounded-lg mb-8 relative border border-white/5">
          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#2a2d35] rounded-md shadow-lg"
            animate={{ x: accessLevel === 'membro' ? 0 : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          <button
            onClick={() => setAccessLevel('membro')}
            className={cn(
              "flex-1 py-2 text-sm font-medium relative z-10 transition-colors uppercase tracking-wider",
              accessLevel === 'membro' ? "text-[#22ff88]" : "text-[#64748b]"
            )}
          >
            Membro
          </button>
          <button
            onClick={() => setAccessLevel('administrador')}
            className={cn(
              "flex-1 py-2 text-sm font-medium relative z-10 transition-colors uppercase tracking-wider",
              accessLevel === 'administrador' ? "text-[#22ff88]" : "text-[#64748b]"
            )}
          >
            Administrador
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <input
              type="email"
              placeholder="E-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#2a2d35]/50 border border-white/5 rounded-lg px-4 py-3.5 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#22ff88]/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <input
              type="password"
              placeholder="Senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#2a2d35]/50 border border-white/5 rounded-lg px-4 py-3.5 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#22ff88]/50 transition-all"
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#22ff88] to-[#00ffcc] rounded-lg text-black font-bold text-sm tracking-wide hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between text-xs text-[#64748b]">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-transparent checked:bg-[#22ff88] transition-all" />
            <span className="group-hover:text-white transition-colors">Lembrar-me</span>
          </label>
          <button className="hover:text-white transition-colors">Esqueceu sua senha?</button>
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-[#94a3b8]">
            {mode === 'login' ? 'Novo na plataforma?' : 'Já tem uma conta?'}
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-white font-bold hover:text-[#22ff88] transition-colors"
            >
              {mode === 'login' ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
          <p className="mt-6 text-[10px] text-[#64748b] leading-relaxed">
            Esta página é protegida por Google reCAPTCHA para garantir que você não é um robô. 
            <button className="text-[#22ff88] ml-1">Saiba mais.</button>
          </p>
        </div>
      </motion.div>

      {/* Global Footer */}
      <div className="absolute bottom-8 w-full px-12 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase font-bold tracking-[0.2em] text-[#64748b] z-20 gap-4">
        <div className="flex gap-8">
          <button className="hover:text-white transition-colors">Termos de Serviço</button>
          <button className="hover:text-white transition-colors">Privacidade</button>
          <button className="hover:text-white transition-colors">Suporte</button>
        </div>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 hover:text-white transition-colors">
            <Globe className="w-3 h-3" />
            Português (BR)
          </button>
          <span>© 2026 Aurora Creative Studio</span>
        </div>
      </div>
    </div>
  );
}
