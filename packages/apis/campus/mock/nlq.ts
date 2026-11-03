/**
 * @file 自然语言查询解析（NL2Query）
 * @desc 把"高一(1)班姓张的学生"这类自然语言，解析成列表页可用的查询条件。
 *       当前为规则引擎（词典命中 + 日期关键词 + 字段模式），
 *       接入真实模型时只需替换 parseNaturalQuery 的实现，前端与接口契约不变。
 */
import dayjs from "dayjs";

export type NlqKind = "text" | "select" | "enum" | "date";

export interface NlqSchemaItem {
	key: string;
	label: string;
	kind: NlqKind;
	options?: { label: string; value: any }[];
}

export interface NlqCondition {
	label: string;
	text: string;
}

export interface NlqResult {
	filters: Record<string, any>;
	conditions: NlqCondition[];
	explain: string;
	confidence: number;
}

/** 日期关键词 → 区间 */
function parseDateRange(question: string): [string, string] | null {
	const today = dayjs();
	const fmt = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");

	if (/今天|今日/.test(question)) return [fmt(today), fmt(today)];
	if (/昨天|昨日/.test(question)) return [fmt(today.subtract(1, "day")), fmt(today.subtract(1, "day"))];
	if (/前天/.test(question)) return [fmt(today.subtract(2, "day")), fmt(today.subtract(2, "day"))];
	if (/本周|这周|这一周/.test(question)) {
		const monday = today.subtract((today.day() + 6) % 7, "day");
		return [fmt(monday), fmt(today)];
	}
	if (/上周|上一周/.test(question)) {
		const monday = today.subtract((today.day() + 6) % 7, "day").subtract(7, "day");
		return [fmt(monday), fmt(monday.add(6, "day"))];
	}
	if (/本月|这个月|当月/.test(question)) return [fmt(today.startOf("month")), fmt(today)];
	if (/上月|上个月/.test(question)) {
		const start = today.subtract(1, "month").startOf("month");
		return [fmt(start), fmt(start.endOf("month"))];
	}
	const recent = question.match(/最近\s*(\d+)\s*天/);
	if (recent) return [fmt(today.subtract(Number(recent[1]) - 1, "day")), fmt(today)];
	const lastWeek = question.match(/(\d+)\s*天(?:内|以内|之内)/);
	if (lastWeek) return [fmt(today.subtract(Number(lastWeek[1]) - 1, "day")), fmt(today)];

	return null;
}

/**
 * 解析自然语言查询
 * @param question 用户输入
 * @param schema 当前页面支持的查询字段
 */
export function parseNaturalQuery(question: string, schema: NlqSchemaItem[]): NlqResult {
	const q = (question || "").replace(/\s+/g, " ").trim();
	const filters: Record<string, any> = {};
	const conditions: NlqCondition[] = [];

	if (!q) {
		return { filters, conditions, explain: "请输入查询描述", confidence: 0 };
	}

	/* 1. 选项命中（下拉 / 字典）：长标签优先，避免「高一」命中「高一(1)班」 */
	const optionFields = schema.filter(s => s.kind !== "text" && s.options?.length);
	const candidates = optionFields
		.flatMap(field => (field.options || []).map(opt => ({ field, opt })))
		.filter(c => String(c.opt.label).length >= 2)
		.sort((a, b) => String(b.opt.label).length - String(a.opt.label).length);

	for (const { field, opt } of candidates) {
		if (filters[field.key] !== undefined) continue;
		if (!q.includes(String(opt.label))) continue;
		filters[field.key] = opt.value;
		conditions.push({ label: field.label, text: String(opt.label) });
	}

	/* 2. 日期区间 */
	const dateField = schema.find(s => s.kind === "date");
	if (dateField && !filters[dateField.key]) {
		const range = parseDateRange(q);
		if (range) {
			filters[dateField.key] = range;
			conditions.push({ label: dateField.label, text: `${range[0]} ~ ${range[1]}` });
		}
	}

	/* 3. 文本字段：显式写法「姓名：张三」或「学号 202400001」 */
	schema
		.filter(s => s.kind === "text")
		.forEach(field => {
			if (filters[field.key]) return;
			const patterns = [
				new RegExp(`${field.label}\\s*[:：=]\\s*([\\u4e00-\\u9fa5A-Za-z0-9（）()_-]+)`),
				new RegExp(`${field.label}\\s*(?:是|为|叫)\\s*([\\u4e00-\\u9fa5A-Za-z0-9（）()_-]+)`),
				new RegExp(`${field.label}\\s+([\\u4e00-\\u9fa5A-Za-z0-9（）()_-]+)`)
			];
			for (const re of patterns) {
				const m = q.match(re);
				if (m?.[1]) {
					filters[field.key] = m[1];
					conditions.push({ label: field.label, text: m[1] });
					return;
				}
			}
		});

	/* 4. 姓名特例：「姓张」「张姓」 */
	const nameField = schema.find(s => s.kind === "text" && /姓名|学生/.test(s.label));
	if (nameField && !filters[nameField.key]) {
		const m = q.match(/姓\s*([\u4e00-\u9fa5])/) || q.match(/([\u4e00-\u9fa5])姓/);
		if (m?.[1]) {
			filters[nameField.key] = m[1];
			conditions.push({ label: nameField.label, text: `以「${m[1]}」开头` });
		}
	}

	/* 5. 生成解释 */
	const filtered = schema.filter(s => filters[s.key] !== undefined);
	const confidence = filtered.length
		? Math.min(0.95, 0.45 + filtered.length * 0.15)
		: 0;

	const explain = conditions.length
		? `已识别 ${conditions.length} 个条件，点击「应用条件」后自动查询`
		: "没有识别到有效条件，试试包含班级、状态或时间范围，例如「高一(1)班本周缺勤的记录」";

	return { filters, conditions, explain, confidence: Number(confidence.toFixed(2)) };
}
