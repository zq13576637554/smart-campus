import http from "../http";

/** 考试列表 */
export const $examPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/exam/page", data);

/** 考场安排 */
export const $examRoomsGet = (params: { examId: string }): Promise<any[]> =>
	http.get("/exam/rooms", { params });

/** 新增/编辑考试 */
export const $examSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/exam/save", data);

/** 发布考试安排 */
export const $examPublishPost = (data: { id: string; status?: string }): Promise<boolean> =>
	http.post("/exam/publish", data);

/** 考试统计 */
export const $examStatisticsGet = (): Promise<any> => http.get("/exam/statistics");
