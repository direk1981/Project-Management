import React from 'react';
import { Project, Task } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  TrendingUp, 
  Calendar, 
  User, 
  Users,
  Banknote,
  FolderDown,
  Plus,
  SlidersHorizontal,
  Phone,
  Building2,
  Tag
} from 'lucide-react';
import { formatSimpleDate } from '../utils/fileUtils';

interface ProjectStatsProps {
  project: Project;
  tasks: Task[];
  onOpenNewProject?: () => void;
  onOpenEditProject?: () => void;
  onOpenManageTeam?: () => void;
  onOpenManageMilestones?: () => void;
  onOpenManageCategories?: () => void;
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ 
  project, 
  tasks,
  onOpenNewProject,
  onOpenEditProject,
  onOpenManageTeam,
  onOpenManageMilestones,
  onOpenManageCategories,
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const reviewTasks = tasks.filter((t) => t.status === 'under_review').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;

  const totalDocuments = tasks.reduce((sum, t) => sum + t.documents.length, 0);
  const totalImages = tasks.reduce((sum, t) => sum + t.images.length, 0);

  // Overall progress percentage
  const avgProgress = totalTasks > 0
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
    : 0;

  return (
    <div id="project-overview-panel" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 mb-6">
      {/* Top row: Project info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              รหัสโครงการ: {project.code}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              กำหนดส่งมอบ: {formatSimpleDate(project.targetEndDate)}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-slate-400" />
              งบประมาณ: {project.budget}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {project.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
            {project.description}
          </p>
        </div>

        {/* Progress meter */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 min-w-[240px] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              ความคืบหน้ารวม
            </span>
            <span className="text-base font-bold text-indigo-700">{avgProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${avgProgress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>งานเสร็จสิ้น {completedTasks} จาก {totalTasks} รายการ</span>
            <span className="text-emerald-600 font-medium">{completedTasks}/{totalTasks} เสร็จสมบูรณ์</span>
          </div>
        </div>
      </div>

      {/* Leadership & Personnel: PM & Co-PMs */}
      <div className="py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>ผู้บริหารโครงการ:</span>
          </span>

          {/* PM Card */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/90 border border-indigo-200/90 shadow-2xs">
            <div className="relative">
              <img
                src={project.manager.avatar}
                alt="PM"
                className="w-7 h-7 rounded-full object-cover border border-indigo-300"
              />
              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8px] font-black bg-indigo-700 text-white leading-tight">
                PM
              </span>
            </div>
            <div className="text-left leading-tight">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">ผู้จัดการโครงการ (PM)</div>
              <div className="text-xs font-bold text-slate-900">{project.manager.name}</div>
            </div>
          </div>

          {/* Co-PM Cards */}
          {project.coManagers && project.coManagers.length > 0 ? (
            project.coManagers.map((copm) => (
              <div
                key={copm.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/90 border border-blue-200/90 shadow-2xs"
              >
                <div className="relative">
                  <img
                    src={copm.avatar}
                    alt="Co-PM"
                    className="w-7 h-7 rounded-full object-cover border border-blue-300"
                  />
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8px] font-black bg-blue-700 text-white leading-tight">
                    Co-PM
                  </span>
                </div>
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">รองผู้จัดการโครงการ (Co-PM)</div>
                  <div className="text-xs font-bold text-slate-900">{copm.name}</div>
                </div>
              </div>
            ))
          ) : (
            <button
              id="quick-add-copm-btn"
              type="button"
              onClick={onOpenEditProject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/40 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ แต่งตั้ง Co-PM</span>
            </button>
          )}
        </div>

        {/* Action Buttons for Project, Milestones, Categories & PM Management */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {onOpenManageMilestones && (
            <button
              id="open-milestones-modal-btn"
              type="button"
              onClick={onOpenManageMilestones}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>กำหนดงวดงาน</span>
            </button>
          )}

          {onOpenManageCategories && (
            <button
              id="open-categories-modal-btn"
              type="button"
              onClick={onOpenManageCategories}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>หมวดหมู่งาน</span>
            </button>
          )}

          {onOpenManageTeam && (
            <button
              id="open-team-modal-btn"
              type="button"
              onClick={onOpenManageTeam}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span>ทีมงาน & PM</span>
            </button>
          )}

          {onOpenEditProject && (
            <button
              id="open-edit-project-btn"
              type="button"
              onClick={onOpenEditProject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>จัดการ PM / Co-PM</span>
            </button>
          )}

          {onOpenNewProject && (
            <button
              id="open-new-project-btn-stats"
              type="button"
              onClick={onOpenNewProject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มโครงการ</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
        {/* Total Tasks */}
        <div className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3 border border-slate-100 transition-colors">
          <div className="text-xs font-medium text-slate-500">งานทั้งหมด</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalTasks}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{todoTasks} รอดำเนินการ</div>
        </div>

        {/* In progress */}
        <div className="bg-blue-50/50 hover:bg-blue-50 rounded-xl p-3 border border-blue-100/80 transition-colors">
          <div className="text-xs font-medium text-blue-700 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            กำลังทำ
          </div>
          <div className="text-xl font-bold text-blue-900 mt-1">{inProgressTasks}</div>
          <div className="text-[11px] text-blue-600/80 mt-0.5">กำลังดำเนินงาน</div>
        </div>

        {/* Under Review */}
        <div className="bg-amber-50/50 hover:bg-amber-50 rounded-xl p-3 border border-amber-100/80 transition-colors">
          <div className="text-xs font-medium text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            รอตรวจสอบ
          </div>
          <div className="text-xl font-bold text-amber-900 mt-1">{reviewTasks}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">รอวิศวกร/QC ตรวจ</div>
        </div>

        {/* Completed */}
        <div className="bg-emerald-50/50 hover:bg-emerald-50 rounded-xl p-3 border border-emerald-100/80 transition-colors">
          <div className="text-xs font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            เสร็จสมบูรณ์
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-1">{completedTasks}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">ส่งมอบงานแล้ว</div>
        </div>

        {/* Downloadable Documents */}
        <div className="bg-purple-50/50 hover:bg-purple-50 rounded-xl p-3 border border-purple-100/80 transition-colors">
          <div className="text-xs font-medium text-purple-700 flex items-center gap-1">
            <FolderDown className="w-3 h-3 text-purple-600" />
            ไฟล์เอกสาร
          </div>
          <div className="text-xl font-bold text-purple-900 mt-1">{totalDocuments}</div>
          <div className="text-[11px] text-purple-600/80 mt-0.5">พร้อมดาวน์โหลด</div>
        </div>

        {/* Real-time Photos */}
        <div className="bg-cyan-50/50 hover:bg-cyan-50 rounded-xl p-3 border border-cyan-100/80 transition-colors">
          <div className="text-xs font-medium text-cyan-700 flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-cyan-600" />
            ภาพถ่ายหน้างาน
          </div>
          <div className="text-xl font-bold text-cyan-900 mt-1">{totalImages}</div>
          <div className="text-[11px] text-cyan-600/80 mt-0.5">แนบสดเรียลไทม์</div>
        </div>
      </div>
    </div>
  );
};
