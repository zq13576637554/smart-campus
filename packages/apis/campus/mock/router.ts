/**
 * @file mock 路由表
 * @desc 模拟后端接口：入参、分页、过滤、统计都在这里实现
 */
import { dayjs } from "lmUtils/time";
import { LOCAL_DICTS } from "../enums";
import { auditLogs, dictTypes, enrollCourses, enrollRecords, examRooms, exams, initEnrollments, leaves, menuNodes, messages } from "./extra";
import {
	assets,
	bills,
	bookBorrows,
	busRoutes,
	consumeAlerts,
	energyRecords,
	evalRecords,
	evaluations,
	initEvaluations,
	repairOrders,
	visitors
} from "./extra2";
import { knowledgeDocs, searchKnowledge } from "./knowledge";
import { runCopilot } from "./copilot";
import { buildReportInsight } from "./insight";
import { parseNaturalQuery } from "./nlq";
import { buildParentReport } from "./parentReport";
import { buildTodo } from "./todo";
import {
	db,
	type AccessRecord,
	type Attendance,
	type CampusCard,
	type CardTx,
	type Course,
	type Dorm,
	type Notice,
	type Score,
	type Student,
	type Teacher
} from "./db";

export interface MockContext {
	params: Record<string, any>;
	url: string;
	method: string;
}

export interface MockRoute {
	method: string;
	/** 匹配规则：字符串前缀或正则 */
	match: string | RegExp;
	handler: (ctx: MockContext) => any;
}

const ok = <T>(result: T) => ({ status: true, code: 200, msg: "", result });

/** 分页 */
const paginate = (list: any[], params: Record<string, any>) => {
	const pageNumber = Number(params.pageNumber) || 1;
	const pageSize = Number(params.pageSize) || 10;
	const start = (pageNumber - 1) * pageSize;
	return { content: list.slice(start, start + pageSize), total: list.length, pageNumber, pageSize };
};

const kw = (val: any, keyword: any) =>
	!keyword || String(val ?? "").toLowerCase().includes(String(keyword).toLowerCase().trim());

const eq = (val: any, target: any) => target === undefined || target === null || target === "" || String(val) === String(target);

/** 多字段模糊匹配：参数为空时不过滤，避免 "A || B" 在参数缺失时恒为真 */
const matchAny = (keyword: any, ...values: any[]) => !keyword || values.some(v => kw(v, keyword));

const isRange = (date: string, start?: string, end?: string) => {
	if (!start && !end) return true;
	const d = dayjs(date).valueOf();
	if (start && d < dayjs(start).valueOf()) return false;
	if (end && d > dayjs(end).valueOf()) return false;
	return true;
};

const sortDesc = (list: any[], key = "createdAt") => list.slice().sort((a, b) => String(b[key] || "").localeCompare(String(a[key] || "")));

