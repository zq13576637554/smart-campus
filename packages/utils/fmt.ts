/** 数字千分位 */
export function thousands(num: number | string, digits = 0): string {
	const n = Number(num);
	if (Number.isNaN(n)) return "--";
	return n.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** 金额格式化 */
export const formatMoney = (v: number | string, prefix = "¥", digits = 2) => {
	const n = Number(v);
	if (Number.isNaN(n)) return "--";
	return `${prefix}${thousands(n, digits)}`;
};

/** 百分比 */
export function formatPercent(v: number | string, digits = 1): string {
	const n = Number(v);
	if (Number.isNaN(n)) return "--";
	return `${(n * 100).toFixed(digits)}%`;
}

/** 文本省略 */
export function ellipsis(text: string, len = 12): string {
	if (!text) return "";
	return text.length > len ? `${text.slice(0, len)}...` : text;
}

/** 数字补零 */
export const padZero = (n: number, len = 2) => String(n).padStart(len, "0");

/** 文件大小 */
export function formatFileSize(size: number): string {
	if (!size) return "0B";
	const unit = ["B", "KB", "MB", "GB", "TB"];
	let i = 0;
	let s = size;
	while (s >= 1024 && i < unit.length - 1) {
		s /= 1024;
		i++;
	}
	return `${s.toFixed(i === 0 ? 0 : 1)}${unit[i]}`;
}

/** 手机号脱敏 */
export const maskPhone = (phone: string) => (phone ? String(phone).replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "");

/** 身份证脱敏 */
export const maskIdCard = (id: string) =>
	id ? String(id).replace(/^(.{4}).*(.{4})$/, "$1**********$2") : "";
