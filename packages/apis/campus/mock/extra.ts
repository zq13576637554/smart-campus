/**
 * @file 平台能力相关的演示数据（字典 / 菜单权限 / 消息 / 请假审批）
 * @desc 与 db.ts 分离，避免单文件过大；所有集合都支持运行时增删改
 */
import { dayjs } from "lmUtils/time";
import { LOCAL_DICTS } from "../enums";
import type { DictItem } from "lmStore/modules/dict";

/* ---------------- 数据字典（可维护） ---------------- */
export interface DictTypeRecord {
	id: string;
	type: string;
	name: string;
	remark: string;
	builtin: boolean;
	items: DictItem[];
}

export const dictTypes: DictTypeRecord[] = Object.keys(LOCAL_DICTS).map((type, index) => ({
	id: `DT${String(index + 1).padStart(3, "0")}`,
	type,
	name: type,
	remark: "",
	builtin: true,
	items: LOCAL_DICTS[type].map((d, i) => ({ ...d, sort: i } as any))
}));

// 补充中文名，便于字典管理页展示
const DICT_NAMES: Record<string, string> = {
	STUDENT_STATUS: "学籍状态",
	GENDER: "性别",
	TEACHER_STATUS: "在职状态",
	TEACHER_TITLE: "教师职称",
	COURSE_TYPE: "课程类型",
	ATTENDANCE_TYPE: "考勤类型",
	CHECK_METHOD: "打卡方式",
	DORM_STATUS: "宿舍状态",
	CARD_BIZ_TYPE: "一卡通交易类型",
	ACCESS_DIRECTION: "通行方向",
	ACCESS_STATUS: "通行状态",
	PERSON_TYPE: "人员类型",
	NOTICE_TYPE: "通知类型",
	EXAM_TYPE: "考试类型",
	SCORE_LEVEL: "成绩等级",
	YES_OR_NO: "是否",
	USER_STATUS: "用户状态",
	TERM: "学期"
};
dictTypes.forEach(d => (d.name = DICT_NAMES[d.type] || d.type));

/* ---------------- 菜单与按钮权限 ---------------- */
export type MenuType = "group" | "menu" | "button";

export interface MenuNode {
	id: string;
	parentId: string | null;
	title: string;
	name: string;
	path: string;
	icon?: string;
	group?: string;
	sort?: number;
	type: MenuType;
	/** 按钮权限码 */
	auth?: string;
	visible: boolean;
}

const GROUPS = [
	{ id: "G01", title: "工作台", icon: "grid", sort: 1 },
	{ id: "G10", title: "学籍管理", icon: "student", sort: 10 },
	{ id: "G20", title: "教学管理", icon: "course", sort: 20 },
	{ id: "G30", title: "校园生活", icon: "dorm", sort: 30 },
	{ id: "G40", title: "智能中枢", icon: "ai", sort: 40 },
	{ id: "G50", title: "系统设置", icon: "system", sort: 50 }
];

interface PageSeed {
	id: string;
	group: string;
	title: string;
	path: string;
	icon: string;
	sort: number;
	/** 按钮权限码（逗号分隔） */
	buttons?: string;
}

