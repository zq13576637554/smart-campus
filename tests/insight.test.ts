import { describe, expect, it } from "vitest";
import { buildReportInsight } from "../packages/apis/campus/mock/insight";

const attendanceRows = [
	{ className: "高一(1)班", rate: 98.5, absent: 2, late: 1 },
	{ className: "高一(2)班", rate: 88.0, absent: 12, late: 5 },
	{ className: "高一(3)班", rate: 95.2, absent: 4, late: 2 }
];

const scoreRows = [
	{ course: "语文", avg: 86.2, passRate: 96.0, max: 99 },
	{ course: "数学", avg: 68.4, passRate: 78.0, max: 95 },
	{ course: "英语", avg: 89.1, passRate: 97.5, max: 100 }
];

const billRows = [
	{ className: "高一(1)班", total: 10000, paid: 9800, unpaid: 200 },
	{ className: "高一(2)班", total: 12000, paid: 8000, unpaid: 4000 }
];

describe("buildReportInsight", () => {
	it("空数据给出兜底文案", () => {
		const r = buildReportInsight("attendance", []);
		expect(r.summary).toContain("没有数据");
		expect(r.suggestions).toHaveLength(1);
	});

	it("考勤报表指出最低出勤班级", () => {
		const r = buildReportInsight("attendance", attendanceRows);
		expect(r.summary).toContain("出勤率");
		expect(r.findings.some(f => f.text.includes("高一(2)班"))).toBe(true);
		expect(r.metrics.find(m => m.label === "累计缺勤")?.value).toBe(18);
		expect(r.suggestions.length).toBeGreaterThanOrEqual(3);
	});

	it("成绩报表指出薄弱学科", () => {
		const r = buildReportInsight("score", scoreRows);
		expect(r.summary).toContain("数学");
		expect(r.metrics.find(m => m.label === "薄弱学科")?.value).toBe("数学");
		expect(r.findings.some(f => f.level === "warn")).toBe(true);
	});

	it("缴费报表统计欠费与收缴率", () => {
		const r = buildReportInsight("bill", billRows);
		expect(r.metrics.find(m => m.label === "欠费")?.value).toBe("4,200");
		expect(r.findings.some(f => f.text.includes("高一(2)班"))).toBe(true);
	});

	it("花名册报表统计未分配宿舍", () => {
		const rows = [
			{ statusName: "在读", dorm: "A 栋101" },
			{ statusName: "在读", dorm: "" },
			{ statusName: "休学", dorm: "" }
		];
		const r = buildReportInsight("roster", rows);
		expect(r.metrics.find(m => m.label === "未分配宿舍")?.value).toBe(2);
		expect(r.findings.some(f => f.level === "warn")).toBe(true);
	});

	it("未知报表类型不报错", () => {
		const r = buildReportInsight("unknown", [{ a: 1 }]);
		expect(r.summary).toContain("1 条数据");
	});
});
