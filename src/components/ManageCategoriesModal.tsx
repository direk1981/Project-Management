import React, { useState } from 'react';
import { TaskCategory, Task } from '../types';
import { 
  X, 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  AlertCircle, 
  Layers, 
  Sparkles,
  Search
} from 'lucide-react';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TaskCategory[];
  tasks: Task[];
  onAddCategory: (category: TaskCategory) => void;
  onUpdateCategory: (oldName: string, updatedCategory: TaskCategory) => void;
  onDeleteCategory: (categoryId: string, categoryName: string, fallbackCategoryName?: string) => void;
}

export const CATEGORY_COLORS = [
  { id: 'indigo', label: 'คราม (Indigo)', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { id: 'emerald', label: 'เขียวมรกต (Emerald)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { id: 'blue', label: 'น้ำเงิน (Blue)', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { id: 'amber', label: 'ส้มอำพัน (Amber)', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  { id: 'rose', label: 'กุหลาบ (Rose)', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  { id: 'purple', label: 'ม่วง (Purple)', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  { id: 'teal', label: 'เขียวน้ำทะเล (Teal)', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  { id: 'cyan', label: 'ฟ้าไซแอน (Cyan)', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  { id: 'slate', label: 'เทากราไฟต์ (Slate)', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
];

export const getCategoryBadgeStyle = (colorName: string) => {
  const found = CATEGORY_COLORS.find((c) => c.id === colorName);
  if (found) return found;
  return CATEGORY_COLORS[0];
};

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  tasks,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [color, setColor] = useState('indigo');
  const [description, setDescription] = useState('');
  const [originalName, setOriginalName] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setName('');
    setColor('indigo');
    setDescription('');
    setEditingId(null);
    setIsCreating(true);
  };

  const handleStartEdit = (cat: TaskCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color || 'indigo');
    setDescription(cat.description || '');
    setOriginalName(cat.name);
    setIsCreating(false);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCreating) {
      const newCat: TaskCategory = {
        id: 'cat-' + Date.now(),
        name: name.trim(),
        color,
        description: description.trim(),
      };
      onAddCategory(newCat);
      setIsCreating(false);
    } else if (editingId) {
      const updatedCat: TaskCategory = {
        id: editingId,
        name: name.trim(),
        color,
        description: description.trim(),
      };
      onUpdateCategory(originalName, updatedCat);
      setEditingId(null);
    }

    setName('');
    setDescription('');
  };

  const handleDelete = (cat: TaskCategory) => {
    const taskCount = tasks.filter((t) => t.category === cat.name).length;
    if (categories.length <= 1) {
      alert('ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากต้องมีหมวดหมู่อย่างน้อย 1 รายการ');
      return;
    }

    if (taskCount > 0) {
      const remaining = categories.filter((c) => c.id !== cat.id);
      const fallback = remaining[0]?.name || 'ทั่วไป';
      if (confirm(`หมวดหมู่ "${cat.name}" มีงานผูกอยู่ ${taskCount} รายการ คุณต้องการลบและย้ายงานทั้งหมดไปที่หมวด "${fallback}" หรือไม่?`)) {
        onDeleteCategory(cat.id, cat.name, fallback);
      }
    } else {
      if (confirm(`คุณต้องการลบหมวดหมู่ "${cat.name}" หรือไม่?`)) {
        onDeleteCategory(cat.id, cat.name);
      }
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div 
      id="manage-categories-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="manage-categories-modal-container"
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Tag className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">จัดการหมวดหมู่งาน (Task Categories)</h3>
              <p className="text-xs text-slate-300">
                เพิ่ม แก้ไข หรือปรับเปลี่ยนหมวดหมู่สำหรับจัดกลุ่มงานโครงการ
              </p>
            </div>
          </div>
          <button
            id="close-manage-categories-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาหมวดหมู่งาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-indigo-400"
              />
            </div>

            {!isCreating && !editingId && (
              <button
                id="open-create-category-btn"
                type="button"
                onClick={handleStartCreate}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มหมวดหมู่ใหม่</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form Panel */}
          {(isCreating || editingId) && (
            <form onSubmit={handleSaveForm} className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isCreating ? 'เพิ่มหมวดหมู่งานใหม่' : `แก้ไขหมวดหมู่งาน: ${originalName}`}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อหมวดหมู่งาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น งานตกแต่งภายใน, งานโครงสร้างเหล็ก"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium outline-none focus:border-indigo-600"
                  />
                  {editingId && originalName !== name && (
                    <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>งานทั้งหมดที่อยู่ในหมวด "{originalName}" จะถูกเปลี่ยนเป็น "{name}" อัตโนมัติ</span>
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คำอธิบาย / ขอบเขตงานของหมวดหมู่นี้
                  </label>
                  <input
                    type="text"
                    placeholder="ระบุรายละเอียดขอบข่ายงานโดยสังเขป..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    เลือกโทนสีสัญลักษณ์ของหมวดหมู่:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          c.bg
                        } ${c.text} ${c.border} ${
                          color === c.id
                            ? 'ring-2 ring-indigo-600 ring-offset-1 font-bold shadow-2xs'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
                        <span>{c.label.split(' ')[0]}</span>
                        {color === c.id && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-100">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  id="save-category-btn"
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                >
                  {isCreating ? 'บันทึกหมวดหมู่ใหม่' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>รายการหมวดหมู่ทั้งหมด ({filteredCategories.length})</span>
              <span>จำนวนงานที่ผูกไว้</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {filteredCategories.map((cat) => {
                const badge = getCategoryBadgeStyle(cat.color);
                const taskCount = tasks.filter((t) => t.category === cat.name).length;

                return (
                  <div
                    key={cat.id}
                    className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <span>{cat.name}</span>
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {taskCount} งาน
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          title="แก้ไขหมวดหมู่นี้"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          title="ลบหมวดหมู่นี้"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
