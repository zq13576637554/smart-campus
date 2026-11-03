/** 首字母大写 */
export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

/** 下划线转驼峰 */
export const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

/** 驼峰转下划线 */
export const toSnake = (s: string) => s.replace(/([A-Z])/g, "_$1").toLowerCase();

/** kebab */
export const toKebab = (s: string) => s.replace(/([A-Z])/g, "-$1").toLowerCase();

/** 字符串截断 */
export const truncate = (s: string, len: number, suffix = "...") => (s && s.length > len ? s.slice(0, len) + suffix : s || "");

/** 拼音首字母（仅常用汉字，演示用） */
const PINYIN_MAP: Record<string, string> = {
	张: "z",
	王: "w",
	李: "l",
	赵: "z",
	刘: "l",
	陈: "c",
	杨: "y",
	黄: "h",
	周: "z",
	吴: "w",
	徐: "x",
	孙: "s",
	马: "m",
	朱: "z",
	胡: "h",
	郭: "g",
	何: "h",
	高: "g",
	林: "l",
	罗: "l",
	郑: "z",
	梁: "l",
	谢: "x",
	宋: "s",
	唐: "t",
	许: "x",
	韩: "h",
	冯: "f",
	邓: "d",
	曹: "c",
	彭: "p",
	曾: "z",
	肖: "x",
	田: "t",
	董: "d",
	袁: "y",
	潘: "p",
	蒋: "j",
	蔡: "c",
	余: "y",
	杜: "d"
};

export function firstLetter(name: string) {
	if (!name) return "";
	const c = name[0];
	if (PINYIN_MAP[c]) return PINYIN_MAP[c].toUpperCase();
	return /[a-zA-Z]/.test(c) ? c.toUpperCase() : "#";
}

/** 生成唯一 id */
let seed = 0;
export const uid = (prefix = "lm") => `${prefix}_${Date.now().toString(36)}_${(seed++).toString(36)}`;

/** 简单模板替换 */
export const template = (str: string, data: Record<string, any>) =>
	str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ""));
