/**
 * @file 通用导入落库
 * @desc 把导入页校验通过的行写入 mock 库，返回成功/失败统计。
 *       与前端校验互补：这里负责「重复检测」与「字段补齐」。
 */
import { dayjs } from "lmUtils/time";
import { db } from "./db";

export type ImportType = "student" | "teacher" | "course" | "score";

export interface ImportResult {
	success: number;
	failed: { row: number; message: string }[];
}

/** 学生导入沿用既有接口，这里只处理其余三类 */
export function applyImport(type: string, rows: Record<string, any>[]): ImportResult {
	const failed: ImportResult["failed"] = [];
	let success = 0;

	const push = (index: number, message: string) => failed.push({ row: index + 2, message });

	if (type === "teacher") {
		const exists = new Set(db.teachers.map(t => t.teacherNo));
		rows.forEach((row, i) => {
			const no = String(row.teacherNo || "").trim();
			if (!no) return push(i, "工号不能为空");
			if (exists.has(no)) return push(i, `工号 ${no} 已存在`);
			exists.add(no);
			db.teachers.push({
				id: `T${Date.now()}${i}`,
				teacherNo: no,
				name: String(row.name || "").trim(),
				gender: row.gender === "女" ? "F" : "M",
				subject: String(row.subject || "").trim(),
				title: String(row.title || "教师").trim(),
				phone: String(row.phone || "").trim(),
				email: "",
				deptName: String(row.subject || "").trim(),
				status: "ACTIVE"
			} as any);
			success++;
		});
		return { success, failed };
	}

	if (type === "course") {
		const exists = new Set(db.courses.map(c => c.courseNo));
		rows.forEach((row, i) => {
			const no = String(row.courseNo || "").trim();
			if (!no) return push(i, "课程编码不能为空");
			if (exists.has(no)) return push(i, `课程编码 ${no} 已存在`);
			exists.add(no);
			db.courses.push({
				id: `C${Date.now()}${i}`,
				courseNo: no,
				courseName: String(row.courseName || "").trim(),
				teacherId: "",
				teacherName: String(row.teacherName || "").trim(),
				credit: Number(row.credit) || 2,
				hours: (Number(row.credit) || 2) * 16,
				type: "必修",
				grade: row.grade || "高一",
				term: "2025-2026 学年第一学期"
			} as any);
			success++;
		});
		return { success, failed };
	}

	if (type === "score") {
		rows.forEach((row, i) => {
			const studentNo = String(row.studentNo || "").trim();
			const student = db.students.find(s => s.studentNo === studentNo);
			if (!student) return push(i, `学号 ${studentNo} 不存在`);
			const score = Number(row.score);
			if (!Number.isFinite(score) || score < 0 || score > 150) return push(i, "成绩需在 0-150 之间");
			db.scores.push({
				id: `S${Date.now()}${i}`,
				studentId: student.id,
				studentNo,
				name: student.name,
				className: student.className,
				grade: student.grade,
				term: "2025-2026 学年第一学期",
				examType: String(row.examType || "期中考试"),
				courseName: String(row.courseName || "").trim(),
				score,
				examTime: dayjs().format("YYYY-MM-DD")
			} as any);
			success++;
		});
		return { success, failed };
	}

	// 学生：走 /student/import，这里兜底返回 0
	return { success: 0, failed: [{ row: 1, message: `暂不支持的导入类型：${type}` }] };
}
