import React, { useState, useEffect, useMemo } from 'react';
import { Task, Project, TaskStatus, TaskPriority, ImageAttachment, TeamMember, TaskCategory, Milestone } from './types';
import { initialProjects, initialTasks, teamMembers } from './data/mockData';
import { initialCategories } from './data/mockCategories';
import { Navbar } from './components/Navbar';
import { ProjectStats } from './components/ProjectStats';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskListView } from './components/TaskListView';
import { ExcelMilestoneView } from './components/ExcelMilestoneView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ImageLightbox } from './components/ImageLightbox';
import { NewTaskModal } from './components/NewTaskModal';
import { NewProjectModal } from './components/NewProjectModal';
import { EditProjectModal } from './components/EditProjectModal';
import { ManageTeamModal } from './components/ManageTeamModal';
import { ManageCategoriesModal } from './components/ManageCategoriesModal';
import { ManageMilestonesModal } from './components/ManageMilestonesModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { 
  Filter, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  FileText,
  Camera,
  FolderDown,
  Info,
  Plus,
  Users,
  SlidersHorizontal,
  Tag,
  Bot
} from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('project_tracker_projects');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load projects from storage', e);
    }
    return initialProjects;
  });

  const [members, setMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('project_tracker_members');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load members from storage', e);
    }
    return teamMembers;
  });

  const [categories, setCategories] = useState<TaskCategory[]>(() => {
    try {
      const saved = localStorage.getItem('project_tracker_categories');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load categories from storage', e);
    }
    return initialCategories;
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return initialProjects[0]?.id || 'prj-1';
  });

  // Load tasks with fallback to initialTasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('project_tracker_tasks');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load tasks from local storage', e);
    }
    return initialTasks;
  });

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('project_tracker_projects', JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to storage', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('project_tracker_members', JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save members to storage', e);
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem('project_tracker_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to storage', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('project_tracker_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to local storage', e);
    }
  }, [tasks]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'excel' | 'kanban' | 'list'>('excel');

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<ImageAttachment | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);
  const [isManageMilestonesOpen, setIsManageMilestonesOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  const [currentMember, setCurrentMember] = useState<TeamMember>(() => members[0] || teamMembers[0]);

  // Current selected project
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === currentProjectId) || projects[0];
  }, [projects, currentProjectId]);

  // Tasks for current project
  const projectTasks = useMemo(() => {
    return tasks.filter((t) => t.projectId === currentProjectId);
  }, [tasks, currentProjectId]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return projectTasks.filter((task) => {
      // Search query match
      const matchesSearch =
        searchQuery.trim() === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.documents.some((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        task.images.some((img) => img.caption?.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projectTasks, searchQuery, statusFilter, priorityFilter]);

  // Currently opened task
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // Handle task update from modal or quick actions
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  // Fast move status
  const handleMoveStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newProgress = newStatus === 'completed' ? 100 : t.progress;
        return {
          ...t,
          status: newStatus,
          progress: newProgress,
          activities: [
            {
              id: 'act-' + Date.now(),
              taskId: t.id,
              user: currentMember,
              action: `ย้ายงานไปยังสถานะ ${newStatus}`,
              timestamp: new Date().toISOString(),
              type: 'status',
            },
            ...t.activities,
          ],
        };
      })
    );
  };

  // Add new task
  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
    setSelectedTaskId(newTask.id); // open newly created task immediately
  };

  // Add new project (with PM & Co-PM)
  const handleSaveNewProject = (newProject: Project, newMembers?: TeamMember[]) => {
    if (newMembers && newMembers.length > 0) {
      setMembers((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const toAdd = newMembers.filter((m) => !existingIds.has(m.id));
        return [...prev, ...toAdd];
      });
    }
    setProjects((prev) => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
  };

  // Update existing project (PM, Co-PM, milestones)
  const handleUpdateProject = (updatedProject: Project, newMembers?: TeamMember[]) => {
    if (newMembers && newMembers.length > 0) {
      setMembers((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const toAdd = newMembers.filter((m) => !existingIds.has(m.id));
        return [...prev, ...toAdd];
      });
    }
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
  };

  // Add single member (PM, Co-PM, or Engineer)
  const handleAddMember = (newMember: TeamMember) => {
    setMembers((prev) => [...prev, newMember]);
  };

  // Milestone management: update milestones of a project and sync tasks
  const handleUpdateMilestones = (projectId: string, newMilestones: Milestone[]) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, milestones: newMilestones } : p))
    );

    // Sync tasks that reference any updated milestone
    setTasks((prev) =>
      prev.map((t) => {
        if (t.projectId !== projectId) return t;
        const matchingMilestone = newMilestones.find((m) => m.id === t.milestoneId);
        if (matchingMilestone) {
          return {
            ...t,
            milestoneName: matchingMilestone.name,
          };
        }
        return t;
      })
    );
  };

  // Category management: Add
  const handleAddCategory = (newCategory: TaskCategory) => {
    setCategories((prev) => [...prev, newCategory]);
  };

  // Category management: Edit/Update
  const handleUpdateCategory = (oldName: string, updatedCategory: TaskCategory) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );

    // If category was renamed, update all associated tasks in state
    if (oldName !== updatedCategory.name) {
      setTasks((prev) =>
        prev.map((t) => (t.category === oldName ? { ...t, category: updatedCategory.name } : t))
      );
    }
  };

  // Category management: Delete
  const handleDeleteCategory = (categoryId: string, categoryName: string, fallbackName?: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));

    if (fallbackName) {
      setTasks((prev) =>
        prev.map((t) => (t.category === categoryName ? { ...t, category: fallbackName } : t))
      );
    }
  };

  // Reset sample data
  const handleResetData = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      setTasks(initialTasks);
      setProjects(initialProjects);
      setMembers(teamMembers);
      setCategories(initialCategories);
      setCurrentProjectId(initialProjects[0].id);
      localStorage.removeItem('project_tracker_tasks');
      localStorage.removeItem('project_tracker_projects');
      localStorage.removeItem('project_tracker_members');
      localStorage.removeItem('project_tracker_categories');
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-['Prompt',sans-serif]">
      {/* Navbar */}
      <Navbar
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={(id) => {
          setCurrentProjectId(id);
          setSelectedTaskId(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewTask={() => setIsNewTaskOpen(true)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenManageTeam={() => setIsManageTeamOpen(true)}
        onOpenManageMilestones={() => setIsManageMilestonesOpen(true)}
        onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Project Header & Performance Statistics */}
        <ProjectStats 
          project={currentProject} 
          tasks={projectTasks} 
          onOpenNewProject={() => setIsNewProjectOpen(true)}
          onOpenEditProject={() => setIsEditProjectOpen(true)}
          onOpenManageTeam={() => setIsManageTeamOpen(true)}
          onOpenManageMilestones={() => setIsManageMilestonesOpen(true)}
          onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
        />

        {/* Filter & Toolbar */}
        <div id="toolbar-panel" className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              กรองสถานะ:
            </span>
            <button
              id="filter-all-btn"
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({projectTasks.length})
            </button>
            <button
              id="filter-todo-btn"
              type="button"
              onClick={() => setStatusFilter('todo')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'todo'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ยังไม่เริ่ม ({projectTasks.filter((t) => t.status === 'todo').length})
            </button>
            <button
              id="filter-in-progress-btn"
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              กำลังทำ ({projectTasks.filter((t) => t.status === 'in_progress').length})
            </button>
            <button
              id="filter-review-btn"
              type="button"
              onClick={() => setStatusFilter('under_review')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'under_review'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              รอตรวจ/QC ({projectTasks.filter((t) => t.status === 'under_review').length})
            </button>
            <button
              id="filter-completed-btn"
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              เสร็จแล้ว ({projectTasks.filter((t) => t.status === 'completed').length})
            </button>
          </div>

          {/* Secondary controls: Priority filter & quick manage buttons */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
            <button
              id="toolbar-ai-assistant-btn"
              type="button"
              onClick={() => setIsAIAssistantOpen(true)}
              title="ผู้ช่วย AI อัจฉริยะ Gemini (สรุปภาพรวม, แชทถามงาน, ร่างงานใหม่)"
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>ผู้ช่วย AI (Gemini)</span>
            </button>

            <button
              id="toolbar-manage-categories-btn"
              type="button"
              onClick={() => setIsManageCategoriesOpen(true)}
              title="แก้ไขและจัดการหมวดหมู่งาน"
              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>หมวดหมู่งาน ({categories.length})</span>
            </button>

            <button
              id="toolbar-manage-milestones-btn"
              type="button"
              onClick={() => setIsManageMilestonesOpen(true)}
              title="กำหนดและจัดการงวดงานสัญญา"
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>งวดงาน ({currentProject.milestones?.length || 0})</span>
            </button>

            <select
              id="priority-filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1 px-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">ทุกระดับความสำคัญ</option>
              <option value="urgent">เร่งด่วนที่สุด</option>
              <option value="high">สำคัญสูง</option>
              <option value="medium">ปานกลาง</option>
              <option value="low">ปกติ</option>
            </select>

            <button
              id="reset-data-btn"
              type="button"
              onClick={handleResetData}
              title="รีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้น"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode: Excel Spreadsheet vs Kanban vs List */}
        {viewMode === 'excel' && (
          <ExcelMilestoneView
            project={currentProject}
            tasks={projectTasks}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
            onUpdateTask={handleUpdateTask}
            onOpenLightbox={(img) => setLightboxImage(img)}
            currentMember={currentMember}
            onOpenManageMilestones={() => setIsManageMilestonesOpen(true)}
            onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
          />
        )}

        {viewMode === 'kanban' && (
          <KanbanBoard
            tasks={filteredTasks}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
            onMoveStatus={handleMoveStatus}
          />
        )}

        {viewMode === 'list' && (
          <TaskListView
            tasks={filteredTasks}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
            onMoveStatus={handleMoveStatus}
          />
        )}
      </main>

      {/* Task Detail Modal (Download documents & real-time photo attachment) */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onUpdateTask={handleUpdateTask}
        onOpenLightbox={(img) => setLightboxImage(img)}
        currentMember={currentMember}
        categories={categories}
        onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onAddTask={handleAddTask}
        project={currentProject}
        members={members}
        currentMember={currentMember}
        nextTaskNumber={projectTasks.length + 1}
        categories={categories}
        onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
        onOpenManageMilestones={() => setIsManageMilestonesOpen(true)}
      />

      {/* New Project Modal (สร้างโครงการใหม่ พร้อมกำหนด PM และ Co-PM) */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSaveProject={handleSaveNewProject}
        existingMembers={members}
      />

      {/* Edit Project Modal (จัดการ PM / Co-PM และข้อมูลโครงการ) */}
      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        project={currentProject}
        onUpdateProject={handleUpdateProject}
        existingMembers={members}
      />

      {/* Manage Team Modal (จัดการรายชื่อ PM, Co-PM และบุคลากร) */}
      <ManageTeamModal
        isOpen={isManageTeamOpen}
        onClose={() => setIsManageTeamOpen(false)}
        members={members}
        onAddMember={handleAddMember}
      />

      {/* Manage Milestones Modal (กำหนดงวดงานสัญญา) */}
      <ManageMilestonesModal
        isOpen={isManageMilestonesOpen}
        onClose={() => setIsManageMilestonesOpen(false)}
        project={currentProject}
        onUpdateMilestones={handleUpdateMilestones}
      />

      {/* Manage Categories Modal (แก้ไขหมวดหมู่งาน) */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={categories}
        tasks={tasks}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* AI Assistant Modal (Gemini 3.8 Assistant) */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        project={currentProject}
        tasks={projectTasks}
        categories={categories}
        currentMember={currentMember}
        onAddTask={handleAddTask}
      />

      {/* Floating AI Widget Button (FAB) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          id="floating-ai-button"
          type="button"
          onClick={() => setIsAIAssistantOpen(true)}
          title="ปรึกษาผู้ช่วย AI อัจฉริยะ (Gemini 3.8)"
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-indigo-500/25 border border-white/20 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline">ถาม AI ผู้ช่วยโครงการ</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 bg-white/70 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>ระบบติดตามงานโครงการ — กำหนดงวดงานสัญญา, แก้ไขหมวดหมู่งาน, จัดการ PM / Co-PM, ดาวน์โหลดเอกสารและแนบรูปภาพแบบเรียลไทม์</span>
          </div>
          <div>
            <span>ผู้ใช้งานปัจจุบัน: </span>
            <span className="font-semibold text-slate-800">{currentMember.name}</span> ({currentMember.role})
          </div>
        </div>
      </footer>
    </div>
  );
}
