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
    try {
      const response = await fetch('/api/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        throw new Error('Failed to suggest topics');
      }

      const data = (await response.json()) as { topics: TopicSuggestion[] };
      return data.topics;
    } catch (error) {
      console.error('Cannot suggest topics:', error);
      return [];
    }
  },

  async generateAbstract(topic: string, data: any): Promise<string> {
    try {
      const response = await fetch('/api/generate-abstract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, data }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate abstract');
      }

      const result = (await response.json()) as { text: string };
      return result.text;
    } catch (error) {
      console.error('Cannot generate abstract:', error);
      return '';
    }
  },

  async generateFullText(topic: string, abstract: string, data: any): Promise<string> {
    try {
      const response = await fetch('/api/generate-full-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, abstract, data }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate full text');
      }

      const result = (await response.json()) as { text: string };
      return result.text;
    } catch (error) {
      console.error('Cannot generate full text:', error);
      return '';
    }
  },

  async checkPlagiarism(text: string): Promise<{ risk: string; suggestions: string[] }> {
    try {
      const response = await fetch('/api/check-plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to check plagiarism');
      }

      return (await response.json()) as { risk: string; suggestions: string[] };
    } catch (error) {
      console.error('Cannot check plagiarism:', error);
      return { risk: '未知', suggestions: [] };
    }
  },
};
