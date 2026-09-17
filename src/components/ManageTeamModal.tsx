import React, { useState } from 'react';
import { TeamMember } from '../types';
import { 
  X, 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Check, 
  Trash2, 
  Building2,
  Briefcase
} from 'lucide-react';

interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  onAddMember: (newMember: TeamMember) => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
];

const PRESET_ROLES = [
  'Project Manager (PM) / ผู้จัดการโครงการ',
  'Co-Project Manager (Co-PM) / รองผู้จัดการโครงการ',
  'Site Engineer / วิศวกรหน้างาน',
  'Site Architect / สถาปนิกประจำโครงการ',
  'Safety & QC Inspector / เจ้าหน้าที่ จป.วิชาชีพ & QC',
  'MEP Engineer / วิศวกรระบบสุขาภิบาล-ไฟฟ้า',
  'Quantity Surveyor (QS) / วิศวกรประมาณราคา',
];

export const ManageTeamModal: React.FC<ManageTeamModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddMember,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState(PRESET_ROLES[0]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATARS[0]);

  if (!isOpen) return null;

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMember: TeamMember = {
      id: 'm-' + Date.now(),
      name: name.trim(),
      role: role.trim(),
      avatar,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@company.co.th`,
      phone: phone.trim() || '08x-xxx-xxxx',
    };

    onAddMember(newMember);
    setName('');
    setEmail('');
    setPhone('');
    setIsAdding(false);
  };

  const getRoleBadge = (r: string) => {
    if (r.includes('PM') && !r.includes('Co-PM')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">PM</span>;
    }
    if (r.includes('Co-PM')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Co-PM</span>;
    }
    if (r.includes('QC') || r.includes('Safety')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">QC/Safety</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">Engineering</span>;
  };

  return (
    <div 
      id="manage-team-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="manage-team-modal-container"
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Users className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">จัดการทีมงาน & ผู้บริหารโครงการ (PM / Co-PM)</h3>
              <p className="text-xs text-slate-300">
                เพิ่มและดูรายชื่อ PM, Co-PM, วิศวกร และผู้มีส่วนร่วมในโครงการ
              </p>
            </div>
          </div>
          <button
            id="close-manage-team-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Add member button or form */}
          {!isAdding ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <div>
                <h4 className="text-sm font-bold text-indigo-950">ต้องการเพิ่มบุคลากรใหม่?</h4>
                <p className="text-xs text-indigo-700/80 mt-0.5">
                  เพิ่ม PM, Co-PM หรือวิศวกรเพื่อแต่งตั้งและมอบหมายงานในระบบ
                </p>
              </div>
              <button
                id="open-add-member-form-btn"
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ เพิ่ม PM / Co-PM / บุคลากร</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveMember} className="p-4 rounded-xl bg-slate-50 border border-indigo-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>แบบฟอร์มเพิ่มบุคลากรใหม่</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น วิศวกร อรรถพล มีสุข"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ตำแหน่ง / บทบาทในโครงการ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium outline-none focus:border-indigo-600"
                  >
                    {PRESET_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    placeholder="เช่น attapon.m@company.co.th"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 081-234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">เลือกรูปโปรไฟล์:</span>
                <div className="flex items-center gap-2.5">
                  {DEFAULT_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        avatar === url ? 'border-indigo-600 scale-110 shadow-sm ring-2 ring-indigo-200' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  บันทึกข้อมูลบุคลากร
                </button>
              </div>
            </form>
          )}

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                รายชื่อบุคลากรทั้งหมด ({members.length} ท่าน)
              </h4>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {members.map((member) => (
                <div key={member.id} className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {member.name}
                        </span>
                        {getRoleBadge(member.role)}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {member.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-xs text-slate-600 flex items-center justify-end gap-1 font-mono">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
