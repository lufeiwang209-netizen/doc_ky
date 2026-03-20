/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, 
  FileText, 
  Search, 
  History, 
  Download, 
  ChevronRight, 
  Plus, 
  User, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap,
  BookOpen,
  FileSearch,
  Copy,
  RefreshCw
} from 'lucide-react';
import { CoolLoading } from './components/CoolLoading';
import { geminiService, UserProfile, TopicSuggestion } from './services/geminiService';

// --- Types ---
type Step = 'login' | 'profile' | 'dashboard' | 'topic-selection' | 'writing-form' | 'abstract-result' | 'full-text-result' | 'plagiarism-check';

interface Draft {
  id: string;
  title: string;
  date: string;
  status: 'abstract' | 'full-text';
}

// --- Render Helpers (Moved outside to prevent re-renders and focus loss on every keystroke) ---
const Header = () => (
  <header className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Stethoscope className="text-white w-5 h-5" />
      </div>
      <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
        医研通
      </h1>
    </div>
    <div className="flex items-center space-x-4">
      <button className="p-2 text-slate-400 hover:text-white transition-colors">
        <Search className="w-5 h-5" />
      </button>
      <button className="p-2 text-slate-400 hover:text-white transition-colors">
        <User className="w-5 h-5" />
      </button>
    </div>
  </header>
);

const StepWrapper = ({ children, title, onBack, stepKey }: { children: React.ReactNode, title?: string, onBack?: () => void, stepKey: string }) => (
  <motion.div 
    key={stepKey}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="max-w-2xl mx-auto p-6 space-y-8"
  >
    {onBack && (
      <button onClick={onBack} className="flex items-center text-slate-400 hover:text-emerald-400 transition-colors group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        返回
      </button>
    )}
    {title && <h2 className="text-3xl font-bold glow-text">{title}</h2>}
    {children}
  </motion.div>
);

