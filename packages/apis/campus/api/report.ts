import http from "../http";

/** 运行报表 */
export const $reportRunPost = (data: Record<string, any>): Promise<{ columns: any[]; rows: any[]; total: number }> =>
	http.post("/report/run", data);
