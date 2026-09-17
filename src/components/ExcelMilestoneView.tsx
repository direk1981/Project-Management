import React, { useState, useMemo } from 'react';
import { Task, Project, TaskStatus, SubTaskItem, TeamMember, ImageAttachment, DocumentAttachment } from '../types';
import { 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Download, 
  Camera, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Calendar, 
  User, 
  Trash2, 
  Eye, 
  CheckSquare, 
  SlidersHorizontal,
  FileCheck,
  TrendingUp,
  Percent,
  Tag
} from 'lucide-react';
import { formatSimpleDate, triggerFileDownload, exportMilestonesToCSV } from '../utils/fileUtils';

interface ExcelMilestoneViewProps {
  project: Project;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onOpenLightbox: (img: ImageAttachment) => void;
  currentMember: TeamMember;
  onOpenManageMilestones?: () => void;
  onOpenManageCategories?: () => void;
}

export const ExcelMilestoneView: React.FC<ExcelMilestoneViewProps> = ({
  project,
  tasks,
  onSelectTask,
  onUpdateTask,
  onOpenLightbox,
  currentMember,
  onOpenManageMilestones,
  onOpenManageCategories,
}) => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({
    'ms-1': true,
    'ms-2': true,
    'ms-3': true,
    'ms-4': true,
    'ms-5': true,
  });
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Adding new sub-task state
  const [addingToTaskId, setAddingToTaskId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemNo, setNewItemNo] = useState('');
  const [newItemWeight, setNewItemWeight] = useState(25);
  const [newItemDueDate, setNewItemDueDate] = useState(new Date().toISOString().slice(0, 10));

  // Initialize expanded tasks on first load
  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    tasks.forEach((t) => {
      initialExpanded[t.id] = true;
    });
    setExpandedTasks(initialExpanded);
  }, [tasks.length]);

  const milestones = useMemo(() => {
    return project.milestones || [
      {
        id: 'ms-1',
        periodNo: 1,
        name: 'งวดที่ 1: งานหลักและเตรียมการ',
        percentage: 100,
        targetDate: project.targetEndDate,
        status: 'in_progress' as const,
      },
    ];
  }, [project]);

  // Group tasks by milestone
  const milestoneGroups = useMemo(() => {
    return milestones.map((ms) => {
      const msTasks = tasks.filter((t) => (t.milestoneId || 'ms-1') === ms.id);
      
      // Calculate total subtasks and progress for this milestone
      let totalSubTasks = 0;
      let completedSubTasks = 0;
      let weightedProgressSum = 0;
      let totalWeight = 0;

      msTasks.forEach((task) => {
        const subs = task.subTasks || [];
        totalSubTasks += subs.length;
        subs.forEach((s) => {
          if (s.status === 'completed') completedSubTasks += 1;
          const w = s.weight || 10;
          totalWeight += w;
          weightedProgressSum += (s.progress || 0) * w;
        });
      });

      const averageProgress = totalWeight > 0 
        ? Math.round(weightedProgressSum / totalWeight)
        : msTasks.length > 0 
          ? Math.round(msTasks.reduce((acc, t) => acc + t.progress, 0) / msTasks.length)
          : 0;

      return {
        milestone: ms,
        tasks: msTasks,
        totalSubTasks,
        completedSubTasks,
        averageProgress,
      };
    });
  }, [milestones, tasks]);

  // Status definition map with colors & labels
  const statusOptions: { value: TaskStatus; label: string; bg: string; text: string; dot: string }[] = [
    { value: 'todo', label: 'รอดำเนินการ', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
    { value: 'in_progress', label: 'กำลังทำ', bg: 'bg-blue-50 border border-blue-200', text: 'text-blue-700 font-medium', dot: 'bg-blue-500' },
    { value: 'under_review', label: 'รอตรวจ/QC', bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-800 font-medium', dot: 'bg-amber-500' },
    { value: 'completed', label: 'เสร็จสมบูรณ์', bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-800 font-semibold', dot: 'bg-emerald-500' },
    { value: 'delayed', label: 'ล่าช้ากว่าแผน', bg: 'bg-rose-50 border border-rose-200', text: 'text-rose-700 font-semibold', dot: 'bg-rose-500' },
  ];

  const getStatusBadge = (status: TaskStatus) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0];
  };

  // Toggle milestone collapse
  const toggleMilestone = (msId: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [msId]: !prev[msId],
    }));
  };

  // Toggle task collapse
  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Expand / Collapse All
  const handleExpandAll = () => {
    const allMs: Record<string, boolean> = {};
    const allT: Record<string, boolean> = {};
    milestones.forEach((m) => { allMs[m.id] = true; });
    tasks.forEach((t) => { allT[t.id] = true; });
    setExpandedMilestones(allMs);
    setExpandedTasks(allT);
  };

  const handleCollapseAll = () => {
    const allMs: Record<string, boolean> = {};
    const allT: Record<string, boolean> = {};
    milestones.forEach((m) => { allMs[m.id] = false; });
    tasks.forEach((t) => { allT[t.id] = false; });
    setExpandedMilestones(allMs);
    setExpandedTasks(allT);
  };

  // Recalculate parent task progress based on subtasks
  const recalcTaskProgress = (subTasks: SubTaskItem[]): { progress: number; status: TaskStatus } => {
    if (!subTasks || subTasks.length === 0) return { progress: 0, status: 'todo' };
    
    let totalWeight = 0;
    let weightedProgress = 0;
    let allCompleted = true;
    let anyInProgress = false;
    let anyUnderReview = false;

    subTasks.forEach((s) => {
      const w = s.weight || 10;
      totalWeight += w;
      weightedProgress += (s.progress || 0) * w;
      if (s.status !== 'completed') allCompleted = false;
      if (s.status === 'in_progress') anyInProgress = true;
      if (s.status === 'under_review') anyUnderReview = true;
    });

    const calculatedProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
    
    let derivedStatus: TaskStatus = 'todo';
    if (allCompleted || calculatedProgress === 100) {
      derivedStatus = 'completed';
    } else if (anyUnderReview) {
      derivedStatus = 'under_review';
    } else if (anyInProgress || calculatedProgress > 0) {
      derivedStatus = 'in_progress';
    }

    return { progress: calculatedProgress, status: derivedStatus };
  };

  // Handle direct subtask status update
  const handleSubTaskStatusChange = (
    taskId: string,
    subTaskId: string,
    newStatus: TaskStatus
  ) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const currentSubTasks = targetTask.subTasks || [];
    const updatedSubTasks = currentSubTasks.map((st) => {
      if (st.id !== subTaskId) return st;
      const updatedProgress = newStatus === 'completed' ? 100 : newStatus === 'todo' ? 0 : st.progress === 0 ? 50 : st.progress;
      return {
        ...st,
        status: newStatus,
        progress: updatedProgress,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
      };
    });

    const { progress: newProgress, status: derivedStatus } = recalcTaskProgress(updatedSubTasks);

    const updatedTask: Task = {
      ...targetTask,
      subTasks: updatedSubTasks,
      progress: newProgress,
      status: derivedStatus,
      activities: [
        {
          id: 'act-' + Date.now(),
          taskId: targetTask.id,
          user: currentMember,
          action: `อัปเดตสถานะข้อย่อยเป็น "${getStatusBadge(newStatus).label}"`,
          timestamp: new Date().toISOString(),
          type: 'status',
        },
        ...targetTask.activities,
      ],
    };

    onUpdateTask(updatedTask);
  };

  // Quick checkbox toggle (Done / Undone)
  const handleToggleSubTaskCheck = (taskId: string, subTaskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    handleSubTaskStatusChange(taskId, subTaskId, nextStatus);
  };

  // Handle subtask progress slider/step change
  const handleSubTaskProgressChange = (taskId: string, subTaskId: string, newProg: number) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const currentSubTasks = targetTask.subTasks || [];
    const updatedSubTasks = currentSubTasks.map((st) => {
      if (st.id !== subTaskId) return st;
      let stStatus = st.status;
      if (newProg === 100) stStatus = 'completed';
      else if (newProg > 0 && stStatus === 'todo') stStatus = 'in_progress';
      else if (newProg === 0 && stStatus === 'completed') stStatus = 'todo';

      return {
        ...st,
        progress: newProg,
        status: stStatus,
      };
    });

    const { progress: newProgress, status: derivedStatus } = recalcTaskProgress(updatedSubTasks);

    onUpdateTask({
      ...targetTask,
      subTasks: updatedSubTasks,
      progress: newProgress,
      status: derivedStatus,
    });
  };

  // Delete sub-task
  const handleDeleteSubTask = (taskId: string, subTaskId: string) => {
    if (!confirm('ยืนยันลบรายการงานย่อยนี้หรือไม่?')) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const updatedSubTasks = (targetTask.subTasks || []).filter((s) => s.id !== subTaskId);
    const { progress: newProgress, status: derivedStatus } = recalcTaskProgress(updatedSubTasks);

    onUpdateTask({
      ...targetTask,
      subTasks: updatedSubTasks,
      progress: newProgress,
      status: derivedStatus,
    });
  };

  // Submit adding new subtask
  const handleSaveNewSubTask = (taskId: string) => {
    if (!newItemTitle.trim()) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const currentSubs = targetTask.subTasks || [];
    const autoNo = newItemNo.trim() || `${targetTask.code}.${currentSubs.length + 1}`;

    const newSub: SubTaskItem = {
      id: 'sub-' + Date.now(),
      itemNo: autoNo,
      title: newItemTitle.trim(),
      status: 'todo',
      progress: 0,
      weight: Number(newItemWeight) || 20,
      assigneeName: targetTask.assignee.name,
      dueDate: newItemDueDate || targetTask.dueDate,
    };

    const updatedSubs = [...currentSubs, newSub];
    const { progress: newProgress, status: derivedStatus } = recalcTaskProgress(updatedSubs);

    onUpdateTask({
      ...targetTask,
      subTasks: updatedSubs,
      progress: newProgress,
      status: derivedStatus,
    });

    // Reset form
    setAddingToTaskId(null);
    setNewItemTitle('');
    setNewItemNo('');
  };

  // Export to Excel CSV
  const handleExportCSV = () => {
    const flatExportData: {
      milestoneName: string;
      topicCode: string;
      topicTitle: string;
      itemNo: string;
      title: string;
      status: string;
      progress: number;
      weight: number;
      assigneeName: string;
      dueDate: string;
    }[] = [];

    milestoneGroups.forEach((group) => {
      group.tasks.forEach((t) => {
        const subs = t.subTasks || [];
        if (subs.length > 0) {
          subs.forEach((s) => {
            flatExportData.push({
              milestoneName: group.milestone.name,
              topicCode: t.code,
              topicTitle: t.title,
              itemNo: s.itemNo,
              title: s.title,
              status: getStatusBadge(s.status).label,
              progress: s.progress,
              weight: s.weight || 0,
              assigneeName: s.assigneeName || t.assignee.name,
              dueDate: s.dueDate || t.dueDate,
            });
          });
        } else {
          flatExportData.push({
            milestoneName: group.milestone.name,
            topicCode: t.code,
            topicTitle: t.title,
            itemNo: t.code,
            title: t.description || t.title,
            status: getStatusBadge(t.status).label,
            progress: t.progress,
            weight: 100,
            assigneeName: t.assignee.name,
            dueDate: t.dueDate,
          });
        }
      });
    });

    exportMilestonesToCSV(project.name, flatExportData);
  };

  // Summary Metrics across all visible milestones
  const allSubTasksList = useMemo(() => {
    const list: { task: Task; sub: SubTaskItem; milestone: any }[] = [];
    milestoneGroups.forEach((g) => {
      g.tasks.forEach((t) => {
        (t.subTasks || []).forEach((s) => {
          list.push({ task: t, sub: s, milestone: g.milestone });
        });
      });
    });
    return list;
  }, [milestoneGroups]);

  const totalSubTasksCount = allSubTasksList.length;
  const completedSubTasksCount = allSubTasksList.filter((i) => i.sub.status === 'completed').length;
  const inProgressSubTasksCount = allSubTasksList.filter((i) => i.sub.status === 'in_progress').length;
  const underReviewSubTasksCount = allSubTasksList.filter((i) => i.sub.status === 'under_review').length;
  const todoSubTasksCount = allSubTasksList.filter((i) => i.sub.status === 'todo').length;

  const totalWeightedProgress = totalSubTasksCount > 0
    ? Math.round((completedSubTasksCount / totalSubTasksCount) * 100)
    : 0;

  return (
    <div id="excel-milestone-tracker-container" className="space-y-4">
      {/* Top Banner & Excel Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  ตารางติดตามงานโครงการแบบ Excel รายงวด
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                    WBS & งวดงาน
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  ตรวจสอบหัวข้อหลักและรายละเอียดย่อยเป็นข้อๆ พร้อมอัปเดตสถานะและดาวน์โหลดเอกสาร/ภาพถ่ายหน้างานได้ทันที
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    <span className="font-bold">PM:</span>
                    <span>{project.manager.name}</span>
                  </div>
                  {project.coManagers && project.coManagers.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <span className="font-bold">Co-PM:</span>
                      <span>{project.coManagers.map((c) => c.name).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Configure Milestones, Manage Categories, Export to CSV & Expand/Collapse */}
          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
            {onOpenManageMilestones && (
              <button
                id="open-manage-milestones-excel-btn"
                type="button"
                onClick={onOpenManageMilestones}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>กำหนดงวดงาน</span>
              </button>
            )}

            {onOpenManageCategories && (
              <button
                id="open-manage-categories-excel-btn"
                type="button"
                onClick={onOpenManageCategories}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>แก้ไขหมวดหมู่</span>
              </button>
            )}

            <button
              id="expand-all-btn"
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
            >
              กางทั้งหมด
            </button>
            <button
              id="collapse-all-btn"
              type="button"
              onClick={handleCollapseAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
            >
              ยุบทั้งหมด
            </button>
            <button
              id="export-excel-csv-btn"
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก Excel (.csv)</span>
            </button>
          </div>
        </div>

        {/* Milestone Quick Filter Tabs */}
        <div className="pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Milestone Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-medium scrollbar-none">
            <span className="text-slate-400 mr-1 text-xs shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              เลือกงวดงาน:
            </span>
            <button
              type="button"
              onClick={() => setSelectedMilestoneId('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                selectedMilestoneId === 'all'
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทุกงวดงาน ({milestones.length})
            </button>
            {milestones.map((ms) => {
              const isSelected = selectedMilestoneId === ms.id;
              return (
                <button
                  key={ms.id}
                  type="button"
                  onClick={() => setSelectedMilestoneId(ms.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>งวดที่ {ms.periodNo}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {ms.percentage}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search box inside spreadsheet */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาข้อ, เลขที่ข้อ, หรืองานย่อย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Status Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60">
            <div className="text-slate-500 text-[11px] mb-0.5">รวมรายการย่อยทั้งหมด</div>
            <div className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>{totalSubTasksCount} ข้อ</span>
              <span className="text-xs font-semibold text-indigo-600">{totalWeightedProgress}% สำเร็จ</span>
            </div>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-200/60">
            <div className="text-emerald-700 text-[11px] mb-0.5">เสร็จสมบูรณ์ (Done)</div>
            <div className="text-base font-bold text-emerald-800">
              {completedSubTasksCount} <span className="text-xs font-normal text-emerald-600">ข้อ</span>
            </div>
          </div>
          <div className="bg-blue-50/60 rounded-xl p-2.5 border border-blue-200/60">
            <div className="text-blue-700 text-[11px] mb-0.5">กำลังทำ (In Progress)</div>
            <div className="text-base font-bold text-blue-800">
              {inProgressSubTasksCount} <span className="text-xs font-normal text-blue-600">ข้อ</span>
            </div>
          </div>
          <div className="bg-amber-50/60 rounded-xl p-2.5 border border-amber-200/60">
            <div className="text-amber-800 text-[11px] mb-0.5">รอตรวจ/QC (Review)</div>
            <div className="text-base font-bold text-amber-900">
              {underReviewSubTasksCount} <span className="text-xs font-normal text-amber-700">ข้อ</span>
            </div>
          </div>
          <div className="bg-slate-100/70 rounded-xl p-2.5 border border-slate-200/60">
            <div className="text-slate-600 text-[11px] mb-0.5">รอดำเนินการ (To-do)</div>
            <div className="text-base font-bold text-slate-800">
              {todoSubTasksCount} <span className="text-xs font-normal text-slate-500">ข้อ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Excel Header Bar */}
        <div className="bg-slate-800 text-slate-200 px-4 py-2.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white">SHEET: ติดตามงวดงานโครงการ (WBS Breakdown)</span>
            <span className="text-slate-400 hidden sm:inline">| คลิกที่ช่อง "สถานะ" หรือคลิกเครื่องหมายถูก เพื่ออัปเดตงานแบบเรียลไทม์</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            {project.code}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold text-[11px] tracking-tight">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">ลำดับ</th>
                <th className="py-2.5 px-3 min-w-[280px] border-r border-slate-200">หัวข้อ & รายละเอียดย่อยในแต่ละงวด</th>
                <th className="py-2.5 px-3 w-36 border-r border-slate-200">สถานะงาน (Status)</th>
                <th className="py-2.5 px-3 w-28 border-r border-slate-200 text-center">ความคืบหน้า (%)</th>
                <th className="py-2.5 px-3 w-20 border-r border-slate-200 text-center">น้ำหนัก %</th>
                <th className="py-2.5 px-3 w-36 border-r border-slate-200">ผู้รับผิดชอบ</th>
                <th className="py-2.5 px-3 w-28 border-r border-slate-200 text-center">เอกสารดาวน์โหลด</th>
                <th className="py-2.5 px-3 w-24 border-r border-slate-200 text-center">ภาพถ่ายไซต์</th>
                <th className="py-2.5 px-3 w-28 border-r border-slate-200">กำหนดส่ง</th>
                <th className="py-2.5 px-3 w-20 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {milestoneGroups
                .filter((group) => selectedMilestoneId === 'all' || group.milestone.id === selectedMilestoneId)
                .map((group) => {
                  const isMilestoneExpanded = expandedMilestones[group.milestone.id] !== false;
                  
                  // Filter tasks by search query
                  const filteredGroupTasks = group.tasks.filter((task) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    const matchTask = task.title.toLowerCase().includes(q) || task.code.toLowerCase().includes(q);
                    const matchSub = (task.subTasks || []).some(
                      (s) => s.title.toLowerCase().includes(q) || s.itemNo.toLowerCase().includes(q)
                    );
                    return matchTask || matchSub;
                  });

                  if (filteredGroupTasks.length === 0 && searchQuery.trim()) {
                    return null;
                  }

                  return (
                    <React.Fragment key={group.milestone.id}>
                      {/* LEVEL 1: MILESTONE ROW (งวดงาน) */}
                      <tr 
                        id={`milestone-row-${group.milestone.id}`}
                        className="bg-slate-900 text-white font-medium cursor-pointer hover:bg-slate-800 transition-colors border-t-2 border-b-2 border-slate-950"
                        onClick={() => toggleMilestone(group.milestone.id)}
                      >
                        {/* Expand/Collapse Chevron */}
                        <td className="py-3 px-3 text-center border-r border-slate-700">
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-white/20 transition-colors text-white"
                          >
                            {isMilestoneExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Milestone Title & Description */}
                        <td className="py-3 px-3 border-r border-slate-700" colSpan={2}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-white tracking-wide">
                              {group.milestone.name}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-400/30">
                              ค่างวด {group.milestone.percentage}% {group.milestone.amount ? `(${group.milestone.amount})` : ''}
                            </span>
                          </div>
                          {group.milestone.description && (
                            <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                              {group.milestone.description}
                            </div>
                          )}
                        </td>

                        {/* Milestone Overall Progress */}
                        <td className="py-3 px-3 text-center border-r border-slate-700">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono font-bold text-white text-xs">
                              {group.averageProgress}%
                            </span>
                            <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full transition-all"
                                style={{ width: `${group.averageProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Milestone items count */}
                        <td className="py-3 px-3 text-center border-r border-slate-700 text-[11px] text-slate-300">
                          {group.completedSubTasks}/{group.totalSubTasks} ข้อ
                        </td>

                        {/* Manager */}
                        <td className="py-3 px-3 border-r border-slate-700 text-[11px] text-slate-300 truncate">
                          {project.manager.name}
                        </td>

                        {/* Empty spacer cols */}
                        <td className="py-3 px-3 border-r border-slate-700 text-center text-slate-400">-</td>
                        <td className="py-3 px-3 border-r border-slate-700 text-center text-slate-400">-</td>

                        {/* Target Date */}
                        <td className="py-3 px-3 border-r border-slate-700 text-slate-300 text-[11px] whitespace-nowrap">
                          {formatSimpleDate(group.milestone.targetDate)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenManageMilestones && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenManageMilestones();
                                }}
                                title="คลิกเพื่อแก้ไขกำหนดงวดงาน"
                                className="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors inline-flex items-center gap-1 text-[10px]"
                              >
                                <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                                <span>แก้ไขงวด</span>
                              </button>
                            )}
                            <span className="text-[11px] text-slate-400">งวดที่ {group.milestone.periodNo}</span>
                          </div>
                        </td>
                      </tr>

                      {/* LEVEL 2 & LEVEL 3: TOPICS & SUB-ITEMS (When milestone is expanded) */}
                      {isMilestoneExpanded &&
                        filteredGroupTasks.map((task) => {
                          const isTaskExpanded = expandedTasks[task.id] !== false;
                          const subTasks = task.subTasks || [];
                          const taskStatusInfo = getStatusBadge(task.status);

                          return (
                            <React.Fragment key={task.id}>
                              {/* LEVEL 2: MAIN TOPIC ROW */}
                              <tr
                                id={`task-topic-row-${task.id}`}
                                className="bg-indigo-50/50 hover:bg-indigo-50 transition-colors font-medium border-b border-indigo-100/70 cursor-pointer"
                                onClick={() => toggleTask(task.id)}
                              >
                                {/* Code / Index */}
                                <td className="py-2.5 px-3 text-center border-r border-slate-200">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      className="p-0.5 rounded text-indigo-700 hover:bg-indigo-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTask(task.id);
                                      }}
                                    >
                                      {isTaskExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <span className="font-mono font-bold text-xs text-indigo-900">
                                      {task.code}
                                    </span>
                                  </div>
                                </td>

                                {/* Main Topic Title */}
                                <td className="py-2.5 px-3 border-r border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-xs sm:text-sm hover:text-indigo-600 transition-colors">
                                      {task.title}
                                    </span>
                                    <span className="text-[10px] font-semibold bg-white border border-indigo-200 text-indigo-700 px-1.5 py-0.2 rounded">
                                      หมวด: {task.category}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                                    {task.description}
                                  </div>
                                </td>

                                {/* Topic Overall Status Dropdown */}
                                <td 
                                  className="py-2.5 px-3 border-r border-slate-200" 
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <select
                                    value={task.status}
                                    onChange={(e) => {
                                      const newSt = e.target.value as TaskStatus;
                                      onUpdateTask({
                                        ...task,
                                        status: newSt,
                                        progress: newSt === 'completed' ? 100 : task.progress,
                                      });
                                    }}
                                    className={`w-full text-xs font-semibold py-1 px-2 rounded-lg cursor-pointer outline-none ${taskStatusInfo.bg} ${taskStatusInfo.text}`}
                                  >
                                    {statusOptions.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Topic Progress */}
                                <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="font-mono font-semibold text-xs text-slate-800">
                                      {task.progress}%
                                    </span>
                                    <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          task.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                                        }`}
                                        style={{ width: `${task.progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>

                                {/* Topic weight / items count */}
                                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-[11px] text-slate-500">
                                  {subTasks.length} ข้อย่อย
                                </td>

                                {/* Assignee */}
                                <td className="py-2.5 px-3 border-r border-slate-200">
                                  <div className="flex items-center gap-1.5">
                                    <img
                                      src={task.assignee.avatar}
                                      alt={task.assignee.name}
                                      className="w-5 h-5 rounded-full object-cover border border-slate-200"
                                    />
                                    <span className="text-xs text-slate-800 truncate max-w-[110px]">
                                      {task.assignee.name.split(' ')[0]} {task.assignee.name.split(' ')[1]}
                                    </span>
                                  </div>
                                </td>

                                {/* Document download */}
                                <td className="py-2.5 px-3 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}>
                                  {task.documents.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => triggerFileDownload(task.documents[0])}
                                      title={`ดาวน์โหลด ${task.documents[0].name}`}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium text-[11px] transition-colors cursor-pointer border border-purple-200"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>{task.documents.length} ไฟล์</span>
                                      <Download className="w-2.5 h-2.5" />
                                    </button>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>

                                {/* Site Photos */}
                                <td className="py-2.5 px-3 border-r border-slate-200 text-center" onClick={(e) => e.stopPropagation()}>
                                  {task.images.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => onOpenLightbox(task.images[0])}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 hover:bg-cyan-100 font-medium text-[11px] transition-colors cursor-pointer border border-cyan-200"
                                    >
                                      <Camera className="w-3 h-3" />
                                      <span>{task.images.length} รูป</span>
                                    </button>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>

                                {/* Due Date */}
                                <td className="py-2.5 px-3 border-r border-slate-200 text-[11px] text-slate-600 whitespace-nowrap">
                                  {formatSimpleDate(task.dueDate)}
                                </td>

                                {/* Actions */}
                                <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => onSelectTask(task)}
                                      title="เปิดดูรายละเอียดเต็ม / แนบรูปภาพ"
                                      className="p-1 rounded bg-white hover:bg-indigo-100 text-indigo-700 border border-slate-200 transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddingToTaskId(task.id);
                                        setNewItemNo(`${task.code}.${subTasks.length + 1}`);
                                      }}
                                      title="เพิ่มรายการย่อยในหัวข้อนี้"
                                      className="p-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* LEVEL 3: SUB-TASK ITEMS ROWS (The detailed Excel items!) */}
                              {isTaskExpanded &&
                                subTasks.map((subItem) => {
                                  const subStatus = getStatusBadge(subItem.status);
                                  const isDone = subItem.status === 'completed';

                                  return (
                                    <tr
                                      key={subItem.id}
                                      id={`sub-item-row-${subItem.id}`}
                                      className={`hover:bg-slate-50 transition-colors ${
                                        isDone ? 'bg-emerald-50/20' : 'bg-white'
                                      }`}
                                    >
                                      {/* Sub-item Index & Checkbox */}
                                      <td className="py-2 px-3 text-center border-r border-slate-200">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleSubTaskCheck(task.id, subItem.id, subItem.status)}
                                            title={isDone ? 'คลิกเพื่อเปลี่ยนเป็นกำลังทำ' : 'คลิกเพื่อทำเครื่องหมายว่าเสร็จสิ้น'}
                                            className="cursor-pointer transition-transform active:scale-90"
                                          >
                                            {isDone ? (
                                              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                                            ) : (
                                              <Circle className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                            )}
                                          </button>
                                          <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                            {subItem.itemNo}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Sub-item Title & Description */}
                                      <td className="py-2 px-3 border-r border-slate-200 pl-6 sm:pl-8">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`text-xs ${
                                              isDone
                                                ? 'line-through text-slate-400'
                                                : 'text-slate-800 font-medium'
                                            }`}
                                          >
                                            {subItem.title}
                                          </span>
                                          {subItem.documentName && (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                                              <FileCheck className="w-2.5 h-2.5" />
                                              มีเอกสาร
                                            </span>
                                          )}
                                          {subItem.hasPhoto && (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 rounded">
                                              <Camera className="w-2.5 h-2.5" />
                                              มีภาพหน้างาน
                                            </span>
                                          )}
                                        </div>
                                        {subItem.description && (
                                          <div className="text-[11px] text-slate-400 mt-0.5">
                                            {subItem.description}
                                          </div>
                                        )}
                                      </td>

                                      {/* Interactive Status Dropdown (CORE FEATURE) */}
                                      <td className="py-1.5 px-3 border-r border-slate-200">
                                        <select
                                          value={subItem.status}
                                          onChange={(e) =>
                                            handleSubTaskStatusChange(
                                              task.id,
                                              subItem.id,
                                              e.target.value as TaskStatus
                                            )
                                          }
                                          className={`w-full text-xs font-semibold py-1 px-2 rounded-lg cursor-pointer outline-none transition-all ${subStatus.bg} ${subStatus.text}`}
                                        >
                                          {statusOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                      </td>

                                      {/* Interactive Progress % */}
                                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <select
                                            value={subItem.progress}
                                            onChange={(e) =>
                                              handleSubTaskProgressChange(
                                                task.id,
                                                subItem.id,
                                                Number(e.target.value)
                                              )
                                            }
                                            className="font-mono text-xs font-semibold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 cursor-pointer text-slate-700"
                                          >
                                            <option value={0}>0%</option>
                                            <option value={25}>25%</option>
                                            <option value={50}>50%</option>
                                            <option value={70}>70%</option>
                                            <option value={80}>80%</option>
                                            <option value={100}>100%</option>
                                          </select>
                                        </div>
                                      </td>

                                      {/* Weight % */}
                                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-[11px] text-slate-500">
                                        {subItem.weight || 25}%
                                      </td>

                                      {/* Sub-item Assignee */}
                                      <td className="py-2 px-3 border-r border-slate-200 text-xs text-slate-700 truncate">
                                        {subItem.assigneeName || task.assignee.name}
                                      </td>

                                      {/* Sub-item Document Download */}
                                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                                        {subItem.hasDocument || subItem.documentName ? (
                                          <button
                                            type="button"
                                            title={`ดาวน์โหลด ${subItem.documentName || 'เอกสารประกอบ'}`}
                                            onClick={() => {
                                              // Find matching document or trigger sample download
                                              const matchedDoc = task.documents.find(
                                                (d) => d.name === subItem.documentName
                                              ) || {
                                                id: 'doc-sub-' + subItem.id,
                                                name: subItem.documentName || `เอกสาร_${subItem.itemNo}.pdf`,
                                                fileType: 'pdf' as const,
                                                size: 520000,
                                                uploadedAt: new Date().toISOString(),
                                                uploadedBy: subItem.assigneeName || task.assignee.name,
                                              };
                                              triggerFileDownload(matchedDoc);
                                            }}
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] transition-colors border border-purple-200"
                                          >
                                            <Download className="w-2.5 h-2.5" />
                                            <span className="truncate max-w-[65px]">
                                              {subItem.documentName ? subItem.documentName.split('.')[0] : 'ดาวน์โหลด'}
                                            </span>
                                          </button>
                                        ) : (
                                          <span className="text-slate-300">-</span>
                                        )}
                                      </td>

                                      {/* Sub-item Site Photo Lightbox Preview */}
                                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                                        {subItem.hasPhoto && subItem.photoUrl ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              onOpenLightbox({
                                                id: 'photo-sub-' + subItem.id,
                                                name: `ภาพถ่าย_${subItem.itemNo}.jpg`,
                                                url: subItem.photoUrl!,
                                                size: 1500000,
                                                uploadedAt: new Date().toISOString(),
                                                uploadedBy: subItem.assigneeName || task.assignee.name,
                                                caption: subItem.photoCaption || subItem.title,
                                              });
                                            }}
                                            className="inline-flex items-center gap-1 p-0.5 rounded border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 transition-colors"
                                            title="คลิกดูภาพถ่ายหน้างานแบบเต็มจอ"
                                          >
                                            <img
                                              src={subItem.photoUrl}
                                              alt={subItem.title}
                                              className="w-6 h-6 rounded object-cover"
                                            />
                                            <Camera className="w-3 h-3 text-cyan-700" />
                                          </button>
                                        ) : (
                                          <span className="text-slate-300">-</span>
                                        )}
                                      </td>

                                      {/* Due Date */}
                                      <td className="py-2 px-3 border-r border-slate-200 text-[11px] text-slate-500 whitespace-nowrap">
                                        {formatSimpleDate(subItem.dueDate || task.dueDate)}
                                      </td>

                                      {/* Delete sub-item */}
                                      <td className="py-2 px-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSubTask(task.id, subItem.id)}
                                          title="ลบรายการย่อยนี้"
                                          className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}

                              {/* INLINE ADD SUB-TASK ROW */}
                              {isTaskExpanded && addingToTaskId === task.id && (
                                <tr className="bg-indigo-50/70 border-2 border-dashed border-indigo-300">
                                  <td className="py-2 px-3 text-center">
                                    <input
                                      type="text"
                                      value={newItemNo}
                                      onChange={(e) => setNewItemNo(e.target.value)}
                                      placeholder="1.2.x"
                                      className="w-14 text-center font-mono text-xs py-1 px-1 bg-white border border-indigo-300 rounded outline-none"
                                    />
                                  </td>
                                  <td className="py-2 px-3" colSpan={2}>
                                    <input
                                      type="text"
                                      value={newItemTitle}
                                      onChange={(e) => setNewItemTitle(e.target.value)}
                                      placeholder="พิมพ์รายละเอียดงานย่อย เช่น ตรวจรับเหล็กเสริม, ทดสอบ Slump test..."
                                      className="w-full text-xs py-1 px-2.5 bg-white border border-indigo-300 rounded outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveNewSubTask(task.id);
                                        if (e.key === 'Escape') setAddingToTaskId(null);
                                      }}
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <span className="text-xs text-slate-400">0%</span>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <input
                                      type="number"
                                      value={newItemWeight}
                                      onChange={(e) => setNewItemWeight(Number(e.target.value))}
                                      className="w-12 text-center text-xs py-1 bg-white border border-indigo-200 rounded"
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-xs text-slate-600">
                                    {task.assignee.name}
                                  </td>
                                  <td className="py-2 px-3 text-center text-slate-400" colSpan={2}>
                                    -
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      type="date"
                                      value={newItemDueDate}
                                      onChange={(e) => setNewItemDueDate(e.target.value)}
                                      className="text-xs py-0.5 px-1 bg-white border border-slate-200 rounded w-full"
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveNewSubTask(task.id)}
                                        className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                                      >
                                        บันทึก
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setAddingToTaskId(null)}
                                        className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs cursor-pointer"
                                      >
                                        ยกเลิก
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {/* QUICK BUTTON TO ADD SUB-TASK */}
                              {isTaskExpanded && addingToTaskId !== task.id && (
                                <tr className="bg-slate-50/40 hover:bg-slate-100/60 border-b border-slate-100">
                                  <td colSpan={10} className="py-1.5 px-8">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddingToTaskId(task.id);
                                        setNewItemNo(`${task.code}.${subTasks.length + 1}`);
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 font-medium py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>+ เพิ่มข้อและรายละเอียดย่อยใน {task.title}</span>
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Spreadsheet Footer Status Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">คำอธิบายสถานะ:</span>
            <div className="flex flex-wrap items-center gap-2">
              {statusOptions.map((opt) => (
                <span key={opt.value} className="inline-flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`}></span>
                  <span>{opt.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            ระบบบันทึกข้อมูลอัตโนมัติ (Auto-saved to Local Storage)
          </div>
        </div>
      </div>
    </div>
  );
};
