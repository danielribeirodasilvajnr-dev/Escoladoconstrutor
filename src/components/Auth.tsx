import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Globe, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [verificationSent, setVerificationSent] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar com Google');
      setError(err.message || 'Erro ao conectar com Google');
    } finally {
      setLoading(false);
    }
  };

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
        toast.success(`Bem-vindo de volta, ${email.split('@')[0]}!`);
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: accessLevel,
              email: email,
            },
          },
        });

        if (signUpError) throw signUpError;

        setVerificationSent(true);
        toast.success('Confirme seu e-mail para ativar sua conta.');
        return; // Don't call onSuccess
      }
      onSuccess();
    } catch (err: any) {
      let message = err.message || 'Ocorreu um erro na autenticação.';
      
      // Tradução de erros comuns do Supabase
      if (message.includes('email rate limit exceeded')) {
        message = 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.';
      } else if (message.includes('Invalid login credentials')) {
        message = 'E-mail ou senha incorretos.';
      } else if (message.includes('User already registered')) {
        message = 'Este e-mail já está cadastrado.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Por favor, confirme seu e-mail para acessar a plataforma.';
      } else if (message.includes('Password should be at least 6 characters')) {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      }

      toast.error(message);
      setError(message);
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
          Escola do Construtor
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
            Aluno
          </button>
          <button
            onClick={() => {
              setAccessLevel('administrador');
              setMode('login'); // Force login mode for professors
            }}
            className={cn(
              "flex-1 py-2 text-sm font-medium relative z-10 transition-colors uppercase tracking-wider",
              accessLevel === 'administrador' ? "text-[#22ff88]" : "text-[#64748b]"
            )}
          >
            Professor
          </button>
        </div>

        <AnimatePresence mode="wait">
          {verificationSent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-[#22ff88]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#22ff88]/20">
                <Globe className="w-8 h-8 text-[#22ff88]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Verifique seu e-mail</h3>
              <p className="text-[#94a3b8] text-sm mb-6 leading-relaxed">
                Enviamos um link de confirmação para <span className="text-white font-medium">{email}</span>. 
                Por favor, clique no link para ativar sua conta.
              </p>
              <button
                onClick={() => setVerificationSent(false)}
                className="text-[#22ff88] text-sm font-bold hover:underline"
              >
                Voltar para o login
              </button>
            </motion.div>
          ) : (
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>

              {!verificationSent && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#1a1c22] px-2 text-[#64748b]">Ou continuar com</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white font-medium text-sm hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>
                </>
              )}
            </form>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between text-xs text-[#64748b]">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-transparent checked:bg-[#22ff88] transition-all" />
            <span className="group-hover:text-white transition-colors">Lembrar-me</span>
          </label>
          <button className="hover:text-white transition-colors">Esqueceu sua senha?</button>
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          {accessLevel === 'membro' ? (
            <p className="text-sm text-[#94a3b8]">
              {mode === 'login' ? 'Novo na plataforma?' : 'Já tem uma conta?'}
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-2 text-white font-bold hover:text-[#22ff88] transition-colors"
              >
                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          ) : (
            <p className="text-sm text-[#94a3b8]">
              Área de acesso restrito. Novos professores só podem acessar através de convite oficial.
            </p>
          )}
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
          <span>© 2026 Escola do Construtor</span>
        </div>
      </div>
    </div>
  );
}
