import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Mail,
  Shield,
  GraduationCap,
  User,
  MoreVertical,
  Check,
  Loader2,
  Key,
  Plus,
  Trash2,
  Clock,
  UserPlus,
  Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

export function AdminUsersView() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(userId: string, newRole: string) {
    try {
      setUpdatingId(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Cargo atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar cargo: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleInviteProfessor(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setIsInviting(true);
      const { data, error } = await supabase.functions.invoke('invite-professor', {
        body: { email: inviteEmail }
      });

      if (error) throw error;

      toast.success('Convite enviado para ' + inviteEmail);
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (error: any) {
      toast.error('Erro ao enviar convite: ' + error.message);
    } finally {
      setIsInviting(false);
    }
  }

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = user.full_name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = user.email?.toLowerCase().includes(searchLower) || false;
    return nameMatch || emailMatch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master':
        return { label: 'Master', color: 'bg-red-400/10 text-red-400 border-red-400/20', icon: Shield };
      case 'administrador':
        return { label: 'Professor', color: 'bg-[#22ff88]/10 text-[#22ff88] border-[#22ff88]/20', icon: GraduationCap };
      default:
        return { label: 'Aluno', color: 'bg-white/5 text-[#64748b] border-white/10', icon: User };
    }
  };

  return (
    <div className="p-10 max-w-[1600px] mx-auto space-y-10 pb-20">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Gestão de Usuários</h1>
          <p className="text-[#64748b] text-base">Controle de acessos, permissões e cargos da plataforma.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-[#22ff88] text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(34,255,136,0.2)]"
        >
          <UserPlus className="w-5 h-5" />
          Novo Professor
        </button>
      </header>

      {/* Filters and Stats */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative group w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b] group-focus-within:text-[#22ff88] transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c22] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium"
          />
        </div>

        <div className="flex gap-4">
          <div className="bg-[#1a1c22] border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-3">
            <Users className="w-5 h-5 text-[#22ff88]" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#64748b] font-bold">Total</p>
              <p className="text-xl font-bold text-white leading-none">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1c22] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {/* Users Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[#64748b] border-b border-white/5">
                <th className="px-10 py-6 font-bold">Usuário</th>
                <th className="px-10 py-6 font-bold">Contato</th>
                <th className="px-10 py-6 font-bold">Cargo Atual</th>
                <th className="px-10 py-6 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-10 py-8 bg-white/[0.02]" />
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 text-[#64748b]">
                      <Users className="w-8 h-8" />
                    </div>
                    <p className="text-white font-bold">Nenhum usuário encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2a2d35] to-[#1a1c22] border border-white/10 flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-[#64748b]">
                              {user.full_name?.charAt(0) || user.email.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-[#22ff88] transition-colors">
                            {user.full_name || 'Usuário sem nome'}
                          </p>
                          <p className="text-[10px] text-[#64748b] uppercase tracking-tighter">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-[#94a3b8] text-sm font-medium">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      {(() => {
                        const badge = getRoleBadge(user.role);
                        return (
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${badge.color}`}>
                            <badge.icon className="w-3.5 h-3.5" />
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-10 py-6 text-right">
                      {updatingId === user.id ? (
                        <Loader2 className="w-5 h-5 animate-spin ml-auto text-[#22ff88]" />
                      ) : (
                        <div className="flex justify-end gap-2">
                          <RoleDropdown
                            currentRole={user.role}
                            onUpdate={(role) => handleUpdateRole(user.id, role)}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1c22] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#22ff88]/10 flex items-center justify-center border border-[#22ff88]/20">
                  <GraduationCap className="w-6 h-6 text-[#22ff88]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Convidar Professor</h3>
                  <p className="text-xs text-[#64748b]">O professor receberá um e-mail com as instruções.</p>
                </div>
              </div>

              <form onSubmit={handleInviteProfessor} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[#64748b] ml-1">E-mail do Professor</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b] group-focus-within:text-[#22ff88] transition-colors" />
                    <input
                      type="email"
                      required
                      placeholder="ex: professor@construtor360.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-[#0f1115] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#22ff88]/30 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-6 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#22ff88] text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(34,255,136,0.2)] disabled:opacity-50"
                  >
                    {isInviting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Convite
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleDropdown({ currentRole, onUpdate }: { currentRole: string, onUpdate: (role: string) => void }) {
  const [open, setOpen] = useState(false);
  const roles = [
    { id: 'membro', label: 'Aluno', icon: User },
    { id: 'administrador', label: 'Professor', icon: GraduationCap },
    { id: 'master', label: 'Master', icon: Shield },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#64748b] hover:text-white"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 bottom-full mb-2 w-48 bg-[#1a1c22] border border-white/5 rounded-2xl shadow-2xl z-50 p-2 text-left"
            >
              <p className="px-4 py-2 text-[10px] uppercase font-bold text-[#64748b] tracking-widest border-b border-white/5 mb-2">Alterar Cargo</p>
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    if (role.id !== currentRole) onUpdate(role.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${role.id === currentRole
                      ? 'bg-[#22ff88]/10 text-[#22ff88]'
                      : 'text-[#64748b] hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <role.icon className="w-4 h-4" />
                    {role.label}
                  </div>
                  {role.id === currentRole && <Check className="w-4 h-4" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
