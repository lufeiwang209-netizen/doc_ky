import express from 'express';
import { createAihubmix } from '@aihubmix/ai-sdk-provider';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json({ limit: '2mb' }));

type UserProfile = {
  department: string;
  title: string;
  hospitalLevel: string;
};

type TopicSuggestion = {
  title: string;
  reason: string;
  difficulty: '低' | '中' | '高';
};

type MockTopicTemplate = {
  title: string;
  reason: string;
  difficulty: '低' | '中' | '高';
};

const hasApiKey = Boolean(process.env.AIHUBMIX_API_KEY);
const forceMock = process.env.MOCK_AI === 'true';
const useMock = forceMock || !hasApiKey;

function getClient() {
  const apiKey = process.env.AIHUBMIX_API_KEY;
  if (!apiKey) {
    throw new Error('Missing AIHUBMIX_API_KEY on server');
  }

  return createAihubmix({
    apiKey,
    baseURL: 'https://aihubmix.com',
  } as any);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MOCK_TOPIC_TEMPLATES: MockTopicTemplate[] = [
  {
    title: '{department}常见慢病患者规范化随访效果分析',
    reason: '基于门诊复诊数据，流程清晰，适合{hospitalLevel}{title}快速落地。',
    difficulty: '低',
  },
  {
    title: '{department}患者分层管理对依从性与复诊率影响研究',
    reason: '以依从性和复诊率为核心指标，统计口径稳定，论文结构容易展开。',
    difficulty: '中',
  },
  {
    title: '{department}单中心病例队列下并发症风险预测模型探索',
    reason: '具备一定创新性，可基于既往病历构建临床风险分层方案。',
    difficulty: '高',
  },
  {
    title: '{department}围术期/治疗期关键指标动态变化及影响因素分析',
    reason: '强调时间序列变化，适合形成“方法-结果-讨论”完整闭环。',
    difficulty: '中',
  },
  {
    title: '{department}多学科协作路径优化对住院日与费用的影响',
    reason: '管理价值和临床价值兼顾，评审时容易体现实践改进意义。',
    difficulty: '中',
  },
  {
    title: '{department}重点人群个体化干预前后疗效对比研究',
    reason: '适合从真实世界数据提炼结论，样本组织方式灵活。',
    difficulty: '低',
  },
  {
    title: '{department}不良事件发生特征及预警因素回顾性分析',
    reason: '围绕安全性展开，数据证据明确，临床应用价值突出。',
    difficulty: '中',
  },
  {
    title: '{department}规范化健康教育对患者自我管理能力提升作用',
    reason: '可结合随访问卷和复诊数据，适合基层推广型研究。',
    difficulty: '低',
  },
  {
    title: '{department}不同治疗策略在亚组人群中的疗效差异比较',
    reason: '亚组分析更容易体现论文深度，适合职称晋升场景。',
    difficulty: '高',
  },
  {
    title: '{department}临床路径执行一致性与疗效结局关联研究',
    reason: '可以结合质控数据，强调规范化诊疗的改进价值。',
    difficulty: '中',
  },
  {
    title: '{department}院内-院外连续管理模式对复发率影响分析',
    reason: '覆盖出院后随访场景，贴近真实业务，讨论空间大。',
    difficulty: '中',
  },
  {
    title: '{department}电子病历结构化数据辅助决策应用效果评估',
    reason: '具备信息化特色，创新点明确，适合形成亮点章节。',
    difficulty: '高',
  },
];

const mockTopicCursorByProfile = new Map<string, number>();

function fillTemplate(template: string, profile: UserProfile) {
  return template
    .replaceAll('{department}', profile.department)
    .replaceAll('{title}', profile.title)
    .replaceAll('{hospitalLevel}', profile.hospitalLevel);
}

function createMockTopics(profile: UserProfile): TopicSuggestion[] {
  const profileKey = `${profile.department}|${profile.title}|${profile.hospitalLevel}`;
  const start = mockTopicCursorByProfile.get(profileKey) ?? 0;
  const nextCursor = (start + 3) % MOCK_TOPIC_TEMPLATES.length;
  mockTopicCursorByProfile.set(profileKey, nextCursor);

  const selected: TopicSuggestion[] = [];
  for (let i = 0; i < 3; i += 1) {
    const template = MOCK_TOPIC_TEMPLATES[(start + i) % MOCK_TOPIC_TEMPLATES.length];
    selected.push({
      title: fillTemplate(template.title, profile),
      reason: fillTemplate(template.reason, profile),
      difficulty: template.difficulty,
    });
  }
  return selected;
}

function createMockAbstract(topic: string, data: Record<string, unknown>): string {
  const caseCount = String(data.caseCount || '50');
  const period = String(data.period || '6个月');
  const methods = String(data.methods || '基于门诊与住院病历资料进行回顾性分析');
  const indicators = String(data.indicators || '总有效率、不良反应发生率及复诊率');
  const results = String(data.results || '干预后主要临床指标较基线改善，差异具有统计学意义（P<0.05）');

  return `目的：探讨《${topic}》在临床实践中的应用价值及其对患者结局的影响。\n\n方法：纳入${caseCount}例患者，研究周期为${period}，采用${methods}。主要观察指标包括${indicators}。\n\n结果：${results}。同时，患者治疗依从性有所提升，提示规范化管理策略具有较好的可实施性。\n\n结论：基于真实世界临床数据的分析显示，本研究方案在基层医疗场景中具有可行性和推广潜力，可为后续多中心研究提供参考。`;
}

function createMockFullText(topic: string, abstract: string, data: Record<string, unknown>): string {
  const caseCount = String(data.caseCount || '50');
  const period = String(data.period || '6个月');
  const methods = String(data.methods || '采用标准化诊疗流程并结合病历回顾进行分析');
  const indicators = String(data.indicators || '疗效指标、并发症发生率、再入院率、患者依从性');
  const results = String(data.results || '干预后主要结局较基线改善，组间比较差异具有统计学意义');

  const introParagraphs = [
    `近年来，基层与二级医院在${topic}相关诊疗中不断推进规范化管理，但在真实世界场景下，患者来源复杂、病程阶段不一、合并症较多，导致临床路径执行效果存在明显差异。职称论文写作不仅要求体现科研规范性，还要求突出可复制的临床实践价值，因此围绕日常可获取数据开展系统分析具有现实意义。`,
    `从医疗质量改进角度看，单纯报告疗效结论已难以满足评审要求，更需要结合过程指标、终点指标与安全性指标进行综合评价。本研究以连续病例为基础，尽量减少选择偏倚，围绕患者诊疗全过程进行结构化整理，力图为同级别医院提供可借鉴的研究范式。`,
    `此外，随着电子病历结构化程度提升，研究者能够在不额外增加临床负担的前提下完成回顾性证据构建。通过规范定义纳入排除标准、观察终点及统计策略，可将日常诊疗数据转化为具有学术表达力的论文证据链。`,
  ];

  const methodParagraphs = [
    `1. 研究对象与样本来源：纳入本院${period}内符合诊断标准且资料完整患者，共${caseCount}例。纳入标准包括：诊断明确、关键随访节点完整、主要实验室或影像学指标可追溯。排除标准包括：关键变量缺失、合并重大急危重症导致路径中断、依从性评估无法完成等情形。`,
    `2. 研究设计：采用回顾性观察研究方案，按既定诊疗路径对患者进行分层管理。围绕基线评估、治疗执行、随访复评三个阶段建立数据节点，确保每例患者均具备可比性记录。研究过程中严格执行匿名化处理原则，仅用于科研统计分析。`,
    `3. 干预与管理策略：在常规诊疗基础上，结合${methods}。重点环节包括风险分层、个体化宣教、用药依从性管理与复诊提醒机制。对高风险患者加强电话随访与复诊跟踪，对低风险患者强调标准化自我管理和关键预警信号识别。`,
    `4. 观察指标：主要观察终点设定为临床疗效改善水平；次要终点包括${indicators}。安全性终点记录治疗相关不良事件与严重不良事件。所有指标均采用统一口径由两名研究人员独立核对，出现分歧时由第三人复核。`,
    `5. 统计学方法：计量资料以均数±标准差表示，符合正态分布时采用t检验，不符合正态分布时采用秩和检验；计数资料采用率或构成比表示，组间比较采用卡方检验或Fisher精确检验。双侧检验以P<0.05为差异有统计学意义。`,
  ];

  const resultBlocks = [
    `结果一：基线特征比较显示，两组在年龄、性别构成、主要合并症比例及关键实验室指标方面差异无统计学意义，提示样本具有较好的可比性。`,
    `结果二：经过规范化干预后，主要疗效指标出现持续改善趋势。与基线相比，复评节点的核心临床参数明显优化，且改善幅度在高依从性亚组中更为显著。`,
    `结果三：过程管理指标方面，规范组在复诊到位率、用药连续性与随访完成率上均优于常规组，说明路径管理措施对提升执行质量具有积极作用。`,
    `结果四：安全性分析提示，总体不良事件发生率可控，严重不良事件未见明显增加。多数不良反应经对症处理后缓解，未出现与研究措施直接相关的严重后果。`,
    `结果五：亚组分析显示，不同病程阶段患者对干预的响应存在差异。早期管理组在依从性提升和复发预防方面收益更明显，而病程较长患者在生活方式调整方面改善幅度相对有限。`,
    `结果六：经济学相关指标方面，规范化管理后平均住院日与重复检查比例呈下降趋势，提示该路径在提升疗效同时具备一定资源优化潜力。`,
  ];

  const discussionParagraphs = [
    `本研究结果提示，在真实世界环境下，围绕“诊疗流程标准化+分层随访管理”构建的综合策略能够提升关键疗效指标并改善过程执行质量。该结论与国内外关于慢病连续管理的研究方向基本一致，进一步说明基层场景也可以形成高质量临床证据。`,
    `与单一干预相比，本研究强调多环节协同：风险评估、健康教育、用药指导、复诊提醒和不良事件监测共同构成闭环。实践中我们发现，单点措施短期有效但可持续性不足，只有将管理动作嵌入日常门诊流程，才能稳定改善患者结局。`,
    `在论文写作层面，评审专家通常关注“是否真正解决临床问题”。本研究通过过程指标与终点指标并重的方式，既展示疗效改善，又呈现执行路径的可操作性，能够更好体现研究的落地价值。`,
    `需要说明的是，回顾性设计仍存在不可避免的偏倚风险，例如潜在混杂因素控制不足、部分行为学指标依赖病历记录完整性等。尽管我们通过统一口径抽取和多轮复核降低误差，但证据等级仍低于前瞻性随机对照研究。`,
    `后续可在多中心联合基础上开展前瞻性研究，进一步扩大样本并延长观察周期，重点验证长期复发控制与生活质量改善幅度。同时可引入更精细的风险预测模型，为个体化干预提供更强数据支持。`,
    `综合来看，本研究形成了“问题识别—路径干预—结局评估—持续改进”的完整链路，既满足职称论文对规范性的要求，也具备在同级医院推广的现实可行性。`,
  ];

  const references = [
    '[1] 王某某, 李某某. 基层医院慢病规范化管理实践与效果分析[J]. 中国临床管理, 2023, 15(4): 221-226.',
    '[2] Zhang L, Chen H, Wu Y, et al. Real-world pathway optimization and outcome improvement in chronic care[J]. Int J Clin Pract, 2022, 76(9): e15320.',
    '[3] 赵某某, 周某某. 医疗质量持续改进在临床路径中的应用研究[J]. 中国医院管理, 2021, 41(12): 58-62.',
    '[4] Liu Q, Sun J, Fang W, et al. Adherence-focused intervention and readmission reduction: a retrospective cohort study[J]. BMC Health Serv Res, 2021, 21: 1189.',
    '[5] 陈某某, 孙某某. 电子病历数据用于真实世界研究的方法学探讨[J]. 中华医学科研管理杂志, 2020, 33(6): 401-406.',
  ];

  let body = '';
  body += `# ${topic}\n\n`;
  body += '## 摘要\n';
  body += `${abstract}\n\n`;
  body += '## 引言\n';
  body += `${introParagraphs.join('\n\n')}\n\n`;
  body += '## 资料与方法\n';
  body += `${methodParagraphs.join('\n\n')}\n\n`;
  body += '## 结果\n';
  body += `${resultBlocks.join('\n\n')}\n\n`;
  body += `补充结果说明：${results}。结合分层分析可见，依从性提升与疗效改善呈正相关，提示管理质量是影响结局的重要中介因素。\n\n`;
  body += '## 讨论\n';
  body += `${discussionParagraphs.join('\n\n')}\n\n`;
  body += '## 结论\n';
  body += `基于${caseCount}例患者、历时${period}的真实世界数据分析，本研究证实${topic}相关规范化管理策略具有可行性、有效性与一定安全性。建议在同级医疗机构中进一步开展标准化推广，并通过持续数据监测迭代临床路径，以实现疗效与效率的双重提升。\n\n`;
  body += '## 参考文献\n';
  body += `${references.join('\n')}\n`;

  const minLength = 4500;
  const maxLength = 6500;
  if (body.length < minLength) {
    const paddingParagraph =
      '为增强文本完整性，本段补充了对研究背景、方法执行细节与结果解释逻辑的阐述，包括样本异质性处理、路径依从性评估、随访节点管理与临床可推广性判断等内容，以便在职称评审场景中更清晰地展示研究设计的严谨性与实践价值。';
    while (body.length < minLength) {
      body += `\n${paddingParagraph}\n`;
    }
  }
  if (body.length > maxLength) {
    body = body.slice(0, maxLength);
  }

  return body;
}

function createMockPlagiarism(text: string) {
  const risk = text.length > 1200 ? '中' : '低';
  return {
    risk,
    suggestions: [
      '将“结果表明/研究显示”等高频模板句替换为具体数据描述，降低同质化表达。',
      '讨论部分增加本科室场景化解释，例如患者来源、随访限制与资源条件。',
      '适度调整段落结构，避免连续使用“目的-方法-结果”固定句式。',
    ],
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: useMock ? 'mock' : 'live' });
});

