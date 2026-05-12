import { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { DashboardOverview } from './DashboardOverview';
import { AdminOverview } from './AdminOverview';
import { ExamCreator } from './ExamCreator';
import { CourseManager } from './CourseManager';
import { ProfileSettings } from './ProfileSettings';
import { Vitrine } from './Vitrine';
import { CoursePlayer } from './CoursePlayer';
import { AdminUsersView } from './AdminUsersView';
import { AdminFinanceView } from './AdminFinanceView';
import { ExamPlayer } from './ExamPlayer';
import { CertificateView } from './CertificateView';
import { CertificatesTab } from './CertificatesTab';
import { CommunityView } from './CommunityView';
import { SupportEducationView } from './SupportEducationView';
import { AdminSupportView } from './AdminSupportView';

type DashboardView =
  | 'vitrine'
  | 'suporte'
  | 'overview'
  | 'certificados'
  | 'comunidade'
  | 'admin-overview'
  | 'admin-provas'
  | 'admin-cursos'
  | 'admin-usuarios'
  | 'admin-financeiro'
  | 'admin-suporte'
  | 'settings'
  | 'player'
  | 'exam-player'
  | 'certificate-view';

interface DashboardProps {
  userData: any;
  session: any;
}

export function Dashboard({ userData, session }: DashboardProps) {
  const [activeView, setActiveView] = useState<DashboardView>(
    (userData?.role === 'master' || userData?.role === 'professor') 
      ? 'admin-overview' 
      : 'vitrine'
  );
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [examContext, setExamContext] = useState<{ courseId: string; moduleId: string | null } | null>(null);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [currentCertificateId, setCurrentCertificateId] = useState<string | null>(null);
  const [courseManagerView, setCourseManagerView] = useState<'list' | 'editor'>('list');
  const [courseManagerSelectedId, setCourseManagerSelectedId] = useState<string | null>(null);

  const handleOpenExam = (courseId: string, moduleId: string | null) => {
    setExamContext({ courseId, moduleId });
    setActiveView("admin-provas");
  };

  const handleCourseSelect = (courseId: string) => {
    setActiveCourseId(courseId);
    setActiveView('player');
  };

  const renderView = () => {
    switch (activeView) {
      case 'vitrine':
        return <Vitrine userData={userData} onViewChange={(view) => setActiveView(view as DashboardView)} />;
      case 'overview':
        return <DashboardOverview userData={userData} onCourseSelect={handleCourseSelect} />;
      case 'certificados':
        return (
          <CertificatesTab 
            userData={userData} 
            onViewCertificate={(id) => {
              setCurrentCertificateId(id);
              setActiveView('certificate-view');
            }} 
          />
        );
      case 'player':
        return activeCourseId ? (
          <CoursePlayer
            courseId={activeCourseId}
            onBack={() => setActiveView('overview')}
            session={session}
            onTakeExam={(examId) => {
              setCurrentExamId(examId);
              setActiveView('exam-player');
            }}
          />
        ) : null;
      case 'admin-overview':
        return <AdminOverview userData={userData} onViewChange={(view) => setActiveView(view as DashboardView)} />;
      case "admin-provas":
        return (
          <ExamCreator
            userData={userData}
            initialCourseId={examContext?.courseId}
            initialModuleId={examContext?.moduleId}
            onBack={() => {
              setExamContext(null);
              setActiveView("admin-cursos");
            }}
          />
        );
      case "admin-cursos":
        return (
          <CourseManager
            userData={userData}
            onViewChange={(view) => setActiveView(view as DashboardView)}
            onOpenExam={handleOpenExam}
            activeSubView={courseManagerView}
            setActiveSubView={setCourseManagerView}
            selectedCourseId={courseManagerSelectedId}
            setSelectedCourseId={setCourseManagerSelectedId}
          />
        );
      case "admin-usuarios":
        return <AdminUsersView />;
      case "admin-financeiro":
        return <AdminFinanceView />;
      case "admin-suporte":
        return <AdminSupportView />;
      case 'settings':
        return <ProfileSettings userData={userData} />;
      case 'comunidade':
        return <CommunityView />;
      case 'suporte':
        return <SupportEducationView userData={userData} />;
      case 'exam-player':
        return currentExamId ? (
          <ExamPlayer
            examId={currentExamId}
            userData={userData}
            onBack={() => setActiveView('player')}
            onFinish={(score, passed, certId) => {
              if (certId) {
                setCurrentCertificateId(certId);
                setActiveView('certificate-view');
              } else {
                setActiveView('player');
              }
            }}
          />
        ) : null;
      case 'certificate-view':
        return currentCertificateId ? (
          <CertificateView
            certificateId={currentCertificateId}
            onBack={() => setActiveView('overview')}
          />
        ) : null;
      default:
        return (
          <div className="p-12 flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-[#22ff88]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#22ff88]/20">
                <span className="text-3xl text-[#22ff88]">⚡</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Módulo em Desenvolvimento</h2>
              <p className="text-[#64748b] leading-relaxed">
                Estamos preparando o acesso aos sistemas de {activeView}.
                Em breve, novas trilhas e conteúdos estarão disponíveis no seu console.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      activeView={activeView}
      onViewChange={(view) => setActiveView(view as DashboardView)}
      userData={userData}
    >
      {renderView()}
    </DashboardLayout>
  );
}