export const PAGE_SEEDS: PageSeed[] = [
	{ id: "M001", group: "G01", title: "首页", path: "/home/", icon: "home", sort: 1 },
	{ id: "M010", group: "G10", title: "学生档案", path: "/xsgl/", icon: "student", sort: 10, buttons: "student:add,student:edit,student:delete,student:export,student:import" },
	{ id: "M011", group: "G10", title: "班级管理", path: "/bjgl/", icon: "class", sort: 11, buttons: "class:add,class:edit,class:delete" },
	{ id: "M012", group: "G10", title: "教职工管理", path: "/jsgl/", icon: "teacher", sort: 12, buttons: "teacher:add,teacher:edit,teacher:delete" },
	{ id: "M020", group: "G20", title: "课程管理", path: "/kcgl/", icon: "course", sort: 20, buttons: "course:add,course:edit,course:delete" },
	{ id: "M021", group: "G20", title: "课表管理", path: "/kcb/", icon: "schedule", sort: 21 },
	{ id: "M022", group: "G20", title: "学业成绩", path: "/cjgl/", icon: "score", sort: 22, buttons: "score:edit,score:export" },
	{ id: "M023", group: "G20", title: "智能考勤", path: "/kqgl/", icon: "attendance", sort: 23, buttons: "attendance:fix" },
	{ id: "M024", group: "G20", title: "考试管理", path: "/ksgl/", icon: "document", sort: 24, buttons: "exam:add,exam:edit,exam:publish" },
	{ id: "M025", group: "G20", title: "选课中心", path: "/xkzx/", icon: "files", sort: 25 },
	{ id: "M030", group: "G30", title: "智慧宿舍", path: "/ssgl/", icon: "dorm", sort: 30, buttons: "dorm:edit" },
	{ id: "M031", group: "G30", title: "校园一卡通", path: "/ykt/", icon: "card", sort: 31, buttons: "card:recharge" },
	{ id: "M032", group: "G30", title: "门禁安防", path: "/mjgl/", icon: "access", sort: 32 },
	{ id: "M033", group: "G30", title: "通知公告", path: "/tzgg/", icon: "notice", sort: 33, buttons: "notice:add,notice:delete" },
	{ id: "M034", group: "G30", title: "请假审批", path: "/qjgl/", icon: "calendar", sort: 34, buttons: "leave:apply,leave:approve" },
	{ id: "M035", group: "G30", title: "宿舍报修", path: "/ssbx/", icon: "files", sort: 35 },
	{ id: "M036", group: "G30", title: "访客预约", path: "/fkyy/", icon: "user", sort: 36 },
	{ id: "M037", group: "G30", title: "缴费中心", path: "/jfzx/", icon: "card", sort: 37 },
	{ id: "M038", group: "G30", title: "消费预警", path: "/xfyj/", icon: "notice", sort: 38 },
	{ id: "M039", group: "G30", title: "图书馆", path: "/tsjy/", icon: "document", sort: 39 },
	{ id: "M045", group: "G30", title: "校车管理", path: "/xcgl/", icon: "files", sort: 45 },
	{ id: "M046", group: "G30", title: "能耗监测", path: "/nhjc/", icon: "chart", sort: 46 },
	{ id: "M040", group: "G40", title: "AI 校园助手", path: "/ai/", icon: "ai", sort: 40 },
	{ id: "M041", group: "G40", title: "数据大屏", path: "/daping/", icon: "chart", sort: 41 },
	{ id: "M042", group: "G40", title: "综合素质评价", path: "/zhsz/", icon: "medal", sort: 42 },
	{ id: "M043", group: "G40", title: "报表中心", path: "/bbzx/", icon: "document", sort: 43 },
	{ id: "M050", group: "G50", title: "系统管理", path: "/xtgl/", icon: "system", sort: 50 },
	{ id: "M051", group: "G50", title: "菜单权限", path: "/cdgl/", icon: "menu", sort: 51 },
	{ id: "M052", group: "G50", title: "数据字典", path: "/zdgl/", icon: "files", sort: 52 },
	{ id: "M053", group: "G50", title: "消息中心", path: "/msg/", icon: "notice", sort: 53 },
	{ id: "M054", group: "G50", title: "操作日志", path: "/rzgl/", icon: "document", sort: 54 },
	{ id: "M055", group: "G50", title: "资产台账", path: "/zctz/", icon: "files", sort: 55 }
];

/** 生成扁平菜单（分组 + 页面 + 按钮） */
export const menuNodes: MenuNode[] = [];
GROUPS.forEach(g => {
	menuNodes.push({
		id: g.id,
		parentId: null,
		title: g.title,
		name: g.title,
		path: "",
		icon: g.icon,
		group: g.title,
		sort: g.sort,
		type: "group",
		visible: true
	});
});
PAGE_SEEDS.forEach(p => {
	menuNodes.push({
		id: p.id,
		parentId: p.group,
		title: p.title,
		name: p.id,
		path: p.path,
		icon: p.icon,
		group: GROUPS.find(g => g.id === p.group)?.title,
		sort: p.sort,
		type: "menu",
		visible: true
	});
	(p.buttons ? p.buttons.split(",") : []).forEach((auth, i) => {
		menuNodes.push({
			id: `${p.id}-B${i + 1}`,
			parentId: p.id,
			title: auth.split(":")[1] || auth,
			name: auth,
			path: "",
			group: GROUPS.find(g => g.id === p.group)?.title,
			sort: i,
			type: "button",
			auth,
			visible: true
		});
	});
});

