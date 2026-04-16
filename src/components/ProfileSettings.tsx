import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, Upload, Loader2, Camera, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ProfileSettingsProps {
  userData: any;
}

export function ProfileSettings({ userData }: ProfileSettingsProps) {
  const [name, setName] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(userData?.avatar_url || '');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phone Mask for Brazil (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 7) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setPhone(value);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.id}-${Math.random()}.${fileExt}`;
      const filePath = `${userData.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (error: any) {
      alert('Erro ao fazer upload da imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          phone: phone,
          avatar_url: avatarUrl,
          bio: bio,
        }
      });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert('Erro ao salvar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-[800px] mx-auto pb-20">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Configurações de Perfil</h1>
        <p className="text-[#64748b]">Gerencie suas informações pessoais e aparência no console.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-10">
        {/* Avatar Upload Selection */}
        <section className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5 flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-[#0f1115] overflow-hidden border-2 border-white/5 relative">
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                  <Loader2 className="w-8 h-8 text-[#22ff88] animate-spin" />
                </div>
              ) : null}
              <img 
                src={avatarUrl || `https://i.pravatar.cc/100?u=${userData?.email}`}
                className="w-full h-full object-cover"
                alt="Profile Preview"
              />
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#22ff88] rounded-2xl flex items-center justify-center border-4 border-[#1a1c22] hover:scale-110 active:scale-95 transition-all text-black"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              accept="image/*"
            />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-white mb-1">Foto de Perfil</h3>
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-bold">PNG, JPG ou GIF. Máximo 2MB.</p>
          </div>
        </section>

        {/* Personal Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Nome Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] group-focus-within:text-[#22ff88] transition-colors" />
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2 opacity-60 cursor-not-allowed">
            <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">E-mail (Identificador)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input 
                type="email"
                readOnly
                value={userData?.email || ''}
                className="w-full bg-[#0f1115] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-[#64748b] focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Telefone (Brasil)</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] group-focus-within:text-[#22ff88] transition-colors" />
              <input 
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Resumo do Perfil (Bio)</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Descreva sua experiência e especialidades..."
              className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl p-6 text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium min-h-[120px] resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-10 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-3">
             {success && (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }} 
                 animate={{ opacity: 1, x: 0 }}
                 className="flex items-center gap-2 text-[#22ff88] text-sm font-bold"
               >
                 <CheckCircle2 className="w-5 h-5" />
                 Perfil Atualizado!
               </motion.div>
             )}
          </div>
          <button 
            type="submit"
            disabled={loading || uploading}
            className="px-10 py-4 bg-[#22ff88] text-black font-bold rounded-2xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(34,255,136,0.2)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SALVAR ALTERAÇÕES'}
          </button>
        </div>
      </form>
    </div>
  );
}
