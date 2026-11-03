import { describe, expect, it } from "vitest";
import { buildParentReport } from "../packages/apis/campus/mock/parentReport";

const student = { name: "钟明轩", studentNo: "202400020", className: "高一(1)班" };

const scores = [
	{ courseName: "语文", score: 99 },
	{ courseName: "数学", score: 62 },
	{ courseName: "英语", score: 100 }
];

const attendance = [
	{ type: "NORMAL" },
	{ type: "NORMAL" },
	{ type: "LATE" },
	{ type: "ABSENT" }
];

const leaves = [{ status: "APPROVED" }, { status: "REJECTED" }];

describe("buildParentReport", () => {
	it("生成完整结构", () => {
		const r = buildParentReport(student, scores, attendance, leaves, null);
		expect(r.student.name).toBe("钟明轩");
		expect(r.metrics).toHaveLength(4);
		expect(r.highlights.length).toBeGreaterThan(0);
		expect(r.advice.length).toBeGreaterThan(0);
		expect(r.week).toContain("~");
	});

	it("出勤率与迟到缺勤计数正确", () => {
		const r = buildParentReport(student, scores, attendance, leaves, null);
		// 4 条记录，2 条正常 => 50%
		expect(r.metrics.find(m => m.label === "本周出勤")?.value).toBe(50);
		expect(r.metrics.find(m => m.label === "迟到/缺勤")?.value).toBe("1/1");
	});

	it("给出优势学科与需关注学科", () => {
		const r = buildParentReport(student, scores, attendance, leaves, null);
		// 英语 100 分最高
		expect(r.highlights.some(h => h.type === "good" && h.text.includes("英语"))).toBe(true);
		expect(r.highlights.some(h => h.type === "warn" && h.text.includes("数学"))).toBe(true);
		expect(r.advice.some(a => a.includes("数学"))).toBe(true);
	});

	it("有缺勤时提示核对补假", () => {
		const r = buildParentReport(student, scores, attendance, leaves, null);
		expect(r.highlights.some(h => h.text.includes("缺勤"))).toBe(true);
	});

	it("综合素质评价存在时纳入亮点", () => {
		const evaluation = { moral: 20, academic: 20, physical: 16, art: 15, level: "D" };
		const r = buildParentReport(student, scores, attendance, leaves, evaluation);
		expect(r.highlights.some(h => h.title === "综合素质")).toBe(true);
	});

	it("无成绩时用 -- 占位且不崩", () => {
		const r = buildParentReport(student, [], [], [], null);
		expect(r.metrics.find(m => m.label === "综合均分")?.value).toBe("--");
		expect(r.summary).toContain("暂无新成绩");
	});
});
