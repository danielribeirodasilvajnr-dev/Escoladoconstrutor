import { useState } from 'react';
import { CourseList } from './CourseList';
import { CourseEditor } from './CourseEditor';

interface CourseManagerProps {
  userData: any;
  onViewChange: (view: string) => void;
}

export function CourseManager({ userData, onViewChange }: CourseManagerProps) {
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
