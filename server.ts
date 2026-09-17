import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy initialization of Gemini API Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// 1. Health & Config Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 2. AI Chat & Assistant endpoint for Project Management
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, projectContext, history } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGemini();

    const systemInstruction = `
คุณคือ "AI Project Co-Pilot" ผู้ช่วยอัจฉริยะในการบริหารและจัดการโครงการพัฒนา Software (SW) และ Hardware (HW)
ตอบคำถามด้วยภาษาไทยที่สุภาพ กระชับ เป็นมืออาชีพ ถูกหลักวิศวกรรม และตรงประเด็น
มีความเชี่ยวชาญทั้งด้าน:
- งาน Software (SW): Frontend, Backend, APIs, Database, Cloud, Firmware, Embedded Systems, Mobile App
- งาน Hardware (HW): ออกแบบวงจร (Schematic & PCB), MCU/SoC, Sensors, ตู้คอนโทรล, Wiring, Power Supply, Soldering
- การผสานระบบ (SW & HW Integration): IoT Protocols (MQTT, Modbus, BLE, CAN bus), Flashing, Calibration
- การควบคุมงวดงานสัญญา (Milestones), การบริหารงบประมาณ, การเร่งรัดงานที่ล่าช้า, และการจัดทำเอกสารส่งมอบงาน

บริบทของโครงการปัจจุบัน:
${projectContext ? JSON.stringify(projectContext, null, 2) : 'ไม่มีข้อมูลบริบทเพิ่มเติม'}
`;

    const userContents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-6)) {
        userContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }
    userContents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text || 'ขออภัย ไม่สามารถประมวลผลข้อความได้' });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({
      error: error.message || 'เกิดข้อผิดพลาดในการเรียกใช้งาน Gemini AI',
    });
  }
});

// 3. AI Smart Task Generator (Auto Categorization SW / HW + Subtasks)
app.post('/api/ai/generate-task', async (req: Request, res: Response) => {
  try {
    const { userPrompt, projectContext, categories } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: 'User prompt is required' });
    }

    const ai = getGemini();

    const systemInstruction = `
คุณคือผู้ช่วย AI ที่เชี่ยวชาญในการวิเคราะห์ความต้องการงานด้าน Software (SW) และ Hardware (HW)
เมื่อผู้ใช้ระบุสิ่งที่ต้องการทำ ให้คุณแปลงเป็นโครงสร้างงาน (Task Work Breakdown Structure) ภาษาไทยที่สมบูรณ์
ต้องเลือกหมวดหมู่ให้เหมาะสมที่สุด โดยเน้นหมวดหมู่หลัก:
- "งาน Software (SW)"
- "งาน Hardware (HW)"
- "งานเชื่อมต่อระบบ (System Integration)"
- "งานทดสอบและตรวจสอบคุณภาพ (QA & Testing)"
- "งานเอกสารและตรวจรับงาน (Documentation & Delivery)"
(หรือเลือกจากรายการหมวดหมู่ที่มีให้: ${categories ? JSON.stringify(categories.map((c: any) => c.name)) : 'SW, HW'})

กรุณาส่งออกผลลัพธ์เป็น JSON Object เท่านั้น มีโครงสร้างดังนี้:
{
  "title": "ชื่อหัวข้องานที่กระชับ ชัดเจน เป็นภาษาไทย",
  "category": "หมวดหมู่งานที่ตรงที่สุด เช่น งาน Software (SW) หรือ งาน Hardware (HW)",
  "priority": "urgent" | "high" | "medium" | "low",
  "description": "คำอธิบายรายละเอียดทางเทคนิค ขอบเขตงาน และเกณฑ์การตรวจรับ",
  "suggestedMilestonePeriod": 1,
  "subTasks": [
    {
      "title": "ชื่องานย่อยขั้นตอนที่ 1",
      "weight": 25,
      "assigneeRole": "Software Engineer หรือ Hardware Engineer"
    },
    ... รวม weight ให้ได้ 100
  ],
  "technicalNotes": "ข้อควรระวังทางเทคนิค เช่น ชิป IC, โปรโตคอล, ความปลอดภัย หรือ Library ที่แนะนำ"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `กรุณาสร้างรายละเอียดงานจากความต้องการต่อไปนี้:
"${userPrompt}"

ข้อมูลโครงการ:
${projectContext ? JSON.stringify(projectContext) : 'โครงการพัฒนา SW & HW'}
`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ task: parsed });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-task:', error);
    res.status(500).json({
      error: error.message || 'ไม่สามารถสร้างงานด้วย AI ได้',
    });
  }
});

// 4. AI Subtask Breakdown Generator
app.post('/api/ai/subtasks', async (req: Request, res: Response) => {
  try {
    const { title, description, category } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const ai = getGemini();

    const systemInstruction = `
