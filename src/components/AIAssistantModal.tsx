import React, { useState } from 'react';
import { Project, Task, TaskCategory, TeamMember } from '../types';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Code2, 
  Layers, 
  RefreshCw, 
  FileText,
  PlusCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  tasks: Task[];
  categories: TaskCategory[];
  currentMember: TeamMember;
  onAddTask: (newTask: Task) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ProjectSummaryReport {
  overallHealth: 'good' | 'warning' | 'critical';
  summaryHeadline: string;
  swProgress: {
    summary: string;
    keyAchievements: string[];
    concerns: string[];
  };
  hwProgress: {
    summary: string;
    keyAchievements: string[];
    concerns: string[];
  };
  milestoneOutlook: string;
  urgentActions: string[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  project,
  tasks,
  categories,
  currentMember,
  onAddTask,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'report' | 'generator'>('report');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `สวัสดีครับคุณ ${currentMember.name} ผมคือ **AI Project Co-Pilot** ผู้ช่วยจัดการข้อมูลโครงการสำหรับงานด้าน Software (SW) และ Hardware (HW) คุณสามารถถามสรุปสถานะ ตรวจสอบความเสี่ยง หรือให้ผมช่วยร่างงานและวิเคราะห์ข้อมูลโครงการได้เลยครับ`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Executive Report state
  const [report, setReport] = useState<ProjectSummaryReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Generator state
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [generatedTaskPreview, setGeneratedTaskPreview] = useState<any | null>(null);
  const [generatorSuccessMsg, setGeneratorSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Fetch / Refresh Executive Summary Report
  const handleFetchReport = async () => {
    setIsReportLoading(true);
    setReportError(null);
    try {
      const res = await fetch('/api/ai/project-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            name: project.name,
            code: project.code,
            budget: project.budget,
            milestones: project.milestones,
          },
          tasks: tasks.map((t) => ({
            title: t.title,
            category: t.category,
            status: t.status,
            progress: t.progress,
            dueDate: t.dueDate,
            priority: t.priority,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch summary');
      }
      setReport(data.report);
    } catch (err: any) {
      console.error('Report error:', err);
      setReportError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก AI');
    } finally {
      setIsReportLoading(false);
    }
  };

  // 2. Send Chat Query
  const handleSendChat = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          projectContext: {
            name: project.name,
            code: project.code,
            budget: project.budget,
            currentMilestones: project.milestones,
            taskStats: {
              total: tasks.length,
              completed: tasks.filter((t) => t.status === 'completed').length,
              inProgress: tasks.filter((t) => t.status === 'in_progress').length,
              todo: tasks.filter((t) => t.status === 'todo').length,
              swCount: tasks.filter((t) => t.category.includes('Software') || t.category.includes('SW')).length,
              hwCount: tasks.filter((t) => t.category.includes('Hardware') || t.category.includes('HW')).length,
            },
            categories: categories.map((c) => c.name),
          },
          history: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'AI request failed');
      }

      const botMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: `ขออภัยครับ เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถติดต่อ AI Service ได้'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 3. AI Task Generator
  const handleGenerateTask = async () => {
    if (!generatorPrompt.trim() || isGeneratingTask) return;
    setIsGeneratingTask(true);
    setGeneratedTaskPreview(null);
    setGeneratorSuccessMsg(null);

    try {
      const res = await fetch('/api/ai/generate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: generatorPrompt,
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
        throw new Error(data.error || 'Failed to generate task');
      }
      setGeneratedTaskPreview(data.task);
    } catch (err: any) {
      alert(`ไม่สามารถสร้างงานด้วย AI ได้: ${err.message}`);
    } finally {
      setIsGeneratingTask(false);
    }
  };

  // 4. Save Generated Task directly into project
  const handleCommitGeneratedTask = () => {
    if (!generatedTaskPreview) return;

    // Match milestone
    const targetMilestone = project.milestones?.[0] || {
      id: 'ms-1',
      periodNo: 1,
      name: 'งวดที่ 1',
    };

    const taskCount = tasks.length + 1;
    const prefix = generatedTaskPreview.category?.includes('Hardware') || generatedTaskPreview.category?.includes('HW')
      ? 'HW'
      : 'SW';

    const newTask: Task = {
      id: 'task-ai-' + Date.now(),
      code: `${prefix}-${targetMilestone.periodNo}.${taskCount}`,
      title: generatedTaskPreview.title || 'งานใหม่จาก AI',
      description: generatedTaskPreview.description || '',
      projectId: project.id,
      projectName: project.name,
      milestoneId: targetMilestone.id,
      milestoneName: targetMilestone.name,
      status: 'todo',
      priority: generatedTaskPreview.priority || 'medium',
      assignee: currentMember,
      reporter: currentMember,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      progress: 0,
      category: generatedTaskPreview.category || 'งาน Software (SW)',
      subTasks: Array.isArray(generatedTaskPreview.subTasks)
        ? generatedTaskPreview.subTasks.map((sub: any, idx: number) => ({
            id: `sub-ai-${Date.now()}-${idx}`,
            itemNo: `${targetMilestone.periodNo}.${taskCount}.${idx + 1}`,
            title: sub.title || `ขั้นตอนย่อย ${idx + 1}`,
            status: 'pending',
            progress: 0,
            weight: Number(sub.weight) || Math.floor(100 / (generatedTaskPreview.subTasks.length || 1)),
            assigneeName: sub.assigneeRole || currentMember.name,
          }))
        : [],
      documents: [],
      images: [],
      activities: [
        {
          id: 'act-ai-' + Date.now(),
          taskId: 'task-ai-' + Date.now(),
          user: currentMember,
          action: 'สร้างงานใหม่ผ่านระบบผู้ช่วยอัจฉริยะ AI',
          timestamp: new Date().toISOString(),
          type: 'status',
        },
      ],
    };

    onAddTask(newTask);
    setGeneratorSuccessMsg(`เพิ่มงาน "${newTask.title}" เข้าสู่โครงการเรียบร้อยแล้ว!`);
    setGeneratedTaskPreview(null);
    setGeneratorPrompt('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="ai-assistant-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-400 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">ผู้ช่วยอัจฉริยะ AI (AI Project Co-Pilot)</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300">
                วิเคราะห์และจัดการข้อมูลโครงการวิศวกรรม Software (SW) & Hardware (HW)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 pt-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('report');
                if (!report && !isReportLoading) handleFetchReport();
              }}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'report'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>ภาพรวม & วิเคราะห์ความเสี่ยง (Report)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>แชทสอบถามโครงการ (AI Chat)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('generator')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'generator'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>สร้างงานอัตโนมัติ (Task Generator)</span>
            </button>
          </div>

          {activeTab === 'report' && (
            <button
              type="button"
              onClick={handleFetchReport}
              disabled={isReportLoading}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 pb-3 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReportLoading ? 'animate-spin' : ''}`} />
              <span>อัปเดตข้อมูล</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Executive Report */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              {!report && !isReportLoading && !reportError && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600 shadow-xs">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">วิเคราะห์ข้อมูลโครงการด้วย AI</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                    ให้ Gemini AI รวบรวมและวิเคราะห์ภาพรวมงาน Software, Hardware, สถานะงวดงานสัญญา และค้นหาความเสี่ยงเพื่อเสนอแนวทางแก้ไข
                  </p>
                  <button
                    type="button"
                    onClick={handleFetchReport}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>เริ่มวิเคราะห์ข้อมูลโครงการเดี๋ยวนี้</span>
                  </button>
                </div>
              )}

              {isReportLoading && (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">กำลังประมวลผลข้อมูลงาน SW & HW ด้วย Gemini 3.8 Flash...</p>
                  <p className="text-xs text-slate-400">กำลังตรวจสอบสัดส่วนความคืบหน้า, การส่งมอบงวดงาน และจุดคอขวด</p>
                </div>
              )}

              {reportError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              {report && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                    report.overallHealth === 'good'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : report.overallHealth === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}>
                    <div className={`p-2 rounded-lg shrink-0 ${
                      report.overallHealth === 'good'
                        ? 'bg-emerald-100 text-emerald-700'
                        : report.overallHealth === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {report.overallHealth === 'good' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider">สถานะโครงการ:</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                          {report.overallHealth === 'good' ? '🟢 ปกติ (On Track)' : report.overallHealth === 'warning' ? '🟡 ควรเฝ้าระวัง (Needs Attention)' : '🔴 วิกฤต (Critical)'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold mt-1">{report.summaryHeadline}</p>
                    </div>
                  </div>

                  {/* SW & HW Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Software Progress */}
                    <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                        <Code2 className="w-4 h-4 text-indigo-600" />
                        <span>สถานะงาน Software (SW)</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{report.swProgress.summary}</p>
                      
                      {report.swProgress.keyAchievements?.length > 0 && (
                        <div className="space-y-1 text-xs">
                          <span className="font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ผลงานที่สำเร็จ:
                          </span>
                          <ul className="list-disc list-inside text-slate-600 pl-1 space-y-0.5">
                            {report.swProgress.keyAchievements.map((ach, i) => (
                              <li key={i}>{ach}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.swProgress.concerns?.length > 0 && (
                        <div className="space-y-1 text-xs pt-1 border-t border-indigo-100">
                          <span className="font-semibold text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            จุดสังเกต / ข้อกังวล:
                          </span>
                          <ul className="list-disc list-inside text-slate-600 pl-1 space-y-0.5">
                            {report.swProgress.concerns.map((con, i) => (
                              <li key={i}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Hardware Progress */}
                    <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                        <Cpu className="w-4 h-4 text-emerald-600" />
                        <span>สถานะงาน Hardware (HW)</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{report.hwProgress.summary}</p>

                      {report.hwProgress.keyAchievements?.length > 0 && (
                        <div className="space-y-1 text-xs">
                          <span className="font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ผลงานที่สำเร็จ:
                          </span>
                          <ul className="list-disc list-inside text-slate-600 pl-1 space-y-0.5">
                            {report.hwProgress.keyAchievements.map((ach, i) => (
                              <li key={i}>{ach}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.hwProgress.concerns?.length > 0 && (
                        <div className="space-y-1 text-xs pt-1 border-t border-emerald-100">
                          <span className="font-semibold text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            จุดสังเกต / ข้อกังวล:
                          </span>
                          <ul className="list-disc list-inside text-slate-600 pl-1 space-y-0.5">
                            {report.hwProgress.concerns.map((con, i) => (
                              <li key={i}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Milestone Outlook */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <span>การประเมินการส่งมอบงวดงานสัญญา (Milestone Outlook)</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{report.milestoneOutlook}</p>
                  </div>

                  {/* Urgent Recommendations */}
                  {report.urgentActions?.length > 0 && (
                    <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>ข้อเสนอแนะเร่งด่วนสำหรับ PM และ Co-PM</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {report.urgentActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Chat Assistant */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[520px]">
              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="text-[11px] text-slate-400">คำถามแนะนำ:</span>
                <button
                  type="button"
                  onClick={() => handleSendChat('สรุปงาน Hardware (HW) ที่กำลังทำอยู่และมีกำหนดส่งในเดือนนี้')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] transition-colors cursor-pointer"
                >
                  ⚡ สรุปงาน HW ประจำงวดนี้
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('มีงาน Software ตัวไหนที่มีความเสี่ยงจะส่งมอบไม่ทันบ้าง?')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] transition-colors cursor-pointer"
                >
                  ⚠️ เช็คความเสี่ยงงาน SW
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat('ช่วยร่างรายการเอกสารที่ต้องเตรียมตรวจรับงานงวดที่ 2 (PCB & Firmware)')}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] transition-colors cursor-pointer"
                >
                  📋 ร่างเอกสารตรวจรับงวดที่ 2
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-amber-300'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-xs whitespace-pre-wrap'
                            : 'bg-slate-100 text-slate-800 rounded-tl-xs whitespace-pre-wrap border border-slate-200/70 shadow-2xs'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex gap-2.5 max-w-[85%] mr-auto">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center shrink-0 text-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100 text-slate-500 text-xs rounded-tl-xs border border-slate-200 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>AI กำลังวิเคราะห์ข้อมูลโครงการ...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="พิมพ์คำถามเกี่ยวกับงาน SW, HW, กำหนดส่ง หรือการตรวจรับ..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 outline-none"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isChatLoading}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่ง</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Task Generator */}
          {activeTab === 'generator' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>สร้างงานอัจฉริยะ (AI Task Work Breakdown Generator)</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  พิมพ์ความต้องการสั้นๆ เช่น "ต้องการทำบอร์ดวัดอุณหภูมิความชื้นและเขียน Firmware อ่านค่าส่งผ่าน RS-485" ระบบจะจำแนกหมวดหมู่ (SW/HW) ตั้งชื่อ และแตกงานย่อย (Subtasks) พร้อมคำนวณน้ำหนัก % ให้ทันที
                </p>

                <div className="mt-3.5 space-y-2">
                  <textarea
                    rows={3}
                    value={generatorPrompt}
                    onChange={(e) => setGeneratorPrompt(e.target.value)}
                    placeholder="พิมพ์ความต้องการงานที่ต้องการสร้าง..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white outline-none"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setGeneratorPrompt('ออกแบบวงจรบอร์ดอ่านค่าเซนเซอร์ 4-20mA และแปลงเป็น Modbus RTU')}
                        className="text-[11px] text-indigo-700 hover:underline cursor-pointer"
                      >
                        ตัวอย่าง HW
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setGeneratorPrompt('พัฒนา API Webhook รับข้อมูลพิกัด GPS และบันทึกลง TimescaleDB')}
                        className="text-[11px] text-indigo-700 hover:underline cursor-pointer"
                      >
                        ตัวอย่าง SW
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateTask}
                      disabled={!generatorPrompt.trim() || isGeneratingTask}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      {isGeneratingTask ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังคิดวิเคราะห์...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>ให้ AI สร้างโครงสร้างงาน</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {generatorSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{generatorSuccessMsg}</span>
                </div>
              )}

              {/* Generated Task Preview */}
              {generatedTaskPreview && (
                <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          generatedTaskPreview.category?.includes('Hardware') || generatedTaskPreview.category?.includes('HW')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        }`}>
                          {generatedTaskPreview.category}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          ความสำคัญ: {generatedTaskPreview.priority}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{generatedTaskPreview.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={handleCommitGeneratedTask}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>บันทึกงานนี้เข้าโครงการ</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                    {generatedTaskPreview.description}
                  </p>

                  {/* Subtasks Breakdown */}
                  {Array.isArray(generatedTaskPreview.subTasks) && generatedTaskPreview.subTasks.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>รายการงานย่อยที่ AI แตกให้ (Subtasks Breakdown):</span>
                      </h5>
                      <div className="space-y-1.5">
                        {generatedTaskPreview.subTasks.map((sub: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200/70"
                          >
                            <span className="font-medium text-slate-800">
                              {idx + 1}. {sub.title}
                            </span>
                            <div className="flex items-center gap-2">
                              {sub.assigneeRole && (
                                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {sub.assigneeRole}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {sub.weight}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {generatedTaskPreview.technicalNotes && (
                    <div className="text-[11px] text-slate-500 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60">
                      💡 <strong>ข้อแนะนำเชิงเทคนิค:</strong> {generatedTaskPreview.technicalNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>ขับเคลื่อนด้วย Google Gemini API • โครงการ: {project.name}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
