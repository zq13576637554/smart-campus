/**
 * @file 模型接入层
 * @desc 统一 Provider 契约：rule（规则引擎，离线可用）/ openai（OpenAI 兼容）/ ollama（本地）。
 *       密钥只存在于服务端代理，前端仅请求 /ai-proxy。
 */
export type ProviderName = "rule" | "openai" | "ollama";

export interface ChatMessage {
	role: "system" | "user" | "assistant" | "tool";
	content: string;
	/** assistant 发起工具调用时携带 */
	tool_calls?: any[];
	/** tool 角色的结果需要回填 id */
	tool_call_id?: string;
	/** DeepSeek 思考模式要求把推理内容原样回传 */
	reasoning_content?: string;
}

export const providerName = ((import.meta.env.VITE_AI_PROVIDER as string) || "rule") as ProviderName;
export const providerModel = (import.meta.env.VITE_AI_MODEL as string) || "gpt-4o-mini";
const AI_BASE = (import.meta.env.VITE_AI_BASE as string) || "/ai-proxy";

/** 当前是否接入了真实模型 */
export const isModelEnabled = providerName !== "rule";

export const PROVIDER_LABEL: Record<ProviderName, string> = {
	rule: "本地规则引擎",
	openai: "OpenAI 兼容模型",
	ollama: "本地 Ollama"
};

/**
 * 调用模型
 * @throws 未配置模型或请求失败时抛错，调用方需降级到规则引擎
 */
export async function chatWithModel(messages: ChatMessage[], opts: { signal?: AbortSignal; temperature?: number } = {}): Promise<string> {
	if (!isModelEnabled) throw new Error("RULE_ENGINE");

	const endpoint = providerName === "ollama" ? `${AI_BASE}/api/chat` : `${AI_BASE}/chat/completions`;
	const payload =
		providerName === "ollama"
			? { model: providerModel, messages, stream: false, options: { temperature: opts.temperature ?? 0.3 } }
			: { model: providerModel, messages, temperature: opts.temperature ?? 0.3, stream: false };

	const res = await fetch(endpoint, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload),
		signal: opts.signal
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`模型服务返回 ${res.status}${detail ? `：${detail.slice(0, 120)}` : ""}`);
	}

	const data = await res.json();
	const content =
		providerName === "ollama" ? data?.message?.content : data?.choices?.[0]?.message?.content;

	if (!content) throw new Error("模型返回内容为空");
	return String(content).trim();
}

/** 校园助手的系统提示词 */
export const CAMPUS_SYSTEM_PROMPT = [
	"你是「智慧校园」管理系统的 AI 助手，服务对象是学校管理者与教师。",
	"回答要求：中文、简洁、分点；涉及数据时先给结论再给依据；不确定时明确说明，不要编造数字。",
	"你只能基于提供的数据上下文回答；涉及未成年人信息时注意脱敏（不要输出完整身份证号、住址）。",
	"你不得给出处分、评优等最终结论，只能提供参考建议。"
].join("\n");

export interface StreamOptions {
	signal?: AbortSignal;
	temperature?: number;
	/** 每收到一段增量文本回调一次 */
	onDelta?: (delta: string, full: string) => void;
}

/**
 * 从一行流式数据里取出增量文本（纯函数，便于单测）
 * @desc OpenAI 兼容：`data: {"choices":[{"delta":{"content":"…"}}]}`，结束标记 `data: [DONE]`
 *       Ollama：每行一个 JSON，内容在 `message.content`
 */
export function parseStreamLine(line: string): any | null {
	const raw = (line || "").trim();
	if (!raw) return null;

	const payloadText = raw.startsWith("data:") ? raw.slice(5).trim() : raw;
	if (!payloadText || payloadText === "[DONE]") return null;

	try {
		return JSON.parse(payloadText);
	} catch {
		// 半行 / 心跳 / 非 JSON
		return null;
	}
}

export function extractDelta(line: string, provider: ProviderName = providerName): string {
	const json = parseStreamLine(line);
	if (!json) return "";
	const delta = provider === "ollama" ? (json?.message?.content ?? "") : (json?.choices?.[0]?.delta?.content ?? "");
	return typeof delta === "string" ? delta : "";
}

/**
 * 流式调用模型（SSE / NDJSON）
 * @desc 逐块解析上游返回，边收边回调，实现"逐字输出"。
 *       代理层已做透传（server/ai-proxy.mjs），这里只负责解析与拼接。
 * @returns 完整文本
 */
