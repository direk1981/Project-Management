import { TaskCategory } from '../types';

export const initialCategories: TaskCategory[] = [
  {
    id: 'cat-1',
    name: 'งาน Software (SW)',
    color: 'indigo',
    description: 'งานพัฒนาโปรแกรม, Frontend, Backend API, Database, Cloud Service, Firmware และ Mobile Application',
  },
  {
    id: 'cat-2',
    name: 'งาน Hardware (HW)',
    color: 'emerald',
    description: 'งานออกแบบวงจร (PCB Design), จัดหาอุปกรณ์ชิ้นส่วน, ประกอบบอร์ด MCU, เซนเซอร์, ตู้คอนโทรล และ Wiring',
  },
  {
    id: 'cat-3',
    name: 'งานเชื่อมต่อระบบ (System Integration)',
    color: 'blue',
    description: 'งานเชื่อมโยง HW กับ SW, ทดสอบ IoT Gateway, สื่อสารโปรโตคอล MQTT/Modbus/BLE และตรวจวัดความเข้ากันได้ของระบบ',
  },
  {
    id: 'cat-4',
    name: 'งานทดสอบและตรวจสอบคุณภาพ (QA & Testing)',
    color: 'amber',
    description: 'งานทดสอบซอฟต์แวร์และฮาร์ดแวร์, Stress Test, Signal Integrity, Unit Testing และการตรวจมาตรฐาน QC',
  },
  {
    id: 'cat-5',
    name: 'งานเอกสารและตรวจรับงาน (Documentation & Delivery)',
    color: 'slate',
    description: 'งานจัดทำ Schematic, Datasheet, API Spec, เอกสารทดสอบ และเอกสารส่งมอบงานตามงวดสัญญา',
  },
];
