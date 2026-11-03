import { describe, expect, it } from "vitest";
import { runCopilot } from "../packages/apis/campus/mock/copilot";

describe("Copilot 工具路由", () => {
	it("请假类问题命中 queryLeave，而不是被「学生」抢走", () => {
		expect(runCopilot("有多少学生请假待审批").tool).toBe("queryLeave");
	});

	it.each([
		["本周考勤怎么样", "queryAttendance"],
		["高二数学成绩分析", "queryScores"],
		["一卡通余额不足的名单", "queryCards"],
		["宿舍报修还有多少待处理", "queryRepairs"],
		["综合素质评价分布", "queryEvaluations"],
		["现在有几名学生", "queryStudents"]
	])("「%s」→ %s", (question, tool) => {
		expect(runCopilot(question).tool).toBe(tool);
	});

	it("无关问题回落到 chat 意图（由上层补充回答）", () => {
		const r = runCopilot("今天天气怎么样");
		expect(r.intent).toBe("chat");
		expect(r.reply).toBe("");
		expect(r.cards).toHaveLength(0);
	});

	it("返回结构：结论 + 指标卡 + 明细 + 追问", () => {
		const r = runCopilot("本周考勤怎么样");
		expect(r.reply.length).toBeGreaterThan(10);
		expect(r.cards.length).toBe(2);
		expect(r.cards[0].type).toBe("metrics");
		expect(r.cards[0].metrics).toHaveLength(4);
		expect(r.cards[1].type).toBe("table");
		expect(r.followUps.length).toBeGreaterThan(0);
	});

	it("只读约束：结果里不包含任何写操作字段", () => {
		const r = runCopilot("本周考勤怎么样");
		const text = JSON.stringify(r);
		expect(text).not.toMatch(/approve|delete|update|create/i);
	});
});