คุณคือวิศวกรอาวุโสด้าน SW และ HW ให้ช่วยแตกรายการงานย่อย (Subtasks Breakdown) สำหรับงานที่ระบุ
ส่งออกผลลัพธ์เป็น JSON Object เท่านั้น:
{
  "subTasks": [
    {
      "title": "ชื่องานย่อยที่ชัดเจน วัดผลได้",
      "weight": 25
    }
  ]
}
หมายเหตุ:
- ให้แตกเป็น 3 - 5 งานย่อยที่สมเหตุสมผลตามหลักวิศวกรรม
- ผลรวมของ weight ทุกงานย่อยต้องเท่ากับ 100 พอดี
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `ชื่องาน: ${title}\nหมวดหมู่: ${category || 'SW/HW'}\nรายละเอียด: ${description || '-'}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"subTasks":[]}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/subtasks:', error);
    res.status(500).json({
      error: error.message || 'ไม่สามารถสร้างงานย่อยด้วย AI ได้',
    });
  }
});

// 5. AI Project Executive Summary & Risk Analysis
app.post('/api/ai/project-summary', async (req: Request, res: Response) => {
  try {
    const { project, tasks } = req.body;
    if (!project) {
      return res.status(400).json({ error: 'Project data is required' });
    }

    const ai = getGemini();

    const systemInstruction = `
คุณคือที่ปรึกษาบริหารโครงการระดับสูง (Senior Project Consultant) ด้านระบบวิศวกรรม Software & Hardware
ให้วิเคราะห์ข้อมูลโครงการและสถานะงานทั้งหมด แล้วสรุปรายงานสำหรับผู้บริหาร (Executive Summary & Actionable Insights)
เน้นการจำแนกเปรียบเทียบระหว่าง:
- งาน Software (SW)
- งาน Hardware (HW)
- สถานะงวดงานตามสัญญา (Milestones)

ส่งออกเป็น JSON Object เท่านั้น ดังนี้:
{
  "overallHealth": "good" | "warning" | "critical",
  "summaryHeadline": "สรุปสั้น 1 ประโยคเกี่ยวกับสถานะโครงการ",
  "swProgress": {
    "summary": "สรุปสถานะงาน Software",
    "keyAchievements": ["สิ่งที่สำเร็จแล้ว 1-2 ข้อ"],
    "concerns": ["ข้อกังวล 1-2 ข้อ"]
  },
  "hwProgress": {
    "summary": "สรุปสถานะงาน Hardware",
    "keyAchievements": ["สิ่งที่สำเร็จแล้ว 1-2 ข้อ"],
    "concerns": ["ข้อกังวล 1-2 ข้อ"]
  },
  "milestoneOutlook": "การประเมินการส่งมอบงวดงานถัดไป",
  "urgentActions": [
    "สิ่งที่ PM / Co-PM ควรเร่งรัดทำทันที 2-3 ข้อ"
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `ข้อมูลโครงการ:
${JSON.stringify({
  name: project.name,
  code: project.code,
  budget: project.budget,
  milestones: project.milestones,
  totalTasks: tasks?.length || 0,
  tasks: (tasks || []).map((t: any) => ({
    title: t.title,
    category: t.category,
    status: t.status,
    progress: t.progress,
    dueDate: t.dueDate,
    priority: t.priority,
  })),
})}
`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ report: parsed });
  } catch (error: any) {
    console.error('Error in /api/ai/project-summary:', error);
    res.status(500).json({
      error: error.message || 'ไม่สามารถสร้างบทสรุปโครงการด้วย AI ได้',
    });
  }
});

// 6. AI Photo / Hardware / Site QC Inspector (Multimodal Vision)
app.post('/api/ai/analyze-photo', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', taskTitle, context } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    const ai = getGemini();

    // Clean base64 string if data URL scheme is present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          text: `กรุณาตรวจสอบรูปภาพนี้ในฐานะผู้ตรวจสอบคุณภาพ (QC Inspector) และวิศวกรระบบ HW & SW:
- ตรวจสอบความถูกต้องของการติดตั้งชิ้นส่วน HW, วงจร PCB, การเดินสาย Wiring, หรือหน้าจอทดสอบระบบ SW
- ชื่องานที่เกี่ยวข้อง: "${taskTitle || 'งานระบบ SW & HW'}"
- ข้อมูลบริบท: "${context || 'ภาพประกอบการตรวจรับงาน'}"

ให้ตอบเป็นภาษาไทย โดยมีหัวข้อ:
1. สิ่งที่ปรากฏในภาพ (Visual Observations)
2. ผลการตรวจสอบคุณภาพและความเรียบร้อย (QC Assessment: ผ่าน / ต้องแก้ไข)
3. ข้อสังเกตและคำแนะนำเชิงวิศวกรรม (Engineering Recommendations)
เขียนให้กระชับ ชัดเจน และเป็นมืออาชีพ`,
        },
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
      ],
      config: {
        temperature: 0.3,
      },
    });

    res.json({ analysis: response.text || 'ไม่สามารถวิเคราะห์รูปภาพได้' });
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-photo:', error);
    res.status(500).json({
      error: error.message || 'ไม่สามารถวิเคราะห์ภาพถ่ายด้วย AI ได้',
    });
  }
});

// Start the Express Server with Vite integration
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
