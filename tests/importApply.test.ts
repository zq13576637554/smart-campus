import { describe, expect, it } from "vitest";
import { applyImport } from "../packages/apis/campus/mock/importApply";
import { db } from "../packages/apis/campus/mock/db";
import { IMPORT_DEFS, IMPORT_OPTIONS } from "../packages/apis/campus/import/defs";

describe("通用导入", () => {
	it("导入定义覆盖 4 类数据，选项与定义一致", () => {
		expect(Object.keys(IMPORT_DEFS)).toEqual(["student", "teacher", "course", "score"]);
		expect(IMPORT_OPTIONS).toHaveLength(4);
		expect(IMPORT_DEFS.student.columns.some(c => c.required)).toBe(true);
	});

	it("教职工：同批次内工号重复只入一条", () => {
		const before = db.teachers.length;
		const r = applyImport("teacher", [
			{ name: "测试甲", teacherNo: "T-TEST-001", subject: "数学", phone: "13800001111" },
			{ name: "测试乙", teacherNo: "T-TEST-001", subject: "语文", phone: "13900002222" }
		]);
		expect(r.success).toBe(1);
		expect(r.failed).toHaveLength(1);
		expect(r.failed[0].message).toContain("已存在");
		expect(db.teachers.length).toBe(before + 1);
	});

	it("教职工：工号为空被拒绝", () => {
		const r = applyImport("teacher", [{ name: "无工号", teacherNo: "", subject: "数学" }]);
		expect(r.success).toBe(0);
		expect(r.failed[0].message).toContain("工号不能为空");
	});

	it("课程：编码重复被拒绝，学分为空时取默认值", () => {
		const r1 = applyImport("course", [{ courseName: "测试课", courseNo: "C-TEST-001" }]);
		expect(r1.success).toBe(1);
		const created = db.courses.find(c => c.courseNo === "C-TEST-001");
		expect(created?.credit).toBe(2);

		const r2 = applyImport("course", [{ courseName: "重复课", courseNo: "C-TEST-001" }]);
		expect(r2.success).toBe(0);
		expect(r2.failed[0].message).toContain("已存在");
	});

	it("成绩：学号不存在被拒绝", () => {
		const r = applyImport("score", [
			{ studentNo: "999999999", courseName: "数学", score: "88" }
		]);
		expect(r.success).toBe(0);
		expect(r.failed[0].message).toContain("不存在");
	});

	it("成绩：分数越界在服务端同样被拒绝", () => {
		const first = db.students[0];
		const r = applyImport("score", [
			{ studentNo: first.studentNo, courseName: "数学", score: "200" }
		]);
		expect(r.success).toBe(0);
		expect(r.failed[0].message).toContain("0-150");
	});

	it("成绩：合法行写入并回填学生信息", () => {
		const first = db.students[0];
		const before = db.scores.length;
		const r = applyImport("score", [
			{ studentNo: first.studentNo, courseName: "数学", score: "92", examType: "期中考试" }
		]);
		expect(r.success).toBe(1);
		expect(db.scores.length).toBe(before + 1);
		const saved = db.scores[db.scores.length - 1];
		expect(saved.name).toBe(first.name);
		expect(saved.className).toBe(first.className);
	});

	it("未知类型返回明确提示", () => {
		const r = applyImport("unknown", [{ a: 1 }]);
		expect(r.success).toBe(0);
		expect(r.failed[0].message).toContain("暂不支持");
	});
});
