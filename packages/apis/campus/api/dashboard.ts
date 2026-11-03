import http from "../http";

/** 首页概览（可按校区过滤） */
export const $dashboardOverviewGet = (params?: { campusId?: string }): Promise<any> =>
	http.get("/dashboard/overview", { params });

/** 校区列表 */
export const $campusesGet = (): Promise<any[]> => http.get("/auth/campuses");

/** AI 助手对话 */
export const $aiChatPost = (data: { question: string; sessionId?: string }): Promise<{ answer: string; references: string[]; time: string }> =>
	http.post("/ai/chat", data);
