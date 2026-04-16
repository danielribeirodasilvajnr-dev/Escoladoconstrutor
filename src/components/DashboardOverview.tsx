import { motion } from 'motion/react';
import { HeroSection } from './HeroSection';
import { CourseCard } from './CourseCard';
import { FeaturedCard } from './FeaturedCard';
import { WeeklyCard } from './WeeklyCard';

const myCourses = [
  { image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&auto=format&fit=crop", title: "Design de Microprocessadores", mentor: "Dr. David Heinemeier", progress: 65 },
  { image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&auto=format&fit=crop", title: "Estruturas Paramétricas", mentor: "Eng. Sarah Chen", progress: 20 },
  { image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=800&h=450&auto=format&fit=crop", title: "Segurança de Rede Industrial", mentor: "Marcus V. Hollis", progress: 88 }
];

const recommended = [
  { image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=800&auto=format&fit=crop", category: "Novo Masterclass", title: "Inteligência Artificial em Sistemas Embarcados" },
  { image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=800&auto=format&fit=crop", category: "Fundamentos", title: "Termodinâmica para Energias Renováveis" },
  { image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=800&auto=format&fit=crop", category: "Avançado", title: "Soberania de Dados & Criptografia Industrial" }
];

const weekly = [
  { image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=450&auto=format&fit=crop", type: "Workshop", title: "Otimização de Turbinas Eólicas em Altas Altitudes" },
  { image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&h=450&auto=format&fit=crop", type: "Entrevista", title: "Mobilidade Urbana: O Futuro dos Trens Maglev" },
  { image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=450&auto=format&fit=crop", type: "Documentário", title: "Bastidores: A Engenharia por trás da PrecisionX" },
  { image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&auto=format&fit=crop", type: "Live", title: "Telecomunicações via Starlink & Além" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function DashboardOverview() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-8 max-w-[1600px] mx-auto pb-20"
    >
      <motion.div variants={itemVariants}>
        <HeroSection />
      </motion.div>

      {/* Meus Cursos */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Meus Cursos</h2>
            <span className="px-2 py-0.5 bg-[#22ff88]/10 text-[#22ff88] text-[10px] font-bold rounded-md uppercase tracking-wider">
              3 Ativos
            </span>
          </div>
          <button className="text-sm font-medium text-[#64748b] hover:text-white transition-colors">
            Ver todos
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myCourses.map((course, i) => (
            <motion.div key={i} variants={itemVariants}>
              <CourseCard {...course} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recomendados */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8">Recomendados para Você</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommended.map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <FeaturedCard {...item} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Novidades */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-8">Novidades da Semana</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {weekly.map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <WeeklyCard {...item} />
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
