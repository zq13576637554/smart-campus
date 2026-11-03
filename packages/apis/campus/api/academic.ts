import http from "../http";

/* ---------------- 学生 ---------------- */
export const $studentPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/student/page", data);

export const $studentDetailGet = (params: { id: string }): Promise<any> => http.get("/student/detail", { params });

export const $studentSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/student/save", data);

export const $studentDeletePost = (data: { id?: string; ids?: string[] }): Promise<boolean> =>
	http.post("/student/delete", data);

/** 批量导入：返回成功条数与失败明细 */
export const $studentImportPost = (
	rows: Record<string, any>[]
): Promise<{ success: number; failed: { row: number; message: string }[] }> =>
	http.post("/student/import", { rows });

export const $studentStatisticsGet = (): Promise<any> => http.get("/student/statistics");

/* ---------------- 班级 ---------------- */
export const $classPagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/class/page", data);

export const $classSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/class/save", data);

export const $classDeletePost = (data: { id: string }): Promise<boolean> => http.post("/class/delete", data);

export const $classOptionsGet = (): Promise<{ label: string; value: string; grade: string }[]> => http.get("/class/options");

/* ---------------- 课程 ---------------- */
export const $coursePagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/course/page", data);

export const $courseSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/course/save", data);

export const $courseDeletePost = (data: { id: string }): Promise<boolean> => http.post("/course/delete", data);

export const $courseStatisticsGet = (): Promise<any> => http.get("/course/statistics");

/* ---------------- 课表 ---------------- */
export const $scheduleListGet = (params: { classId: string }): Promise<any> =>
	http.get("/schedule/list", { params });

export const $scheduleOverviewGet = (): Promise<any> => http.get("/schedule/overview");

/* ---------------- 考勤 ---------------- */
export const $attendancePagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/attendance/page", data);

export const $attendanceStatisticsGet = (): Promise<any> => http.get("/attendance/statistics");

export const $attendanceSavePost = (data: Record<string, any>): Promise<boolean> =>
	http.post("/attendance/save", data);

/* ---------------- 成绩 ---------------- */
export const $scorePagePost = (data: Record<string, any>): Promise<{ content: any[]; total: number }> =>
	http.post("/score/page", data);

export const $scoreSavePost = (data: Record<string, any>): Promise<boolean> => http.post("/score/save", data);

export const $scoreAnalysisGet = (): Promise<any> => http.get("/score/analysis");
