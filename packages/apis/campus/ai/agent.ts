/**
 * @file 校园助手 Agent
 * @desc 三级路由：规则命中工具 → 直接返回（快且确定）；
 *       否则交给模型，模型可自行调用只读工具，再基于结果作答。
 *       全部为非流式兜底与流式输出混合：工具结果回来后再流式总结。
 */
import { $aiCopilotPost, $aiToolPost } from "../api/ai";
import { sync } from "lmUtils/promise";
import { AI_TOOLS } from "./tools";
import { CAMPUS_SYSTEM_PROMPT, chatWithModelStream, chatWithToolsStream, isModelEnabled } from "./provider";

export interface AgentResult {
	content: string;
	cards: any[];
	tool?: string;
	followUps?: string[];
	/** rule：规则直出；model：模型直接回答；tool：模型调用了工具 */
	source: "rule" | "model" | "tool";
}

interface AgentOptions {
	onDelta?: (delta: string, full: string) => void;
	signal?: AbortSignal;
	history?: { role: "user" | "assistant"; content: string }[];
}

const SYSTEM = [
	CAMPUS_SYSTEM_PROMPT,
	"你可以调用工具查询真实数据。需要具体数字时优先调用工具，不要凭空编造。",
	"如果问题不需要数据，直接用简洁中文回答，不要调用工具。"
].join("\n");

/** 把工具结果压成模型可读的简短上下文 */
const summarizeToolResult = (r: any) => {
	const metrics = (r?.cards || [])
		.flatMap((c: any) => c.metrics || [])
		.map((m: any) => `${m.label} ${m.value}${m.unit || ""}`)
		.join("；");
	return `${r?.reply || ""}${metrics ? `（关键指标：${metrics}）` : ""}`;
};

export async function askAgent(question: string, opts: AgentOptions = {}): Promise<AgentResult> {
	/* 1. 规则优先：命中工具直接返回 */
	const [ruleErr, ruleRes] = await sync($aiCopilotPost({ question }));
	const rule = ruleRes as any;
	if (!ruleErr && rule?.tool) {
		return { content: rule.reply || "", cards: rule.cards || [], tool: rule.tool, followUps: rule.followUps || [], source: "rule" };
	}

	/* 2. 未接模型：返回规则兜底文案 */
	if (!isModelEnabled) {
		return { content: rule?.reply || "暂时没有找到相关数据。", cards: [], followUps: rule?.followUps || [], source: "rule" };
	}

	/* 3. 模型 + 工具 */
	const messages: any[] = [
		{ role: "system", content: SYSTEM },
		...(opts.history || []).slice(-6),
		{ role: "user", content: question }
	];

	const plan = await chatWithToolsStream(messages, AI_TOOLS, {
		onDelta: opts.onDelta,
		signal: opts.signal
	});

	// 3.1 模型没调工具：内容已在流式过程中输出
	if (!plan.toolCalls.length) {
		return { content: plan.content, cards: [], source: "model" };
	}

	// 3.2 执行工具（最多 3 个）
	const calls = plan.toolCalls.slice(0, 3);
	const executed: { call: any; result: any }[] = [];
	for (const call of calls) {
		const [err, res] = await sync($aiToolPost({ name: call.name, args: call.args }));
		executed.push({ call, result: err ? null : res });
	}

	const okResults = executed.filter(e => e.result);
	if (!okResults.length) {
		return { content: plan.content || "工具执行失败，请换个问法再试试。", cards: [], source: "model" };
	}

	// 3.3 回传工具结果做总结。
	// 注意：assistant 的 tool_calls 必须与 tool 消息严格一一对应，否则上游直接 400，
	// 所以这里用同一份 calls 构造两边，失败的工具也要回一条说明。
	const assistantMessage = {
		role: "assistant" as const,
		content: plan.assistantMessage?.content || "",
		// 思考模式要求回传，否则上游 400
		reasoning_content: plan.assistantMessage?.reasoning_content,
		tool_calls: (plan.assistantMessage?.tool_calls || []).slice(0, calls.length)
	};

	const toolMessages = executed.map(e => ({
		role: "tool" as const,
		tool_call_id: e.call.id,
		content: e.result ? summarizeToolResult(e.result) : "该工具未返回数据"
	}));

	const cards = okResults.flatMap(e => e.result?.cards || []);
	const toolName = okResults.map(e => e.call.name).join(",");
	const followUps = okResults[0]?.result?.followUps || [];

	try {
		const final = await chatWithModelStream([...messages, assistantMessage, ...toolMessages], {
			onDelta: opts.onDelta,
			signal: opts.signal
		});
		return { content: final, cards, tool: toolName, followUps, source: "tool" };
	} catch (e: any) {
		// 总结失败不能让整轮失败：直接返回工具结论
		if (e?.name === "AbortError") throw e;
		return {
			content: okResults.map(r => r.result?.reply).filter(Boolean).join("\n\n"),
			cards,
			tool: toolName,
			followUps,
			source: "tool"
		};
	}
}
