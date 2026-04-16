import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, GraduationCap, CheckCircle, ArrowUpRight, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminOverviewProps {
  userData: any;
  onViewChange?: (view: string) => void;
}

export function AdminOverview({ userData, onViewChange }: AdminOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Total de Alunos", value: "0", change: "0%", icon: Users, color: "text-[#22ff88]" },
    { label: "Cursos Totais", value: "0", status: "Ativos", icon: GraduationCap, color: "text-[#22ff88]" },
    { label: "Taxa de Conclusão", value: "0%", status: "---", icon: CheckCircle, color: "text-[#00ffcc]" },
  ]);

  const [growthData, setGrowthData] = useState([
    { month: 'JAN', value: 0 },
    { month: 'FEB', value: 0 },
    { month: 'MAR', value: 0 },
    { month: 'APR', value: 0 },
    { month: 'MAY', value: 0 },
    { month: 'JUN', value: 0 },
  ]);

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (userData?.id) {
      fetchAdminStats();
    }
  }, [userData]);

  async function fetchAdminStats() {
    try {
      setLoading(true);

      // 1. Fetch courses for this instructor with enrollment counts
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          cover_url,
          price,
          created_at,
          enrollments (
            id,
            user_id,
            progress,
            created_at
          )
        `)
        .eq('instructor_id', userData.id);

      if (coursesError) throw coursesError;

      // 2. Aggregate Stats
      let totalStudentsSet = new Set();
      let totalProgress = 0;
      let totalEnrollmentsCount = 0;
      let totalRevenue = 0;

      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
      const growthMap: { [key: string]: number } = { JAN: 0, FEB: 0, MAR: 0, APR: 0, MAY: 0, JUN: 0 };

      const formattedActivities = (courses || []).map(course => {
        const enrollCount = course.enrollments?.length || 0;
        const revenue = enrollCount * (course.price || 0);
        
        totalEnrollmentsCount += enrollCount;
        totalRevenue += revenue;

        course.enrollments?.forEach((enroll: any) => {
          totalStudentsSet.add(enroll.user_id);
          totalProgress += enroll.progress || 0;
          
          // Growth Data Calculation (simplified for last 6 months)
          const date = new Date(enroll.created_at);
          const monthName = months[date.getMonth()];
          if (growthMap[monthName] !== undefined) {
             growthMap[monthName]++;
          }
        });

        return {
          id: course.id,
          course: course.title,
          published: `Publicado em ${new Date(course.created_at).toLocaleDateString('pt-BR')}`,
          instructor: userData.full_name || 'Você',
          enrollments: `+${enrollCount}`,
          revenue: `R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
          image: course.cover_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100"
        };
      });

      const avgCompletion = totalEnrollmentsCount > 0 ? (totalProgress / totalEnrollmentsCount).toFixed(1) : "0";

      setStats([
        { label: "Total de Alunos", value: totalStudentsSet.size.toLocaleString('pt-BR'), change: `+${totalEnrollmentsCount}`, icon: Users, color: "text-[#22ff88]" },
        { label: "Cursos Totais", value: (courses?.length || 0).toString(), status: "Ativos", icon: GraduationCap, color: "text-[#22ff88]" },
        { label: "Taxa de Conclusão", value: `${avgCompletion}%`, status: Number(avgCompletion) > 50 ? "Alta" : "Média", icon: CheckCircle, color: "text-[#00ffcc]" },
      ]);

      // Normalize growth data for the chart (find max to set percentages)
      const maxGrowth = Math.max(...Object.values(growthMap), 1);
      setGrowthData(months.map(m => ({
        month: m,
        value: (growthMap[m] / maxGrowth) * 100,
        active: m === months[new Date().getMonth()]
      })));

      setRecentActivities(formattedActivities.sort((a, b) => b.revenue.localeCompare(a.revenue)).slice(0, 5));

    } catch (error: any) {
      console.error('Erro ao buscar estatísticas do admin:', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-10 max-w-[1600px] mx-auto space-y-10 pb-20">
      <header className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Painel do Professor</h1>
          <p className="text-[#64748b] text-base">Relatório de performance editorial e métricas de engajamento.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onViewChange?.('admin-cursos')}
            className="p-2.5 bg-[#1a1c22] border border-white/5 rounded-xl hover:bg-[#2a2d35] transition-all text-[#64748b] hover:text-white"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-[#1a1c22] border border-white/5 p-1 overflow-hidden">
             <img src={userData?.avatar_url || "https://i.pravatar.cc/100?u=admin"} className="w-full h-full rounded-lg object-cover" alt="Admin" />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-12 h-12 text-[#22ff88] animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5 relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  {stat.change && (
                    <span className="px-2 py-1 bg-[#22ff88]/10 text-[#22ff88] text-[10px] font-bold rounded-md">
                      {stat.change}
                    </span>
                  )}
                  {stat.status && (
                    <span className="px-2 py-1 bg-white/5 text-[#64748b] text-[10px] font-bold rounded-md">
                      {stat.status}
                    </span>
                  )}
                </div>
                <p className="text-[#64748b] text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-4xl font-bold text-white tracking-tight">{stat.value}</p>
                
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                  <div className={cn("h-full opacity-50 transition-all duration-1000", stat.color === 'text-[#22ff88]' ? 'bg-[#22ff88]' : 'bg-[#00ffcc]')} style={{ width: '60%' }} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Growth Dynamics */}
            <div className="lg:col-span-2 bg-[#1a1c22] p-8 rounded-3xl border border-white/5">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Dinâmica de Crescimento</h2>
                  <p className="text-[#64748b] text-xs">Visualização semestral de novos ingressantes.</p>
                </div>
                <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold">
                  <div className="flex items-center gap-2 text-[#22ff88]">
                    <div className="w-2 h-2 rounded-full bg-[#22ff88]" />
                    Novos Usuários
                  </div>
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <div className="w-2 h-2 rounded-full bg-[#33353b]" />
                    Média
                  </div>
                </div>
              </div>
              
              <div className="h-64 flex items-end justify-between gap-4 px-4">
                {growthData.map((data, i) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-4">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${data.value || 5}%` }} // Min 5% height for visibility
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn(
                        "w-full rounded-lg transition-colors",
                        data.active ? "bg-[#22ff88] shadow-[0_0_20px_rgba(34,255,136,0.3)]" : "bg-[#2a2d35]"
                      )}
                    />
                    <span className="text-[10px] font-bold text-[#64748b]">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Actions & Status */}
            <div className="space-y-6">
              <div 
                onClick={() => onViewChange?.('admin-cursos')}
                className="bg-[#22ff88] p-6 rounded-3xl border border-[#22ff88] flex items-center justify-between group cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <div>
                  <h3 className="text-black font-bold text-lg mb-1">Criar Novo Curso</h3>
                  <p className="text-black/60 text-xs font-medium">Lançar novo conteúdo autoral</p>
                </div>
                <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-black" />
                </div>
              </div>

              <div className="bg-[#1a1c22] p-6 rounded-3xl border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Gerenciar Alunos</h3>
                  <p className="text-[#64748b] text-xs font-medium">Controle de acesso e permissões</p>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Status do Sistema */}
              <div className="bg-[#1a1c22] p-8 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#22ff88] animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white">Status do Sistema</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Carga do Servidor", value: "24%" },
                    { label: "Sessões Ativas", value: (recentActivities.length * 12 + 15).toLocaleString(), color: "text-white" },
                    { label: "Tempo de Atividade", value: "99.9%", color: "text-[#22ff88]" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center text-sm">
                      <span className="text-[#64748b]">{item.label}</span>
                      <span className={cn("font-bold", item.color || "text-white")}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          {recentActivities.length > 0 && (
            <section className="mt-12 bg-[#1a1c22] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Atividades Recentes de Cursos</h2>
                <button className="text-[11px] font-bold text-[#22ff88] uppercase tracking-widest hover:underline transition-all">
                  Ver todos os logs
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-[#64748b] border-b border-white/5">
                      <th className="px-8 py-5">Nome do Curso</th>
                      <th className="px-8 py-5">Instrutor</th>
                      <th className="px-8 py-5">Novas Inscrições</th>
                      <th className="px-8 py-5 text-right">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.map((act, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <img src={act.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                            <div>
                              <p className="font-bold text-white group-hover:text-[#22ff88] transition-colors">{act.course}</p>
                              <p className="text-[10px] text-[#64748b]">{act.published}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-[#94a3b8]">{act.instructor}</td>
                        <td className="px-8 py-6 text-sm font-bold text-[#22ff88]">{act.enrollments}</td>
                        <td className="px-8 py-6 text-sm font-bold text-white text-right">{act.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
