export interface Course {
  id: string;
  code: string;
  name: string;
  color: string;
  termStartDate?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;
  type: 'discussion' | 'assignment' | 'quiz' | 'project';
  status: 'todo' | 'in-progress' | 'completed';
  estimatedHours: number;
  completedAt?: string;
}

export interface SyllabusData {
  courseCode: string;
  courseName: string;
  termStartDate: string; // ISO string
  assignments: Array<Omit<Assignment, 'id' | 'courseId' | 'status'>>;
}

export interface StudySession {
  id: string;
  courseId: string;
  startTime: string;
  durationMinutes: number;
  notes: string;
}

export interface MoodCheckIn {
  id: string;
  timestamp: string;
  stress: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  focus: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export type View = 'dashboard' | 'courses' | 'assignments' | 'timer' | 'ai' | 'settings' | 'wellness' | 'integrations';