/* ---------------- 消息中心 ---------------- */
export interface MessageRecord {
	id: string;
	type: string;
	title: string;
	content: string;
	read: boolean;
	important: boolean;
	time: string;
	link?: string;
	from: string;
}

const MSG_SEED: [string, string, string, string, boolean][] = [
	["APPROVE", "有一条新的请假申请待审批", "高一(3)班 汤汐月 提交事假申请（11-04 至 11-05，共 2 天），请及时处理。", "学生处", true],
	["WARNING", "门禁异常告警", "南门人脸闸机在 22:41 检测到非授权时段通行，已自动拦截并记录。", "保卫处", true],
	["SYSTEM", "系统升级通知", "校园一卡通系统将于周六 02:00-04:00 进行维护，期间暂停充值。", "信息中心", false],
	["APPROVE", "宿舍报修已派单", "B 栋 302 空调故障已派单至后勤维修组，预计 24 小时内上门。", "后勤集团", false],
	["NOTICE", "期末考试安排已发布", "2025-2026 学年第一学期期末考试安排已在「考试管理」发布，请查看考场与监考安排。", "教务处", false],
	["WARNING", "消费异常预警", "学生 陈嘉宁 今日 12:03-12:09 连续消费 4 笔，触发高频消费预警。", "一卡通中心", true],
	["APPROVE", "请假申请已通过", "高三(1)班 钟梦琪 的病假申请已由班主任批准。", "班主任", false],
	["NOTICE", "综合素质评价填报提醒", "本月德育积分与奖惩记录尚未完成填报，请班主任在本周五前提交。", "德育处", false],
	["SYSTEM", "密码即将过期", "您的登录密码已使用 90 天，建议前往个人中心修改。", "信息中心", false],
	["NOTICE", "家长会通知", "高一年级家长会定于本周六上午 9:00 在报告厅举行。", "年级组", false],
	["WARNING", "设备离线提醒", "图书馆闸机连续 30 分钟无心跳，请检查网络与电源。", "信息中心", false],
	["APPROVE", "访客预约待确认", "访客 李先生 申请 11-05 14:00 到访，接待人：张校长。", "门卫室", false]
];

export const messages: MessageRecord[] = MSG_SEED.map(([type, title, content, from, important], i) => ({
	id: `MSG${String(i + 1).padStart(4, "0")}`,
	type,
	title,
	content,
	from,
	important,
	read: i > 6,
	time: dayjs().subtract(i * 3 + 1, "hour").format("YYYY-MM-DD HH:mm:ss")
}));

/* ---------------- 请假审批 ---------------- */
export interface LeaveRecord {
	id: string;
	studentNo: string;
	studentName: string;
	className: string;
	type: string;
	startDate: string;
	endDate: string;
	days: number;
	reason: string;
	status: string;
	applyTime: string;
	approver: string;
	approveTime: string;
	approveRemark: string;
}

const LEAVE_SEED: [string, string, string, string, string, string, string][] = [
	["202400079", "汤汐月", "高一(3)班", "事假", "2026-11-04", "2026-11-05", "家中有事需回家处理"],
	["202400361", "钟梦琪", "高三(3)班", "病假", "2026-11-03", "2026-11-03", "感冒发热，医院建议休息一天"],
	["202400148", "严嘉宁", "高二(1)班", "事假", "2026-10-28", "2026-10-29", "参加数学竞赛集训"],
	["202400042", "邹晨阳", "高一(2)班", "病假", "2026-10-26", "2026-10-27", "牙科手术后休养"],
	["202400165", "孟晨阳", "高二(1)班", "事假", "2026-10-20", "2026-10-20", "亲属婚宴"],
	["202400020", "钟明轩", "高一(1)班", "事假", "2026-10-18", "2026-10-19", "家庭搬迁"]
];

