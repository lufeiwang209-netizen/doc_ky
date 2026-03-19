import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface UserProfile {
  department: string;
  title: string;
  hospitalLevel: string;
}

export interface TopicSuggestion {
  title: string;
  reason: string;
  difficulty: "低" | "中" | "高";
}

export const geminiService = {
  async suggestTopics(profile: UserProfile): Promise<TopicSuggestion[]> {
    const prompt = `你是一位资深的医学科研顾问。请根据以下医生的背景，推荐3个适合用于职称晋升的科研论文选题。
    科室：${profile.department}
    职称：${profile.title}
    医院等级：${profile.hospitalLevel}
    
    要求：
    1. 选题要真实可行，基于临床数据。
    2. 难度适中，适合基层或二级医院医生。
    3. 符合职称评审的合规性要求。
    4. 给出选题理由和难度评估。`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reason: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["低", "中", "高"] },
            },
            required: ["title", "reason", "difficulty"],
          },
        },
      },
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse topics", e);
      return [];
    }
  },

  async generateAbstract(topic: string, data: any): Promise<string> {
    const prompt = `请根据以下临床数据，为选题《${topic}》生成一份标准的医学论文摘要。
    数据详情：
    ${JSON.stringify(data, null, 2)}
    
    要求：
    1. 包含：目的、方法、结果、结论。
    2. 语言专业、严谨。
    3. 字数在300-500字左右。`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "";
  },

  async generateFullText(topic: string, abstract: string, data: any): Promise<string> {
    const prompt = `请根据以下摘要和数据，为选题《${topic}》生成完整的医学论文正文。
    摘要：
    ${abstract}
    
    数据详情：
    ${JSON.stringify(data, null, 2)}
    
    要求：
    1. 包含：引言、资料与方法、结果、讨论、结论。
    2. 结构清晰，逻辑严密。
    3. 符合医学论文写作规范。
    4. 适当引用虚构但合理的参考文献（标注格式）。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });

    return response.text || "";
  },

  async checkPlagiarism(text: string): Promise<{ risk: string; suggestions: string[] }> {
    const prompt = `请对以下医学论文片段进行查重分析，并给出降重建议。
    内容：
    ${text}
    
    要求：
    1. 识别可能的重复表达。
    2. 给出具体的改写建议。
    3. 评估重复风险（低、中、高）。`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["risk", "suggestions"],
        },
      },
    });

    try {
      return JSON.parse(response.text || '{"risk": "未知", "suggestions": []}');
    } catch (e) {
      return { risk: "未知", suggestions: [] };
    }
  }
};