app.post('/api/suggest-topics', async (req, res) => {
  try {
    const { profile } = req.body as { profile: UserProfile };

    if (useMock) {
      await sleep(600);
      return res.json({ topics: createMockTopics(profile) });
    }

    const client = getClient();
    const prompt = `你是一位资深的医学科研顾问。请根据以下医生的背景，推荐3个适合用于职称晋升的科研论文选题。
科室：${profile.department}
职称：${profile.title}
医院等级：${profile.hospitalLevel}

要求：
1. 选题要真实可行，基于临床数据。
2. 难度适中，适合基层或二级医院医生。
3. 符合职称评审的合规性要求。
4. 给出选题理由和难度评估。`;

    const { object } = await generateObject({
      model: client('gpt-4o-mini'),
      schema: z.object({
        topics: z.array(
          z.object({
            title: z.string(),
            reason: z.string(),
            difficulty: z.enum(['低', '中', '高']),
          }),
        ),
      }),
      prompt,
    });

    return res.json({ topics: object.topics });
  } catch (error) {
    console.error('suggest-topics error:', error);
    return res.status(500).json({ error: '选题推荐失败，请检查服务端配置。' });
  }
});

app.post('/api/generate-abstract', async (req, res) => {
  try {
    const { topic, data } = req.body as { topic: string; data: Record<string, unknown> };

    if (useMock) {
      await sleep(700);
      return res.json({ text: createMockAbstract(topic, data || {}) });
    }

    const client = getClient();
    const prompt = `请根据以下临床数据，为选题《${topic}》生成一份标准的医学论文摘要。
数据详情：
${JSON.stringify(data, null, 2)}

要求：
1. 包含：目的、方法、结果、结论。
2. 语言专业、严谨。
3. 字数在300-500字左右。`;

    const { text } = await generateText({
      model: client('gpt-4o-mini'),
      prompt,
    });

    return res.json({ text });
  } catch (error) {
    console.error('generate-abstract error:', error);
    return res.status(500).json({ error: '摘要生成失败，请稍后重试。' });
  }
});

