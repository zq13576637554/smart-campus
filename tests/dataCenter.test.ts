import { describe, expect, it } from "vitest";
import { buildExportData, EXPORT_TYPES, IMPORT_TYPES } from "../packages/apis/campus/mock/dataCenter";
import { db } from "../packages/apis/campus/mock/db";

describe("导入导出中心", () => {
	it("导入类型包含学生档案且已开放", () => {
		const student = IMPORT_TYPES.find(t => t.key === "student");
		expect(student).toBeTruthy();
		expect(student?.available).toBe(true);
		expect(student?.route).toBe("/xsgl/import/");
		expect(student?.columns.some(c => c.required)).toBe(true);
	});

	it("导出类型覆盖 8 类数据", () => {
		expect(EXPORT_TYPES).toHaveLength(8);
		expect(EXPORT_TYPES.map(t => t.key)).toEqual([
			"student",
			"teacher",
			"attendance",
			"score",
			"leave",
			"bill",
			"asset",
			"log"
		]);
	});

	it("学生导出：行数对齐库中数据，枚举翻译为中文", () => {
		const r = buildExportData("student");
		expect(r.rows).toHaveLength(db.students.length);
		expect(r.columns.length).toBeGreaterThan(5);
		expect(r.fileName).toMatch(/^学生档案-\d{8}-\d{4}\.csv$/);

		const row = r.rows[0];
		expect(["男", "女"]).toContain(row.genderText);
		expect(["在读", "休学", "毕业", "退学"]).toContain(row.statusText);
	});

	it("考勤导出：类型与打卡方式有中文文案", () => {
		const r = buildExportData("attendance");
		const row = r.rows[0];
		expect(["正常", "迟到", "早退", "缺勤", "请假"]).toContain(row.typeText);
		expect(["人脸识别", "刷卡", "二维码", "手动"]).toContain(row.methodText);
	});

	it("未知类型抛出明确错误", () => {
		expect(() => buildExportData("not-exist")).toThrow("未知的导出类型");
	});
});
