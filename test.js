import { parse, derivative, simplify } from 'mathjs';
import { generateRelativeErrorTex, formatVarTex } from './src/mathUtils.js';

const form = "2 * (T_1 * T_2^2 - T_1^3) / (T_1^2 - T_2^2)^2";
const vars = ["T_1", "T_2"];

console.log(generateRelativeErrorTex(form, vars));