export const leaves: LeaveRecord[] = LEAVE_SEED.map(([studentNo, studentName, className, type, startDate, endDate, reason], i) => ({
	id: `LV${String(i + 1).padStart(4, "0")}`,
	studentNo,
	studentName,
	className,
	type,
	startDate,
	endDate,
	days: dayjs(endDate).diff(dayjs(startDate), "day") + 1,
	reason,
	status: i === 0 ? "PENDING" : i === 1 ? "PENDING" : i === 5 ? "REJECTED" : "APPROVED",
	applyTime: dayjs(startDate).subtract(1, "day").format("YYYY-MM-DD HH:mm:ss"),
	approver: i < 2 ? "" : "班主任 王老师",
	approveTime: i < 2 ? "" : dayjs(startDate).subtract(1, "day").add(2, "hour").format("YYYY-MM-DD HH:mm:ss"),
	approveRemark: i < 2 ? "" : i === 5 ? "材料不全，请补充医院证明" : "同意"
}));

/* ---------------- 审计日志 ---------------- */
export interface AuditLog {
	id: string;
	userName: string;
	nickName: string;
	action: string;
	module: string;
	ip: string;
	time: string;
	result: string;
	detail: string;
}

const LOG_ACTIONS = [
	["LOGIN", "登录", "认证中心", "成功"],
	["QUERY", "查询学生档案", "学生档案", "成功"],
	["UPDATE", "编辑学生档案", "学生档案", "成功"],
	["EXPORT", "导出学生档案", "学生档案", "成功"],
	["APPROVE", "审批请假申请", "请假审批", "成功"],
	["DELETE", "删除通知公告", "通知公告", "失败"],
	["RECHARGE", "校园卡充值", "一卡通", "成功"],
	["LOGIN", "登录", "认证中心", "失败"]
];

export const auditLogs: AuditLog[] = Array.from({ length: 60 }, (_, i) => {
	const [action, label, module, result] = LOG_ACTIONS[i % LOG_ACTIONS.length];
	return {
		id: `LOG${String(i + 1).padStart(5, "0")}`,
		userName: ["admin", "principal", "master01", "teacher01"][i % 4],
		nickName: ["系统管理员", "张校长", "王老师", "李老师"][i % 4],
		action: label,
		module,
		ip: `192.168.10.${(i % 60) + 20}`,
		time: dayjs().subtract(i * 2 + 1, "hour").format("YYYY-MM-DD HH:mm:ss"),
		result,
		detail: `${label} - ${module}（${action}）`
	};
});

export { GROUPS };

/* ---------------- 考试管理 ---------------- */
export interface ExamRecord {
	id: string;
	name: string;
	type: string;
	grade: string;
	date: string;
	startTime: string;
	endTime: string;
	roomCount: number;
	studentCount: number;
	status: string;
	remark: string;
}

export interface ExamRoom {
	id: string;
	examId: string;
	roomNo: string;
	building: string;
	seats: number;
	used: number;
	invigilator: string;
}

