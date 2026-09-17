import React, { useState, useRef } from 'react';
import { Task, Project, TeamMember, TaskPriority, DocumentAttachment, ImageAttachment, SubTaskItem, TaskCategory } from '../types';
import { X, Upload, Camera, FileText, Image as ImageIcon, Trash2, Plus, ListChecks, Calendar, Settings, Sparkles, RefreshCw, Wand2 } from 'lucide-react';
import { detectFileType, formatFileSize } from '../utils/fileUtils';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (newTask: Task) => void;
  project: Project;
  members: TeamMember[];
  currentMember: TeamMember;
  nextTaskNumber: number;
  categories?: TaskCategory[];
  onOpenManageCategories?: () => void;
  onOpenManageMilestones?: () => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  project,
  members,
  currentMember,
  nextTaskNumber,
  categories = [],
  onOpenManageCategories,
  onOpenManageMilestones,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'งาน Software (SW)');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [milestoneId, setMilestoneId] = useState<string>(project.milestones?.[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState(members[0]?.id || '');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [initialSubtasks, setInitialSubtasks] = useState<string[]>([
    'วิเคราะห์สเปกและความต้องการเชิงเทคนิค',
    'ดำเนินการเขียนโปรแกรม / ออกแบบและประกอบบอร์ด',
    'ทดสอบการทำงานและเก็บผลลัพธ์ (Test Results)',
  ]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [images, setImages] = useState<ImageAttachment[]>([]);

  // AI Prompt & Loading state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubtasksAiLoading, setIsSubtasksAiLoading] = useState(false);

  const docInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Function to call AI task generator
  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: aiPrompt,
          projectContext: {
            name: project.name,
            code: project.code,
            milestones: project.milestones,
          },
          categories,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'AI generation failed');
      }

      if (data.task) {
        if (data.task.title) setTitle(data.task.title);
        if (data.task.description) setDescription(data.task.description);
        if (data.task.priority) setPriority(data.task.priority);
        if (data.task.category) {
          const matched = categories.find((c) => c.name.toLowerCase() === data.task.category.toLowerCase())
            || categories.find((c) => c.name.includes(data.task.category))
            || categories[0];
          if (matched) setCategory(matched.name);
        }
        if (Array.isArray(data.task.subTasks) && data.task.subTasks.length > 0) {
          setInitialSubtasks(data.task.subTasks.map((s: any) => s.title));
        }
      }
    } catch (err: any) {
      alert(`ขออภัย: ${err.message || 'ไม่สามารถสร้างงานด้วย AI ได้'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Function to call AI for subtask expansion
  const handleAutoSubtasksWithAi = async () => {
    if (!title.trim() || isSubtasksAiLoading) {
      alert('กรุณาระบุชื่องานก่อนเพื่อให้ AI แตกรายการย่อยได้อย่างแม่นยำครับ');
      return;
    }
    setIsSubtasksAiLoading(true);
    try {
      const res = await fetch('/api/ai/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
        }),
      });

      const data = await res.json();
      if (Array.isArray(data.subTasks) && data.subTasks.length > 0) {
        setInitialSubtasks(data.subTasks.map((s: any) => s.title));
      }
    } catch (err: any) {
      alert(`ไม่สามารถแตกงานย่อยด้วย AI: ${err.message}`);
    } finally {
      setIsSubtasksAiLoading(false);
    }
  };

  const handleAttachDocs = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const doc: DocumentAttachment = {
          id: 'doc-new-' + Date.now() + '-' + idx,
          name: file.name,
          fileType: detectFileType(file.name),
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentMember.name,
          contentData: e.target?.result as string,
        };
        setDocuments((prev) => [...prev, doc]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAttachImages = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img: ImageAttachment = {
          id: 'img-new-' + Date.now() + '-' + idx,
          name: file.name,
          url: e.target?.result as string,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentMember.name,
          caption: 'ภาพแนบเริ่มต้นพร้อมการสร้างงาน',
        };
        setImages((prev) => [...prev, img]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignee = members.find((m) => m.id === assigneeId) || members[0];
    const codePrefix = project.code.split('-')[0] || 'PRJ';
    const taskCode = `${codePrefix}-T${String(nextTaskNumber).padStart(2, '0')}`;

    const selectedMilestone = project.milestones?.find((m) => m.id === milestoneId);

    const generatedSubtasks: SubTaskItem[] = initialSubtasks
      .filter((text) => text.trim().length > 0)
      .map((text, idx) => ({
        id: `sub-${Date.now()}-${idx + 1}`,
        itemNo: `${idx + 1}`,
        title: text.trim(),
        status: 'todo',
        progress: 0,
        weight: Math.round(100 / Math.max(1, initialSubtasks.length)),
      }));

    const newTask: Task = {
      id: 'task-' + Date.now(),
      code: taskCode,
      title: title.trim(),
      description: description.trim() || 'ไม่มีคำอธิบายเพิ่มเติม',
      projectId: project.id,
      projectName: project.name,
      milestoneId: selectedMilestone ? selectedMilestone.id : undefined,
      milestoneName: selectedMilestone ? `${selectedMilestone.code}: ${selectedMilestone.title}` : undefined,
      status: 'todo',
      priority,
      assignee,
      reporter: currentMember,
      startDate: new Date().toISOString().split('T')[0],
      dueDate,
      progress: 0,
      category,
      subTasks: generatedSubtasks,
      documents,
      images,
      activities: [
        {
          id: 'act-' + Date.now(),
          taskId: 'task-' + Date.now(),
          user: currentMember,
          action: 'สร้างงานโครงการใหม่ในระบบ',
          timestamp: new Date().toISOString(),
          type: 'status',
        },
      ],
    };

    onAddTask(newTask);
    onClose();
  };

  return (
    <div 
      id="new-task-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="new-task-modal"
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              สร้างงานโครงการใหม่
            </h3>
            <p className="text-xs text-slate-500">
              สำหรับ {project.name}
            </p>
          </div>
          <button
            id="new-task-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* AI Task Generator Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/90 via-violet-50/80 to-indigo-50/90 border border-indigo-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>ให้ AI ช่วยวิเคราะห์และร่างงานอัตโนมัติ (SW / HW WBS)</span>
              </label>
              <span className="text-[10px] font-semibold text-indigo-600 bg-white/80 px-2 py-0.5 rounded-full border border-indigo-200">
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mb-2">
              พิมพ์เป้าหมายงานสั้นๆ ระบบจะช่วยคิดชื่องาน, จำแนกหมวดหมู่ (SW/HW), กำหนดระดับความสำคัญ และแตกรายการงานย่อยให้ทันที
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="เช่น ออกแบบวงจรบอร์ดเซนเซอร์วัดกระแสและเขียน Firmware Modbus..."
                className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-xs text-slate-800 outline-none focus:border-indigo-600 shadow-2xs"
                disabled={isAiLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerateWithAi();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleGenerateWithAi}
                disabled={!aiPrompt.trim() || isAiLoading}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังคิด...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>สร้างด้วย AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่องาน / รายการปฏิบัติการ *
            </label>
            <input
              id="new-task-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ออกแบบวงจร PCB ภาคจ่ายไฟ, พัฒนา API Webhook เชื่อมต่อ Cloud"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Category & Priority & Milestone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  งวดงานสัญญา (Milestone)
                </label>
                {onOpenManageMilestones && (
                  <button
                    type="button"
                    onClick={onOpenManageMilestones}
                    className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    + กำหนดงวดงาน
                  </button>
                )}
              </div>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white outline-none font-medium text-slate-800 text-xs"
              >
                <option value="">-- ไม่ระบุงวดงาน --</option>
                {project.milestones?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.percentage}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  หมวดหมู่งาน (Category)
                </label>
                {onOpenManageCategories && (
                  <button
                    type="button"
                    onClick={onOpenManageCategories}
                    className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
                  >
                    + แก้ไขหมวดหมู่
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white outline-none text-xs font-medium"
              >
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="งานฐานรากและโครงสร้าง">งานฐานรากและโครงสร้าง</option>
                    <option value="งานสถาปัตยกรรม">งานสถาปัตยกรรม</option>
                    <option value="งานระบบไฟฟ้า (MEP)">งานระบบไฟฟ้า (MEP)</option>
                    <option value="งานระบบสุขาภิบาล">งานระบบสุขาภิบาล</option>
                    <option value="งานระบบปรับอากาศ (HVAC)">งานระบบปรับอากาศ (HVAC)</option>
                    <option value="งานความปลอดภัย & QC">งานความปลอดภัย & QC</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระดับความสำคัญ
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white outline-none font-medium"
              >
                <option value="low">ปกติ (Low)</option>
                <option value="medium">ปานกลาง (Medium)</option>
                <option value="high">สำคัญสูง (High)</option>
                <option value="urgent">เร่งด่วนที่สุด (Urgent)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ผู้รับผิดชอบงาน
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                กำหนดส่งมอบ (Due Date)
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white outline-none"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดและเกณฑ์การตรวจรับ
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุข้อกำหนดเฉพาะ สเปกวัสดุ หรือข้อควรระวังในการปฏิบัติงาน..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Subtasks / Checklist Items */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-indigo-600" />
                <span>รายละเอียดย่อยเป็นข้อๆ ในงวดนี้ (Sub-items สำหรับติดตามผล)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoSubtasksWithAi}
                  disabled={isSubtasksAiLoading || !title.trim()}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{isSubtasksAiLoading ? 'กำลังแตกงานย่อย...' : '✨ AI แตกงานย่อย'}</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  {initialSubtasks.length} ข้อ
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-2.5">
              {initialSubtasks.map((st, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={st}
                    onChange={(e) => {
                      const updated = [...initialSubtasks];
                      updated[index] = e.target.value;
                      setInitialSubtasks(updated);
                    }}
                    placeholder={`ข้อย่อยที่ ${index + 1}`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setInitialSubtasks(initialSubtasks.filter((_, i) => i !== index))}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add more subtask */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newSubtaskInput.trim()) {
                      setInitialSubtasks([...initialSubtasks, newSubtaskInput.trim()]);
                      setNewSubtaskInput('');
                    }
                  }
                }}
                placeholder="พิมพ์รายละเอียดย่อยใหม่แล้วกด Enter หรือคลิกเพิ่ม..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (newSubtaskInput.trim()) {
                    setInitialSubtasks([...initialSubtasks, newSubtaskInput.trim()]);
                    setNewSubtaskInput('');
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มข้อ</span>
              </button>
            </div>
          </div>

          {/* Quick Attachments Section */}
          <div className="pt-2 border-t border-slate-200">
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              แนบไฟล์เอกสารและภาพถ่ายประกอบงานทันที
            </span>
            <div className="flex flex-wrap gap-2">
              <input
                ref={docInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.zip,.txt"
                className="hidden"
                onChange={(e) => handleAttachDocs(e.target.files)}
              />
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <FileText className="w-4 h-4 text-purple-600" />
                <span>แนบเอกสาร ({documents.length})</span>
              </button>

              <input
                ref={imgInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAttachImages(e.target.files)}
              />
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>แนบรูปภาพ ({images.length})</span>
              </button>
            </div>

            {/* Thumbnail previews */}
            {(documents.length > 0 || images.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-dashed border-slate-200">
                {documents.map((d, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-purple-50 text-purple-800 text-[11px] font-medium border border-purple-200 truncate max-w-xs">
                    📄 {d.name}
                  </span>
                ))}
                {images.map((img, i) => (
                  <div key={i} className="w-10 h-10 rounded border border-slate-200 overflow-hidden">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              id="submit-new-task-btn"
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              บันทึกสร้างงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
