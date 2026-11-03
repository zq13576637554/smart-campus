import { describe, expect, it } from "vitest";
import { extractDelta } from "../packages/apis/campus/ai/provider";

describe("extractDelta（流式解析）", () => {
	it("解析 OpenAI 增量块", () => {
		const line = 'data: {"choices":[{"delta":{"content":"你好"}}]}';
		expect(extractDelta(line, "openai")).toBe("你好");
	});

	it("忽略 [DONE] 结束标记", () => {
		expect(extractDelta("data: [DONE]", "openai")).toBe("");
	});

	it("忽略空行与心跳", () => {
		expect(extractDelta("", "openai")).toBe("");
		expect(extractDelta("   ", "openai")).toBe("");
		expect(extractDelta(": ping", "openai")).toBe("");
	});

	it("忽略没有 delta 的块（usage / role 首帧）", () => {
		expect(extractDelta('data: {"choices":[{"delta":{"role":"assistant"}}]}', "openai")).toBe("");
		expect(extractDelta('data: {"usage":{"total_tokens":10}}', "openai")).toBe("");
	});

	it("解析不完整 JSON 时不抛错", () => {
		expect(extractDelta('data: {"choices":[{"delta":{"content":"你', "openai")).toBe("");
	});

	it("解析 Ollama NDJSON", () => {
		const line = '{"message":{"role":"assistant","content":"好"},"done":false}';
		expect(extractDelta(line, "ollama")).toBe("好");
	});

	it("Ollama 结束帧无内容", () => {
		expect(extractDelta('{"message":{"content":""},"done":true}', "ollama")).toBe("");
	});

	it("默认按当前 provider 解析", () => {
		// 未接模型时 providerName 为 rule，OpenAI 格式仍能正确取出内容
		expect(extractDelta('data: {"choices":[{"delta":{"content":"x"}}]}')).toBe("x");
	});
});
