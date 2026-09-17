import React, { useState } from 'react';
import { Project, TeamMember, Milestone } from '../types';
import { 
  X, 
  Building2, 
  User, 
  Users, 
  Calendar, 
  Banknote, 
  Plus, 
  Trash2, 
  UserCheck, 
  Sparkles,
  Layers,
  Phone,
  Mail
} from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (newProject: Project, newMembers?: TeamMember[]) => void;
  existingMembers: TeamMember[];
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  existingMembers,
}) => {
  const currentYear = new Date().getFullYear();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 6);

  const [code, setCode] = useState(`PRJ-${currentYear}-${String(Math.floor(Math.random() * 90) + 10)}`);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [budget, setBudget] = useState('45,000,000 บาท');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetEndDate, setTargetEndDate] = useState(nextMonth.toISOString().split('T')[0]);

  // Selected PM & Co-PMs
  const [selectedPmId, setSelectedPmId] = useState<string>(existingMembers[0]?.id || '');
  const [selectedCoPmIds, setSelectedCoPmIds] = useState<string[]>(
    existingMembers.length > 1 ? [existingMembers[1].id] : []
  );

  // Inline Add New PM modal / form
  const [showAddPmForm, setShowAddPmForm] = useState(false);
  const [newPmName, setNewPmName] = useState('');
  const [newPmEmail, setNewPmEmail] = useState('');
  const [newPmPhone, setNewPmPhone] = useState('');
  const [newPmAvatar, setNewPmAvatar] = useState(DEFAULT_AVATARS[0]);

  // Inline Add New Co-PM modal / form
  const [showAddCoPmForm, setShowAddCoPmForm] = useState(false);
  const [newCoPmName, setNewCoPmName] = useState('');
  const [newCoPmEmail, setNewCoPmEmail] = useState('');
  const [newCoPmPhone, setNewCoPmPhone] = useState('');
  const [newCoPmAvatar, setNewCoPmAvatar] = useState(DEFAULT_AVATARS[1]);

  // Milestone list template
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: 'ms-new-1',
      periodNo: 1,
      name: 'งวดที่ 1: งานเตรียมการ รังวัด และงานวิศวกรรมฐานราก',
      percentage: 30,
      amount: '13,500,000 บาท',
      targetDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      status: 'in_progress',
    },
    {
      id: 'ms-new-2',
      periodNo: 2,
      name: 'งวดที่ 2: งานโครงสร้างหลักและงานระบบวิศวกรรม',
      percentage: 40,
      amount: '18,000,000 บาท',
      targetDate: new Date(Date.now() + 105 * 86400000).toISOString().split('T')[0],
      status: 'pending',
    },
    {
      id: 'ms-new-3',
      periodNo: 3,
      name: 'งวดที่ 3: งานสถาปัตยกรรม ทดสอบระบบ และส่งมอบตรวจรับ',
      percentage: 30,
      amount: '13,500,000 บาท',
      targetDate: nextMonth.toISOString().split('T')[0],
      status: 'pending',
    },
  ]);

  if (!isOpen) return null;

  // Toggle Co-PM selection
  const handleToggleCoPm = (memberId: string) => {
    setSelectedCoPmIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  // Add new milestone row
  const handleAddMilestone = () => {
    const nextNo = milestones.length + 1;
    const newMs: Milestone = {
      id: 'ms-new-' + Date.now(),
      periodNo: nextNo,
      name: `งวดที่ ${nextNo}: งานตามสัญญาและส่งมอบ`,
      percentage: 20,
      amount: '9,000,000 บาท',
      targetDate: targetEndDate,
      status: 'pending',
    };
    setMilestones([...milestones, newMs]);
  };

  const handleRemoveMilestone = (id: string) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCreatedMembers: TeamMember[] = [];

    // Handle new PM created inline
    let actualPm: TeamMember;
    if (showAddPmForm && newPmName.trim()) {
      actualPm = {
        id: 'member-' + Date.now() + '-pm',
        name: newPmName.trim(),
        role: 'Project Manager (PM) / ผู้จัดการโครงการ',
        avatar: newPmAvatar,
        email: newPmEmail.trim() || `pm.${Date.now()}@company.co.th`,
        phone: newPmPhone.trim() || '08x-xxx-xxxx',
      };
      newCreatedMembers.push(actualPm);
    } else {
      actualPm = existingMembers.find((m) => m.id === selectedPmId) || existingMembers[0];
    }

    // Handle new Co-PM created inline
    const actualCoPms: TeamMember[] = [];
    if (showAddCoPmForm && newCoPmName.trim()) {
      const createdCoPm: TeamMember = {
        id: 'member-' + Date.now() + '-copm',
        name: newCoPmName.trim(),
        role: 'Co-Project Manager (Co-PM) / รองผู้จัดการโครงการ',
        avatar: newCoPmAvatar,
        email: newCoPmEmail.trim() || `copm.${Date.now()}@company.co.th`,
        phone: newCoPmPhone.trim() || '08x-xxx-xxxx',
      };
      newCreatedMembers.push(createdCoPm);
      actualCoPms.push(createdCoPm);
    }

    selectedCoPmIds.forEach((id) => {
      const found = existingMembers.find((m) => m.id === id);
      if (found && found.id !== actualPm.id && !actualCoPms.some((c) => c.id === found.id)) {
        actualCoPms.push(found);
      }
    });

    const newProject: Project = {
      id: 'prj-' + Date.now(),
      code: code.trim() || `PRJ-${currentYear}-01`,
      name: name.trim(),
      client: client.trim() || 'หน่วยงานว่าจ้าง / ลูกค้า',
      description: description.trim() || 'โครงการติดตามการปฏิบัติงานก่อสร้างและส่งมอบงวดงาน',
      startDate,
      targetEndDate,
      manager: actualPm,
      coManagers: actualCoPms,
      budget: budget.trim() || '0 บาท',
      milestones,
    };

    onSaveProject(newProject, newCreatedMembers);
    onClose();
  };

  return (
    <div 
      id="new-project-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="new-project-modal-container"
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Building2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">เพิ่มโครงการใหม่</h3>
              <p className="text-xs text-indigo-200">
                สร้างโครงการ กำหนดผู้จัดการโครงการ (PM), รองผู้จัดการ (Co-PM) และงวดงาน
              </p>
            </div>
          </div>
          <button
            id="close-new-project-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Basic Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>ข้อมูลพื้นฐานโครงการ</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสโครงการ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="new-project-code-input"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="เช่น BKK-2026-09"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อโครงการ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="new-project-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="เช่น โครงการก่อสร้างอาคารสำนักงานและศูนย์ข้อมูลอัจฉริยะ"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผู้ว่าจ้าง / เจ้าของโครงการ
                </label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="เช่น การทางพิเศษ / บมจ.พัฒนาอสังหา"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  งบประมาณรวม
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  placeholder="เช่น 120,000,000 บาท"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่เริ่มต้น - กำหนดส่งมอบ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-slate-300 text-xs outline-none"
                  />
                  <input
                    type="date"
                    value={targetEndDate}
                    onChange={(e) => setTargetEndDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายละเอียดและขอบเขตโครงการ
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุขนาดพื้นที่ ขอบเขตสัญญา หรือเป้าหมายสำคัญของโครงการ..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* PM & Co-PM Section */}
          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>การแต่งตั้ง PM และ Co-PM ประจำโครงการ</span>
              </span>
            </h4>

            {/* PM (Project Manager) */}
            <div className="mb-4 pb-4 border-b border-indigo-100/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold">PM</span>
                  <span>ผู้จัดการโครงการ (Project Manager)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddPmForm(!showAddPmForm)}
                  className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddPmForm ? 'เลือกจากรายชื่อเดิม' : '+ สร้าง PM คนใหม่'}</span>
                </button>
              </div>

              {!showAddPmForm ? (
                <div className="flex items-center gap-3">
                  <select
                    id="select-pm-dropdown"
                    value={selectedPmId}
                    onChange={(e) => setSelectedPmId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                  >
                    {existingMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                  {existingMembers.find((m) => m.id === selectedPmId) && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-indigo-100 shrink-0">
                      <img
                        src={existingMembers.find((m) => m.id === selectedPmId)?.avatar}
                        alt="PM"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="text-[11px] leading-tight text-slate-700">
                        <div className="font-semibold">{existingMembers.find((m) => m.id === selectedPmId)?.name}</div>
                        <div className="text-slate-400">{existingMembers.find((m) => m.id === selectedPmId)?.phone || '08x-xxx-xxxx'}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Inline Add New PM Form */
                <div className="bg-white p-3 rounded-lg border border-indigo-200 space-y-2 mt-2">
                  <div className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>กรอกข้อมูล PM คนใหม่</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล (เช่น วิศวกร อรรถพล มีสุข)"
                      value={newPmName}
                      onChange={(e) => setNewPmName(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="email"
                      placeholder="อีเมล (เช่น attapon.m@company.co.th)"
                      value={newPmEmail}
                      onChange={(e) => setNewPmEmail(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="เบอร์โทรศัพท์ (เช่น 081-999-8877)"
                      value={newPmPhone}
                      onChange={(e) => setNewPmPhone(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">เลือกรูปโปรไฟล์:</span>
                    <div className="flex items-center gap-2">
                      {DEFAULT_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewPmAvatar(url)}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                            newPmAvatar === url ? 'border-indigo-600 scale-110 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Co-PM (Co-Project Manager) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">Co-PM</span>
                  <span>รองผู้จัดการโครงการ (Co-Project Manager)</span>
                  <span className="text-slate-400 font-normal">(สามารถเลือกได้หลายคน)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCoPmForm(!showAddCoPmForm)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddCoPmForm ? 'เลือกจากรายชื่อเดิม' : '+ สร้าง Co-PM คนใหม่'}</span>
                </button>
              </div>

              {!showAddCoPmForm ? (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {existingMembers
                      .filter((m) => m.id !== selectedPmId)
                      .map((m) => {
                        const isSelected = selectedCoPmIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleToggleCoPm(m.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                            />
                            <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full object-cover" />
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-xs font-semibold truncate">{m.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{m.role}</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {selectedCoPmIds.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">
                      * ไม่ได้เลือก Co-PM (สามารถกำหนดภายหลังได้)
                    </p>
                  )}
                </div>
              ) : (
                /* Inline Add New Co-PM Form */
                <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-2 mt-2">
                  <div className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>กรอกข้อมูล Co-PM คนใหม่</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล (เช่น สถาปนิก กานต์ดา บุญมี)"
                      value={newCoPmName}
                      onChange={(e) => setNewCoPmName(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="email"
                      placeholder="อีเมล (เช่น kanda.b@company.co.th)"
                      value={newCoPmEmail}
                      onChange={(e) => setNewCoPmEmail(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="เบอร์โทรศัพท์ (เช่น 089-111-2233)"
                      value={newCoPmPhone}
                      onChange={(e) => setNewCoPmPhone(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">เลือกรูปโปรไฟล์:</span>
                    <div className="flex items-center gap-2">
                      {DEFAULT_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewCoPmAvatar(url)}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                            newCoPmAvatar === url ? 'border-blue-600 scale-110 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Milestones / งวดงาน */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>กำหนดงวดงานสัญญา (Milestones)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มงวดงาน</span>
              </button>
            </div>

            <div className="space-y-2">
              {milestones.map((m, index) => (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="font-bold text-slate-600 shrink-0 w-16">
                    งวดที่ {index + 1}
                  </span>
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[index].name = e.target.value;
                      setMilestones(updated);
                    }}
                    placeholder="ชื่องวดงาน เช่น งานเสาเข็มและฐานราก"
                    className="flex-1 px-2.5 py-1.5 rounded border border-slate-200 bg-white font-medium outline-none"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 w-20">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={m.percentage}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[index].percentage = Number(e.target.value) || 0;
                          setMilestones(updated);
                        }}
                        className="w-12 px-1.5 py-1 rounded border border-slate-200 bg-white text-center font-bold outline-none"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>
                    <input
                      type="text"
                      value={m.amount || ''}
                      onChange={(e) => {
                        const updated = [...milestones];
                        updated[index].amount = e.target.value;
                        setMilestones(updated);
                      }}
                      placeholder="จำนวนเงิน"
                      className="w-28 px-2 py-1 rounded border border-slate-200 bg-white outline-none"
                    />
                    <input
                      type="date"
                      value={m.targetDate}
                      onChange={(e) => {
                        const updated = [...milestones];
                        updated[index].targetDate = e.target.value;
                        setMilestones(updated);
                      }}
                      className="px-2 py-1 rounded border border-slate-200 bg-white outline-none"
                    />
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              id="submit-new-project-btn"
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4" />
              <span>สร้างและเปิดโครงการทันที</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
