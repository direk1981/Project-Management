export type TaskStatus = 'todo' | 'in_progress' | 'under_review' | 'completed' | 'delayed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone?: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'zip' | 'txt' | 'other';
  size: number; // bytes
  uploadedAt: string;
  uploadedBy: string;
  downloadUrl?: string;
  contentData?: string; // base64 or text content for download
}

export interface ImageAttachment {
  id: string;
  name: string;
  url: string; // data URL or image link
  thumbnailUrl?: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  caption?: string;
  latLng?: string; // e.g. location tag for field work
}

export interface TaskActivity {
  id: string;
  taskId: string;
  user: TeamMember;
  action: string;
  timestamp: string;
  type: 'status' | 'image_upload' | 'doc_upload' | 'comment';
  commentText?: string;
  attachedImageUrl?: string;
}

export interface SubTaskItem {
  id: string;
  itemNo: string; // e.g. "1.1.1", "1.2.1"
  title: string; // รายการงานย่อย
  description?: string;
  status: TaskStatus;
  progress: number; // 0 - 100%
  weight?: number; // ค่าน้ำหนัก % ในงวด
  assigneeName?: string;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  hasDocument?: boolean;
  documentName?: string;
  hasPhoto?: boolean;
  photoUrl?: string;
  photoCaption?: string;
}

export interface Milestone {
  id: string;
  periodNo: number; // 1, 2, 3...
  name: string; // e.g. "งวดที่ 1: งานเตรียมการและฐานรากใต้ดิน"
  description?: string;
  percentage: number; // e.g. 20 (20% ของโครงการ)
  amount?: string; // e.g. "29,000,000 บาท"
  targetDate: string; // e.g. "2026-03-31"
  status: 'pending' | 'in_progress' | 'ready_for_inspection' | 'approved' | 'paid';
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string; // e.g. 'indigo', 'emerald', 'blue', 'amber', 'rose', 'purple', 'teal', 'cyan'
  description?: string;
}

export interface Task {
  id: string;
  code: string; // e.g. PRJ-012 หรือ 1.1
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  milestoneId?: string; // e.g. "ms-1"
  milestoneName?: string; // e.g. "งวดที่ 1: งานเตรียมการและฐานรากใต้ดิน"
  status: TaskStatus;
  priority: TaskPriority;
  assignee: TeamMember;
  reporter: TeamMember;
  startDate: string;
  dueDate: string;
  progress: number; // 0-100%
  category: string; // e.g. งานฐานราก, งานโครงสร้าง, ออกแบบ UI, ติดตั้งระบบ
  documents: DocumentAttachment[];
  images: ImageAttachment[];
  activities: TaskActivity[];
  subTasks?: SubTaskItem[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  description: string;
  startDate: string;
  targetEndDate: string;
  manager: TeamMember; // PM (Project Manager)
  coManagers?: TeamMember[]; // Co-PM (Co-Project Manager(s))
  budget: string;
  milestones?: Milestone[];
}
