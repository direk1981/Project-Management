import React, { useState, useEffect } from 'react';
import { Project, Milestone } from '../types';
import { 
  X, 
  Layers, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  AlertCircle, 
  Calendar, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal,
  FileSpreadsheet,
  Save,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatSimpleDate } from '../utils/fileUtils';

interface ManageMilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateMilestones: (projectId: string, newMilestones: Milestone[]) => void;
}

const STATUS_OPTIONS: { id: Milestone['status']; label: string; bg: string; text: string }[] = [
  { id: 'pending', label: 'ยังไม่ถึงกำหนด (Pending)', bg: 'bg-slate-100', text: 'text-slate-700' },
  { id: 'in_progress', label: 'กำลังดำเนินการ (In Progress)', bg: 'bg-blue-50', text: 'text-blue-700' },
  { id: 'ready_for_inspection', label: 'พร้อมตรวจรับงาน (Ready for Inspection)', bg: 'bg-amber-50', text: 'text-amber-800' },
  { id: 'approved', label: 'ตรวจรับผ่านแล้ว (Approved)', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { id: 'paid', label: 'เบิกจ่ายเงินแล้ว (Paid)', bg: 'bg-purple-50', text: 'text-purple-700' },
];

export const ManageMilestonesModal: React.FC<ManageMilestonesModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateMilestones,
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>(project.milestones || []);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [periodNo, setPeriodNo] = useState<number>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [percentage, setPercentage] = useState<number>(20);
  const [amount, setAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<Milestone['status']>('pending');

  useEffect(() => {
    setMilestones(project.milestones || []);
  }, [project]);

  if (!isOpen) return null;

  const totalPercentage = milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);

  const handleStartAdd = () => {
    const nextNo = milestones.length > 0 
      ? Math.max(...milestones.map((m) => m.periodNo || 0)) + 1 
      : 1;
    const remainingPct = Math.max(0, 100 - totalPercentage);

    setPeriodNo(nextNo);
    setName(`งวดที่ ${nextNo}: ส่งมอบงานและตรวจรับ`);
    setDescription('');
    setPercentage(remainingPct > 0 ? remainingPct : 15);
    setAmount('');
    setTargetDate(project.targetEndDate || new Date().toISOString().split('T')[0]);
    setStatus('pending');
    setEditingMilestoneId(null);
    setIsAddingNew(true);
  };

  const handleStartEdit = (m: Milestone) => {
    setEditingMilestoneId(m.id);
    setPeriodNo(m.periodNo || 1);
    setName(m.name);
    setDescription(m.description || '');
    setPercentage(m.percentage);
    setAmount(m.amount || '');
    setTargetDate(m.targetDate);
    setStatus(m.status);
    setIsAddingNew(false);
  };

  const handleCancelForm = () => {
    setIsAddingNew(false);
    setEditingMilestoneId(null);
  };

  const handleSaveMilestoneForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isAddingNew) {
      const newMs: Milestone = {
        id: 'ms-' + Date.now(),
        periodNo,
        name: name.trim(),
        description: description.trim(),
        percentage: Number(percentage) || 0,
        amount: amount.trim(),
        targetDate,
        status,
      };
      const updated = [...milestones, newMs].sort((a, b) => (a.periodNo || 0) - (b.periodNo || 0));
      setMilestones(updated);
      setIsAddingNew(false);
    } else if (editingMilestoneId) {
      const updated = milestones.map((m) => {
        if (m.id !== editingMilestoneId) return m;
        return {
          ...m,
          periodNo,
          name: name.trim(),
          description: description.trim(),
          percentage: Number(percentage) || 0,
          amount: amount.trim(),
          targetDate,
          status,
        };
      }).sort((a, b) => (a.periodNo || 0) - (b.periodNo || 0));
      setMilestones(updated);
      setEditingMilestoneId(null);
    }
  };

  const handleDeleteMilestone = (id: string) => {
    if (milestones.length <= 1) {
      alert('โครงการต้องมีงวดงานอย่างน้อย 1 งวด');
      return;
    }
    if (confirm('คุณต้องการลบงวดงานนี้หรือไม่? งานที่ผูกกับงวดนี้จะถูกยกเลิกการผูกงวด')) {
      setMilestones(milestones.filter((m) => m.id !== id));
    }
  };

  const handleAutoBalance = () => {
    if (milestones.length === 0) return;
    const count = milestones.length;
    const base = Math.floor(100 / count);
    const rem = 100 - base * count;

    const balanced = milestones.map((m, idx) => ({
      ...m,
      percentage: idx === count - 1 ? base + rem : base,
    }));
    setMilestones(balanced);
  };

  const handleSaveAll = () => {
    onUpdateMilestones(project.id, milestones);
    onClose();
  };

  return (
    <div 
      id="manage-milestones-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="manage-milestones-modal-container"
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Layers className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">กำหนดงวดงานสัญญา (Milestones Configuration)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-emerald-200">
                  {project.code}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                เพิ่ม แก้ไข ปรับเปลี่ยนสัดส่วนเปอร์เซ็นต์ ยอดเงิน และเกณฑ์ส่งมอบในแต่ละงวดของ {project.name}
              </p>
            </div>
          </div>
          <button
            id="close-manage-milestones-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Percentage Summary Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">สัดส่วนเปอร์เซ็นต์งวดงานรวม:</span>
                <span className={`text-base font-black ${totalPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {totalPercentage}% / 100%
                </span>
                {totalPercentage === 100 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> รวมครบ 100% ถูกต้อง
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    {totalPercentage < 100 ? `ขาดอีก ${100 - totalPercentage}%` : `เกินอยู่ ${totalPercentage - 100}%`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                >
                  เกลี่ยสัดส่วนเฉลี่ยเท่ากัน
                </button>
                {!isAddingNew && !editingMilestoneId && (
                  <button
                    id="add-milestone-trigger-btn"
                    type="button"
                    onClick={handleStartAdd}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มงวดงาน</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalPercentage === 100
                    ? 'bg-emerald-500'
                    : totalPercentage > 100
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Form for Adding / Editing */}
          {(isAddingNew || editingMilestoneId) && (
            <form onSubmit={handleSaveMilestoneForm} className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>{isAddingNew ? 'เพิ่มงวดงานใหม่' : `แก้ไขงวดงานที่ ${periodNo}`}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    งวดที่ (Period No.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={periodNo}
                    onChange={(e) => setPeriodNo(Number(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่องวดงาน / ขอบเขตงานส่งมอบ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น งวดที่ 1: งานเตรียมการ รังวัด และงานฐานรากใต้ดิน"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สัดส่วน % ของโครงการ <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={percentage}
                      onChange={(e) => setPercentage(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-center text-slate-800 outline-none focus:border-emerald-600"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ยอดเงินงวด (บาท)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 29,000,000 บาท"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    กำหนดส่งมอบงาน
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สถานะงวดงาน
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Milestone['status'])}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium outline-none focus:border-emerald-600"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รายละเอียดเกณฑ์การตรวจรับ / ขอบเขตงานย่อยในงวดนี้
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ระบุเกณฑ์การตรวจรับ เอกสารที่ต้องแนบ หรือรายละเอียดงานในงวด..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  id="save-milestone-form-btn"
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  {isAddingNew ? 'บันทึกงวดงานใหม่' : 'บันทึกการแก้ไขงวดนี้'}
                </button>
              </div>
            </form>
          )}

          {/* Milestone List Table */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
              <span>รายการงวดงานสัญญา ({milestones.length} งวด)</span>
              <span>สถานะ & การดำเนินการ</span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              {milestones.map((m, idx) => {
                const statusStyle = STATUS_OPTIONS.find((s) => s.id === m.status) || STATUS_OPTIONS[0];

                return (
                  <div
                    key={m.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/90 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-emerald-600 leading-none">งวด</span>
                        <span className="text-sm font-black leading-none mt-0.5">{m.periodNo || idx + 1}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {m.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.percentage}%
                          </span>
                          {m.amount && (
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                              <Banknote className="w-3 h-3 text-slate-400" />
                              {m.amount}
                            </span>
                          )}
                        </div>

                        {m.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {m.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            กำหนดส่งมอบ: {formatSimpleDate(m.targetDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label.split(' ')[0]}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(m)}
                          title="แก้ไขงวดงานนี้"
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMilestone(m.id)}
                            title="ลบงวดงานนี้"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {milestones.length} งวดงานสัญญา | สัดส่วนรวม {totalPercentage}%
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              id="save-all-milestones-btn"
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการกำหนดงวดงาน</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
