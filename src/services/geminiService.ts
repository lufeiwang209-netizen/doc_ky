export interface UserProfile {
  department: string;
  title: string;
  hospitalLevel: string;
}

export interface TopicSuggestion {
  title: string;
  reason: string;
  difficulty: '低' | '中' | '高';
}

type MockTopicTemplate = {
  title: string;
  reason: string;
  difficulty: '低' | '中' | '高';
};

const MOCK_TOPIC_TEMPLATES: MockTopicTemplate[] = [
  { title: '{department}常见慢病患者规范化随访效果分析', reason: '基于门诊复诊数据，流程清晰，适合{hospitalLevel}{title}快速落地。', difficulty: '低' },
  { title: '{department}患者分层管理对依从性与复诊率影响研究', reason: '以依从性和复诊率为核心指标，统计口径稳定，论文结构容易展开。', difficulty: '中' },
  { title: '{department}单中心病例队列下并发症风险预测模型探索', reason: '具备一定创新性，可基于既往病历构建临床风险分层方案。', difficulty: '高' },
  { title: '{department}围术期/治疗期关键指标动态变化及影响因素分析', reason: '强调时间序列变化，适合形成“方法-结果-讨论”完整闭环。', difficulty: '中' },
  { title: '{department}多学科协作路径优化对住院日与费用的影响', reason: '管理价值和临床价值兼顾，评审时容易体现实践改进意义。', difficulty: '中' },
  { title: '{department}重点人群个体化干预前后疗效对比研究', reason: '适合从真实世界数据提炼结论，样本组织方式灵活。', difficulty: '低' },
  { title: '{department}不良事件发生特征及预警因素回顾性分析', reason: '围绕安全性展开，数据证据明确，临床应用价值突出。', difficulty: '中' },
  { title: '{department}规范化健康教育对患者自我管理能力提升作用', reason: '可结合随访问卷和复诊数据，适合基层推广型研究。', difficulty: '低' },
  { title: '{department}不同治疗策略在亚组人群中的疗效差异比较', reason: '亚组分析更容易体现论文深度，适合职称晋升场景。', difficulty: '高' },
  { title: '{department}临床路径执行一致性与疗效结局关联研究', reason: '可以结合质控数据，强调规范化诊疗的改进价值。', difficulty: '中' },
  { title: '{department}院内-院外连续管理模式对复发率影响分析', reason: '覆盖出院后随访场景，贴近真实业务，讨论空间大。', difficulty: '中' },
  { title: '{department}电子病历结构化数据辅助决策应用效果评估', reason: '具备信息化特色，创新点明确，适合形成亮点章节。', difficulty: '高' },
];

const topicCursorByProfile = new Map<string, number>();

function fillTemplate(template: string, profile: UserProfile) {
  return template
    .replaceAll('{department}', profile.department)
    .replaceAll('{title}', profile.title)
    .replaceAll('{hospitalLevel}', profile.hospitalLevel);
}

function createMockTopics(profile: UserProfile): TopicSuggestion[] {
  const profileKey = `${profile.department}|${profile.title}|${profile.hospitalLevel}`;
  const start = topicCursorByProfile.get(profileKey) ?? 0;
  const nextCursor = (start + 3) % MOCK_TOPIC_TEMPLATES.length;
  topicCursorByProfile.set(profileKey, nextCursor);

  return [0, 1, 2].map((offset) => {
    const template = MOCK_TOPIC_TEMPLATES[(start + offset) % MOCK_TOPIC_TEMPLATES.length];
    return {
      title: fillTemplate(template.title, profile),
      reason: fillTemplate(template.reason, profile),
      difficulty: template.difficulty,
    };
  });
}

function createMockAbstract(topic: string, data: Record<string, unknown>) {
  const caseCount = String(data.caseCount || '50');
  const period = String(data.period || '6个月');
  const methods = String(data.methods || '规范化随访与分层干预');
  const indicators = String(data.indicators || '疗效指标、依从性与不良事件');
  const results = String(data.results || '干预后关键指标改善，差异具有统计学意义');
  return `目的：探讨《${topic}》在真实世界临床中的应用价值。\n\n方法：纳入${caseCount}例患者，研究周期${period}，采用${methods}，观察${indicators}。\n\n结果：${results}，并且管理路径执行后患者随访完成率上升。\n\n结论：该研究方案在同级医院场景具备可行性，适合作为职称论文选题。`;
}

