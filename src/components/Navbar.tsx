import React from 'react';
import { Project } from '../types';
import { 
  Building2, 
  Search, 
  Plus, 
  CheckCircle2, 
  Sparkles,
  Layers,
  FileDown,
  Camera,
  FileSpreadsheet,
  Users,
  SlidersHorizontal,
  Tag
} from 'lucide-react';

interface NavbarProps {
  projects: Project[];
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewTask: () => void;
  onOpenNewProject?: () => void;
  onOpenManageTeam?: () => void;
  onOpenManageMilestones?: () => void;
  onOpenManageCategories?: () => void;
  onOpenAIAssistant?: () => void;
  viewMode: 'excel' | 'kanban' | 'list';
  onToggleViewMode: (mode: 'excel' | 'kanban' | 'list') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
  searchQuery,
  onSearchChange,
  onOpenNewTask,
  onOpenNewProject,
  onOpenManageTeam,
  onOpenManageMilestones,
  onOpenManageCategories,
  onOpenAIAssistant,
  viewMode,
  onToggleViewMode,
}) => {
  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  return (
    <header id="main-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  ระบบติดตามงานโครงการ
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  เชื่อมต่อเรียลไทม์
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Project Tracking & Real-time Site Attachment System
              </p>
            </div>
          </div>

          {/* Project Selector & Search & Quick Add Project */}
          <div className="flex-1 max-w-xl flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                placeholder="ค้นหางาน, รหัสงาน, เอกสาร หรือรูปภาพ..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-400 rounded-lg text-slate-800 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <select
                  id="project-selector"
                  value={currentProjectId}
                  onChange={(e) => {
                    if (e.target.value === '__NEW_PROJECT__') {
                      if (onOpenNewProject) onOpenNewProject();
                    } else {
                      onSelectProject(e.target.value);
                    }
                  }}
                  className="text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-800 py-1.5 px-3 pr-7 rounded-lg border border-slate-200 outline-none cursor-pointer appearance-none transition-colors max-w-[220px] sm:max-w-xs truncate"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name.length > 24 ? p.name.substring(0, 24) + '...' : p.name}
                    </option>
                  ))}
                  <option value="__NEW_PROJECT__" className="font-bold text-indigo-600 bg-indigo-50">
                    + เพิ่มโครงการใหม่...
                  </option>
                </select>
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  ▼
                </div>
              </div>

              {onOpenNewProject && (
                <button
                  id="navbar-add-project-btn"
                  type="button"
                  onClick={onOpenNewProject}
                  title="สร้างโครงการใหม่"
                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Manage Milestones Button */}
            {onOpenManageMilestones && (
              <button
                id="navbar-manage-milestones-btn"
                type="button"
                onClick={onOpenManageMilestones}
                title="กำหนดงวดงานสัญญาและมูลค่าโครงการ"
                className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                <span>กำหนดงวดงาน</span>
              </button>
            )}

            {/* Manage Categories Button */}
            {onOpenManageCategories && (
              <button
                id="navbar-manage-categories-btn"
                type="button"
                onClick={onOpenManageCategories}
                title="แก้ไขและจัดการหมวดหมู่งาน"
                className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-800 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>หมวดหมู่งาน</span>
              </button>
            )}

            {/* Manage Team Button */}
            {onOpenManageTeam && (
              <button
                id="navbar-manage-team-btn"
                type="button"
                onClick={onOpenManageTeam}
                title="จัดการ PM, Co-PM และทีมงาน"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>ทีมงาน & PM</span>
              </button>
            )}

            {/* View Switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
              <button
                id="view-excel-btn"
                type="button"
                onClick={() => onToggleViewMode('excel')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'excel'
                    ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ตาราง Excel งวดงาน</span>
              </button>
              <button
                id="view-kanban-btn"
                type="button"
                onClick={() => onToggleViewMode('kanban')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                บอร์ดคัมบัง
              </button>
              <button
                id="view-list-btn"
                type="button"
                onClick={() => onToggleViewMode('list')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                ตารางงาน
              </button>
            </div>

            {/* AI Assistant Button */}
            {onOpenAIAssistant && (
              <button
                id="navbar-ai-assistant-btn"
                type="button"
                onClick={onOpenAIAssistant}
                title="ผู้ช่วย AI อัจฉริยะ Gemini (วิเคราะห์โครงการ, สรุปสถานะ, แชทถามงาน)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-300/50 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span className="hidden xs:inline">ผู้ช่วย AI</span>
                <span className="xs:hidden">AI</span>
              </button>
            )}

            {/* Create Task Button */}
            <button
              id="create-new-task-btn"
              type="button"
              onClick={onOpenNewTask}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs sm:text-sm font-medium shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างงานใหม่</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
