import http from "../http";

/** 选课课程池 */
export const $enrollPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/enroll/page", data);

/** 某门课的选课学生 */
export const $enrollStudentsGet = (params: { courseId: string }): Promise<any[]> =>
	http.get("/enroll/students", { params });

/** 开放 / 关闭选课 */
export const $enrollTogglePost = (data: { id: string; open?: boolean }): Promise<boolean> =>
	http.post("/enroll/toggle", data);

/** 选课统计 */
export const $enrollStatisticsGet = (): Promise<any> => http.get("/enroll/statistics");