export const exams: ExamRecord[] = [
	{ id: "EX0001", name: "2025-2026 学年第一学期期末考试", type: "FINAL", grade: "高三", date: "2026-01-12", startTime: "09:00", endTime: "11:00", roomCount: 8, studentCount: 382, status: "PUBLISHED", remark: "考场与监考安排已发布" },
	{ id: "EX0002", name: "高三年级第一次模拟考试", type: "MONTHLY", grade: "高三", date: "2026-11-18", startTime: "09:00", endTime: "11:30", roomCount: 6, studentCount: 128, status: "PUBLISHED", remark: "" },
	{ id: "EX0003", name: "高二年级期中考试", type: "MIDTERM", grade: "高二", date: "2026-11-10", startTime: "14:00", endTime: "16:00", roomCount: 6, studentCount: 126, status: "DRAFT", remark: "待确认监考名单" },
	{ id: "EX0004", name: "高一年级期中考试", type: "MIDTERM", grade: "高一", date: "2026-11-10", startTime: "09:00", endTime: "11:00", roomCount: 6, studentCount: 128, status: "DRAFT", remark: "" },
	{ id: "EX0005", name: "高三第二次模拟考试", type: "MONTHLY", grade: "高三", date: "2026-12-08", startTime: "09:00", endTime: "11:30", roomCount: 6, studentCount: 128, status: "DRAFT", remark: "" },
	{ id: "EX0006", name: "信息技术学业水平测试", type: "FINAL", grade: "高二", date: "2026-12-20", startTime: "10:00", endTime: "11:00", roomCount: 4, studentCount: 126, status: "FINISHED", remark: "已录入成绩" },
	{ id: "EX0007", name: "物理化学实验操作考查", type: "QUIZ", grade: "高二", date: "2026-10-22", startTime: "14:00", endTime: "15:30", roomCount: 3, studentCount: 96, status: "FINISHED", remark: "" },
	{ id: "EX0008", name: "高一年级入学分班考试", type: "QUIZ", grade: "高一", date: "2026-09-02", startTime: "08:00", endTime: "10:00", roomCount: 6, studentCount: 130, status: "FINISHED", remark: "" }
];

export const examRooms: ExamRoom[] = [];
exams.forEach(exam => {
	for (let i = 0; i < exam.roomCount; i++) {
		const seats = 30;
		const perRoom = Math.round(exam.studentCount / exam.roomCount);
		examRooms.push({
			id: `${exam.id}-R${i + 1}`,
			examId: exam.id,
			roomNo: `${String(101 + i).padStart(3, "0")}`,
			building: i < 3 ? "博学楼" : "明德楼",
			seats,
			used: Math.min(seats, perRoom),
			invigilator: ["王老师", "李老师", "张老师", "赵老师", "刘老师", "陈老师"][i % 6]
		});
	}
});

/* ---------------- 选课 ---------------- */
export interface EnrollCourse {
	id: string;
	courseId: string;
	courseName: string;
	teacherName: string;
	grade: string;
	type: string;
	credit: number;
	capacity: number;
	enrolled: number;
	open: boolean;
	time: string;
}

export interface EnrollRecord {
	id: string;
	courseId: string;
	courseName: string;
	studentNo: string;
	studentName: string;
	className: string;
	time: string;
}

/** 由课程派生选课课程池（容量与已选人数为确定性伪随机） */
export const enrollCourses: EnrollCourse[] = [];
export const enrollRecords: EnrollRecord[] = [];

/** 由外部注入课程与学生数据后初始化（避免循环依赖） */
export function initEnrollments(
	courses: { id: string; courseName: string; teacherName: string; grade: string; type: string; credit: number }[],
	students: { studentNo: string; name: string; className: string }[]
) {
	let seed = 7;
	const rnd = () => {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	};

	courses.slice(0, 18).forEach((c, i) => {
		const capacity = [30, 40, 50, 60][i % 4];
		const enrolled = Math.min(capacity, 12 + Math.floor(rnd() * (capacity - 10)));
		enrollCourses.push({
			id: `EC${String(i + 1).padStart(4, "0")}`,
			courseId: c.id,
			courseName: c.courseName,
			teacherName: c.teacherName,
			grade: c.grade,
			type: c.type,
			credit: c.credit,
			capacity,
			enrolled,
			open: i % 5 !== 4,
			time: dayjs().subtract(i, "day").format("YYYY-MM-DD HH:mm:ss")
		});

		Array.from({ length: Math.min(enrolled, 12) }).forEach((_, k) => {
			const stu = students[Math.floor(rnd() * students.length)];
			enrollRecords.push({
				id: `ER${String(enrollRecords.length + 1).padStart(5, "0")}`,
				courseId: c.id,
				courseName: c.courseName,
				studentNo: stu.studentNo,
				studentName: stu.name,
				className: stu.className,
				time: dayjs().subtract(i, "day").add(k, "minute").format("YYYY-MM-DD HH:mm:ss")
			});
		});
	});
}