// --- Main Component ---
export default function App() {
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    department: '内科',
    title: '主治医师',
    hospitalLevel: '二级医院'
  });
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('aihubmixApiKey') || '');
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [formData, setFormData] = useState({
    caseCount: '50',
    period: '6个月',
    studyType: '回顾性分析',
    methods: '',
    indicators: '',
    results: '',
    summary: ''
  });
  const [abstract, setAbstract] = useState('');
  const [fullText, setFullText] = useState('');
  const [plagiarismResult, setPlagiarismResult] = useState<{ risk: string; suggestions: string[] } | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([
    { id: '1', title: '糖尿病患者规范化管理效果分析', date: '2026-03-18', status: 'full-text' },
    { id: '2', title: '高血压病例回顾摘要', date: '2026-03-17', status: 'abstract' }
  ]);

  useEffect(() => {
    geminiService.setApiKey(apiKey);
    // 当 apiKey 改变时，更新 localStorage
    if (apiKey) {
      localStorage.setItem('aihubmixApiKey', apiKey);
    } else {
      localStorage.removeItem('aihubmixApiKey');
    }
  }, [apiKey]);

  // --- Handlers ---
  const handleLogin = () => {
    if (!apiKey) {
      alert('请先填写 AiHubMix API Key！');
      return;
    }
    setLoading(true);
    setLoadingMsg('正在验证身份...');
    setTimeout(() => {
      setLoading(false);
      setStep('profile');
    }, 1500);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleSaveProfile = () => {
    setStep('dashboard');
  };

  const startNewResearch = async () => {
    setLoading(true);
    setLoadingMsg('AI 正在根据您的背景匹配最佳选题...');
    const suggestions = await geminiService.suggestTopics(userProfile);
    setTopics(suggestions);
    setLoading(false);
    setStep('topic-selection');
  };

  const selectTopic = (topic: string) => {
    setSelectedTopic(topic);
    setStep('writing-form');
  };

  const generateAbstract = async () => {
    setLoading(true);
    setLoadingMsg('正在生成科研摘要...');
    const result = await geminiService.generateAbstract(selectedTopic, formData);
    setAbstract(result);
    setLoading(false);
    setStep('abstract-result');
  };

  const generateFullText = async () => {
    setLoading(true);
    setLoadingMsg('正在生成论文正文，这可能需要一点时间...');
    const result = await geminiService.generateFullText(selectedTopic, abstract, formData);
    setFullText(result);
    setLoading(false);
    setStep('full-text-result');
  };

  const checkPlagiarism = async () => {
    setLoading(true);
    setLoadingMsg('正在进行学术查重分析...');
    const result = await geminiService.checkPlagiarism(fullText || abstract);
    setPlagiarismResult(result);
    setLoading(false);
    setStep('plagiarism-check');
  };

  const downloadFile = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.doc`;
    document.body.appendChild(element);
    element.click();
  };

  // --- Views ---
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950"><CoolLoading message={loadingMsg} /></div>;

  return (
    <div className="min-h-screen medical-grid">
      <AnimatePresence mode="wait">
        {step === 'login' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen flex items-center justify-center p-6"
          >
            <div className="glass-panel p-10 rounded-3xl w-full max-w-md space-y-8 relative overflow-hidden">
              <div className="scan-line absolute inset-x-0 top-0 opacity-20" />
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <Stethoscope className="text-emerald-500 w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold glow-text">医研通</h1>
                <p className="text-slate-400">临床医生职称科研助手</p>
              
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-slate-500 font-mono">AiHubMix API Key</label>
                <input 
                  type="password" 
                  placeholder="请输入您的 AiHubMix API Key" 
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-slate-500 font-mono">手机号</label>
                  <input 
                    type="text" 
                    placeholder="请输入手机号" 
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-slate-500 font-mono">验证码</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="验证码" 
                      className="flex-1 bg-slate-800/50 border border-white/5 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                    <button className="bg-slate-800 px-4 rounded-xl text-sm hover:bg-slate-700 transition-colors">获取</button>
                  </div>
                </div>
                <button 
                  onClick={handleLogin}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center group"
                >
                  立即登录 / 保存 API Key
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <p className="text-center text-xs text-slate-600">
                登录即代表同意《用户协议》与《隐私政策》
              </p>
            </div>
          </motion.div>
        )}

        {step === 'profile' && (
          <StepWrapper stepKey="profile" title="完善基础资料">
            <p className="text-slate-400">这些信息将帮助 AI 为您推荐最适合职称晋升的选题。</p>
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">所在科室</label>
                  <select 
                    value={userProfile.department}
                    onChange={(e) => setUserProfile({...userProfile, department: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>内科</option>
                    <option>外科</option>
                    <option>儿科</option>
                    <option>妇产科</option>
                    <option>急诊科</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">当前职称</label>
                  <select 
                    value={userProfile.title}
                    onChange={(e) => setUserProfile({...userProfile, title: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>住院医师</option>
                    <option>主治医师</option>
                    <option>副主任医师</option>
                    <option>主任医师</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">医院等级</label>
                  <select 
                    value={userProfile.hospitalLevel}
                    onChange={(e) => setUserProfile({...userProfile, hospitalLevel: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>三级医院</option>
                    <option>二级医院</option>
                    <option>一级医院/社区中心</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleSaveProfile}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-400 transition-all"
              >
                保存并进入首页
              </button>
            </div>
          </StepWrapper>
        )}

        {step === 'dashboard' && (
          <div key="dashboard" className="min-h-screen">
            <Header />
            <main className="max-w-4xl mx-auto p-6 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">你好，{userProfile.title}</h2>
                  <p className="text-slate-400">今天推荐您先完成一个职称选题</p>
                </div>
                <button 
                  onClick={startNewResearch}
                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  开启新科研
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Sparkles, label: '智能选题', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { icon: Zap, label: '快速写作', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                  { icon: ShieldCheck, label: '查重降重', color: 'text-purple-400', bg: 'bg-purple-400/10' },
                  { icon: BookOpen, label: '政策速查', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                ].map((item, i) => (
                  <button key={i} className="glass-panel p-6 rounded-2xl flex flex-col items-center space-y-3 hover:bg-slate-800/80 transition-all group">
                    <div className={`${item.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                      <item.icon className={`${item.color} w-6 h-6`} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center">
                    <History className="w-5 h-5 mr-2 text-slate-500" />
                    我的草稿
                  </h3>
                  <button className="text-sm text-emerald-400 hover:underline">查看全部</button>
                </div>
                <div className="space-y-3">
                  {drafts.map(draft => (
                    <div key={draft.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <FileText className="text-slate-400 w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{draft.title}</h4>
                          <p className="text-xs text-slate-500">{draft.date} · {draft.status === 'full-text' ? '正文已生成' : '仅摘要'}</p>
                        </div>
                      </div>
                      <ChevronRight className="text-slate-600 w-5 h-5" />
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        )}

        {step === 'topic-selection' && (
          <StepWrapper stepKey="topic-selection" title="智能选题推荐" onBack={() => setStep('dashboard')}>
            <div className="space-y-4">
              {topics.map((topic, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-panel p-6 rounded-3xl space-y-4 border-l-4 border-l-emerald-500"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold leading-tight">{topic.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-mono ${
                      topic.difficulty === '低' ? 'bg-emerald-500/20 text-emerald-400' : 
                      topic.difficulty === '中' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      难度: {topic.difficulty}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{topic.reason}</p>
                  <button 
                    onClick={() => selectTopic(topic.title)}
                    className="w-full py-3 bg-slate-800 hover:bg-emerald-500 text-white rounded-xl transition-all font-bold"
                  >
                    选择该题并开始写作
                  </button>
                </motion.div>
              ))}
              <button className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                换一批选题
              </button>
            </div>
          </StepWrapper>
        )}

        {step === 'writing-form' && (
          <StepWrapper stepKey="writing-form" title="填写临床信息" onBack={() => setStep('topic-selection')}>
            <div className="glass-panel p-6 rounded-2xl space-y-2 mb-6 border-l-4 border-l-blue-500">
              <p className="text-xs text-blue-400 font-mono uppercase tracking-widest">当前选题</p>
              <h3 className="text-lg font-bold">{selectedTopic}</h3>
            </div>
            
            <div className="glass-panel p-8 rounded-3xl space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">病例数</label>
                  <input 
                    type="number"
                    value={formData.caseCount}
                    onChange={(e) => setFormData({...formData, caseCount: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">研究周期</label>
                  <input 
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({...formData, period: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">诊疗/干预方法</label>
                  <textarea 
                    placeholder="例如：采用XX药物联合XX疗法..."
                    value={formData.methods}
                    onChange={(e) => setFormData({...formData, methods: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 h-24 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">观察指标</label>
                  <textarea 
                    placeholder="例如：治疗前后的血压变化、不良反应率..."
                    value={formData.indicators}
                    onChange={(e) => setFormData({...formData, indicators: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 h-24 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">主要结果</label>
                  <textarea 
                    placeholder="例如：总有效率达95%，显著高于对照组..."
                    value={formData.results}
                    onChange={(e) => setFormData({...formData, results: e.target.value})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 h-24 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all">保存草稿</button>
                <button 
                  onClick={generateAbstract}
                  className="flex-[2] py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  生成科研摘要
                </button>
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 'abstract-result' && (
          <StepWrapper stepKey="abstract-result" title="摘要生成结果" onBack={() => setStep('writing-form')}>
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <div className="prose prose-invert max-w-none">
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 font-serif leading-relaxed whitespace-pre-wrap">
                  {abstract}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={checkPlagiarism}
                  className="py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center"
                >
                  <FileSearch className="w-5 h-5 mr-2" />
                  查重降重
                </button>
                <button 
                  onClick={generateFullText}
                  className="py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  生成论文正文
                </button>
              </div>
              <button 
                onClick={() => downloadFile(abstract, `${selectedTopic}-摘要`)}
                className="w-full py-4 border border-white/10 text-slate-400 rounded-xl hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                导出摘要 (Word)
              </button>
            </div>
          </StepWrapper>
        )}

        {step === 'full-text-result' && (
          <StepWrapper stepKey="full-text-result" title="论文正文预览" onBack={() => setStep('abstract-result')}>
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                <div className="bg-slate-950/50 p-8 rounded-2xl border border-white/5 font-serif leading-relaxed whitespace-pre-wrap">
                  <h1 className="text-2xl font-bold text-center mb-8">{selectedTopic}</h1>
                  {fullText}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={checkPlagiarism}
                  className="py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center"
                >
                  <FileSearch className="w-5 h-5 mr-2" />
                  查重分析
                </button>
                <button 
                  onClick={() => downloadFile(fullText, selectedTopic)}
                  className="py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  导出全文 (Word)
                </button>
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 'plagiarism-check' && (
          <StepWrapper stepKey="plagiarism-check" title="查重降重分析" onBack={() => setStep(fullText ? 'full-text-result' : 'abstract-result')}>
            <div className="glass-panel p-8 rounded-3xl space-y-8">
              <div className="flex items-center justify-between p-6 bg-slate-950/50 rounded-2xl border border-white/5">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">重复风险评估</p>
                  <h3 className={`text-2xl font-bold ${
                    plagiarismResult?.risk === '低' ? 'text-emerald-400' : 
                    plagiarismResult?.risk === '中' ? 'text-blue-400' : 'text-orange-400'
                  }`}>
                    {plagiarismResult?.risk}
                  </h3>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-500 w-8 h-8" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-emerald-400" />
                  AI 降重建议
                </h4>
                <div className="space-y-3">
                  {plagiarismResult?.suggestions.map((s, i) => (
                    <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 text-sm leading-relaxed flex items-start">
                      <div className="w-5 h-5 bg-emerald-500/10 rounded flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-[10px] text-emerald-500 font-bold">{i+1}</span>
                      </div>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setStep(fullText ? 'full-text-result' : 'abstract-result')}
                className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-all"
              >
                一键应用并返回
              </button>
            </div>
          </StepWrapper>
        )}
      </AnimatePresence>
      
      {/* Bottom Navigation for Mobile Feel */}
      {step !== 'login' && (
        <nav className="fixed bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 p-4 flex justify-around items-center md:hidden z-50">
          <button onClick={() => setStep('dashboard')} className={`flex flex-col items-center space-y-1 ${step === 'dashboard' ? 'text-emerald-400' : 'text-slate-500'}`}>
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">首页</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-slate-500">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">政策</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-slate-500">
            <History className="w-5 h-5" />
            <span className="text-[10px]">草稿</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-slate-500">
            <User className="w-5 h-5" />
            <span className="text-[10px]">我的</span>
          </button>
        </nav>
      )}
    </div>
  );
}
