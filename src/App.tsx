import { useState, useMemo } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import { Calculator, AlertCircle } from 'lucide-react';
import {
  extractVariables,
  generateRelativeErrorTex,
  calculateResults,
  formatVarTex,
  previewFormulaTex
} from './mathUtils';

function App() {
  const [formula, setFormula] = useState<string>('2pi*L*m*(r_1^2 + r_2^2)/(T_1^2 - T_2^2)');
  
  // 实时变量字典，格式为 { "r_1": 1.2 }
  const [values, setValues] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, number>>({});

  // 记忆解析变量和生成的 LaTeX，减少渲染卡顿
  const extractedVars = useMemo(() => extractVariables(formula), [formula]);
  const relativeErrorTex = useMemo(() => generateRelativeErrorTex(formula, extractedVars), [formula, extractedVars]);
  
  // 检查公式格式是否合法
  const isValidFormula = extractedVars.length > 0 || formula.trim() === '';

  // 更新变量的值
  const handleValueChange = (v: string, val: string) => {
    setValues(prev => ({ ...prev, [v]: parseFloat(val) || 0 }));
  };

  // 更新变量的不确定度(Delta)
  const handleErrorChange = (v: string, err: string) => {
    setErrors(prev => ({ ...prev, [v]: parseFloat(err) || 0 }));
  };

  // 运行计算
  const results = useMemo(() => {
    if (!isValidFormula || extractedVars.length === 0) return null;
    return calculateResults(formula, extractedVars, values, errors);
  }, [formula, extractedVars, values, errors, isValidFormula]);

  // 工具函数：四舍五入保留适当的有效数字，为了直观简单，展示4位小数
  const formatNum = (num: number) => {
    if (!Number.isFinite(num)) return num.toString();
    return Number.parseFloat(num.toPrecision(5)).toString();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans selection:bg-blue-200">
      <header className="bg-blue-600 text-white shadow-md rounded-b-xl px-4 py-6 mb-6">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Calculator className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">大物实验计算器</h1>
            <p className="text-blue-100 text-sm opacity-90">composed by 五水 · 支持变量识别 · 自动生成误差公式</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 space-y-6">
        
        {/* 输入公式卡片 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            1. 输入函数公式
          </label>
          <input 
            type="text" 
            className="w-full text-lg border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-mono"
            placeholder="例如: m * g * h_1"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-2">
            提示：支持加减乘除(* /)、乘方(^)、对数(log)、三角函数(sin)等，下划线如 <code className="bg-slate-100 px-1 rounded">r_1</code> 会自动显示为下标，输入pi可自动识别为 π。
          </p>

          {/* 公式预览 */}
          {formula.trim() !== '' && (
             <div className="mt-4 pt-4 border-t border-slate-100">
               <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">公式预览 f =</div>
               <div className="overflow-x-auto overflow-y-hidden pb-2 whitespace-nowrap scrollbar-hide">
                 <BlockMath math={`f = ${previewFormulaTex(formula)}`} />
               </div>
             </div>
          )}
        </section>

        {/* 相对误差公式展示 */}
        {isValidFormula && relativeErrorTex && (
          <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-sm border border-blue-100 p-5">
            <label className="block text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              2. 相对误差公式
            </label>
            <div className="overflow-x-auto overflow-y-hidden pb-2 whitespace-nowrap scrollbar-hide text-indigo-950">
              <BlockMath math={relativeErrorTex} />
            </div>
          </section>
        )}

        {!isValidFormula && formula.trim() !== '' && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>无法解析公式，请检查输入格式是否正确。</span>
          </div>
        )}

        {/* 变量输入区 */}
        {extractedVars.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-4">
              3. 输入数据
            </label>
            
            <div className="space-y-4">
              {extractedVars.map(v => (
                <div key={v} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-3 flex justify-center text-lg bg-slate-50 py-2 rounded-lg border border-slate-100">
                    <InlineMath math={formatVarTex(v)} />
                  </div>
                  <div className="col-span-4 relative">
                    <span className="absolute text-xs text-slate-400 -top-2 left-2 bg-white px-1 leading-none z-10">值</span>
                    <input 
                      type="number"
                      step="any"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={values[v] ?? ''}
                      onChange={(e) => handleValueChange(v, e.target.value)}
                    />
                  </div>
                  <div className="col-span-5 relative">
                    <span className="absolute text-xs text-slate-400 -top-2 left-2 bg-white px-1 leading-none z-10 flex items-center">
                      <InlineMath math={`\\Delta`} /> 误差
                    </span>
                    <input 
                      type="number"
                      step="any"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      value={errors[v] ?? ''}
                      onChange={(e) => handleErrorChange(v, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 计算结果展示 */}
        {results && (
          <section className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 p-5">
            <label className="block text-sm font-semibold text-emerald-900 mb-4">
              4. 最终结果
            </label>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-200/50 pb-2">
                <span className="text-emerald-700 text-sm">函数值 <InlineMath math="f" /></span>
                <span className="font-mono text-lg font-bold text-emerald-950">{formatNum(results.fVal)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-200/50 pb-2">
                <span className="text-emerald-700 text-sm">绝对误差 <InlineMath math="\Delta f" /></span>
                <span className="font-mono text-lg font-bold text-emerald-950">{formatNum(results.deltaF)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-200/50 pb-2">
                <span className="text-emerald-700 text-sm">相对误差 <InlineMath math="E_r" /></span>
                <span className="font-mono text-lg font-bold text-emerald-950">{formatNum(results.relError)}%</span>
              </div>
              <div className="pt-2">
                <span className="text-emerald-700 text-sm mb-1 block">标准结果表示:</span>
                <div className="text-center py-4 bg-white rounded-xl border border-emerald-100 shadow-inner">
                  <span className="text-2xl text-emerald-950">
                    <InlineMath math={`f = ${formatNum(results.fVal)} \\pm ${formatNum(results.deltaF)}`} />
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

export default App;
