import { useState } from 'react';
import { CourseList } from './CourseList';
import { CourseEditor } from './CourseEditor';

interface CourseManagerProps {
  userData: any;
  onViewChange: (view: string) => void;
  onOpenExam?: (courseId: string, moduleId: string | null) => void;
}

export function CourseManager({ userData, onViewChange, onOpenExam }: CourseManagerProps) {
  const [activeSubView, setActiveSubView] = useState<'list' | 'editor'>('list');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const handleEditCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveSubView('editor');
  };

  const handleCreateCourse = () => {
    setSelectedCourseId(null);
    setActiveSubView('editor');
  };

  const handleBackToList = () => {
    setActiveSubView('list');
    setSelectedCourseId(null);
  };

  if (activeSubView === 'editor') {
    return (
      <CourseEditor
        courseId={selectedCourseId}
        userData={userData}
        onBack={handleBackToList}
        onViewChange={onViewChange}
        onOpenExam={onOpenExam}
      />
    );
  }

  return (
    <CourseList
      userData={userData}
      onEditCourse={handleEditCourse}
      onCreateCourse={handleCreateCourse}
    />
  );
}
