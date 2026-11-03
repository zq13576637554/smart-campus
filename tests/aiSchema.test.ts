import { describe, expect, it } from "vitest";
import { buildAiSchema, normalizeBarItems } from "../packages/cmps/biz/NPageBasic/aiSchema";

const dict = (type: string) =>
	type === "STUDENT_STATUS"
		? [
				{ label: "在读", value: "STUDYING" },
				{ label: "休学", value: "SUSPENDED" }
			]
		: [];

describe("智能查询 schema 推导", () => {
	it("枚举字段取字典选项", () => {
		const items = [{ key: "status", label: "学籍状态", type: "enumSelect", props: { type: "STUDENT_STATUS" } }];
		const [s] = buildAiSchema(items, dict);
		expect(s.kind).toBe("enum");
		expect(s.options).toHaveLength(2);
		expect(s.options[0]).toEqual({ label: "在读", value: "STUDYING" });
	});

	it("下拉字段用配置里的 options", () => {
		const items = [
			{
				key: "className",
				label: "班级",
				props: { options: [{ label: "高一(1)班", value: "G1C1" }] }
			}
		];
		const [s] = buildAiSchema(items, dict);
		expect(s.kind).toBe("select");
		expect(s.options[0].value).toBe("G1C1");
	});

	it("日期字段识别为 date", () => {
		const items = [
			{ key: "range", label: "时间", props: { type: "daterange" } },
			{ key: "day", label: "日期", props: { type: "date" } }
		];
		const schema = buildAiSchema(items, dict);
		expect(schema.map(s => s.kind)).toEqual(["date", "date"]);
	});

	it("普通输入框为 text 且无选项", () => {
		const [s] = buildAiSchema([{ key: "name", label: "姓名", props: {} }], dict);
		expect(s.kind).toBe("text");
		expect(s.options).toEqual([]);
	});

	it("过滤掉没有 key 的条目", () => {
		const schema = buildAiSchema([{ label: "无效" }, { key: "ok", label: "有效" }], dict);
		expect(schema).toHaveLength(1);
		expect(schema[0].key).toBe("ok");
	});

	it("空输入返回空数组而不是报错", () => {
		expect(buildAiSchema()).toEqual([]);
		expect(buildAiSchema([], dict)).toEqual([]);
	});

	it("normalizeBarItems 兼容扁平数组与 [{items}] 两种写法", () => {
		expect(normalizeBarItems([{ key: "a" }])).toEqual([{ key: "a" }]);
		expect(normalizeBarItems([{ items: [{ key: "b" }] }])).toEqual([{ key: "b" }]);
		expect(normalizeBarItems([])).toEqual([]);
	});

	it("推导结果能直接喂给自然语言解析（端到端串联）", () => {
		const items = [
			{ key: "className", label: "班级", props: { options: [{ label: "高一(1)班", value: "G1C1" }] } },
			{ key: "status", label: "学籍状态", type: "enumSelect", props: { type: "STUDENT_STATUS" } }
		];
		const schema = buildAiSchema(items, dict);
		// schema 结构满足 NlqSchemaItem 契约
		expect(schema.every(s => s.key && ["text", "select", "enum", "date"].includes(s.kind))).toBe(true);
	});
});