app.post('/api/generate-full-text', async (req, res) => {
  try {
    const { topic, abstract, data } = req.body as {
      topic: string;
      abstract: string;
      data: Record<string, unknown>;
    };

    if (useMock) {
      await sleep(900);
      return res.json({ text: createMockFullText(topic, abstract, data || {}) });
    }

    const client = getClient();
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

    const { text } = await generateText({
      model: client('gpt-4o-mini'),
      prompt,
    });

    return res.json({ text });
  } catch (error) {
    console.error('generate-full-text error:', error);
    return res.status(500).json({ error: '正文生成失败，请稍后重试。' });
  }
});

app.post('/api/check-plagiarism', async (req, res) => {
  try {
    const { text } = req.body as { text: string };

    if (useMock) {
      await sleep(500);
      return res.json(createMockPlagiarism(text || ''));
    }

    const client = getClient();
    const prompt = `请对以下医学论文片段进行查重分析，并给出降重建议。
内容：
${text}

要求：
1. 识别可能的重复表达。
2. 给出具体的改写建议。
3. 评估重复风险（低、中、高）。`;

    const { object } = await generateObject({
      model: client('gpt-4o-mini'),
      schema: z.object({
        risk: z.string(),
        suggestions: z.array(z.string()),
      }),
      prompt,
    });

    return res.json(object);
  } catch (error) {
    console.error('check-plagiarism error:', error);
    return res.status(500).json({ error: '查重分析失败，请稍后重试。' });
  }
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port} (${useMock ? 'mock' : 'live'} mode)`);
});
