import React from 'react';
import { Task, TaskStatus } from '../types';
import { 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Eye, 
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatSimpleDate, triggerFileDownload } from '../utils/fileUtils';

interface TaskListViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onSelectTask,
  onMoveStatus,
}) => {
  const statusBadges: Record<TaskStatus, { label: string; class: string }> = {
    todo: { label: 'รอดำเนินการ', class: 'bg-slate-100 text-slate-700' },
    in_progress: { label: 'กำลังทำ', class: 'bg-blue-50 text-blue-700 border border-blue-200' },
    under_review: { label: 'รอตรวจ/QC', class: 'bg-amber-50 text-amber-800 border border-amber-200' },
    completed: { label: 'เสร็จสมบูรณ์', class: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
    delayed: { label: 'ล่าช้ากว่าแผน', class: 'bg-rose-50 text-rose-800 border border-rose-200' },
  };

  const priorityBadges = {
    low: { label: 'ต่ำ', class: 'text-slate-600 bg-slate-100' },
    medium: { label: 'ปานกลาง', class: 'text-blue-700 bg-blue-50' },
    high: { label: 'สูง', class: 'text-amber-700 bg-amber-50' },
    urgent: { label: 'เร่งด่วน', class: 'text-rose-700 bg-rose-50 font-bold' },
  };

  return (
    <div id="task-list-table-container" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
              <th className="py-3.5 px-4">รหัส & ชื่องานโครงการ</th>
              <th className="py-3.5 px-4">สถานะ</th>
              <th className="py-3.5 px-4">ความสำคัญ</th>
              <th className="py-3.5 px-4">ผู้รับผิดชอบ</th>
              <th className="py-3.5 px-4">ความคืบหน้า</th>
              <th className="py-3.5 px-4">เอกสารดาวน์โหลด</th>
              <th className="py-3.5 px-4">ภาพถ่ายเรียลไทม์</th>
              <th className="py-3.5 px-4">กำหนดส่งมอบ</th>
              <th className="py-3.5 px-4 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const statusInfo = statusBadges[task.status];
              const priorityInfo = priorityBadges[task.priority];

              return (
                <tr
                  key={task.id}
                  id={`list-row-${task.id}`}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectTask(task)}
                >
                  {/* Code & Title */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                        {task.code}
                      </span>
                      <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 ml-1">
                      {task.milestoneName && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                          {task.milestoneName}
                        </span>
                      )}
                      <span>หมวด: {task.category}</span>
                    </div>
                  </td>

                  {/* Status Dropdown / Badge */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={(e) => onMoveStatus(task.id, e.target.value as TaskStatus)}
                      className={`text-xs font-semibold py-1 px-2.5 rounded-lg border-none outline-none cursor-pointer ${statusInfo.class}`}
                    >
                      <option value="todo">รอดำเนินการ</option>
                      <option value="in_progress">กำลังทำ</option>
                      <option value="under_review">รอตรวจ/QC</option>
                      <option value="completed">เสร็จสมบูรณ์</option>
                      <option value="delayed">ล่าช้ากว่าแผน</option>
                    </select>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <span className={`text-[11px] px-2 py-0.5 rounded-md ${priorityInfo.class}`}>
                      {priorityInfo.label}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={task.assignee.avatar}
                        alt={task.assignee.name}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200"
                      />
                      <span className="text-xs text-slate-700 truncate max-w-[120px]">
                        {task.assignee.name}
                      </span>
                    </div>
                  </td>

                  {/* Progress */}
                  <td className="py-3.5 px-4">
                    <div className="w-28 space-y-1">
                      <div className="flex justify-between items-center text-[11px] text-slate-600 font-medium">
                        <span className="font-bold">{task.progress}%</span>
                        {task.subTasks && task.subTasks.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {task.subTasks.filter(s => s.status === 'completed').length}/{task.subTasks.length} ข้อ
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            task.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Documents & Direct Download */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    {task.documents.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          <FileText className="w-3.5 h-3.5" />
                          {task.documents.length} ไฟล์
                        </span>
                        {/* Direct download primary doc */}
                        <button
                          type="button"
                          title={`ดาวน์โหลด ${task.documents[0].name}`}
                          onClick={() => triggerFileDownload(task.documents[0])}
                          className="p-1 rounded text-purple-600 hover:text-purple-900 hover:bg-purple-100 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Real-time Photos */}
                  <td className="py-3.5 px-4">
                    {task.images.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={task.images[0].url}
                            alt="thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
                          {task.images.length} รูป
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                    {formatSimpleDate(task.dueDate)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>เปิดดูงาน</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