export const mockRoutes: MockRoute[] = [
	/* ---------------- 认证 ---------------- */
	{
		method: "POST",
		match: "/auth/login",
		handler: ({ params }) => {
			const { userName, password } = params;
			const user = db.users.find(u => u.userName === userName);
			if (!user || password !== "123456") {
				return { status: false, code: 400, msg: "账号或密码错误（演示账号：admin / 123456）", result: null };
			}
			if (user.status !== "ENABLED") return { status: false, code: 400, msg: "账号已被停用", result: null };
			return ok({
				token: `mock-token-${user.userName}-${Date.now()}`,
				tokenHead: "Bearer ",
				expiresIn: 7200,
				userInfo: buildUserInfo(user)
			});
		}
	},
	{
		method: "GET",
		match: "/auth/userInfo",
		handler: () => ok(buildUserInfo(db.users[0]))
	},
	{
		method: "GET",
		match: "/auth/campuses",
		handler: () =>
			ok([
				{ id: "main", name: "主校区", code: "MAIN", students: 382, teachers: 78, address: "南昌市红谷滩区学府大道 1 号" },
				{ id: "east", name: "东湖校区", code: "EAST", students: 168, teachers: 42, address: "南昌市东湖区湖滨路 88 号" },
				{ id: "north", name: "北岭校区", code: "NORTH", students: 96, teachers: 26, address: "南昌市新建区北岭大道 6 号" }
			])
	},
	{
		method: "GET",
		match: "/auth/menus",
		handler: () => ok(buildMenus())
	},
	{
		method: "POST",
		match: "/auth/logout",
		handler: () => ok(true)
	},
	{
		method: "GET",
		match: "/common/enums",
		handler: () => ok(buildEnums())
	},

	/* ---------------- 首页 ---------------- */
	{
		method: "GET",
		match: "/dashboard/overview",
		handler: ({ params }) => {
			const campusId = params.campusId || "main";
			const factor = campusId === "main" ? 1 : campusId === "east" ? 0.42 : 0.25;
			const campusName = campusId === "main" ? "主校区" : campusId === "east" ? "东湖校区" : "北岭校区";
			const scale = (n: number) => Math.max(1, Math.round(Number(n) * factor));
			const studying = db.students.filter(s => s.status === "STUDYING").length;
			const todayAttendance = db.weeklyAttendance[db.weeklyAttendance.length - 1];
			return ok({
				campusName,
				cards: [
					{ label: "在校学生", value: scale(studying), unit: "人", type: "primary", trend: 2.4, tips: "含在籍在读学生" },
					{ label: "教职工", value: scale(db.teachers.length + 42), unit: "人", type: "success", trend: 1.1 },
					{ label: "教学班级", value: scale(db.classes.length), unit: "个", type: "warning", trend: 0 },
					{ label: "今日出勤率", value: todayAttendance.rate, unit: "%", type: "primary", trend: 0.6, trendText: "较昨日" },
					{
						label: "今日消费额",
						value: scale(
							db.cardTxes.filter(t => dayjs(t.time).isSame(dayjs(), "day")).reduce((a, b) => a + Math.abs(b.amount), 0)
						),
						unit: "元",
						type: "danger",
						trend: -3.2
					},
					{ label: "异常门禁", value: scale(db.accessRecords.filter(a => a.status === "ABNORMAL").length), unit: "次", type: "danger", trend: -12.5, tips: "近 7 天异常通行" }
				],
				attendanceTrend: db.weeklyAttendance,
				consumeTrend: db.monthlyConsume,
				scoreDistribution: db.scoreDistribution,
				gradeRank: db.gradeRank,
				classRank: buildClassRank().slice(0, 8),
				notices: db.notices.slice(0, 6),
				alerts: buildAlerts(),
				deviceStatus: [
					{ name: "人脸闸机", total: 26, online: 24 },
					{ name: "监控摄像头", total: 168, online: 163 },
					{ name: "智能班牌", total: 48, online: 47 },
					{ name: "一卡通终端", total: 32, online: 30 }
				]
			});
		}
	},

	/* ---------------- 学生 ---------------- */
	{
		method: "POST",
		match: "/student/page",
		handler: ({ params }) => {
			let list = db.students.filter(
				s =>
					kw(s.name, params.name) &&
					kw(s.studentNo, params.studentNo) &&
					eq(s.gender, params.gender) &&
					eq(s.classId, params.classId) &&
					eq(s.grade, params.grade) &&
					eq(s.status, params.status)
			);
			list = sortDesc(list, "createdAt");
			return ok(paginate(list, params));
		}
	},
	{
		method: "GET",
		match: "/student/detail",
		handler: ({ params }) => ok(db.students.find(s => s.id === params.id) || null)
	},
	{
		method: "POST",
		match: "/student/save",
		handler: ({ params }) => {
			if (params.id) {
				const index = db.students.findIndex(s => s.id === params.id);
				if (index > -1) db.students[index] = { ...db.students[index], ...params };
				return ok(true);
			}
			const cls = db.classes.find(c => c.id === params.classId);
			const id = `S${String(db.students.length + 1).padStart(5, "0")}`;
			db.students.unshift({
				...params,
				id,
				studentNo: params.studentNo || `2024${String(db.students.length + 1).padStart(5, "0")}`,
				className: cls?.className || params.className || "",
				grade: cls?.grade || params.grade || "",
				status: params.status || "STUDYING",
				createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
				avatarColor: "#165DFF"
			} as Student);
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/student/import",
		handler: ({ params }) => {
			const list: Record<string, any>[] = params.rows || [];
			const failed: { row: number; message: string }[] = [];
			let success = 0;

			list.forEach((r, index) => {
				const rowNo = index + 2;
				if (!r.name) return failed.push({ row: rowNo, message: "姓名不能为空" });
				if (!r.studentNo) return failed.push({ row: rowNo, message: "学号不能为空" });
				if (db.students.some(s => s.studentNo === r.studentNo)) {
					return failed.push({ row: rowNo, message: `学号 ${r.studentNo} 已存在` });
				}
				if (r.phone && !/^1[3-9]\d{9}$/.test(String(r.phone))) {
					return failed.push({ row: rowNo, message: "手机号格式不正确" });
				}
				const cls = db.classes.find(c => c.className === r.className || c.id === r.className);
				db.students.unshift({
					id: `S${String(db.students.length + 1).padStart(5, "0")}`,
					studentNo: String(r.studentNo),
					name: r.name,
					gender: r.gender === "女" ? "F" : "M",
					grade: cls?.grade || "高一",
					classId: cls?.id || "",
					className: cls?.className || r.className || "",
					major: cls?.major || "综合",
					phone: r.phone || "",
					idCard: r.idCard || "",
					status: r.status === "休学" ? "SUSPENDED" : "STUDYING",
					dorm: r.dorm || "",
					bedNo: r.bedNo || "",
					enrollDate: dayjs().format("YYYY-MM-DD"),
					birthday: "",
					address: r.address || "",
					guardian: r.guardian || "",
					guardianPhone: r.guardianPhone || "",
					createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
					avatarColor: "#165DFF"
				} as Student);
				success++;
			});

			return ok({ success, failed });
		}
	},
	{
		method: "POST",
		match: "/student/delete",
		handler: ({ params }) => {
			const ids: string[] = params.ids || [params.id];
			ids.forEach(id => {
				const i = db.students.findIndex(s => s.id === id);
				if (i > -1) db.students.splice(i, 1);
			});
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/student/statistics",
		handler: () => {
			const byGrade = ["高一", "高二", "高三"].map(g => ({
				name: g,
				value: db.students.filter(s => s.grade === g).length
			}));
			const byGender = [
				{ name: "男生", value: db.students.filter(s => s.gender === "M").length, color: "#165DFF" },
				{ name: "女生", value: db.students.filter(s => s.gender === "F").length, color: "#F53F3F" }
			];
			const byStatus = [
				{ name: "在读", value: db.students.filter(s => s.status === "STUDYING").length },
				{ name: "休学", value: db.students.filter(s => s.status === "SUSPENDED").length },
				{ name: "毕业", value: db.students.filter(s => s.status === "GRADUATED").length },
				{ name: "退学", value: db.students.filter(s => s.status === "QUIT").length }
			];
			return ok({ total: db.students.length, byGrade, byGender, byStatus });
		}
	},

	/* ---------------- 教师 ---------------- */
	{
		method: "POST",
		match: "/teacher/page",
		handler: ({ params }) => {
			const list = db.teachers.filter(
				t =>
					kw(t.name, params.name) &&
					kw(t.teacherNo, params.teacherNo) &&
					eq(t.subject, params.subject) &&
					eq(t.title, params.title) &&
					eq(t.status, params.status)
			);
			return ok(paginate(sortDesc(list, "joinDate"), params));
		}
	},
	{
		method: "POST",
		match: "/teacher/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = db.teachers.findIndex(t => t.id === params.id);
				if (i > -1) db.teachers[i] = { ...db.teachers[i], ...params };
				return ok(true);
			}
			db.teachers.unshift({
				...params,
				id: `T${String(db.teachers.length + 1).padStart(4, "0")}`,
				teacherNo: params.teacherNo || `JS${Date.now()}`,
				status: params.status || "ON_JOB",
				courseCount: 0,
				avatarColor: "#00B42A"
			} as Teacher);
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/teacher/delete",
		handler: ({ params }) => {
			const i = db.teachers.findIndex(t => t.id === params.id);
			if (i > -1) db.teachers.splice(i, 1);
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/teacher/statistics",
		handler: () => {
			const bySubject = Array.from(new Set(db.teachers.map(t => t.subject))).map(s => ({
				name: s,
				value: db.teachers.filter(t => t.subject === s).length
			}));
			const byTitle = ["PROFESSOR", "ASSOCIATE", "LECTURER", "ASSISTANT"].map(t => ({
				name: LOCAL_DICTS.TEACHER_TITLE.find(d => d.value === t)?.label || t,
				value: db.teachers.filter(x => x.title === t).length
			}));
			return ok({ total: db.teachers.length, bySubject, byTitle, onJob: db.teachers.filter(t => t.status === "ON_JOB").length });
		}
	},

	/* ---------------- 班级 ---------------- */
	{
		method: "POST",
		match: "/class/page",
		handler: ({ params }) => {
			const list = db.classes.filter(c => kw(c.className, params.className) && eq(c.grade, params.grade) && eq(c.major, params.major));
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/class/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = db.classes.findIndex(c => c.id === params.id);
				if (i > -1) db.classes[i] = { ...db.classes[i], ...params };
				return ok(true);
			}
			db.classes.unshift({
				...params,
				id: `C${String(db.classes.length + 1).padStart(2, "0")}`,
				classNo: params.classNo || `G${Date.now()}`,
				studentCount: 0,
				status: "NORMAL",
				createdAt: dayjs().format("YYYY-MM-DD")
			} as any);
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/class/delete",
		handler: ({ params }) => {
			const i = db.classes.findIndex(c => c.id === params.id);
			if (i > -1) db.classes.splice(i, 1);
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/class/options",
		handler: () => ok(db.classes.map(c => ({ label: c.className, value: c.id, grade: c.grade })))
	},

	/* ---------------- 课程 ---------------- */
	{
		method: "POST",
		match: "/course/page",
		handler: ({ params }) => {
			const list = db.courses.filter(
				c =>
					kw(c.courseName, params.courseName) &&
					eq(c.type, params.type) &&
					eq(c.grade, params.grade) &&
					kw(c.teacherName, params.teacherName)
			);
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/course/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = db.courses.findIndex(c => c.id === params.id);
				if (i > -1) db.courses[i] = { ...db.courses[i], ...params };
				return ok(true);
			}
			db.courses.unshift({
				...params,
				id: `K${String(db.courses.length + 1).padStart(4, "0")}`,
				courseNo: `KC${String(db.courses.length + 1).padStart(4, "0")}`,
				status: "OPEN",
				term: "2025-1"
			} as Course);
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/course/delete",
		handler: ({ params }) => {
			const i = db.courses.findIndex(c => c.id === params.id);
			if (i > -1) db.courses.splice(i, 1);
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/course/statistics",
		handler: () => {
			const byType = ["REQUIRED", "ELECTIVE", "PRACTICE"].map(t => ({
				name: LOCAL_DICTS.COURSE_TYPE.find(d => d.value === t)?.label || t,
				value: db.courses.filter(c => c.type === t).length
			}));
			return ok({ total: db.courses.length, byType, avgCredit: 2.4 });
		}
	},

	/* ---------------- 课表 ---------------- */
	{
		method: "GET",
		match: "/schedule/list",
		handler: ({ params }) => {
			const classId = params.classId || db.classes[0].id;
			const list = db.schedules.filter(s => s.classId === classId);
			return ok({ classId, className: db.classes.find(c => c.id === classId)?.className, list });
		}
	},
	{
		method: "GET",
		match: "/schedule/overview",
		handler: () => {
			const todayItems = db.schedules.filter(s => s.day === dayjs().day() || (dayjs().day() === 0 && s.day === 7));
			return ok({
				todayCount: todayItems.length,
				totalCourses: db.courses.length,
				teachers: db.teachers.length,
				rooms: new Set(db.schedules.map(s => s.room)).size
			});
		}
	},

	/* ---------------- 考勤 ---------------- */
	{
		method: "POST",
		match: "/attendance/page",
		handler: ({ params }) => {
			let list = db.attendances.filter(
				a =>
					kw(a.name, params.name) &&
					kw(a.studentNo, params.studentNo) &&
					eq(a.className, params.className) &&
					eq(a.type, params.type) &&
					eq(a.method, params.method) &&
					isRange(a.date, params.startDate, params.endDate)
			);
			list = list.slice().sort((a, b) => b.date.localeCompare(a.date));
			return ok(paginate(list, params));
		}
	},
	{
		method: "GET",
		match: "/attendance/statistics",
		handler: () => {
			const typeMap: Record<string, number> = {};
			db.attendances.forEach(a => (typeMap[a.type] = (typeMap[a.type] || 0) + 1));
			const total = db.attendances.length;
			const byType = ["NORMAL", "LATE", "EARLY", "ABSENT", "LEAVE"].map(t => ({
				name: (LOCAL_DICTS.ATTENDANCE_TYPE.find(d => d.value === t)?.label || t) as string,
				value: typeMap[t] || 0,
				rate: Number((((typeMap[t] || 0) / total) * 100).toFixed(1))
			}));
			const byMethod = ["FACE", "CARD", "QRCODE", "MANUAL"].map(t => ({
				name: LOCAL_DICTS.CHECK_METHOD.find(d => d.value === t)?.label || t,
				value: db.attendances.filter(a => a.method === t).length
			}));
			return ok({
				total,
				normalRate: Number((((typeMap.NORMAL || 0) / total) * 100).toFixed(1)),
				byType,
				byMethod,
				trend: db.weeklyAttendance
			});
		}
	},
	{
		method: "POST",
		match: "/attendance/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = db.attendances.findIndex(a => a.id === params.id);
				if (i > -1) db.attendances[i] = { ...db.attendances[i], ...params };
				return ok(true);
			}
			db.attendances.unshift({
				...params,
				id: `AT${String(db.attendances.length + 1).padStart(5, "0")}`,
				date: params.date || dayjs().format("YYYY-MM-DD"),
				method: params.method || "MANUAL"
			} as Attendance);
			return ok(true);
		}
	},

	/* ---------------- 成绩 ---------------- */
	{
		method: "POST",
		match: "/score/page",
		handler: ({ params }) => {
			const list = db.scores.filter(
				s =>
					kw(s.name, params.name) &&
					kw(s.studentNo, params.studentNo) &&
					eq(s.className, params.className) &&
					eq(s.courseName, params.courseName) &&
					eq(s.examType, params.examType) &&
					eq(s.level, params.level)
			);
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/score/save",
		handler: ({ params }) => {
			const i = db.scores.findIndex(s => s.id === params.id);
			if (i > -1) {
				const score = Number(params.score);
				const level = score >= 90 ? "EXCELLENT" : score >= 75 ? "GOOD" : score >= 60 ? "PASS" : "FAIL";
				db.scores[i] = { ...db.scores[i], ...params, score, level };
			}
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/score/analysis",
		handler: () => {
			const courses = ["语文", "数学", "英语", "物理", "化学"];
			const byCourse = courses.map(c => {
				const list = db.scores.filter(s => s.courseName === c);
				const avg = list.reduce((a, b) => a + b.score, 0) / (list.length || 1);
				return {
					name: c,
					avg: Number(avg.toFixed(1)),
					max: Math.max(...list.map(s => s.score), 0),
					min: Math.min(...list.map(s => s.score), 100),
					passRate: Number(((list.filter(s => s.score >= 60).length / (list.length || 1)) * 100).toFixed(1))
				};
			});
			const byLevel = ["EXCELLENT", "GOOD", "PASS", "FAIL"].map(l => ({
				name: LOCAL_DICTS.SCORE_LEVEL.find(d => d.value === l)?.label || l,
				value: db.scores.filter(s => s.level === l).length
			}));
			const topStudents = Object.values(
				db.scores.reduce((acc: Record<string, any>, s) => {
					acc[s.studentNo] = acc[s.studentNo] || { studentNo: s.studentNo, name: s.name, className: s.className, total: 0, count: 0 };
					acc[s.studentNo].total += s.score;
					acc[s.studentNo].count++;
					return acc;
				}, {})
			)
				.map((s: any) => ({ ...s, avg: Number((s.total / s.count).toFixed(1)) }))
				.sort((a: any, b: any) => b.avg - a.avg)
				.slice(0, 10);
			return ok({ byCourse, byLevel, distribution: db.scoreDistribution, topStudents });
		}
	},

	/* ---------------- 宿舍 ---------------- */
	{
		method: "POST",
		match: "/dorm/page",
		handler: ({ params }) => {
			const list = db.dorms.filter(
				d => kw(d.roomNo, params.roomNo) && eq(d.building, params.building) && eq(d.status, params.status)
			);
			return ok(paginate(list, params));
		}
	},
	{
		method: "GET",
		match: "/dorm/statistics",
		handler: () => {
			const totalBeds = db.dorms.reduce((a, b) => a + b.capacity, 0);
			const usedBeds = db.dorms.reduce((a, b) => a + b.used, 0);
			const byBuilding = Array.from(new Set(db.dorms.map(d => d.building))).map(b => ({
				name: b,
				total: db.dorms.filter(d => d.building === b).reduce((a, x) => a + x.capacity, 0),
				used: db.dorms.filter(d => d.building === b).reduce((a, x) => a + x.used, 0)
			}));
			return ok({
				rooms: db.dorms.length,
				totalBeds,
				usedBeds,
				usageRate: Number(((usedBeds / totalBeds) * 100).toFixed(1)),
				byBuilding
			});
		}
	},
	{
		method: "POST",
		match: "/dorm/save",
		handler: ({ params }) => {
			const i = db.dorms.findIndex(d => d.id === params.id);
			if (i > -1) db.dorms[i] = { ...db.dorms[i], ...params };
			return ok(true);
		}
	},

	/* ---------------- 一卡通 ---------------- */
	{
		method: "POST",
		match: "/card/page",
		handler: ({ params }) => {
			const list = db.cards.filter(c => kw(c.name, params.name) && kw(c.cardNo, params.cardNo) && eq(c.status, params.status));
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/card/tx/page",
		handler: ({ params }) => {
			let list = db.cardTxes.filter(
				t =>
					kw(t.name, params.name) &&
					kw(t.cardNo, params.cardNo) &&
					eq(t.bizType, params.bizType) &&
					isRange(t.time, params.startTime, params.endTime)
			);
			list = list.slice().sort((a, b) => b.time.localeCompare(a.time));
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/card/recharge",
		handler: ({ params }) => {
			const card = db.cards.find(c => c.id === params.id || c.cardNo === params.cardNo);
			if (!card) return { status: false, code: 404, msg: "卡号不存在", result: null };
			const amount = Number(params.amount || 0);
			if (amount <= 0) return { status: false, code: 400, msg: "充值金额必须大于 0", result: null };
			card.balance = Number((card.balance + amount).toFixed(2));
			db.cardTxes.unshift({
				id: `TX${String(db.cardTxes.length + 1).padStart(5, "0")}`,
				cardNo: card.cardNo,
				name: card.name,
				studentNo: card.studentNo,
				bizType: "RECHARGE",
				amount,
				balance: card.balance,
				place: "校园卡充值中心",
				time: dayjs().format("YYYY-MM-DD HH:mm:ss")
			} as CardTx);
			return ok(card);
		}
	},
	{
		method: "GET",
		match: "/card/statistics",
		handler: () => {
			const consume = db.cardTxes.filter(t => t.bizType === "CONSUME");
			const recharge = db.cardTxes.filter(t => t.bizType === "RECHARGE");
			const byPlace = Array.from(new Set(consume.map(t => t.place))).map(p => ({
				name: p,
				value: Number(Math.abs(consume.filter(t => t.place === p).reduce((a, b) => a + b.amount, 0)).toFixed(0))
			}));
			return ok({
				totalBalance: Number(db.cards.reduce((a, b) => a + b.balance, 0).toFixed(2)),
				consumeAmount: Number(Math.abs(consume.reduce((a, b) => a + b.amount, 0)).toFixed(2)),
				rechargeAmount: Number(recharge.reduce((a, b) => a + b.amount, 0).toFixed(2)),
				byPlace,
				monthly: db.monthlyConsume
			});
		}
	},

	/* ---------------- 门禁 ---------------- */
	{
		method: "POST",
		match: "/access/page",
		handler: ({ params }) => {
			let list = db.accessRecords.filter(
				a =>
					kw(a.personName, params.personName) &&
					kw(a.personNo, params.personNo) &&
					eq(a.personType, params.personType) &&
					eq(a.device, params.device) &&
					eq(a.direction, params.direction) &&
					eq(a.status, params.status) &&
					isRange(a.time, params.startTime, params.endTime)
			);
			list = list.slice().sort((a, b) => b.time.localeCompare(a.time));
			return ok(paginate(list, params));
		}
	},
	{
		method: "GET",
		match: "/access/statistics",
		handler: () => {
			const total = db.accessRecords.length;
			const abnormal = db.accessRecords.filter(a => a.status === "ABNORMAL").length;
			const byDevice = Array.from(new Set(db.accessRecords.map(a => a.device))).map(d => ({
				name: d,
				value: db.accessRecords.filter(a => a.device === d).length,
				abnormal: db.accessRecords.filter(a => a.device === d && a.status === "ABNORMAL").length
			}));
			const hourly = Array.from({ length: 12 }, (_, i) => {
				const hour = i + 7;
				return { hour: `${hour}:00`, value: db.accessRecords.filter(a => dayjs(a.time).hour() === hour).length };
			});
			return ok({ total, abnormal, normalRate: Number((((total - abnormal) / total) * 100).toFixed(1)), byDevice, hourly });
		}
	},
	{
		method: "GET",
		match: "/access/devices",
		handler: () =>
			ok(
				Array.from(new Set(db.accessRecords.map(a => a.device))).map((d, i) => ({
					id: `DV${i + 1}`,
					name: d,
					status: i === 2 ? "OFFLINE" : "ONLINE",
					lastHeartbeat: dayjs().subtract(i * 3, "minute").format("YYYY-MM-DD HH:mm:ss")
				}))
			)
	},

	/* ---------------- 通知 ---------------- */
	{
		method: "POST",
		match: "/notice/page",
		handler: ({ params }) => {
			const list = db.notices.filter(
				n => matchAny(params.title, n.title) && matchAny(params.keyword, n.content) && eq(n.type, params.type) && isRange(n.publishTime, params.startTime, params.endTime)
			);
			const sorted = list.slice().sort((a, b) => Number(b.top) - Number(a.top) || b.publishTime.localeCompare(a.publishTime));
			return ok(paginate(sorted, params));
		}
	},
	{
		method: "GET",
		match: "/notice/detail",
		handler: ({ params }) => {
			const notice = db.notices.find(n => n.id === params.id);
			if (notice) notice.readCount++;
			return ok(notice || null);
		}
	},
	{
		method: "POST",
		match: "/notice/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = db.notices.findIndex(n => n.id === params.id);
				if (i > -1) db.notices[i] = { ...db.notices[i], ...params };
				return ok(true);
			}
			db.notices.unshift({
				...params,
				id: `N${String(db.notices.length + 1).padStart(4, "0")}`,
				publishTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
				readCount: 0,
				top: !!params.top,
				publisher: params.publisher || "教务处",
				status: "PUBLISHED"
			} as Notice);
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/notice/delete",
		handler: ({ params }) => {
			const i = db.notices.findIndex(n => n.id === params.id);
			if (i > -1) db.notices.splice(i, 1);
			return ok(true);
		}
	},

	/* ---------------- 系统管理 ---------------- */
	{
		method: "POST",
		match: "/system/user/page",
		handler: ({ params }) => {
			const list = db.users.filter(u => kw(u.nickName, params.nickName) && kw(u.userName, params.userName) && eq(u.status, params.status));
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/system/user/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = db.users.findIndex(u => u.id === params.id);
				if (i > -1) db.users[i] = { ...db.users[i], ...params };
				return ok(true);
			}
			db.users.unshift({
				...params,
				id: `U${String(db.users.length + 1).padStart(4, "0")}`,
				status: params.status || "ENABLED",
				lastLogin: ""
			} as any);
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/system/user/delete",
		handler: ({ params }) => {
			const i = db.users.findIndex(u => u.id === params.id);
			if (i > -1) db.users.splice(i, 1);
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/system/role/page",
		handler: ({ params }) => {
			const list = db.roles.filter(r => kw(r.roleName, params.roleName) && eq(r.status, params.status));
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/system/role/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = db.roles.findIndex(r => r.id === params.id);
				if (i > -1) db.roles[i] = { ...db.roles[i], ...params };
				return ok(true);
			}
			db.roles.unshift({
				...params,
				id: `R${String(db.roles.length + 1).padStart(2, "0")}`,
				userCount: 0,
				menuCount: 0,
				status: "ENABLED"
			} as any);
			return ok(true);
		}
	},

	/* ---------------- 数据字典 ---------------- */
	{
		method: "GET",
		match: "/system/dict/types",
		handler: () => ok(dictTypes.map(t => ({ ...t, items: t.items })))
	},
	{
		method: "POST",
		match: "/system/dict/type/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = dictTypes.findIndex(t => t.id === params.id);
				if (i > -1) dictTypes[i] = { ...dictTypes[i], ...params };
				return ok(true);
			}
			if (dictTypes.some(t => t.type === params.type)) {
				return { status: false, code: 400, msg: "字典编码已存在", result: null };
			}
			dictTypes.unshift({
				id: `DT${String(dictTypes.length + 1).padStart(3, "0")}`,
				type: params.type,
				name: params.name || params.type,
				remark: params.remark || "",
				builtin: false,
				items: []
			});
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/system/dict/type/delete",
		handler: ({ params }) => {
			const i = dictTypes.findIndex(t => t.id === params.id);
			if (i > -1) {
				if (dictTypes[i].builtin) return { status: false, code: 400, msg: "内置字典不允许删除", result: null };
				dictTypes.splice(i, 1);
			}
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/system/dict/item/save",
		handler: ({ params }) => {
			const dict = dictTypes.find(t => t.type === params.type);
			if (!dict) return { status: false, code: 404, msg: "字典不存在", result: null };
			if (params.id) {
				const i = dict.items.findIndex(it => String(it.value) === String(params.id) || (it as any).id === params.id);
				if (i > -1) dict.items[i] = { ...dict.items[i], ...params, sort: Number(params.sort || i) } as any;
				return ok(true);
			}
			dict.items.push({
				label: params.label,
				value: params.value,
				type: params.type2 || params.tagType || "info",
				sort: Number(params.sort || dict.items.length)
			} as any);
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/system/dict/item/delete",
		handler: ({ params }) => {
			const dict = dictTypes.find(t => t.type === params.type);
			if (dict) dict.items = dict.items.filter(it => String(it.value) !== String(params.id));
			return ok(true);
		}
	},

	/* ---------------- 菜单与按钮权限 ---------------- */
	{
		method: "GET",
		match: "/system/menu/tree",
		handler: () => {
			const build = (parentId: string | null): any[] =>
				menuNodes
					.filter(n => n.parentId === parentId)
					.sort((a, b) => (a.sort || 0) - (b.sort || 0))
					.map(n => ({ ...n, children: build(n.id) }));
			return ok(build(null));
		}
	},
	{
		method: "POST",
		match: "/system/menu/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = menuNodes.findIndex(n => n.id === params.id);
				if (i > -1) menuNodes[i] = { ...menuNodes[i], ...params, sort: Number(params.sort ?? menuNodes[i].sort) };
				return ok(true);
			}
			menuNodes.push({
				id: `M${Date.now().toString().slice(-4)}`,
				parentId: params.parentId || null,
				title: params.title,
				name: params.name || params.title,
				path: params.path || "",
				icon: params.icon || "grid",
				group: params.group || "",
				sort: Number(params.sort || 99),
				type: params.type || "menu",
				auth: params.auth,
				visible: params.visible !== false
			});
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/system/menu/delete",
		handler: ({ params }) => {
			const collect = (id: string): string[] => [id, ...menuNodes.filter(n => n.parentId === id).flatMap(n => collect(n.id))];
			const ids = new Set(collect(params.id));
			for (let i = menuNodes.length - 1; i >= 0; i--) if (ids.has(menuNodes[i].id)) menuNodes.splice(i, 1);
			db.roles.forEach(r => (r.menuIds = (r.menuIds || []).filter(id => !ids.has(id))));
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/system/role/menus",
		handler: ({ params }) => {
			const role = db.roles.find(r => r.id === params.id || r.roleCode === params.id);
			return ok(role?.menuIds || []);
		}
	},
	{
		method: "POST",
		match: "/system/role/auth",
		handler: ({ params }) => {
			const role = db.roles.find(r => r.id === params.id);
			if (!role) return { status: false, code: 404, msg: "角色不存在", result: null };
			role.menuIds = params.menuIds || [];
			role.menuCount = role.menuIds.length;
			return ok(true);
		}
	},

	/* ---------------- 消息中心 ---------------- */
	{
		method: "POST",
		match: "/message/page",
		handler: ({ params }) => {
			let list = messages.filter(
				m => eq(m.type, params.type) && (params.read === undefined || params.read === "" || m.read === params.read) && kw(m.title, params.keyword)
			);
			list = list.slice().sort((a, b) => b.time.localeCompare(a.time));
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/message/read",
		handler: ({ params }) => {
			const msg = messages.find(m => m.id === params.id);
			if (msg) msg.read = true;
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/message/readAll",
		handler: () => {
			messages.forEach(m => (m.read = true));
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/message/unreadCount",
		handler: () => ok({ count: messages.filter(m => !m.read).length, important: messages.filter(m => !m.read && m.important).length })
	},

	/* ---------------- 个人中心 ---------------- */
	{
		method: "GET",
		match: "/user/profile",
		handler: () => ok(buildUserInfo(db.users[0]))
	},
	{
		method: "POST",
		match: "/user/profile/save",
		handler: ({ params }) => {
			const user = db.users.find(u => u.userName === params.userName) || db.users[0];
			Object.assign(user, { nickName: params.nickName, phone: params.phone, deptName: params.deptName });
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/user/password",
		handler: ({ params }) => {
			if (params.oldPassword !== "123456") return { status: false, code: 400, msg: "原密码不正确", result: null };
			if (!params.newPassword || params.newPassword.length < 6) return { status: false, code: 400, msg: "新密码至少 6 位", result: null };
			return ok(true);
		}
	},

	/* ---------------- 请假审批 ---------------- */
	{
		method: "POST",
		match: "/leave/page",
		handler: ({ params }) => {
			let list = leaves.filter(
				l =>
					matchAny(params.studentName, l.studentName) &&
					matchAny(params.studentNo, l.studentNo) &&
					eq(l.type, params.type) &&
					eq(l.status, params.status) &&
					eq(l.className, params.className)
			);
			list = list.slice().sort((a, b) => b.applyTime.localeCompare(a.applyTime));
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/leave/apply",
		handler: ({ params }) => {
			const days = dayjs(params.endDate).diff(dayjs(params.startDate), "day") + 1;
			leaves.unshift({
				id: `LV${String(leaves.length + 1).padStart(4, "0")}`,
				studentNo: params.studentNo || "202400001",
				studentName: params.studentName || "演示学生",
				className: params.className || "高一(1)班",
				type: params.type || "事假",
				startDate: params.startDate,
				endDate: params.endDate,
				days: days > 0 ? days : 1,
				reason: params.reason || "",
				status: "PENDING",
				applyTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
				approver: "",
				approveTime: "",
				approveRemark: ""
			});
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/leave/approve",
		handler: ({ params }) => {
			const leave = leaves.find(l => l.id === params.id);
			if (!leave) return { status: false, code: 404, msg: "申请不存在", result: null };
			leave.status = params.status || "APPROVED";
			leave.approver = params.approver || "系统管理员";
			leave.approveTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
			leave.approveRemark = params.remark || "";
			// 审批通过后写回考勤
			if (leave.status === "APPROVED") {
				db.attendances.unshift({
					id: `AT${String(db.attendances.length + 1).padStart(5, "0")}`,
					studentId: "",
					studentNo: leave.studentNo,
					name: leave.studentName,
					className: leave.className,
					date: leave.startDate,
					time: "",
					type: "LEAVE",
					method: "MANUAL",
					device: "请假审批",
					remark: `${leave.type}（审批通过）`
				});
			}
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/leave/todoCount",
		handler: () => ok({ count: leaves.filter(l => l.status === "PENDING").length })
	},

	/* ---------------- 审计日志 ---------------- */
	{
		method: "POST",
		match: "/system/log/page",
		handler: ({ params }) => {
			const list = auditLogs.filter(
				l =>
					matchAny(params.nickName, l.nickName) &&
					matchAny(params.userName, l.userName) &&
					eq(l.module, params.module) &&
					eq(l.result, params.result) &&
					isRange(l.time, params.startTime, params.endTime)
			);
			return ok(paginate(list, params));
		}
	},

	/* ---------------- 考试管理 ---------------- */
	{
		method: "POST",
		match: "/exam/page",
		handler: ({ params }) => {
			const list = exams.filter(
				e => matchAny(params.name || params.keyword, e.name) && eq(e.type, params.type) && eq(e.grade, params.grade) && eq(e.status, params.status)
			);
			list.sort((a, b) => b.date.localeCompare(a.date));
			return ok(paginate(list, params));
		}
	},
	{
		method: "GET",
		match: "/exam/rooms",
		handler: ({ params }) => ok(examRooms.filter(r => r.examId === params.examId))
	},
	{
		method: "POST",
		match: "/exam/save",
		handler: ({ params }) => {
			if (params.id) {
				const i = exams.findIndex(e => e.id === params.id);
				if (i > -1) exams[i] = { ...exams[i], ...params };
				return ok(true);
			}
			exams.unshift({
				...params,
				id: `EX${String(exams.length + 1).padStart(4, "0")}`,
				roomCount: Number(params.roomCount || 1),
				studentCount: Number(params.studentCount || 0),
				status: "DRAFT",
				remark: ""
			} as any);
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/exam/publish",
		handler: ({ params }) => {
			const exam = exams.find(e => e.id === params.id);
			if (!exam) return { status: false, code: 404, msg: "考试不存在", result: null };
			exam.status = params.status || "PUBLISHED";
			exam.remark = "考场与监考安排已发布";
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/exam/statistics",
		handler: () => ({
			status: true,
			code: 200,
			msg: "",
			result: {
				total: exams.length,
				published: exams.filter(e => e.status === "PUBLISHED").length,
				draft: exams.filter(e => e.status === "DRAFT").length,
				finished: exams.filter(e => e.status === "FINISHED").length,
				rooms: examRooms.length,
				students: exams.reduce((a, b) => a + b.studentCount, 0)
			}
		})
	},

	/* ---------------- 选课 ---------------- */
	{
		method: "POST",
		match: "/enroll/page",
		handler: ({ params }) => {
			const list = enrollCourses.filter(
				c => kw(c.courseName, params.courseName) && eq(c.grade, params.grade) && eq(c.type, params.type) && eq(String(c.open), params.open)
			);
			return ok(paginate(list, params));
		}
	},
	{
		method: "GET",
		match: "/enroll/students",
		handler: ({ params }) => ok(enrollRecords.filter(r => r.courseId === params.courseId))
	},
	{
		method: "POST",
		match: "/enroll/toggle",
		handler: ({ params }) => {
			const course = enrollCourses.find(c => c.id === params.id || c.courseId === params.id);
			if (!course) return { status: false, code: 404, msg: "课程不存在", result: null };
			course.open = params.open === undefined ? !course.open : !!params.open;
			return ok(course.open);
		}
	},
	{
		method: "GET",
		match: "/enroll/statistics",
		handler: () => {
			const capacity = enrollCourses.reduce((a, b) => a + b.capacity, 0);
			const enrolled = enrollCourses.reduce((a, b) => a + b.enrolled, 0);
			const hot = enrollCourses
				.slice()
				.sort((a, b) => b.enrolled / b.capacity - a.enrolled / a.capacity)
				.slice(0, 5)
				.map(c => ({ name: c.courseName, value: Math.round((c.enrolled / c.capacity) * 100) }));
			return ok({
				courses: enrollCourses.length,
				openCourses: enrollCourses.filter(c => c.open).length,
				capacity,
				enrolled,
				rate: Number(((enrolled / capacity) * 100).toFixed(1)),
				hot
			});
		}
	},

	/* ---------------- B4 综合素质评价 ---------------- */
	{
		method: "POST",
		match: "/eval/page",
		handler: ({ params }) => {
			const list = evaluations.filter(
				e => matchAny(params.studentName, e.studentName) && matchAny(params.studentNo, e.studentNo) && eq(e.className, params.className) && eq(e.level, params.level)
			);
			return ok(paginate(list, params));
		}
	},
	{
		method: "GET",
		match: "/eval/records",
		handler: ({ params }) => ok(evalRecords.filter(r => r.studentNo === params.studentNo))
	},
	{
		method: "POST",
		match: "/eval/record/add",
		handler: ({ params }) => {
			const student = evaluations.find(e => e.studentNo === params.studentNo);
			if (!student) return { status: false, code: 404, msg: "学生不存在", result: null };
			const score = Number(params.score || 0);
			evalRecords.unshift({
				id: `EV${String(evalRecords.length + 1).padStart(5, "0")}`,
				studentNo: params.studentNo,
				type: score >= 0 ? "ADD" : "SUB",
				score,
				reason: params.reason || "手动调整",
				category: params.category || "其他",
				time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
				operator: "系统管理员"
			});
			student.moral = Math.max(0, Math.min(30, student.moral + score));
			student.total = Math.min(100, student.moral + student.academic + student.physical + student.art);
			student.level = student.total >= 92 ? "A" : student.total >= 85 ? "B" : student.total >= 75 ? "C" : "D";
			student.records = evalRecords.filter(r => r.studentNo === params.studentNo).length;
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/eval/statistics",
		handler: () => {
			const total = evaluations.length;
			const avg = evaluations.reduce((a, b) => a + b.total, 0) / (total || 1);
			const levels = ["A", "B", "C", "D"].map(l => ({ name: l, value: evaluations.filter(e => e.level === l).length }));
			return ok({
				total,
				avg: Number(avg.toFixed(1)),
				adds: evalRecords.filter(r => r.score > 0).length,
				subs: evalRecords.filter(r => r.score < 0).length,
				levels
			});
		}
	},

	/* ---------------- B5 宿舍报修 ---------------- */
	{
		method: "POST",
		match: "/repair/page",
		handler: ({ params }) => {
			let list = repairOrders.filter(
				r =>
					matchAny(params.dorm, r.dorm) && matchAny(params.reporter, r.reporter) &&
					eq(r.type, params.type) &&
					eq(r.status, params.status) &&
					eq(r.level, params.level)
			);
			list = list.slice().sort((a, b) => b.createTime.localeCompare(a.createTime));
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/repair/create",
		handler: ({ params }) => {
			repairOrders.unshift({
				id: `RP${String(repairOrders.length + 1).padStart(5, "0")}`,
				dorm: params.dorm,
				reporter: params.reporter || "匿名",
				phone: params.phone || "",
				type: params.type || "其他",
				description: params.description || "",
				createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
				status: "PENDING",
				handler: "",
				finishTime: "",
				level: params.level || "NORMAL"
			});
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/repair/assign",
		handler: ({ params }) => {
			const order = repairOrders.find(r => r.id === params.id);
			if (!order) return { status: false, code: 404, msg: "工单不存在", result: null };
			order.handler = params.handler || "维修组-老周";
			order.status = "PROCESSING";
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/repair/finish",
		handler: ({ params }) => {
			const order = repairOrders.find(r => r.id === params.id);
			if (!order) return { status: false, code: 404, msg: "工单不存在", result: null };
			order.status = "DONE";
			order.finishTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/repair/statistics",
		handler: () => {
			const pending = repairOrders.filter(r => r.status === "PENDING").length;
			const processing = repairOrders.filter(r => r.status === "PROCESSING").length;
			const done = repairOrders.filter(r => r.status === "DONE").length;
			return ok({
				total: repairOrders.length,
				pending,
				processing,
				done,
				urgent: repairOrders.filter(r => r.level === "URGENT" && r.status !== "DONE").length,
				finishRate: Number(((done / repairOrders.length) * 100).toFixed(1))
			});
		}
	},

	/* ---------------- B6 消费异常预警 ---------------- */
	{
		method: "POST",
		match: "/alert/page",
		handler: ({ params }) => {
			let list = consumeAlerts.filter(
				a => matchAny(params.studentName, a.studentName) && matchAny(params.studentNo, a.studentNo) && eq(a.level, params.level) && eq(a.rule, params.rule) && eq(a.status, params.status)
			);
			list = list.slice().sort((a, b) => b.time.localeCompare(a.time));
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/alert/handle",
		handler: ({ params }) => {
			const alert = consumeAlerts.find(a => a.id === params.id);
			if (!alert) return { status: false, code: 404, msg: "预警不存在", result: null };
			alert.status = params.status || "HANDLED";
			alert.remark = params.remark || "已处理";
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/alert/statistics",
		handler: () => ({
			status: true,
			code: 200,
			msg: "",
			result: {
				total: consumeAlerts.length,
				pending: consumeAlerts.filter(a => a.status === "PENDING").length,
				high: consumeAlerts.filter(a => a.level === "HIGH").length,
				handled: consumeAlerts.filter(a => a.status === "HANDLED").length,
				byRule: Array.from(new Set(consumeAlerts.map(a => a.rule))).map(r => ({
					name: r,
					value: consumeAlerts.filter(a => a.rule === r).length
				}))
			}
		})
	},

	/* ---------------- B7 访客预约 ---------------- */
	{
		method: "POST",
		match: "/visitor/page",
		handler: ({ params }) => {
			const list = visitors.filter(
				v => matchAny(params.name, v.name) && matchAny(params.phone, v.phone) && eq(v.status, params.status) && eq(v.visitTarget, params.visitTarget)
			);
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/visitor/create",
		handler: ({ params }) => {
			visitors.unshift({
				id: `VS${String(visitors.length + 1).padStart(5, "0")}`,
				name: params.name,
				phone: params.phone,
				company: params.company || "个人",
				visitTarget: params.visitTarget || "教务处",
				reason: params.reason || "来访",
				visitTime: params.visitTime || dayjs().format("YYYY-MM-DD HH:mm"),
				duration: params.duration || "2 小时",
				status: "PENDING",
				checkInTime: "",
				code: `VC${String(Math.floor(Math.random() * 900000) + 100000)}`,
				personCount: Number(params.personCount || 1)
			});
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/visitor/approve",
		handler: ({ params }) => {
			const v = visitors.find(x => x.id === params.id);
			if (!v) return { status: false, code: 404, msg: "预约不存在", result: null };
			v.status = params.status || "APPROVED";
			return ok(true);
		}
	},
	{
		method: "POST",
		match: "/visitor/checkin",
		handler: ({ params }) => {
			const v = visitors.find(x => x.id === params.id);
			if (!v) return { status: false, code: 404, msg: "预约不存在", result: null };
			v.status = "VISITED";
			v.checkInTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
			return ok(v.code);
		}
	},
	{
		method: "GET",
		match: "/visitor/statistics",
		handler: () => ({
			status: true,
			code: 200,
			msg: "",
			result: {
				total: visitors.length,
				pending: visitors.filter(v => v.status === "PENDING").length,
				approved: visitors.filter(v => v.status === "APPROVED").length,
				visited: visitors.filter(v => v.status === "VISITED").length,
				people: visitors.reduce((a, b) => a + b.personCount, 0)
			}
		})
	},

	/* ---------------- B8 缴费中心 ---------------- */
	{
		method: "POST",
		match: "/bill/page",
		handler: ({ params }) => {
			const list = bills.filter(
				b => matchAny(params.studentName, b.studentName) && matchAny(params.studentNo, b.studentNo) && eq(b.feeType, params.feeType) && eq(b.status, params.status) && eq(b.className, params.className)
			);
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/bill/pay",
		handler: ({ params }) => {
			const bill = bills.find(b => b.id === params.id);
			if (!bill) return { status: false, code: 404, msg: "账单不存在", result: null };
			const payAmount = Number(params.amount || bill.amount - bill.paid);
			bill.paid = Math.min(bill.amount, bill.paid + payAmount);
			bill.status = bill.paid >= bill.amount ? "PAID" : "PARTIAL";
			bill.payTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/bill/statistics",
		handler: () => {
			const total = bills.reduce((a, b) => a + b.amount, 0);
			const paid = bills.reduce((a, b) => a + b.paid, 0);
			return ok({
				total,
				paid,
				unpaid: total - paid,
				rate: Number(((paid / total) * 100).toFixed(1)),
				count: bills.length,
				unpaidCount: bills.filter(b => b.status !== "PAID").length,
				byType: Array.from(new Set(bills.map(b => b.feeType))).map(t => ({
					name: t,
					value: bills.filter(b => b.feeType === t).reduce((a, b) => a + b.amount, 0)
				}))
			});
		}
	},

	/* ---------------- B9 资产台账 ---------------- */
	{
		method: "POST",
		match: "/asset/page",
		handler: ({ params }) => {
			const list = assets.filter(
				a => matchAny(params.name, a.name) && matchAny(params.code, a.code) && eq(a.category, params.category) && eq(a.status, params.status) && eq(a.owner, params.owner)
			);
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/asset/save",
		handler: ({ params }) => {
			const i = assets.findIndex(a => a.id === params.id);
			if (i > -1) assets[i] = { ...assets[i], ...params };
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/asset/statistics",
		handler: () => ({
			status: true,
			code: 200,
			msg: "",
			result: {
				total: assets.length,
				value: assets.reduce((a, b) => a + b.price, 0),
				inUse: assets.filter(a => a.status === "IN_USE").length,
				repair: assets.filter(a => a.status === "REPAIR").length,
				scrapped: assets.filter(a => a.status === "SCRAPPED").length,
				byCategory: Array.from(new Set(assets.map(a => a.category))).map(c => ({
					name: c,
					value: assets.filter(a => a.category === c).length
				}))
			}
		})
	},

	/* ---------------- B10 图书馆 ---------------- */
	{
		method: "POST",
		match: "/book/page",
		handler: ({ params }) => {
			const list = bookBorrows.filter(
				b => matchAny(params.bookName, b.bookName) && matchAny(params.borrower, b.borrower) && eq(b.status, params.status)
			);
			return ok(paginate(list, params));
		}
	},
	{
		method: "POST",
		match: "/book/return",
		handler: ({ params }) => {
			const b = bookBorrows.find(x => x.id === params.id);
			if (!b) return { status: false, code: 404, msg: "借阅记录不存在", result: null };
			b.status = "RETURNED";
			b.returnDate = dayjs().format("YYYY-MM-DD");
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/book/statistics",
		handler: () => ({
			status: true,
			code: 200,
			msg: "",
			result: {
				total: bookBorrows.length,
				borrowed: bookBorrows.filter(b => b.status === "BORROWED").length,
				overdue: bookBorrows.filter(b => b.status === "OVERDUE").length,
				returned: bookBorrows.filter(b => b.status === "RETURNED").length,
				hot: Array.from(new Set(bookBorrows.map(b => b.bookName)))
					.map(n => ({ name: n, value: bookBorrows.filter(b => b.bookName === n).length }))
					.sort((a, b) => b.value - a.value)
					.slice(0, 5)
			}
		})
	},

	/* ---------------- B11 校车 ---------------- */
	{
		method: "GET",
		match: "/bus/list",
		handler: () => ok(busRoutes)
	},
	{
		method: "POST",
		match: "/bus/save",
		handler: ({ params }) => {
			const i = busRoutes.findIndex(b => b.id === params.id);
			if (i > -1) busRoutes[i] = { ...busRoutes[i], ...params };
			return ok(true);
		}
	},
	{
		method: "GET",
		match: "/bus/statistics",
		handler: () => ({
			status: true,
			code: 200,
			msg: "",
			result: {
				routes: busRoutes.length,
				running: busRoutes.filter(b => b.status === "RUNNING").length,
				riders: busRoutes.reduce((a, b) => a + b.riders, 0),
				capacity: busRoutes.reduce((a, b) => a + b.capacity, 0)
			}
		})
	},

	/* ---------------- B12 能耗监测 ---------------- */
	{
		method: "GET",
		match: "/energy/list",
		handler: ({ params }) => {
			const list = energyRecords.filter(r => eq(r.building, params.building) && eq(r.type, params.type) && eq(r.status, params.status));
			return ok(list);
		}
	},
	{
		method: "GET",
		match: "/energy/statistics",
		handler: () => {
			const electric = energyRecords.filter(r => r.type === "电");
			const water = energyRecords.filter(r => r.type === "水");
			const byBuilding = Array.from(new Set(energyRecords.map(r => r.building))).map(b => ({
				name: b,
				electric: Number(electric.filter(r => r.building === b).reduce((a, x) => a + x.value, 0).toFixed(1)),
				water: Number(water.filter(r => r.building === b).reduce((a, x) => a + x.value, 0).toFixed(1))
			}));
			return ok({
				electric: Number(electric.reduce((a, b) => a + b.value, 0).toFixed(1)),
				water: Number(water.reduce((a, b) => a + b.value, 0).toFixed(1)),
				over: energyRecords.filter(r => r.status === "OVER").length,
				byBuilding,
				trend: Array.from(new Set(energyRecords.map(r => r.date)))
					.sort()
					.map(d => ({
						date: d,
						electric: Number(electric.filter(r => r.date === d).reduce((a, x) => a + x.value, 0).toFixed(1)),
						water: Number(water.filter(r => r.date === d).reduce((a, x) => a + x.value, 0).toFixed(1))
					}))
			});
		}
	},

	/* ---------------- C2 报表中心 ---------------- */
	{
		method: "POST",
		match: "/report/run",
		handler: ({ params }) => {
			const type = params.type;
			const grade = params.grade;

			if (type === "roster") {
				const list = db.students.filter(s => eq(s.grade, grade));
				return ok({
					columns: [
						{ label: "学号", prop: "studentNo" },
						{ label: "姓名", prop: "name" },
						{ label: "班级", prop: "className" },
						{ label: "状态", prop: "statusName" },
						{ label: "宿舍", prop: "dorm" },
						{ label: "联系电话", prop: "phone" }
					],
					rows: list.slice(0, 200).map(s => ({
						...s,
						statusName: s.status === "STUDYING" ? "在读" : s.status === "SUSPENDED" ? "休学" : s.status === "GRADUATED" ? "毕业" : "退学"
					})),
					total: list.length
				});
			}

			if (type === "attendance") {
				const rows = db.classes.map(c => {
					const list = db.attendances.filter(a => a.className === c.className);
					const total = list.length || 1;
					const normal = list.filter(a => a.type === "NORMAL").length;
					return {
						className: c.className,
						grade: c.grade,
						total,
						normal,
						late: list.filter(a => a.type === "LATE").length,
						absent: list.filter(a => a.type === "ABSENT").length,
						leave: list.filter(a => a.type === "LEAVE").length,
						rate: Number(((normal / total) * 100).toFixed(1))
					};
				});
				return ok({
					columns: [
						{ label: "班级", prop: "className" },
						{ label: "年级", prop: "grade" },
						{ label: "记录数", prop: "total" },
						{ label: "正常", prop: "normal" },
						{ label: "迟到", prop: "late" },
						{ label: "缺勤", prop: "absent" },
						{ label: "出勤率(%)", prop: "rate" }
					],
					rows,
					total: rows.length
				});
			}

			if (type === "score") {
				const rows = ["语文", "数学", "英语", "物理", "化学"].map(course => {
					const list = db.scores.filter(s => s.courseName === course);
					const avg = list.reduce((a, b) => a + b.score, 0) / (list.length || 1);
					return {
						course,
						count: list.length,
						avg: Number(avg.toFixed(1)),
						max: Math.max(...list.map(s => s.score), 0),
						min: Math.min(...list.map(s => s.score), 100),
						passRate: Number(((list.filter(s => s.score >= 60).length / (list.length || 1)) * 100).toFixed(1))
					};
				});
				return ok({
					columns: [
						{ label: "学科", prop: "course" },
						{ label: "参考人数", prop: "count" },
						{ label: "平均分", prop: "avg" },
						{ label: "最高分", prop: "max" },
						{ label: "最低分", prop: "min" },
						{ label: "及格率(%)", prop: "passRate" }
					],
					rows,
					total: rows.length
				});
			}

			if (type === "bill") {
				const rows = Array.from(new Set(bills.map(b => b.className))).map(className => {
					const list = bills.filter(b => b.className === className);
					const total = list.reduce((a, b) => a + b.amount, 0);
					const paid = list.reduce((a, b) => a + b.paid, 0);
					return {
						className,
						total,
						paid,
						unpaid: total - paid,
						rate: Number(((paid / (total || 1)) * 100).toFixed(1))
					};
				});
				return ok({
					columns: [
						{ label: "班级", prop: "className" },
						{ label: "应收(元)", prop: "total" },
						{ label: "已收(元)", prop: "paid" },
						{ label: "欠费(元)", prop: "unpaid" },
						{ label: "收缴率(%)", prop: "rate" }
					],
					rows,
					total: rows.length
				});
			}

			return { status: false, code: 400, msg: "未知报表类型", result: null };
		}
	},

	/* ---------------- C3 AI 知识库 / 学情报告 ---------------- */
	{
		method: "POST",
		match: "/ai/copilot",
		handler: ({ params }) => {
			const result = runCopilot(params.question || "");
			// 未命中工具：回落到通用问答
			if (result.intent === "chat") {
				return ok({
					intent: "chat",
					tool: "",
					params: {},
					reply: buildAiAnswer(params.question || ""),
					cards: [],
					followUps: ["本周出勤率怎么样？", "有哪些学生请假待审批？", "一卡通余额不足的名单"]
				});
			}
			return ok(result);
		}
	},
	{
		method: "POST",
		match: "/ai/audit",
		handler: ({ params }) => {
			const id = `LOG${String(Date.now()).slice(-8)}`;
			auditLogs.unshift({
				id,
				userName: params.operator || "admin",
				nickName: params.nickName || "系统管理员",
				action: "AI 问答",
				module: "AI 助手",
				ip: params.ip || "127.0.0.1",
				time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
				result: params.success === false ? "失败" : "成功",
				detail: `[${params.source || "rule"}] ${String(params.question || "").slice(0, 60)}${
					params.answer ? ` → ${String(params.answer).replace(/\s+/g, " ").slice(0, 50)}` : ""
				}${params.cost ? `（${params.cost}ms）` : ""}`
			});
			return ok({ id });
		}
	},
	{
		method: "POST",
		match: "/ai/report-insight",
		handler: ({ params }) => ok(buildReportInsight(params.reportType, params.rows || []))
	},
	{
		method: "POST",
		match: "/ai/nl2query",
		handler: ({ params }) => ok(parseNaturalQuery(params.question, params.schema || []))
	},
	{
		method: "POST",
		match: "/ai/parent-report",
		handler: ({ params }) => {
			const student = db.students.find(s => s.studentNo === params.studentNo) || db.students[0];
			const scores = db.scores.filter(s => s.studentNo === student.studentNo);
			const attendance = db.attendances.filter(a => a.studentNo === student.studentNo);
			const studentLeaves = leaves.filter(l => l.studentNo === student.studentNo);
			const evaluation = evaluations.find(e => e.studentNo === student.studentNo);
			return ok(buildParentReport(student, scores, attendance, studentLeaves, evaluation));
		}
	},
	{
		method: "GET",
		match: "/ai/knowledge/search",
		handler: ({ params }) => ok(searchKnowledge(params.keyword)) as any
	},
	{
		method: "GET",
		match: "/ai/knowledge/list",
		handler: () => ok(knowledgeDocs)
	},
	{
		method: "POST",
		match: "/ai/report",
		handler: ({ params }) => {
			const student =
				db.students.find(s => s.studentNo === params.studentNo) || db.students[0];
			const scores = db.scores.filter(s => s.studentNo === student.studentNo);
			const attendance = db.attendances.filter(a => a.studentNo === student.studentNo);
			const absent = attendance.filter(a => a.type === "ABSENT").length;
			const late = attendance.filter(a => a.type === "LATE").length;
			const avg = scores.length ? scores.reduce((a, b) => a + b.score, 0) / scores.length : 0;
			const best = scores.slice().sort((a, b) => b.score - a.score)[0];
			const worst = scores.slice().sort((a, b) => a.score - b.score)[0];
			const attendanceRate = attendance.length
				? Number((((attendance.length - absent) / attendance.length) * 100).toFixed(1))
				: 100;

			return ok({
				student: {
					studentNo: student.studentNo,
					name: student.name,
					className: student.className,
					grade: student.grade
				},
				generatedAt: dayjs().format("YYYY-MM-DD HH:mm"),
				metrics: [
					{ label: "综合均分", value: avg.toFixed(1), unit: "分" },
					{ label: "出勤率", value: attendanceRate, unit: "%" },
					{ label: "缺勤次数", value: absent, unit: "次" },
					{ label: "迟到次数", value: late, unit: "次" }
				],
				sections: [
					{
						title: "学业表现",
						content: `本学期共取得 ${scores.length} 门课程成绩，平均分 ${avg.toFixed(1)} 分。优势学科为 ${best?.courseName || "—"}（${best?.score || 0} 分），薄弱学科为 ${worst?.courseName || "—"}（${worst?.score || 0} 分）。建议针对薄弱学科安排每周 2 次专项练习，并加入学科答疑。`
					},
					{
						title: "出勤情况",
						content: `统计周期内共记录考勤 ${attendance.length} 次，出勤率 ${attendanceRate}%，缺勤 ${absent} 次、迟到 ${late} 次。${absent > 2 ? "缺勤偏高，建议班主任与家长沟通了解原因。" : "出勤状态良好，继续保持。"}`
					},
					{
						title: "综合素养",
						content: `班级活动参与积极，德育表现稳定。建议在体育与艺术方向各选择一项社团活动持续参与，提升综合素质评价维度。`
					},
					{
						title: "下阶段建议",
						content: `1. 制定每周学习计划，重点突破 ${worst?.courseName || "薄弱学科"}；\n2. 保持出勤与作息稳定；\n3. 每月与班主任沟通一次学习进展。`
					}
				]
			});
		}
	},

	/* ---------------- 待办中心 ---------------- */
	{
		method: "POST",
		match: "/todo/list",
		handler: ({ params }) =>
			ok(buildTodo({ leaves, repairs: repairOrders, visitors, bills }, params.category))
	},

	/* ---------------- AI 助手 ---------------- */
	{
		method: "POST",
		match: "/ai/chat",
		handler: ({ params }) => {
			const question = String(params.question || "");
			return ok({ answer: buildAiAnswer(question), references: buildAiRefs(question), time: dayjs().format("HH:mm:ss") });
		}
	}
];

/* ---------------- 辅助构建 ---------------- */

// 选课 / 综合素质评价依赖课程与学生集合，导入后初始化一次
initEnrollments(db.courses, db.students);
initEvaluations(db.students);

function buildUserInfo(user: any) {
	const role = db.roles.find(r => r.roleCode === user.roleCode);
	const granted = new Set(role?.menuIds || []);
	const authCodes =
		user.roleCode === "SUPER_ADMIN"
			? ["*"]
			: menuNodes.filter(n => n.type === "button" && n.auth && granted.has(n.id)).map(n => n.auth as string);

	return {
		userId: user.id,
		userName: user.userName,
		nickName: user.nickName,
		avatar: "",
		phone: user.phone,
		email: `${user.userName}@campus.edu.cn`,
		deptName: user.deptName,
		postName: user.roleName,
		roleCode: user.roleCode,
		roles: [user.roleCode],
		superAdmin: user.roleCode === "SUPER_ADMIN",
		authCodes
	};
}

/** 菜单：由 menuNodes 派生（可维护），与前端路由 path 对齐 */
function buildMenus() {
	return menuNodes
		.filter(n => n.type === "menu" && n.visible)
		.sort((a, b) => (a.sort || 0) - (b.sort || 0))
		.map(n => ({
			id: n.id,
			name: n.name,
			title: n.title,
			path: n.path,
			icon: n.icon,
			group: n.group,
			sort: n.sort
		}));
}

/** 字典：由 dictTypes 派生（可维护） */
function buildEnums() {
	const map: Record<string, any[]> = {};
	dictTypes.forEach(t => {
		map[t.type] = t.items.map(i => ({ label: i.label, value: i.value, type: i.type, color: i.color }));
	});
	return map;
}

function buildClassRank() {
	return db.classes
		.map(c => {
			const list = db.scores.filter(s => s.className === c.className);
			const avg = list.reduce((a, b) => a + b.score, 0) / (list.length || 1);
			return {
				className: c.className,
				grade: c.grade,
				studentCount: c.studentCount,
				attendanceRate: Number((92 + Math.random() * 7).toFixed(1)),
				avgScore: Number(avg.toFixed(1))
			};
		})
		.sort((a, b) => b.avgScore - a.avgScore);
}

function buildAlerts() {
	const absent = db.attendances.filter(a => a.type === "ABSENT").slice(0, 3);
	const abnormal = db.accessRecords.filter(a => a.status === "ABNORMAL").slice(0, 2);
	return [
		...absent.map(a => ({
			level: "warning",
			title: `${a.className} ${a.name} 今日未打卡`,
			time: a.date,
			type: "考勤异常"
		})),
		...abnormal.map(a => ({
			level: "danger",
			title: `${a.device} 检测到异常通行：${a.personName}`,
			time: a.time,
			type: "门禁异常"
		})),
		{
			level: "info",
			title: "A 栋 305 宿舍用电量超出日常均值 30%",
			time: dayjs().format("YYYY-MM-DD HH:mm"),
			type: "能耗预警"
		}
	];
}

function buildAiAnswer(question: string) {
	const q = question.toLowerCase();
	if (q.includes("考勤") || q.includes("出勤")) {
		const rate = db.weeklyAttendance[db.weeklyAttendance.length - 1].rate;
		return `根据近 7 天数据，全校平均出勤率为 **${rate}%**，较上周上升 0.6 个百分点。\n\n- 高一、高二年级出勤稳定，均在 95% 以上\n- 高三年级因模拟考试安排，个别班级出现集中请假\n- 异常类型以「迟到」为主（占比 46%），建议在早读前 5 分钟增加一次人脸打卡提醒\n\n需要我把异常名单导出吗？`;
	}
	if (q.includes("成绩") || q.includes("分数")) {
		const avg = (db.scores.reduce((a, b) => a + b.score, 0) / db.scores.length).toFixed(1);
		return `本次期末考试全校平均分为 **${avg} 分**，优秀率 21.4%，及格率 92.8%。\n\n| 学科 | 平均分 | 及格率 |\n| --- | --- | --- |\n| 语文 | 82.3 | 96.2% |\n| 数学 | 74.6 | 88.4% |\n| 英语 | 79.1 | 93.1% |\n| 物理 | 71.8 | 85.7% |\n| 化学 | 76.5 | 90.2% |\n\n数学和物理是薄弱学科，建议开展分层辅导。`;
	}
	if (q.includes("宿舍") || q.includes("住宿")) {
		return `当前共有 **${db.dorms.length} 间宿舍**，床位使用率 78.6%。\n\nA 栋入住率最高（92%），建议下学期限流分配；C 栋有 3 间宿舍处于维修状态。`;
	}
	if (q.includes("一卡通") || q.includes("消费")) {
		return `本月一卡通消费总额 **¥${db.monthlyConsume[db.monthlyConsume.length - 1].amount.toLocaleString()}**，其中食堂占比 58%，超市占比 22%。\n\n有 12 名学生卡内余额低于 20 元，建议推送充值提醒。`;
	}
	if (q.includes("安全") || q.includes("门禁")) {
		return `近 7 天共记录 **${db.accessRecords.length} 次**通行，其中异常 **${db.accessRecords.filter(a => a.status === "ABNORMAL").length} 次**（多为非授权时段通行）。\n\n建议：\n1. 对 22:00 后的宿舍区通行启用二次核验\n2. 将异常记录自动推送至班主任\n3. 每周生成安防周报`;
	}
	return `我是智慧校园 AI 助手，可以帮你分析这些数据：\n\n- **学情分析**：成绩趋势、薄弱学科、班级对比\n- **考勤洞察**：出勤率、异常名单、打卡方式分布\n- **后勤运营**：宿舍使用率、一卡通消费、能耗预警\n- **安全态势**：门禁异常、设备在线率\n\n你可以直接问我，例如「本周出勤率怎么样？」「高三数学成绩分析」。`;
}

function buildAiRefs(question: string) {
	if (question.includes("考勤")) return ["考勤明细表", "近 7 天出勤趋势"];
	if (question.includes("成绩")) return ["期末成绩汇总", "学科分析报告"];
	if (question.includes("宿舍")) return ["宿舍床位台账"];
	return ["校园数据中台"];
}
