import http from "../http";

/** 知识库检索 */
export const $aiKnowledgeSearchGet = (params: { keyword: string }): Promise<any[]> =>
	http.get("/ai/knowledge/search", { params });

/** 知识库全量 */
export const $aiKnowledgeListGet = (): Promise<any[]> => http.get("/ai/knowledge/list");

/** 生成学情报告 */
export const $aiReportPost = (data: { studentNo: string }): Promise<any> => http.post("/ai/report", data);

/** 自然语言 → 查询条件 */
export const $aiNl2QueryPost = (data: { question: string; schema: any[] }): Promise<{
	filters: Record<string, any>;
	conditions: { label: string; text: string }[];
	explain: string;
	confidence: number;
}> => http.post("/ai/nl2query", data);

/** 家长周报 */
export const $aiParentReportPost = (data: { studentNo: string }): Promise<any> =>
	http.post("/ai/parent-report", data);

export interface CopilotCard {
	type: "metrics" | "table";
	title: string;
	metrics?: { label: string; value: string | number; unit?: string }[];
	columns?: { label: string; prop: string }[];
	rows?: Record<string, any>[];
}

export interface CopilotResult {
	intent: string;
	tool: string;
	params: Record<string, any>;
	reply: string;
	cards: CopilotCard[];
	followUps: string[];
}

/** Copilot 对话（只读工具路由） */
export const $aiCopilotPost = (data: { question: string }): Promise<CopilotResult> =>
	http.post("/ai/copilot", data);

/** 报表解读 */
export const $aiReportInsightPost = (data: { reportType: string; rows: any[] }): Promise<{
	summary: string;
	findings: { level: string; text: string }[];
	suggestions: string[];
	metrics: { label: string; value: string | number; unit?: string }[];
}> => http.post("/ai/report-insight", data);

/**
 * AI 调用留痕
 * @desc 写入审计日志（谁在什么时候问了什么、由工具还是模型回答、耗时多少）
 */
export const $aiAuditPost = (data: {
	question: string;
	answer?: string;
	source?: string;
	cost?: number;
	success?: boolean;
	operator?: string;
	nickName?: string;
}): Promise<{ id: string }> => http.post("/ai/audit", data);
