import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2,
  Calendar,
  Filter,
  Download,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface InstructorFinance {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  courses: {
    id: string;
    title: string;
    price: number;
    enrollmentsCount: number;
    revenue: number;
  }[];
}

export function AdminFinanceView() {
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState<InstructorFinance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalStats, setGlobalStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    avgTicket: 0,
    topInstructor: ''
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  async function fetchFinancialData() {
    try {
      setLoading(true);
      
      // 1. Fetch all instructors
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['administrador', 'master']);

      if (profilesError) throw profilesError;

      // 2. Fetch all courses with enrollment counts
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          price,
          instructor_id,
          enrollments (id)
        `);

      if (coursesError) throw coursesError;

      // 3. Aggregate Data
      const instructorMap: { [key: string]: InstructorFinance } = {};

      profiles?.forEach(profile => {
        instructorMap[profile.id] = {
          id: profile.id,
          name: profile.full_name || profile.email.split('@')[0],
          email: profile.email,
          avatar_url: profile.avatar_url,
          totalCourses: 0,
          totalStudents: 0,
          totalRevenue: 0,
          courses: []
        };
      });

      let grandTotalRevenue = 0;
      let grandTotalSales = 0;

      courses?.forEach((course: any) => {
        const enrollCount = course.enrollments?.length || 0;
        const revenue = enrollCount * (course.price || 0);
        const instructorId = course.instructor_id;

        if (instructorMap[instructorId]) {
          instructorMap[instructorId].totalCourses++;
          instructorMap[instructorId].totalStudents += enrollCount;
          instructorMap[instructorId].totalRevenue += revenue;
          instructorMap[instructorId].courses.push({
            id: course.id,
            title: course.title,
            price: course.price || 0,
            enrollmentsCount: enrollCount,
            revenue: revenue
          });
        }

        grandTotalRevenue += revenue;
        grandTotalSales += enrollCount;
      });

      const instructorList = Object.values(instructorMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      setInstructors(instructorList);
      setGlobalStats({
        totalRevenue: grandTotalRevenue,
        totalSales: grandTotalSales,
        avgTicket: grandTotalSales > 0 ? grandTotalRevenue / grandTotalSales : 0,
        topInstructor: instructorList[0]?.name || '---'
      });

    } catch (error: any) {
      toast.error('Erro ao carregar dados financeiros: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredInstructors = instructors.filter(inst => 
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3 md:p-10 max-w-[1600px] mx-auto space-y-5 md:space-y-10 pb-20 mt-2 md:mt-0 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-6 md:mb-12">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-white mb-1 md:mb-2 leading-tight">Financeiro Global</h1>
          <p className="text-[#64748b] text-[10px] md:text-base tracking-wide uppercase font-bold">Faturamento por Instrutor</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] md:text-sm font-bold rounded-xl md:rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest">
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Exportar
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center p-40">
          <Loader2 className="w-12 h-12 text-[#22ff88] animate-spin" />
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Receita Total", value: `R$ ${globalStats.totalRevenue.toLocaleString('pt-BR')}`, icon: DollarSign, color: "text-[#22ff88]", trend: "+12%" },
              { label: "Vendas", value: globalStats.totalSales.toString(), icon: TrendingUp, color: "text-blue-400", trend: "+5%" },
              { label: "Ticket Médio", value: `R$ ${globalStats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, icon: Award, color: "text-purple-400" },
              { label: "Top Professor", value: globalStats.topInstructor, icon: Users, color: "text-orange-400" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1c22] p-5 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-3 md:mb-6">
                  <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                    <stat.icon className={cn("w-4 h-4 md:w-6 md:h-6", stat.color)} />
                  </div>
                  {stat.trend && (
                    <div className="flex items-center gap-1 text-[8px] font-bold text-[#22ff88] bg-[#22ff88]/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg">
                      <ArrowUpRight className="w-2.5 h-2.5" />
                      {stat.trend}
                    </div>
                  )}
                </div>
                <p className="text-[#64748b] text-[9px] md:text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xl md:text-3xl font-extrabold text-white tracking-tight truncate">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Instructor Earnings List */}
          <div className="bg-[#1a1c22]/50 md:bg-[#1a1c22] rounded-2xl md:rounded-[2.5rem] border border-white/5 overflow-hidden">
            <div className="p-6 md:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
              <h2 className="text-xl md:text-2xl font-bold text-white text-center md:text-left">Por Professor</h2>
              <div className="relative group w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] group-focus-within:text-[#22ff88]" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-xl md:rounded-2xl pl-11 pr-4 py-3 md:py-3.5 text-white focus:outline-none focus:border-[#22ff88]/30 transition-all text-sm"
                />
              </div>
            </div>

            {/* Mobile Cards (sm/md only) */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredInstructors.length === 0 ? (
                 <div className="p-10 text-center text-[#64748b] text-sm">Nenhum instrutor.</div>
              ) : (
                filteredInstructors.map(inst => (
                   <div key={inst.id} className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                            {inst.avatar_url ? (
                               <img src={inst.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                               <span className="text-sm font-bold text-[#64748b]">{inst.name.charAt(0)}</span>
                            )}
                         </div>
                         <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">{inst.name}</p>
                            <p className="text-[10px] text-[#64748b] truncate">{inst.email}</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                         <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                            <p className="text-[8px] uppercase tracking-widest text-[#64748b] font-bold mb-1">Cursos</p>
                            <p className="text-sm font-bold text-white">{inst.totalCourses}</p>
                         </div>
                         <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">
                            <p className="text-[8px] uppercase tracking-widest text-[#64748b] font-bold mb-1">Alunos</p>
                            <p className="text-sm font-bold text-white">{inst.totalStudents}</p>
                         </div>
                      </div>

                      <div className="flex justify-between items-end pt-1">
                         <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">Faturamento</p>
                         <p className="text-lg font-bold text-[#22ff88]">R$ {inst.totalRevenue.toLocaleString('pt-BR')}</p>
                      </div>
                   </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-[#64748b] border-b border-white/5">
                    <th className="px-10 py-6">Professor</th>
                    <th className="px-10 py-6">Cursos Ativos</th>
                    <th className="px-10 py-6">Alunos Totais</th>
                    <th className="px-10 py-6 text-right">Faturamento Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInstructors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-10 py-20 text-center text-[#64748b]">Nenhum instrutor encontrado.</td>
                    </tr>
                  ) : (
                    filteredInstructors.map((inst, i) => (
                      <tr key={inst.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2a2d35] to-[#1a1c22] border border-white/10 flex items-center justify-center overflow-hidden">
                              {inst.avatar_url ? (
                                <img src={inst.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl font-bold text-[#64748b]">{inst.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-[#22ff88] transition-colors">{inst.name}</p>
                              <p className="text-[10px] text-[#64748b] font-mono">{inst.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                             <span className="text-white font-bold">{inst.totalCourses}</span>
                             <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-tighter">Cursos</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]" />
                             <span className="text-white font-bold">{inst.totalStudents}</span>
                             <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-tighter">Matrículas</span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <p className="text-xl font-bold text-[#22ff88]">
                            R$ {inst.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest mt-1">Acumulado</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
