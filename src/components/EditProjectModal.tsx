import React, { useState, useEffect } from 'react';
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
  Check, 
  Save,
  Layers,
  Phone,
  Mail
} from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (updatedProject: Project, newMembers?: TeamMember[]) => void;
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

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  existingMembers,
}) => {
  const [name, setName] = useState(project.name);
  const [code, setCode] = useState(project.code);
  const [client, setClient] = useState(project.client);
  const [budget, setBudget] = useState(project.budget);
  const [description, setDescription] = useState(project.description);
  const [startDate, setStartDate] = useState(project.startDate);
  const [targetEndDate, setTargetEndDate] = useState(project.targetEndDate);

  const [selectedPmId, setSelectedPmId] = useState<string>(project.manager.id);
  const [selectedCoPmIds, setSelectedCoPmIds] = useState<string[]>(
    project.coManagers ? project.coManagers.map((m) => m.id) : []
  );

  // Inline Add New PM / Co-PM
  const [showAddPmForm, setShowAddPmForm] = useState(false);
  const [newPmName, setNewPmName] = useState('');
  const [newPmEmail, setNewPmEmail] = useState('');
  const [newPmPhone, setNewPmPhone] = useState('');
  const [newPmAvatar, setNewPmAvatar] = useState(DEFAULT_AVATARS[0]);

  const [showAddCoPmForm, setShowAddCoPmForm] = useState(false);
  const [newCoPmName, setNewCoPmName] = useState('');
  const [newCoPmEmail, setNewCoPmEmail] = useState('');
  const [newCoPmPhone, setNewCoPmPhone] = useState('');
  const [newCoPmAvatar, setNewCoPmAvatar] = useState(DEFAULT_AVATARS[1]);

  const [milestones, setMilestones] = useState<Milestone[]>(project.milestones || []);

  useEffect(() => {
    setName(project.name);
    setCode(project.code);
    setClient(project.client);
    setBudget(project.budget);
    setDescription(project.description);
    setStartDate(project.startDate);
    setTargetEndDate(project.targetEndDate);
    setSelectedPmId(project.manager.id);
    setSelectedCoPmIds(project.coManagers ? project.coManagers.map((m) => m.id) : []);
    setMilestones(project.milestones || []);
  }, [project]);

  if (!isOpen) return null;

  const handleToggleCoPm = (memberId: string) => {
    setSelectedCoPmIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAddMilestone = () => {
    const nextNo = milestones.length + 1;
    const newMs: Milestone = {
      id: 'ms-' + Date.now(),
      periodNo: nextNo,
      name: `งวดที่ ${nextNo}: ส่งมอบงานและตรวจรับ`,
      percentage: 20,
      amount: '10,000,000 บาท',
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
      actualPm = existingMembers.find((m) => m.id === selectedPmId) || project.manager;
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

    const updatedProject: Project = {
      ...project,
      name: name.trim(),
      code: code.trim(),
      client: client.trim(),
      budget: budget.trim(),
      description: description.trim(),
      startDate,
      targetEndDate,
      manager: actualPm,
      coManagers: actualCoPms,
      milestones,
    };

    onUpdateProject(updatedProject, newCreatedMembers);
    onClose();
  };

  return (
    <div 
      id="edit-project-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="edit-project-modal-container"
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Building2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">จัดการข้อมูลโครงการ & ทีมบริหาร (PM / Co-PM)</h3>
              <p className="text-xs text-slate-300">
                ปรับเปลี่ยนผู้จัดการโครงการ (PM), รองผู้จัดการ (Co-PM) และงวดงานของ {project.code}
              </p>
            </div>
          </div>
          <button
            id="close-edit-project-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* PM & Co-PM Management Section */}
          <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>แต่งตั้งผู้จัดการโครงการ (PM) และ รองผู้จัดการ (Co-PM)</span>
              </span>
            </h4>

            {/* PM */}
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
                    id="edit-pm-select"
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
                        <div className="text-slate-400">{existingMembers.find((m) => m.id === selectedPmId)?.email}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-3 rounded-lg border border-indigo-200 space-y-2 mt-2">
                  <div className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>เพิ่มข้อมูล PM คนใหม่</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล PM"
                      value={newPmName}
                      onChange={(e) => setNewPmName(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="email"
                      placeholder="อีเมล PM"
                      value={newPmEmail}
                      onChange={(e) => setNewPmEmail(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="เบอร์โทรศัพท์ PM"
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

            {/* Co-PM */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">Co-PM</span>
                  <span>รองผู้จัดการโครงการ (Co-Project Manager)</span>
                  <span className="text-slate-400 font-normal">({selectedCoPmIds.length} ท่านที่ได้รับแต่งตั้ง)</span>
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
                </div>
              ) : (
                <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-2 mt-2">
                  <div className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>เพิ่มข้อมูล Co-PM คนใหม่</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล Co-PM"
                      value={newCoPmName}
                      onChange={(e) => setNewCoPmName(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="email"
                      placeholder="อีเมล Co-PM"
                      value={newCoPmEmail}
                      onChange={(e) => setNewCoPmEmail(e.target.value)}
                      className="px-2.5 py-1.5 rounded border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="เบอร์โทรศัพท์ Co-PM"
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

          {/* Project Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>รายละเอียดทั่วไปของโครงการ</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสโครงการ
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อโครงการ
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผู้ว่าจ้าง / ลูกค้า
                </label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  กำหนดการโครงการ
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
                รายละเอียดโครงการ
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none"
              />
            </div>
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>งวดงานสัญญา ({milestones.length} งวด)</span>
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
                    งวดที่ {m.periodNo || index + 1}
                  </span>
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[index].name = e.target.value;
                      setMilestones(updated);
                    }}
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

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              id="save-edit-project-btn"
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการเปลี่ยนแปลง</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
