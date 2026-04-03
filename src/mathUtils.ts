// mathUtils.ts
import { parse, derivative, simplify } from 'mathjs';

// 排除的内置常数和函数名，不作为独立变量
const BUILT_IN_CONSTANTS = ['pi', 'e', 'i', 'tau', 'phi'];

/**
 * 将变量名（如 r_1）转换为标准 LaTeX 格式（如 r_{1}）
 */
export function formatVarTex(v: string): string {
    // 处理 mathjs toTex() 时可能转义了下划线的情况 (如 T\_1)
    let formatted = v.replace(/\\_/g, '_');
    
    // 处理独立存在的 pi 转换为 \pi，防止重复转换已有的 \pi
    formatted = formatted.replace(/(^|[^\\])\bpi\b/g, '$1\\pi');
    
    // 将类似 T_1 或 V_max 等变量转成标准 LaTeX 的下标包裹结构 T_{1}
    return formatted.replace(/([a-zA-Z][a-zA-Z0-9]*)_([a-zA-Z0-9]+)/g, '$1_{$2}');
}

/**
 * 将公式转换为 LaTeX 格式用于美观预览
 */
export function previewFormulaTex(formula: string): string {
    try {
        if (!formula.trim()) return '';
        // 尝试使用 math.js 强大的 toTex 能力来生成规范的分数、乘方和希腊字母
        const tex = parse(formula).toTex({ parenthesis: 'auto' });
        return formatVarTex(tex);
    } catch (e) {
        // 如果公式输入到一半报错，回退到普通替换
        return formatVarTex(formula.replace(/\*/g, '\\cdot '));
    }
}

/**
 * 提取公式中包含的所有变量
 */
export function extractVariables(formula: string): string[] {
    try {
        const node = parse(formula);
        const vars = new Set<string>();
        node.traverse((n: any, _path: any, parent: any) => {
            if (n.isSymbolNode) {
                // 如果是函数名，则排除
                if (parent && parent.isFunctionNode && parent.fn.name === n.name) {
                    return;
                }
                if (!BUILT_IN_CONSTANTS.includes(n.name)) {
                    vars.add(n.name);
                }
            }
        });
        return Array.from(vars);
    } catch (e) {
        return [];
    }
}

/**
 * 生成相对误差的各个独立项
 * 返回格式: { variable: string, termTex: string }[]
 */
export function generateRelativeErrorTerms(formula: string, vars: string[]): { variable: string; termTex: string }[] {
    try {
        const fNode = parse(formula);
        const terms: { variable: string; termTex: string }[] = [];
        
        for (const v of vars) {
            // 对变量求偏导 df / dv
            const df = derivative(fNode, v);
            // 相对误差项 = df / (f * dv) 的系数 = df / f
            const relDf = simplify(`(${df.toString()}) / (${fNode.toString()})`);
            
            // 转为 LaTeX
            let tex = relDf.toTex({ parenthesis: 'auto' });
            
            // 修复下划线变量的 LaTeX 渲染
            tex = formatVarTex(tex);
            const vTex = formatVarTex(v);
            
            // 单独的项：绝对值乘以 Delta
            terms.push({
                variable: v,
                termTex: `\\left| ${tex} \\right| \\Delta ${vTex}`
            });
        }
        
        return terms;
    } catch (e) {
        return [];
    }
}

/**
 * 执行数据计算：基于用户输入的值和误差
 */
export function calculateResults(formula: string, vars: string[], values: Record<string, number>, errors: Record<string, number>) {
    try {
        const parsedFormula = parse(formula);
        const compiledF = parsedFormula.compile();
        
        // 评估当前函数值
        const fVal = compiledF.evaluate(values);
        
        // 计算绝对误差 Delta f = Sum | df_i | * Delta x_i
        let deltaF = 0;
        for (const v of vars) {
            const dfNode = derivative(parsedFormula, v);
            const dfVal = dfNode.compile().evaluate(values);
            const vError = errors[v] || 0;
            deltaF += Math.abs(dfVal) * vError;
        }
        
        // 计算相对误差百分比
        const relError = Math.abs(fVal) > 0 ? (deltaF / Math.abs(fVal)) * 100 : 0;
        
        return { 
            fVal, 
            deltaF, 
            relError 
        };
    } catch (e) {
        return null;
    }
}