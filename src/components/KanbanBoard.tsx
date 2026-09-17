import React from 'react';
import { Task, TaskStatus } from '../types';
import { 
  FileText, 
  Image as ImageIcon, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Paperclip,
  Calendar,
  ListChecks
} from 'lucide-react';
import { formatSimpleDate, triggerFileDownload } from '../utils/fileUtils';

interface KanbanBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
}

interface ColumnDef {
  id: TaskStatus;
  title: string;
  subtitle: string;
  accentColor: string;
  badgeBg: string;
  icon: React.ReactNode;
}

const columns: ColumnDef[] = [
  {
    id: 'todo',
    title: 'รอดำเนินการ',
    subtitle: 'To Do',
    accentColor: 'border-slate-300',
    badgeBg: 'bg-slate-100 text-slate-700',
    icon: <Clock className="w-4 h-4 text-slate-500" />,
  },
  {
    id: 'in_progress',
    title: 'กำลังดำเนินการ',
    subtitle: 'In Progress',
    accentColor: 'border-blue-400',
    badgeBg: 'bg-blue-100 text-blue-700',
    icon: <Clock className="w-4 h-4 text-blue-500" />,
  },
  {
    id: 'under_review',
    title: 'รอตรวจสอบ / QC',
    subtitle: 'Under Review',
    accentColor: 'border-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800',
    icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'completed',
    title: 'เสร็จสมบูรณ์',
    subtitle: 'Completed',
    accentColor: 'border-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  },
];

const priorityTags = {
  low: { text: 'ต่ำ', bg: 'bg-slate-100 text-slate-600' },
  medium: { text: 'ปานกลาง', bg: 'bg-blue-50 text-blue-600 border border-blue-200' },
  high: { text: 'สำคัญสูง', bg: 'bg-amber-50 text-amber-700 border border-amber-200' },
  urgent: { text: 'เร่งด่วน', bg: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold' },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onSelectTask,
  onMoveStatus,
}) => {
  return (
    <div id="kanban-board-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            id={`kanban-col-${col.id}`}
            className="bg-slate-100/70 rounded-2xl p-3 sm:p-4 border border-slate-200 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                {col.icon}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-none">
                    {col.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {col.subtitle}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                {colTasks.length}
              </span>
            </div>

            {/* Task Cards List */}
            <div className="space-y-3 flex-1">
              {colTasks.length > 0 ? (
                colTasks.map((task) => {
                  const priority = priorityTags[task.priority];

                  return (
                    <div
                      key={task.id}
                      id={`task-card-${task.id}`}
                      onClick={() => onSelectTask(task)}
                      className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col gap-2.5"
                    >
                      {/* Top: Code & Priority */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          {task.code}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${priority.bg}`}>
                          {priority.text}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {task.title}
                      </h4>

                      {/* Category & Milestone */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        {task.milestoneName && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 text-[10px]">
                            {task.milestoneName}
                          </span>
                        )}
                        <span>หมวด: {task.category}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>ความคืบหน้า</span>
                          <div className="flex items-center gap-1.5">
                            {task.subTasks && task.subTasks.length > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                                <ListChecks className="w-3 h-3 text-indigo-500" />
                                {task.subTasks.filter(s => s.status === 'completed').length}/{task.subTasks.length} ข้อ
                              </span>
                            )}
                            <span className="font-semibold text-slate-700">{task.progress}%</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              task.status === 'completed'
                                ? 'bg-emerald-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Real-time Photo Strip Preview */}
                      {task.images.length > 0 && (
                        <div className="pt-1">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {task.images.slice(0, 3).map((img, i) => (
                              <div
                                key={img.id}
                                className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0"
                              >
                                <img
                                  src={img.url}
                                  alt={img.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {task.images.length > 3 && (
                              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                                +{task.images.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer: Documents & Images counter + Assignee */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2.5">
                          {/* Attached Docs */}
                          <span
                            title={`${task.documents.length} เอกสารแนบ (คลิกดูเพื่อดาวน์โหลด)`}
                            className={`flex items-center gap-1 text-[11px] ${
                              task.documents.length > 0 ? 'text-purple-700 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {task.documents.length}
                          </span>

                          {/* Attached Images */}
                          <span
                            title={`${task.images.length} ภาพถ่ายหน้างานแบบเรียลไทม์`}
                            className={`flex items-center gap-1 text-[11px] ${
                              task.images.length > 0 ? 'text-cyan-700 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            {task.images.length}
                          </span>
                        </div>

                        {/* Assignee Avatar */}
                        <div className="flex items-center gap-1.5" title={`ผู้รับผิดชอบ: ${task.assignee.name}`}>
                          <img
                            src={task.assignee.avatar}
                            alt={task.assignee.name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                        </div>
                      </div>

                      {/* Fast Move Status Arrows */}
                      <div 
                        className="pt-1.5 flex items-center justify-between border-t border-dashed border-slate-100 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {col.id !== 'todo' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const order: TaskStatus[] = ['todo', 'in_progress', 'under_review', 'completed'];
                              const currIdx = order.indexOf(col.id);
                              if (currIdx > 0) onMoveStatus(task.id, order[currIdx - 1]);
                            }}
                            className="text-slate-400 hover:text-slate-700 flex items-center gap-0.5 hover:underline"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> ย้อน
                          </button>
                        ) : (
                          <span></span>
                        )}

                        {col.id !== 'completed' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const order: TaskStatus[] = ['todo', 'in_progress', 'under_review', 'completed'];
                              const currIdx = order.indexOf(col.id);
                              if (currIdx < order.length - 1) onMoveStatus(task.id, order[currIdx + 1]);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 hover:underline"
                          >
                            ถัดไป <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-medium flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> ส่งมอบแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 text-center p-4">
                  ไม่มีงานในสถานะนี้
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