export async function chatWithModelStream(messages: ChatMessage[], opts: StreamOptions = {}): Promise<string> {
	if (!isModelEnabled) throw new Error("RULE_ENGINE");

	const endpoint = providerName === "ollama" ? `${AI_BASE}/api/chat` : `${AI_BASE}/chat/completions`;
	const payload =
		providerName === "ollama"
			? { model: providerModel, messages, stream: true, options: { temperature: opts.temperature ?? 0.3 } }
			: { model: providerModel, messages, temperature: opts.temperature ?? 0.3, stream: true };

	const res = await fetch(endpoint, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload),
		signal: opts.signal
	});

	if (!res.ok || !res.body) {
		const detail = await res.text().catch(() => "");
		throw new Error(`模型服务返回 ${res.status}${detail ? `：${detail.slice(0, 120)}` : ""}`);
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";

	const handleLine = (raw: string) => {
		const delta = extractDelta(raw);
		if (!delta) return;
		full += delta;
		opts.onDelta?.(delta, full);
	};

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";
		lines.forEach(handleLine);
	}
	// 处理最后残留的一行
	if (buffer) handleLine(buffer);

	if (!full.trim()) throw new Error("模型返回内容为空");
	return full.trim();
}

export interface ToolCallResult {
	id: string;
	name: string;
	args: Record<string, any>;
}

export interface ToolStreamResult {
	content: string;
	toolCalls: ToolCallResult[];
	/** 需要回传给模型的 assistant 消息（仅在发生工具调用时非空） */
	assistantMessage: ChatMessage | null;
}

/**
 * 带工具的流式调用（function calling）
 * @desc 边流边累积 tool_calls 分片；无工具调用时内容已经流式输出完毕
 */
export async function chatWithToolsStream(
	messages: ChatMessage[],
	tools: any[],
	opts: StreamOptions & { toolChoice?: "auto" | "none" } = {}
): Promise<ToolStreamResult> {
	if (!isModelEnabled) throw new Error("RULE_ENGINE");

	const endpoint = providerName === "ollama" ? `${AI_BASE}/api/chat` : `${AI_BASE}/chat/completions`;
	const payload =
		providerName === "ollama"
			? { model: providerModel, messages, tools, stream: true, options: { temperature: opts.temperature ?? 0.3 } }
			: {
					model: providerModel,
					messages,
					tools,
					tool_choice: opts.toolChoice ?? "auto",
					temperature: opts.temperature ?? 0.3,
					stream: true
				};

	const res = await fetch(endpoint, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload),
		signal: opts.signal
	});

	if (!res.ok || !res.body) {
		const detail = await res.text().catch(() => "");
		throw new Error(`模型服务返回 ${res.status}${detail ? `：${detail.slice(0, 120)}` : ""}`);
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";
	let reasoning = "";
	const acc = new Map<number, { id: string; name: string; args: string }>();

	const handleLine = (raw: string) => {
		const json = parseStreamLine(raw);
		if (!json) return;

		const delta = providerName === "ollama" ? json?.message : json?.choices?.[0]?.delta;
		if (!delta) return;

		if (typeof delta.content === "string" && delta.content) {
			full += delta.content;
			opts.onDelta?.(delta.content, full);
		}

		// 思考模式：推理内容需要原样带回，否则多轮工具调用会 400
		if (typeof delta.reasoning_content === "string") reasoning += delta.reasoning_content;

		(delta.tool_calls || []).forEach((tc: any, i: number) => {
			const idx = typeof tc.index === "number" ? tc.index : i;
			const cur = acc.get(idx) || { id: "", name: "", args: "" };
			if (tc.id) cur.id = tc.id;
			if (tc.function?.name) cur.name += tc.function.name;
			if (tc.function?.arguments) cur.args += tc.function.arguments;
			acc.set(idx, cur);
		});
	};

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";
		lines.forEach(handleLine);
	}
	if (buffer) handleLine(buffer);

	const toolCalls: ToolCallResult[] = Array.from(acc.values())
		.filter(c => c.name)
		.map(c => {
			let args: Record<string, any> = {};
			try {
				args = c.args ? JSON.parse(c.args) : {};
			} catch {
				args = {};
			}
			return { id: c.id || `call_${c.name}`, name: c.name, args };
		});

	const assistantMessage: ChatMessage | null = toolCalls.length
		? {
				role: "assistant",
				content: full,
				...(reasoning ? { reasoning_content: reasoning } : {}),
				tool_calls: toolCalls.map(c => ({
					id: c.id,
					type: "function",
					function: { name: c.name, arguments: JSON.stringify(c.args) }
				}))
			}
		: null;

	return { content: full.trim(), toolCalls, assistantMessage };
}

