import { describe, expect, it } from "vitest";
import { buildTodo } from "../packages/apis/campus/mock/todo";

const deps = {
	leaves: [
		{ id: "L1", studentName: "张三", studentNo: "2024001", className: "高一(1)班", type: "病假", days: 5, startDate: "2026-11-01", endDate: "2026-11-05", status: "PENDING", applyTime: "2026-11-01 08:00:00" },
		{ id: "L2", studentName: "李四", studentNo: "2024002", className: "高一(1)班", type: "事假", days: 1, startDate: "2026-11-02", endDate: "2026-11-02", status: "PENDING", applyTime: "2026-11-02 08:00:00" },
		{ id: "L3", studentName: "王五", studentNo: "2024003", className: "高一(2)班", type: "事假", days: 1, startDate: "2026-11-02", endDate: "2026-11-02", status: "APPROVED", applyTime: "2026-11-02 09:00:00" }
	],
	repairs: [
		{ id: "R1", dorm: "A 栋 101", reporter: "张三", type: "空调", description: "不制冷", createTime: "2026-11-02 10:00:00", status: "PENDING", level: "URGENT" },
		{ id: "R2", dorm: "B 栋 202", reporter: "李四", type: "照明", description: "灯管闪烁", createTime: "2026-11-02 11:00:00", status: "PENDING", level: "NORMAL" },
		{ id: "R3", dorm: "C 栋 303", reporter: "王五", type: "网络", description: "断网", createTime: "2026-11-02 12:00:00", status: "DONE", level: "NORMAL" }
	],
	visitors: [
		{ id: "V1", name: "赵先生", company: "市教育局", visitTarget: "校长办", reason: "工作交流", visitTime: "2026-11-03 14:00", status: "PENDING", personCount: 2 },
		{ id: "V2", name: "钱女士", company: "家长", visitTarget: "教务处", reason: "家长会", visitTime: "2026-11-20 14:00", status: "PENDING", personCount: 1 },
		{ id: "V3", name: "孙先生", company: "供应商", visitTarget: "后勤", reason: "送货", visitTime: "2026-11-03 09:00", status: "VISITED", personCount: 1 }
	],
	bills: [
		{ id: "B1", studentName: "张三", studentNo: "2024001", className: "高一(1)班", feeType: "学费", amount: 1000, paid: 0, status: "UNPAID", dueDate: "2026-10-01" },
		{ id: "B2", studentName: "李四", studentNo: "2024002", className: "高一(1)班", feeType: "学费", amount: 1000, paid: 500, status: "PARTIAL", dueDate: "2026-10-01" },
		{ id: "B3", studentName: "王五", studentNo: "2024004", className: "高一(1)班", feeType: "住宿费", amount: 800, paid: 800, status: "PAID", dueDate: "2026-10-01" }
	]
};

describe("buildTodo 待办聚合", () => {
	it("只统计待处理项，已通过/已完成/已缴费的不计入", () => {
		const r = buildTodo(deps);
		const ids = r.items.map(i => i.id);
		expect(ids).not.toContain("L3");
		expect(ids).not.toContain("R3");
		expect(ids).not.toContain("V3");
		expect(ids).not.toContain("B3");
	});

	it("账单按班级聚合成催缴单", () => {
		const r = buildTodo(deps);
		const bills = r.items.filter(i => i.category === "bill");
		// 高一(1)班 的 2 笔未缴合并为 1 条，住宿费已缴不计
		expect(bills).toHaveLength(1);
		expect(bills[0].desc).toContain("2 笔");
		expect(bills[0].desc).toContain("待缴 ¥1,500");
	});

	it("紧急优先级：逾期账单、紧急工单、当天来访、长假", () => {
		const r = buildTodo(deps);
		const urgentIds = r.items.filter(i => i.level === "urgent").map(i => i.id);
		expect(urgentIds).toContain("L1"); // 5 天假
		expect(urgentIds).toContain("R1"); // URGENT 工单
		expect(urgentIds.some(id => id.startsWith("bill-"))).toBe(true); // 已逾期
	});

	it("排序：紧急项排在最前", () => {
		const r = buildTodo(deps);
		const firstNormal = r.items.findIndex(i => i.level === "normal");
		if (firstNormal !== -1) {
			expect(r.items.slice(firstNormal).every(i => i.level === "normal")).toBe(true);
		}
	});

	it("分类筛选只返回该类", () => {
		const r = buildTodo(deps, "leave");
		expect(r.items.every(i => i.category === "leave")).toBe(true);
		expect(r.items).toHaveLength(2);
	});

	it("分组统计与总数一致", () => {
		const r = buildTodo(deps);
		const sum = r.groups.reduce((a, g) => a + g.count, 0);
		expect(sum).toBe(r.total);
	});

	it("空数据不报错", () => {
		const r = buildTodo({ leaves: [], repairs: [], visitors: [], bills: [] });
		expect(r.total).toBe(0);
		expect(r.groups).toHaveLength(4);
	});
});