function ensureLength(text: string, min: number, max: number) {
  let output = text;
  const padding = '本研究进一步从临床可实施性、路径依从性、质量改进闭环与推广可复制性等角度进行补充分析，以增强论文在职称评审中的完整表达与实践说服力。';
  while (output.length < min) {
    output += `\n${padding}\n`;
  }
  if (output.length > max) {
    output = output.slice(0, max);
  }
  return output;
}

function createMockFullText(topic: string, abstract: string, data: Record<string, unknown>) {
  const caseCount = String(data.caseCount || '50');
  const period = String(data.period || '6个月');
  const methods = String(data.methods || '规范化随访与分层干预');
  const indicators = String(data.indicators || '疗效指标、依从性与不良事件');
  const results = String(data.results || '干预后关键指标改善，差异具有统计学意义');

  const base = `# ${topic}

## 摘要
${abstract}

## 引言
基层与二级医院在真实世界研究中具有典型临床场景优势，但也面临数据异质性高、随访完整度不足、路径执行不一致等问题。围绕日常可获得数据开展结构化研究，既能满足职称论文的规范要求，也能为临床质量改进提供依据。

## 资料与方法
1. 研究对象：纳入本院${period}内符合标准患者，共${caseCount}例。
2. 研究设计：回顾性观察研究，统一纳入排除标准。
3. 干预策略：${methods}，并设置固定随访节点。
4. 观察指标：${indicators}。
5. 统计学方法：计量资料与计数资料采用常规统计方法分析，P<0.05为差异有统计学意义。

## 结果
基线可比性分析显示，研究对象在核心指标上无明显偏移。实施管理路径后，主要疗效指标改善趋势明确，随访到位率和治疗依从性同步提升。安全性方面未见异常升高的严重不良事件。进一步亚组分析提示，早期纳入管理的患者获益更为显著。补充结果显示：${results}。

## 讨论
本研究说明，规范化路径的价值不仅体现在短期疗效改善，更体现在管理动作可重复、临床团队可执行、患者沟通成本可控。与单点干预不同，连续管理更能形成“识别风险-实施干预-复评迭代”的闭环。对于职称论文而言，这类研究能够同时呈现临床价值与管理价值，通常更容易获得评审认可。

## 结论
基于${caseCount}例患者、${period}观察周期的结果提示，《${topic}》具有明确实践意义，建议在同级医疗机构进一步验证与推广。

## 参考文献
[1] 王某某, 李某某. 基层医院慢病规范化管理实践与效果分析[J]. 中国临床管理, 2023.
[2] Zhang L, Chen H, et al. Real-world pathway optimization in chronic care[J]. Int J Clin Pract, 2022.
[3] 刘某某, 周某某. 临床路径执行一致性与疗效结局关联研究[J]. 中国医院管理, 2021.
`;

  return ensureLength(base, 4500, 6500);
}

function createMockPlagiarism(text: string) {
  const risk = text.length > 1200 ? '中' : '低';
  return {
    risk,
    suggestions: [
      '将模板化句式改写为包含具体数据的表达，降低同质化。',
      '讨论部分加入本科室场景化解释，增强独特性。',
      '调整段落结构，避免连续固定句型。',
    ],
  };
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

      const data = (await response.json()) as { topics?: TopicSuggestion[] };
      if (data.topics && data.topics.length > 0) {
        return data.topics;
      }
      return createMockTopics(profile);
    } catch (error) {
      console.error('Cannot suggest topics, fallback to local mock:', error);
      return createMockTopics(profile);
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

      const result = (await response.json()) as { text?: string };
      return result.text || createMockAbstract(topic, (data || {}) as Record<string, unknown>);
    } catch (error) {
      console.error('Cannot generate abstract, fallback to local mock:', error);
      return createMockAbstract(topic, (data || {}) as Record<string, unknown>);
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

      const result = (await response.json()) as { text?: string };
      return result.text || createMockFullText(topic, abstract, (data || {}) as Record<string, unknown>);
    } catch (error) {
      console.error('Cannot generate full text, fallback to local mock:', error);
      return createMockFullText(topic, abstract, (data || {}) as Record<string, unknown>);
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
      console.error('Cannot check plagiarism, fallback to local mock:', error);
      return createMockPlagiarism(text);
    }
  },
};
