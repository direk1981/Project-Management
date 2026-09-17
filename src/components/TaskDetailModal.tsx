import React, { useState, useRef } from 'react';
import { 
  Task, 
  DocumentAttachment, 
  ImageAttachment, 
  TaskStatus, 
  TaskPriority,
  TeamMember,
  TaskActivity,
  SubTaskItem,
  TaskCategory
} from '../types';
import { 
  X, 
  Download, 
  Upload, 
  Camera, 
  FileText, 
  FileSpreadsheet, 
  FileCheck, 
  FileArchive, 
  File, 
  Trash2, 
  Eye, 
  Clock, 
  Calendar, 
  User, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  Sparkles,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Maximize2,
  ListChecks,
  Circle,
  Plus,
  Bot,
  Wand2,
  RefreshCw
} from 'lucide-react';
import { 
  formatFileSize, 
  formatThaiDate, 
  formatSimpleDate, 
  triggerFileDownload, 
  triggerImageDownload,
  detectFileType 
} from '../utils/fileUtils';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (updatedTask: Task) => void;
  onOpenLightbox: (image: ImageAttachment) => void;
  currentMember: TeamMember;
  categories?: TaskCategory[];
  onOpenManageCategories?: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onUpdateTask,
  onOpenLightbox,
  currentMember,
  categories,
  onOpenManageCategories,
}) => {
  if (!task) return null;

  const [activeTab, setActiveTab] = useState<'subtasks' | 'attachments' | 'info' | 'activity'>('subtasks');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageCaptionInput, setImageCaptionInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [recentNotification, setRecentNotification] = useState<string | null>(null);

  // Sub-tasks creation state
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newSubTaskItemNo, setNewSubTaskItemNo] = useState('');
  const [newSubTaskWeight, setNewSubTaskWeight] = useState(25);

  // AI Inspection & AI Subtask states
  const [selectedImageForAi, setSelectedImageForAi] = useState<ImageAttachment | null>(null);
  const [aiInspectionResult, setAiInspectionResult] = useState<string | null>(null);
  const [isAiInspecting, setIsAiInspecting] = useState(false);
  const [isGeneratingSubtasksWithAi, setIsGeneratingSubtasksWithAi] = useState(false);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setRecentNotification(msg);
    setTimeout(() => setRecentNotification(null), 3500);
  };

  // AI Subtask Breakdown handler
  const handleGenerateSubtasksWithAi = async () => {
    setIsGeneratingSubtasksWithAi(true);
    try {
      const res = await fetch('/api/ai/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          category: task.category,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'AI subtasks failed');
      }

      if (Array.isArray(data.subTasks) && data.subTasks.length > 0) {
        const existingCount = task.subTasks?.length || 0;
        const newItems: SubTaskItem[] = data.subTasks.map((s: any, idx: number) => ({
          id: `sub-${Date.now()}-${idx}`,
          itemNo: `${task.code}.${existingCount + idx + 1}`,
          title: s.title,
          status: 'todo',
          progress: 0,
          weight: Number(s.weight) || Math.floor(100 / data.subTasks.length),
          assigneeName: currentMember.name,
        }));

        const updatedSubTasks = [...(task.subTasks || []), ...newItems];
        const { progress: newProgress, status: newStatus } = recalcSubTaskProgress(updatedSubTasks);

        const updatedTask: Task = {
          ...task,
          subTasks: updatedSubTasks,
          progress: newProgress,
          status: newStatus,
          activities: [
            {
              id: 'act-' + Date.now(),
              taskId: task.id,
              user: currentMember,
              action: `ใช้ AI แตกรายการย่อยอัตโนมัติเพิ่ม ${newItems.length} ข้อ`,
              timestamp: new Date().toISOString(),
              type: 'status',
            },
            ...(task.activities || []),
          ],
        };

        onUpdateTask(updatedTask);
        showNotification(`✨ AI แตกรายการย่อยสำเร็จ เพิ่ม ${newItems.length} ขั้นตอน`);
      }
    } catch (err: any) {
      alert(`ไม่สามารถแตกงานย่อยด้วย AI ได้: ${err.message}`);
    } finally {
      setIsGeneratingSubtasksWithAi(false);
    }
  };

  // AI Photo Inspection Handler
  const handleInspectImageWithAi = async (image: ImageAttachment) => {
    setSelectedImageForAi(image);
    setAiInspectionResult(null);
    setIsAiInspecting(true);

    try {
      let base64Data = image.url;
      if (image.url.startsWith('http')) {
        try {
          const resp = await fetch(image.url);
          const blob = await resp.blob();
          const reader = new FileReader();
          base64Data = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {
          base64Data = image.url;
        }
      }

      const res = await fetch('/api/ai/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
          taskTitle: task.title,
          context: `หมวดหมู่งาน: ${task.category}, คำอธิบายภาพ: ${image.caption || image.name}, ความคืบหน้ารวม: ${task.progress}%`,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'AI Photo analysis failed');
      }
      setAiInspectionResult(data.analysis);
    } catch (err: any) {
      setAiInspectionResult(`ขออภัย ระบบไม่สามารถวิเคราะห์ภาพได้ในขณะนี้: ${err.message}`);
    } finally {
      setIsAiInspecting(false);
    }
  };

  // Recalculate progress based on subtasks
  const recalcSubTaskProgress = (subTasks: SubTaskItem[]) => {
    if (!subTasks || subTasks.length === 0) return { progress: task.progress, status: task.status };
    let totalWeight = 0;
    let weightedProgress = 0;
    let allCompleted = true;
    let anyInProgress = false;

    subTasks.forEach((s) => {
      const w = s.weight || 10;
      totalWeight += w;
      weightedProgress += (s.progress || 0) * w;
      if (s.status !== 'completed') allCompleted = false;
      if (s.status === 'in_progress') anyInProgress = true;
    });

    const newProg = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
    let newStatus = task.status;
    if (allCompleted || newProg === 100) newStatus = 'completed';
    else if (anyInProgress || newProg > 0) newStatus = 'in_progress';

    return { progress: newProg, status: newStatus };
  };

  // SubTask Status Change
  const handleSubTaskStatusToggle = (subTaskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    handleSubTaskStatusUpdate(subTaskId, nextStatus);
  };

  const handleSubTaskStatusUpdate = (subTaskId: string, newStatus: TaskStatus) => {
    const currentSubs = task.subTasks || [];
    const updatedSubs = currentSubs.map((st) => {
      if (st.id !== subTaskId) return st;
      const prog = newStatus === 'completed' ? 100 : newStatus === 'todo' ? 0 : st.progress === 0 ? 50 : st.progress;
      return {
        ...st,
        status: newStatus,
        progress: prog,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
      };
    });

    const { progress: newProg, status: newStatusCalculated } = recalcSubTaskProgress(updatedSubs);
    const updatedTask: Task = {
      ...task,
      subTasks: updatedSubs,
      progress: newProg,
      status: newStatusCalculated,
    };
    onUpdateTask(updatedTask);
    showNotification('อัปเดตสถานะรายการย่อยเรียบร้อย');
  };

  const handleSubTaskProgressUpdate = (subTaskId: string, newProg: number) => {
    const currentSubs = task.subTasks || [];
    const updatedSubs = currentSubs.map((st) => {
      if (st.id !== subTaskId) return st;
      let stStatus = st.status;
      if (newProg === 100) stStatus = 'completed';
      else if (newProg > 0 && stStatus === 'todo') stStatus = 'in_progress';
      return { ...st, progress: newProg, status: stStatus };
    });

    const { progress: calculatedProg, status: calculatedStatus } = recalcSubTaskProgress(updatedSubs);
    onUpdateTask({
      ...task,
      subTasks: updatedSubs,
      progress: calculatedProg,
      status: calculatedStatus,
    });
  };

  const handleDeleteSubTaskItem = (subTaskId: string) => {
    const currentSubs = task.subTasks || [];
    const updatedSubs = currentSubs.filter((st) => st.id !== subTaskId);
    const { progress: calculatedProg, status: calculatedStatus } = recalcSubTaskProgress(updatedSubs);
    onUpdateTask({
      ...task,
      subTasks: updatedSubs,
      progress: calculatedProg,
      status: calculatedStatus,
    });
    showNotification('ลบรายการย่อยแล้ว');
  };

  const handleAddSubTaskItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTaskTitle.trim()) return;

    const currentSubs = task.subTasks || [];
    const itemNo = newSubTaskItemNo.trim() || `${task.code}.${currentSubs.length + 1}`;

    const newSub: SubTaskItem = {
      id: 'sub-' + Date.now(),
      itemNo,
      title: newSubTaskTitle.trim(),
      status: 'todo',
      progress: 0,
      weight: Number(newSubTaskWeight) || 20,
      assigneeName: task.assignee.name,
      dueDate: task.dueDate,
    };

    const updatedSubs = [...currentSubs, newSub];
    const { progress: calculatedProg, status: calculatedStatus } = recalcSubTaskProgress(updatedSubs);

    onUpdateTask({
      ...task,
      subTasks: updatedSubs,
      progress: calculatedProg,
      status: calculatedStatus,
    });

    setNewSubTaskTitle('');
    setNewSubTaskItemNo('');
    setIsAddingSubTask(false);
    showNotification('เพิ่มรายการย่อยในงวดงานสำเร็จ');
  };

  // Status Change Handler
  const handleStatusChange = (newStatus: TaskStatus) => {
    const statusLabels: Record<TaskStatus, string> = {
      todo: 'รอดำเนินการ',
      in_progress: 'กำลังดำเนินการ',
      under_review: 'รอตรวจสอบ',
      completed: 'เสร็จสมบูรณ์',
      delayed: 'ล่าช้ากว่าแผน',
    };

    const newActivity: TaskActivity = {
      id: 'act-' + Date.now(),
      taskId: task.id,
      user: currentMember,
      action: `เปลี่ยนสถานะเป็น "${statusLabels[newStatus]}"`,
      timestamp: new Date().toISOString(),
      type: 'status',
    };

    const updated: Task = {
      ...task,
      status: newStatus,
      progress: newStatus === 'completed' ? 100 : task.progress,
      activities: [newActivity, ...task.activities],
    };

    onUpdateTask(updated);
    showNotification(`อัปเดตสถานะเป็น "${statusLabels[newStatus]}" แล้ว`);
  };

  // Progress Change Handler
  const handleProgressChange = (newProgress: number) => {
    let newStatus = task.status;
    if (newProgress === 100) {
      newStatus = 'completed';
    } else if (newProgress > 0 && task.status === 'todo') {
      newStatus = 'in_progress';
    }

    const updated: Task = {
      ...task,
      progress: newProgress,
      status: newStatus,
    };
    onUpdateTask(updated);
  };

  // Real-time Photo Upload Handler (Handles single or multiple files)
  const processImageFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setUploadProgress(20);

    const fileList = Array.from(files);
    let completedCount = 0;
    const newImages: ImageAttachment[] = [];
    const newActivities: TaskActivity[] = [];

    fileList.forEach((file, index) => {
      // Validate image
      if (!file.type.startsWith('image/')) {
        alert(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ กรุณาเลือกไฟล์ภาพ เช่น JPG, PNG`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        const newImg: ImageAttachment = {
          id: 'img-' + Date.now() + '-' + index,
          name: file.name,
          url: resultUrl,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentMember.name,
          caption: imageCaptionInput.trim() || `ภาพหน้างานบันทึกเมื่อ ${new Date().toLocaleTimeString('th-TH')}`,
          latLng: '13.7563° N, 100.5018° E (ไซต์งาน)',
        };

        newImages.push(newImg);

        newActivities.push({
          id: 'act-' + Date.now() + '-' + index,
          taskId: task.id,
          user: currentMember,
          action: `แนบรูปภาพหน้างานจริง: ${file.name}`,
          timestamp: new Date().toISOString(),
          type: 'image_upload',
          commentText: imageCaptionInput.trim() || undefined,
          attachedImageUrl: resultUrl,
        });

        completedCount++;
        setUploadProgress(Math.round((completedCount / fileList.length) * 100));

        if (completedCount === fileList.length) {
          setTimeout(() => {
            const updated: Task = {
              ...task,
              images: [...newImages, ...task.images],
              activities: [...newActivities, ...task.activities],
            };
            onUpdateTask(updated);
            setIsUploadingImage(false);
            setUploadProgress(0);
            setImageCaptionInput('');
            showNotification(`แนบรูปภาพใหม่สำเร็จ ${newImages.length} รูป (ซิงค์เรียลไทม์แล้ว)`);
          }, 400);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  // Real-time Document Upload Handler
  const processDocFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newDocs: DocumentAttachment[] = [];
    const newActivities: TaskActivity[] = [];

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newDoc: DocumentAttachment = {
          id: 'doc-' + Date.now() + '-' + index,
          name: file.name,
          fileType: detectFileType(file.name),
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentMember.name,
          contentData: dataUrl,
        };

        newDocs.push(newDoc);
        newActivities.push({
          id: 'act-' + Date.now() + '-doc-' + index,
          taskId: task.id,
          user: currentMember,
          action: `อัปโหลดไฟล์เอกสาร: ${file.name}`,
          timestamp: new Date().toISOString(),
          type: 'doc_upload',
        });

        if (newDocs.length === fileList.length) {
          const updated: Task = {
            ...task,
            documents: [...newDocs, ...task.documents],
            activities: [...newActivities, ...task.activities],
          };
          onUpdateTask(updated);
          showNotification(`อัปโหลดเอกสาร ${newDocs.length} ไฟล์ พร้อมให้ดาวน์โหลดแล้ว`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Delete Image
  const handleDeleteImage = (imgId: string) => {
    if (!confirm('ต้องการลบภาพนี้ออกจากงานหรือไม่?')) return;
    const updated: Task = {
      ...task,
      images: task.images.filter((img) => img.id !== imgId),
    };
    onUpdateTask(updated);
    showNotification('ลบรูปภาพเรียบร้อยแล้ว');
  };

  // Delete Document
  const handleDeleteDoc = (docId: string) => {
    if (!confirm('ต้องการลบไฟล์เอกสารนี้หรือไม่?')) return;
    const updated: Task = {
      ...task,
      documents: task.documents.filter((doc) => doc.id !== docId),
    };
    onUpdateTask(updated);
    showNotification('ลบเอกสารเรียบร้อยแล้ว');
  };

  // Submit comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newActivity: TaskActivity = {
      id: 'act-' + Date.now(),
      taskId: task.id,
      user: currentMember,
      action: 'เพิ่มบันทึกรายงานความคืบหน้า',
      timestamp: new Date().toISOString(),
      type: 'comment',
      commentText: commentInput.trim(),
    };

    const updated: Task = {
      ...task,
      activities: [newActivity, ...task.activities],
    };

    onUpdateTask(updated);
    setCommentInput('');
    showNotification('บันทึกรายงานเรียลไทม์สำเร็จ');
  };

  // Helper for document icon
  const getDocIcon = (type: DocumentAttachment['fileType']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'zip':
        return <FileArchive className="w-5 h-5 text-amber-600" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  };

  const priorityLabels = {
    low: 'ปกติ (Low)',
    medium: 'ปานกลาง (Medium)',
    high: 'สำคัญสูง (High)',
    urgent: 'เร่งด่วนที่สุด (Urgent)',
  };

  return (
    <div 
      id="task-detail-backdrop"
      className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="task-detail-modal"
        className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Real-time sync notification badge */}
        {recentNotification && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {recentNotification}
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 tracking-wider">
                {task.code}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-medium">
                {task.category}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-md border ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                {task.projectName}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {task.title}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-3">
            {/* Status Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
              <label htmlFor="task-status-select" className="text-[11px] font-semibold text-slate-500 px-2 hidden sm:block">
                สถานะ:
              </label>
              <select
                id="task-status-select"
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="text-xs font-semibold py-1 px-2.5 rounded-lg bg-slate-100 border-none outline-none text-slate-800 cursor-pointer"
              >
                <option value="todo">⚪ รอดำเนินการ (To Do)</option>
                <option value="in_progress">🔵 กำลังทำ (In Progress)</option>
                <option value="under_review">🟡 รอตรวจสอบ (Under Review)</option>
                <option value="completed">🟢 เสร็จสมบูรณ์ (Completed)</option>
              </select>
            </div>

            <button
              id="close-task-detail-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation for mobile & quick view */}
        <div className="flex items-center justify-between px-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('subtasks')}
              className={`py-3 relative flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'subtasks'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>รายการย่อย/เช็กลิสต์ในงวด</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {task.subTasks?.length || 0} ข้อ
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`py-3 relative flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'attachments'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>เอกสาร & ภาพถ่ายเรียลไทม์</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                {task.documents.length + task.images.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-3 relative flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'info'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>รายละเอียดงาน</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`py-3 relative flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>บันทึกความเคลื่อนไหว</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-slate-100 text-slate-600">
                {task.activities.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>บันทึกและซิงค์ทันที</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 0: SUB-TASKS BREAKDOWN (รายละเอียดย่อยในงวดงาน) */}
          {activeTab === 'subtasks' && (
            <div className="space-y-6">
              {/* Header card with Milestone info */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">
                      {task.milestoneName || 'งวดที่ 1'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">รหัส WBS: {task.code}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ตรวจสอบและอัปเดตความคืบหน้าทีละข้อ เมื่อติ๊กเสร็จครบระบบจะคำนวณค่าน้ำหนักความคืบหน้าของงวดงานนี้ให้อัตโนมัติ
                  </p>
                </div>

                {/* Progress Circle & Metrics */}
                <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/80 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">ความคืบหน้ารวม</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono">{task.progress}%</div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-slate-700 flex items-center justify-center relative">
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-emerald-400 transition-all"
                      style={{ clipPath: `polygon(0 0, 100% 0, 100% ${task.progress}%, 0 ${task.progress}%)` }}
                    ></div>
                    <span className="text-xs font-bold text-white font-mono">{task.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Action bar for subtasks */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <ListChecks className="w-4 h-4 text-indigo-600" />
                  <span>
                    รายการตรวจสอบและขั้นตอนย่อย ({task.subTasks?.filter(s => s.status === 'completed').length || 0}/
                    {task.subTasks?.length || 0} ข้อเสร็จสิ้น)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateSubtasksWithAi}
                    disabled={isGeneratingSubtasksWithAi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingSubtasksWithAi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังแตกงานย่อย...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>✨ AI ช่วยแตกงานย่อย</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingSubTask(!isAddingSubTask)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มรายการย่อยใหม่</span>
                  </button>
                </div>
              </div>

              {/* Inline Form to add subtask */}
              {isAddingSubTask && (
                <form onSubmit={handleAddSubTaskItem} className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                  <div className="font-semibold text-xs text-indigo-900">
                    ➕ เพิ่มหัวข้อย่อยและรายละเอียดงานในงวดนี้
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-500 font-medium block mb-1">ลำดับข้อ</label>
                      <input
                        type="text"
                        value={newSubTaskItemNo}
                        onChange={(e) => setNewSubTaskItemNo(e.target.value)}
                        placeholder={`${task.code}.${(task.subTasks?.length || 0) + 1}`}
                        className="w-full text-xs font-mono p-2 rounded-lg bg-white border border-slate-300 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <label className="text-[11px] text-slate-500 font-medium block mb-1">รายละเอียดงาน</label>
                      <input
                        type="text"
                        value={newSubTaskTitle}
                        onChange={(e) => setNewSubTaskTitle(e.target.value)}
                        placeholder="เช่น ตรวจสอบความถูกต้องของเหล็กเสริม, ทดสอบ Slump test..."
                        className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 outline-none focus:border-indigo-500 font-medium"
                        autoFocus
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] text-slate-500 font-medium block mb-1">ค่าน้ำหนัก (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newSubTaskWeight}
                        onChange={(e) => setNewSubTaskWeight(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingSubTask(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={!newSubTaskTitle.trim()}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      บันทึกรายการ
                    </button>
                  </div>
                </form>
              )}

              {/* Sub-tasks list */}
              {task.subTasks && task.subTasks.length > 0 ? (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  {task.subTasks.map((subItem) => {
                    const isDone = subItem.status === 'completed';
                    return (
                      <div
                        key={subItem.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          isDone ? 'bg-emerald-50/20' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Checkbox + Title */}
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleSubTaskStatusToggle(subItem.id, subItem.status)}
                            className="mt-0.5 sm:mt-0 cursor-pointer transition-transform active:scale-90"
                            title={isDone ? 'คลิกเพื่อเปลี่ยนกลับ' : 'คลิกเพื่อทำเครื่องหมายว่าเสร็จสิ้น'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {subItem.itemNo}
                              </span>
                              <span
                                className={`text-xs sm:text-sm font-semibold ${
                                  isDone ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {subItem.title}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                                น้ำหนัก {subItem.weight || 20}%
                              </span>
                            </div>
                            {subItem.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{subItem.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Controls: Status, Progress, and Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {/* Status select */}
                          <select
                            value={subItem.status}
                            onChange={(e) => handleSubTaskStatusUpdate(subItem.id, e.target.value as TaskStatus)}
                            className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer outline-none"
                          >
                            <option value="todo">⚪ รอดำเนินการ</option>
                            <option value="in_progress">🔵 กำลังทำ</option>
                            <option value="under_review">🟡 รอตรวจ/QC</option>
                            <option value="completed">🟢 เสร็จสมบูรณ์</option>
                            <option value="delayed">🔴 ล่าช้า</option>
                          </select>

                          {/* Progress % */}
                          <select
                            value={subItem.progress}
                            onChange={(e) => handleSubTaskProgressUpdate(subItem.id, Number(e.target.value))}
                            className="text-xs font-mono font-medium py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
                          >
                            <option value={0}>0%</option>
                            <option value={25}>25%</option>
                            <option value={50}>50%</option>
                            <option value={75}>75%</option>
                            <option value={100}>100%</option>
                          </select>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSubTaskItem(subItem.id)}
                            className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="ลบรายการย่อยนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50/70 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
                  <p>ยังไม่มีรายการย่อยในงานนี้</p>
                  <button
                    type="button"
                    onClick={() => setIsAddingSubTask(true)}
                    className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>คลิกที่นี่เพื่อเพิ่มรายการย่อยข้อแรก</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: ATTACHMENTS (DOCUMENTS + REALTIME PHOTOS) */}
          {activeTab === 'attachments' && (
            <div className="space-y-8">
              {/* SECTION A: REALTIME FIELD PHOTOS (แนบรูปภาพประกอบแบบเรียลไทม์) */}
              <div id="realtime-photo-section" className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-base font-bold text-slate-900">
                        ภาพถ่ายหน้างานประกอบงาน (แนบสดแบบเรียลไทม์)
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                        {task.images.length} รูปภาพ
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ถ่ายทอดความคืบหน้า ตรวจสอบจุดสำคัญ หรือบันทึกปัญหาหน้างานพร้อมพิกัดและเวลา
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => e.target.files && processImageFiles(e.target.files)}
                    />
                    <button
                      id="snap-camera-btn"
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>เปิดกล้องถ่ายภาพ</span>
                    </button>

                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && processImageFiles(e.target.files)}
                    />
                    <button
                      id="upload-image-btn"
                      type="button"
                      onClick={() => imageFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>แนบภาพใหม่</span>
                    </button>
                  </div>
                </div>

                {/* Upload drag & drop zone */}
                <div
                  id="image-dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files) {
                      processImageFiles(e.dataTransfer.files);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    isDragOver 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-slate-300 hover:border-indigo-400 bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-medium text-slate-800">
                        ลากรูปภาพมาวางที่นี่ หรือคลิกเพื่ออัปโหลดภาพถ่ายประกอบงาน
                      </p>
                      <p className="text-[11px] text-slate-400">
                        รองรับไฟล์ JPG, PNG, WEBP — แสดงผลทันทีและซิงค์ข้อมูลเรียลไทม์
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <input
                        type="text"
                        placeholder="ระบุคำอธิบายภาพ (ถ้ามี)..."
                        value={imageCaptionInput}
                        onChange={(e) => setImageCaptionInput(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none w-full sm:w-56"
                      />
                      <button
                        type="button"
                        onClick={() => imageFileInputRef.current?.click()}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium shrink-0 cursor-pointer"
                      >
                        เลือกไฟล์
                      </button>
                    </div>
                  </div>

                  {/* Upload Progress Bar */}
                  {isUploadingImage && (
                    <div className="mt-3 pt-3 border-t border-slate-100 max-w-md mx-auto">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1 font-medium">
                        <span>กำลังอัปโหลดและประมวลผลรูปภาพเรียลไทม์...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-time Image Gallery Grid */}
                {task.images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {task.images.map((img) => (
                      <div
                        key={img.id}
                        className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
                      >
                        {/* Image Box */}
                        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                            <button
                              type="button"
                              onClick={() => onOpenLightbox(img)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold backdrop-blur-xs transition-colors"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>ดูรูปเต็ม</span>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                title="ดาวน์โหลดรูปภาพนี้"
                                onClick={() => triggerImageDownload(img)}
                                className="p-1.5 rounded-md bg-white/90 hover:bg-white text-slate-900 text-xs transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="ลบภาพนี้"
                                onClick={() => handleDeleteImage(img.id)}
                                className="p-1.5 rounded-md bg-rose-600/90 hover:bg-rose-600 text-white text-xs transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Image Metadata */}
                        <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                              {img.name}
                            </p>
                            {img.caption && (
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                "{img.caption}"
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleInspectImageWithAi(img)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>AI ตรวจภาพ QC</span>
                            </button>
                            <span className="text-slate-400 text-[10px] shrink-0">
                              {formatThaiDate(img.uploadedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-xl border border-slate-200/60 mt-4">
                    ยังไม่มีรูปภาพประกอบงาน — กดปุ่ม "แนบภาพใหม่" หรือ "เปิดกล้องถ่ายภาพ" เพื่อบันทึกภาพหน้างานแบบเรียลไทม์
                  </div>
                )}
              </div>

              {/* SECTION B: DOCUMENT FILES WITH REAL DOWNLOAD (ดาวน์โหลดไฟล์เอกสารโครงการ) */}
              <div id="project-documents-section" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h3 className="text-base font-bold text-slate-900">
                        ไฟล์เอกสารโครงการ (ดาวน์โหลดและแนบไฟล์)
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {task.documents.length} รายการ
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      แบบแปลนพิมพ์เขียว, สเปกวัสดุ, ใบตรวจรับงวดงาน, รายงานผลทดสอบวิศวกรรม
                    </p>
                  </div>

                  {/* Document upload trigger */}
                  <div>
                    <input
                      ref={docFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.zip,.rar,.txt"
                      className="hidden"
                      onChange={(e) => e.target.files && processDocFiles(e.target.files)}
                    />
                    <button
                      id="upload-doc-btn"
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>แนบไฟล์เอกสารใหม่</span>
                    </button>
                  </div>
                </div>

                {/* Documents List */}
                {task.documents.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {task.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/80">
                            {getDocIcon(doc.fileType)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 truncate">
                              {doc.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="uppercase font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                                {doc.fileType}
                              </span>
                              <span>•</span>
                              <span>{formatFileSize(doc.size)}</span>
                              <span>•</span>
                              <span>อัปโหลดโดย {doc.uploadedBy}</span>
                              <span>•</span>
                              <span>{formatThaiDate(doc.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Download & Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {/* REAL DOWNLOAD BUTTON */}
                          <button
                            id={`download-doc-btn-${doc.id}`}
                            type="button"
                            onClick={() => triggerFileDownload(doc)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-600" />
                            <span>ดาวน์โหลดไฟล์</span>
                          </button>

                          <button
                            type="button"
                            title="ลบเอกสาร"
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-slate-200/60">
                    ยังไม่มีเอกสารแนบในงานนี้ — สามารถกด "แนบไฟล์เอกสารใหม่" เพื่อเพิ่มแบบแปลนหรือรายงาน
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TASK INFO & SCOPE */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left description */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    ขอบเขตงานและรายละเอียด
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed">
                    {task.description}
                  </div>
                </div>

                {/* Progress bar controller */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">
                      ปรับความคืบหน้างานจริง (Real-time Progress)
                    </span>
                    <span className="text-sm font-bold text-indigo-700">
                      {task.progress}%
                    </span>
                  </div>
                  <input
                    id="progress-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={task.progress}
                    onChange={(e) => handleProgressChange(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>0% (ยังไม่เริ่ม)</span>
                    <span>25%</span>
                    <span>50% (ครึ่งทาง)</span>
                    <span>75%</span>
                    <span>100% (เสร็จสมบูรณ์)</span>
                  </div>
                </div>
              </div>

              {/* Right metadata card */}
              <div className="space-y-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  ข้อมูลผู้เกี่ยวข้องและเวลา
                </h4>

                <div>
                  <span className="text-xs text-slate-500 block mb-1">ผู้รับผิดชอบงาน</span>
                  <div className="flex items-center gap-2.5">
                    <img
                      src={task.assignee.avatar}
                      alt={task.assignee.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{task.assignee.name}</div>
                      <div className="text-[11px] text-slate-500">{task.assignee.role}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">ผู้รายงาน / QC</span>
                  <div className="flex items-center gap-2.5">
                    <img
                      src={task.reporter.avatar}
                      alt={task.reporter.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{task.reporter.name}</div>
                      <div className="text-[11px] text-slate-500">{task.reporter.role}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">วันเริ่มงาน:</span>
                    <span className="font-medium text-slate-800">{formatSimpleDate(task.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">กำหนดส่งมอบ:</span>
                    <span className="font-semibold text-rose-700">{formatSimpleDate(task.dueDate)}</span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">หมวดหมู่งาน:</span>
                      {onOpenManageCategories && (
                        <button
                          type="button"
                          onClick={onOpenManageCategories}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                        >
                          แก้ไขหมวดหมู่
                        </button>
                      )}
                    </div>
                    {categories && categories.length > 0 ? (
                      <select
                        value={task.category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          onUpdateTask({ ...task, category: newCat });
                          showNotification(`เปลี่ยนหมวดหมู่งานเป็น "${newCat}" สำเร็จ`);
                        }}
                        className="w-full text-xs font-semibold text-indigo-800 bg-white px-2 py-1 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium text-indigo-700">{task.category}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY TIMELINE & INSTANT COMMENT */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* Add Comment Box */}
              <form onSubmit={handleAddComment} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>บันทึกรายงานหน้างานด่วน (Real-time Site Log)</span>
                </div>
                <textarea
                  id="activity-comment-input"
                  rows={2}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="เขียนรายงานความคืบหน้า ปัญหาที่พบ หรือหมายเหตุการส่งมอบงาน..."
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-200 bg-white focus:border-indigo-400 outline-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400">
                    บันทึกจะปรากฏในไทม์ไลน์ของทีมทันที
                  </span>
                  <button
                    id="submit-comment-btn"
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ส่งรายงาน</span>
                  </button>
                </div>
              </form>

              {/* Timeline list */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ประวัติการอัปเดตและหลักฐานงาน
                </h4>
                <div className="divide-y divide-slate-100">
                  {task.activities.map((act) => (
                    <div key={act.id} className="py-3 flex gap-3">
                      <img
                        src={act.user.avatar}
                        alt={act.user.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900">{act.user.name}</span>
                          <span className="text-slate-400 text-[11px]">
                            {formatThaiDate(act.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">{act.action}</p>
                        {act.commentText && (
                          <div className="p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600 border border-slate-100 mt-1">
                            "{act.commentText}"
                          </div>
                        )}
                        {act.attachedImageUrl && (
                          <div className="mt-2 w-32 h-24 rounded-lg overflow-hidden border border-slate-200">
                            <img
                              src={act.attachedImageUrl}
                              alt="attached thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">รหัสอ้างอิง:</span>
            <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{task.id}</code>
          </div>
          <button
            id="modal-done-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

        {/* AI Photo Inspection Dialog */}
        {selectedImageForAi && (
          <div 
            className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedImageForAi(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/30 text-amber-300">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">ผลวิเคราะห์ภาพถ่ายด้วย AI (QC Inspector)</h4>
                    <p className="text-[11px] text-indigo-200">ประมวลผลโดย Gemini Multimodal Vision</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImageForAi(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Image Preview */}
                <div className="flex gap-3 items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={selectedImageForAi.url}
                    alt={selectedImageForAi.name}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{selectedImageForAi.name}</p>
                    <p className="text-[11px] text-slate-500">สำหรับงาน: {task.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">หมวดหมู่: {task.category}</p>
                  </div>
                </div>

                {/* Analysis Content */}
                {isAiInspecting ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-xs font-semibold text-slate-700">กำลังสแกนภาพและวิเคราะห์มาตรฐานทางวิศวกรรม...</p>
                    <p className="text-[11px] text-slate-400">ระบบกำลังเปรียบเทียบชิ้นงานกับเกณฑ์ตรวจรับงานโครงการ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {aiInspectionResult || 'ไม่มีผลการวิเคราะห์'}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedImageForAi(null)}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs cursor-pointer"
                      >
                        รับทราบผลการวิเคราะห์
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
