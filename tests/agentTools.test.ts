import { describe, expect, it } from "vitest";
import { AI_TOOL_NAMES, AI_TOOLS } from "../packages/apis/campus/ai/tools";
import { runTool, TOOL_NAMES } from "../packages/apis/campus/mock/copilot";

describe("AI 工具（function calling）", () => {
	it("工具清单与后端执行器一一对应", () => {
		expect([...AI_TOOL_NAMES].sort()).toEqual([...TOOL_NAMES].sort());
	});

	it("每个工具都有合法的 JSON Schema", () => {
		AI_TOOLS.forEach(t => {
			expect(t.type).toBe("function");
			expect(t.function.name).toBeTruthy();
			expect(t.function.description.length).toBeGreaterThan(5);
			expect(t.function.parameters.type).toBe("object");
		});
	});

	it("只读约束：工具名不含写操作", () => {
		AI_TOOL_NAMES.forEach(name => {
			expect(name).not.toMatch(/add|create|update|delete|approve|remove/i);
		});
	});

	it("runTool 能按名称执行并命中目标工具", () => {
		const r = runTool("queryAttendance");
		expect(r?.tool).toBe("queryAttendance");
		expect(r?.cards.length).toBeGreaterThan(0);
	});

	it("runTool 透传参数（班级过滤）", () => {
		const r = runTool("queryAttendance", { className: "高一(1)班" });
		expect(r?.tool).toBe("queryAttendance");
		expect(r?.params?.className).toBe("高一(1)班");
	});

	it("runTool 支持最近 N 天参数", () => {
		const r = runTool("queryAttendance", { days: 7 });
		expect(r?.params?.days).toBe(7);
	});

	it("未知工具返回 null 而不是抛错", () => {
		expect(runTool("queryNothing")).toBeNull();
		expect(runTool("")).toBeNull();
	});

	it("每个工具都能被合成问题正确路由到自身", () => {
		TOOL_NAMES.forEach(name => {
			const r = runTool(name, {});
			expect(r?.tool, `工具 ${name} 未能命中`).toBe(name);
		});
	});
});
