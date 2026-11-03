import { describe, expect, it } from "vitest";
import { parseNaturalQuery, type NlqSchemaItem } from "../packages/apis/campus/mock/nlq";

const schema: NlqSchemaItem[] = [
	{ key: "name", label: "姓名", kind: "text" },
	{
		key: "className",
		label: "所属班级",
		kind: "select",
		options: [
			{ label: "高一(1)班", value: "G1C1" },
			{ label: "高一(2)班", value: "G1C2" },
			{ label: "高二(1)班", value: "G2C1" }
		]
	},
	{
		key: "status",
		label: "学籍状态",
		kind: "enum",
		options: [
			{ label: "在读", value: "STUDYING" },
			{ label: "休学", value: "SUSPENDED" }
		]
	},
	{ key: "dateRange", label: "时间范围", kind: "date" }
];

describe("parseNaturalQuery", () => {
	it("识别班级与姓氏", () => {
		const r = parseNaturalQuery("高一(1)班姓张的学生", schema);
		expect(r.filters.className).toBe("G1C1");
		expect(r.filters.name).toBe("张");
		expect(r.conditions).toHaveLength(2);
		expect(r.confidence).toBeGreaterThan(0.5);
	});

	it("识别字典选项", () => {
		const r = parseNaturalQuery("查一下在读的学生", schema);
		expect(r.filters.status).toBe("STUDYING");
	});

	it("长标签优先，不被短标签抢占", () => {
		const withShort: NlqSchemaItem[] = [
			{
				key: "className",
				label: "班级",
				kind: "select",
				options: [
					{ label: "高一", value: "G1" },
					{ label: "高一(1)班", value: "G1C1" }
				]
			}
		];
		expect(parseNaturalQuery("高一(1)班的学生", withShort).filters.className).toBe("G1C1");
	});

	it("解析本周为日期区间", () => {
		const r = parseNaturalQuery("本周的记录", schema);
		const range = r.filters.dateRange as string[];
		expect(range).toHaveLength(2);
		expect(range[0] <= range[1]).toBe(true);
	});

	it("解析最近 N 天", () => {
		const r = parseNaturalQuery("最近7天的考勤", schema);
		expect(r.filters.dateRange).toHaveLength(2);
	});

	it("支持「姓名：张三」显式写法", () => {
		const r = parseNaturalQuery("姓名：张三", schema);
		expect(r.filters.name).toBe("张三");
	});

	it("空输入返回提示且置信度为 0", () => {
		const r = parseNaturalQuery("   ", schema);
		expect(r.conditions).toHaveLength(0);
		expect(r.confidence).toBe(0);
		expect(r.explain).toContain("请输入");
	});

	it("无法识别时给出引导文案", () => {
		const r = parseNaturalQuery("随便看看", schema);
		expect(r.conditions).toHaveLength(0);
		expect(r.explain).toContain("没有识别到有效条件");
	});
});
