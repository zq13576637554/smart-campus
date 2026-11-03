/**
 * @file 演示数据（内存数据库）
 * @desc 使用固定种子的伪随机数，保证每次刷新数据一致
 */
import { dayjs } from "lmUtils/time";

/* ---------------- 伪随机 ---------------- */
let seed = 20240918;
const rnd = () => {
	seed = (seed * 9301 + 49297) % 233280;
	return seed / 233280;
};
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const shuffle = <T>(arr: T[]): T[] => arr.slice().sort(() => rnd() - 0.5);

const SURNAMES = "张王李赵刘陈杨黄周吴徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤".split("");
const GIVEN = ["子涵", "雨桐", "梓萱", "浩然", "宇轩", "欣怡", "诗涵", "一诺", "思远", "晨曦", "佳怡", "嘉豪", "俊杰", "梦琪", "雨欣", "子墨", "欣妍", "宇航", "嘉宁", "天赐", "雅琪", "可馨", "志强", "文博", "若曦", "博文", "紫涵", "皓轩", "语嫣", "明轩", "汐月", "书瑶", "铭泽", "耀阳", "安琪", "家豪", "静怡", "泽宇", "思彤", "晨阳"];
const name = () => `${pick(SURNAMES)}${pick(GIVEN)}`;

const SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "政治", "历史", "地理", "体育", "信息技术", "音乐", "美术"];
const GRADES = ["高一", "高二", "高三"];
const BUILDINGS = ["A 栋", "B 栋", "C 栋", "D 栋"];
const PLACES = ["第一食堂", "第二食堂", "校园超市", "图书馆", "洗衣房", "文具店", "水果店", "打印中心"];
const DEVICES = ["南门人脸闸机", "北门人脸闸机", "图书馆闸机", "宿舍 A 栋闸机", "教学楼一层闸机", "体育馆闸机"];
const TITLES = ["PROFESSOR", "ASSOCIATE", "LECTURER", "ASSISTANT"];
const today = dayjs();

/* ---------------- 班级 ---------------- */
export interface Klass {
	id: string;
	classNo: string;
	className: string;
	grade: string;
	major: string;
	headTeacher: string;
	studentCount: number;
	room: string;
	status: string;
	createdAt: string;
}

export const classes: Klass[] = [];
GRADES.forEach((grade, gi) => {
	for (let i = 1; i <= 4; i++) {
		classes.push({
			id: `C${gi * 4 + i < 10 ? "0" : ""}${gi * 4 + i}`,
			classNo: `G${2024 - gi}${String(i).padStart(2, "0")}`,
			className: `${grade}(${i})班`,
			grade,
			major: pick(["理科", "文科", "综合"]),
			headTeacher: name(),
			studentCount: 0,
			room: `${grade === "高三" ? "博学楼" : grade === "高二" ? "明德楼" : "致远楼"}${int(2, 4)}0${int(1, 9)}`,
			status: "NORMAL",
			createdAt: dayjs().subtract(400 - gi * 30, "day").format("YYYY-MM-DD")
		});
	}
});

/* ---------------- 教师 ---------------- */
export interface Teacher {
	id: string;
	teacherNo: string;
	name: string;
	gender: string;
	subject: string;
	title: string;
	phone: string;
	email: string;
	deptName: string;
	status: string;
	joinDate: string;
	courseCount: number;
	avatarColor: string;
}

export const teachers: Teacher[] = Array.from({ length: 36 }, (_, i) => {
	const gender = rnd() > 0.45 ? "F" : "M";
	return {
		id: `T${String(i + 1).padStart(4, "0")}`,
		teacherNo: `JS${2020 + int(0, 5)}${String(i + 1).padStart(3, "0")}`,
		name: name(),
		gender,
		subject: SUBJECTS[i % SUBJECTS.length],
		title: pick(TITLES),
		phone: `13${int(1, 9)}${String(int(10000000, 99999999))}`,
		email: `teacher${i + 1}@campus.edu.cn`,
		deptName: `${SUBJECTS[i % SUBJECTS.length]}教研组`,
		status: rnd() > 0.9 ? "VACATION" : "ON_JOB",
		joinDate: dayjs().subtract(int(200, 4000), "day").format("YYYY-MM-DD"),
		courseCount: int(1, 4),
		avatarColor: pick(["#165DFF", "#00B42A", "#FF7D00", "#F53F3F", "#722ED1", "#0FC6C2"])
	};
});

/* ---------------- 学生 ---------------- */
export interface Student {
	id: string;
	studentNo: string;
	name: string;
	gender: string;
	grade: string;
	classId: string;
	className: string;
	major: string;
	phone: string;
	idCard: string;
	status: string;
	dorm: string;
	bedNo: string;
	enrollDate: string;
	birthday: string;
	address: string;
	guardian: string;
	guardianPhone: string;
	createdAt: string;
	avatarColor: string;
}

export const students: Student[] = [];
(() => {
	let n = 0;
	classes.forEach(cls => {
		const count = int(28, 36);
		cls.studentCount = count;
		for (let i = 0; i < count; i++) {
			n++;
			const gender = rnd() > 0.5 ? "F" : "M";
			students.push({
				id: `S${String(n).padStart(5, "0")}`,
				studentNo: `2024${String(n).padStart(5, "0")}`,
				name: name(),
				gender,
				grade: cls.grade,
				classId: cls.id,
				className: cls.className,
				major: cls.major,
				phone: `15${int(1, 9)}${String(int(10000000, 99999999))}`,
				idCard: `3601${int(10, 99)}${dayjs().subtract(int(15, 18), "year").format("YYYYMMDD")}${int(1000, 9999)}`,
				status: rnd() > 0.94 ? pick(["SUSPENDED", "GRADUATED"]) : "STUDYING",
				dorm: `${pick(BUILDINGS)}${int(1, 6)}${String(int(1, 12)).padStart(2, "0")}`,
				bedNo: `${int(1, 6)}号床`,
				enrollDate: dayjs().subtract(int(400, 900), "day").format("YYYY-MM-DD"),
				birthday: dayjs().subtract(int(15, 18), "year").format("YYYY-MM-DD"),
				address: `江西省南昌市${pick(["红谷滩区", "青山湖区", "西湖区", "新建区"])}${int(1, 99)}号`,
				guardian: `${pick(SURNAMES)}先生`,
				guardianPhone: `13${int(1, 9)}${String(int(10000000, 99999999))}`,
				createdAt: dayjs().subtract(int(1, 300), "day").format("YYYY-MM-DD HH:mm:ss"),
				avatarColor: pick(["#165DFF", "#00B42A", "#FF7D00", "#F53F3F", "#722ED1", "#0FC6C2"])
			});
		}
	});
})();

/* ---------------- 课程 ---------------- */
export interface Course {
	id: string;
	courseNo: string;
	courseName: string;
	teacherId: string;
	teacherName: string;
	credit: number;
	hours: number;
	type: string;
	grade: string;
	term: string;
	className: string;
	status: string;
}

export const courses: Course[] = [];
(() => {
	let n = 0;
	GRADES.forEach(grade => {
		SUBJECTS.forEach(subject => {
			n++;
			const teacher = pick(teachers.filter(t => t.subject === subject)) || teachers[0];
			courses.push({
				id: `K${String(n).padStart(4, "0")}`,
				courseNo: `KC${String(n).padStart(4, "0")}`,
				courseName: `${grade}${subject}`,
				teacherId: teacher.id,
				teacherName: teacher.name,
				credit: int(1, 4),
				hours: pick([32, 36, 40, 48]),
				type: ["语文", "数学", "英语"].includes(subject) ? "REQUIRED" : pick(["REQUIRED", "ELECTIVE", "PRACTICE"]),
				grade,
				term: "2025-1",
				className: `${grade}(1)班`,
				status: "OPEN"
			});
		});
	});
})();

/* ---------------- 课表 ---------------- */
export interface ScheduleItem {
	id: string;
	classId: string;
	className: string;
	day: number;
	slot: number;
	courseId: string;
	courseName: string;
	teacherName: string;
	room: string;
}

const SLOT_TIME = ["08:00-08:45", "08:55-09:40", "10:00-10:45", "10:55-11:40", "14:00-14:45", "14:55-15:40", "16:00-16:45", "16:55-17:40"];

export const schedules: ScheduleItem[] = [];
(() => {
	classes.forEach(cls => {
		for (let day = 1; day <= 5; day++) {
			for (let slot = 1; slot <= 8; slot++) {
				if (rnd() > 0.9) continue;
				const gradeCourses = courses.filter(c => c.grade === cls.grade);
				const course = pick(gradeCourses);
				schedules.push({
					id: `SC${schedules.length + 1}`,
					classId: cls.id,
					className: cls.className,
					day,
					slot,
					courseId: course.id,
					courseName: course.courseName.replace(cls.grade, ""),
					teacherName: course.teacherName,
					room: cls.room
				});
			}
		}
	});
})();

export const slotTimes = SLOT_TIME;

/* ---------------- 考勤 ---------------- */
export interface Attendance {
	id: string;
	studentId: string;
	studentNo: string;
	name: string;
	className: string;
	date: string;
	time: string;
	type: string;
	method: string;
	device: string;
	remark: string;
}

export const attendances: Attendance[] = Array.from({ length: 320 }, (_, i) => {
	const stu = pick(students);
	const type = rnd() > 0.82 ? pick(["LATE", "EARLY", "ABSENT", "LEAVE"]) : "NORMAL";
	const date = today.subtract(int(0, 29), "day");
	return {
		id: `AT${String(i + 1).padStart(5, "0")}`,
		studentId: stu.id,
		studentNo: stu.studentNo,
		name: stu.name,
		className: stu.className,
		date: date.format("YYYY-MM-DD"),
		time: type === "ABSENT" ? "" : `${String(int(7, 8)).padStart(2, "0")}:${String(int(10, 59)).padStart(2, "0")}:00`,
		type,
		method: pick(["FACE", "CARD", "QRCODE", "MANUAL"]),
		device: pick(["南门人脸闸机", "教学楼一层闸机", "宿舍 A 栋闸机"]),
		remark: type === "LEAVE" ? "事假（已审批）" : type === "ABSENT" ? "未打卡" : ""
	};
});

/* ---------------- 成绩 ---------------- */
export interface Score {
	id: string;
	studentId: string;
	studentNo: string;
	name: string;
	className: string;
	grade: string;
	term: string;
	examType: string;
	courseName: string;
	score: number;
	classRank: number;
	level: string;
}

const scoreLevel = (s: number) => (s >= 90 ? "EXCELLENT" : s >= 75 ? "GOOD" : s >= 60 ? "PASS" : "FAIL");

export const scores: Score[] = [];
(() => {
	let n = 0;
	students.forEach(stu => {
		["语文", "数学", "英语", "物理", "化学"].forEach(subject => {
			n++;
			const sc = Math.min(100, Math.max(32, Math.round(68 + rnd() * 30 + (subject === "数学" ? -4 : 2))));
			scores.push({
				id: `SC${String(n).padStart(5, "0")}`,
				studentId: stu.id,
				studentNo: stu.studentNo,
				name: stu.name,
				className: stu.className,
				grade: stu.grade,
				term: "2025-1",
				examType: "FINAL",
				courseName: subject,
				score: sc,
				classRank: 0,
				level: scoreLevel(sc)
			});
		});
	});

	// 计算班级排名
	const byClassCourse: Record<string, Score[]> = {};
	scores.forEach(s => {
		const key = `${s.className}-${s.courseName}`;
		(byClassCourse[key] = byClassCourse[key] || []).push(s);
	});
	Object.values(byClassCourse).forEach(list => {
		list.sort((a, b) => b.score - a.score).forEach((s, i) => (s.classRank = i + 1));
	});
})();

/* ---------------- 宿舍 ---------------- */
export interface Dorm {
	id: string;
	building: string;
	roomNo: string;
	floor: number;
	capacity: number;
	used: number;
	status: string;
	manager: string;
	students: { name: string; studentNo: string; bedNo: string }[];
}

export const dorms: Dorm[] = [];
BUILDINGS.forEach(building => {
	for (let floor = 1; floor <= 6; floor++) {
		for (let no = 1; no <= 6; no++) {
			const capacity = 6;
			const used = int(2, 6);
			const members = shuffle(students).slice(0, used);
			dorms.push({
				id: `D${building.charCodeAt(0)}${floor}${no}`,
				building,
				roomNo: `${floor}${String(no).padStart(2, "0")}`,
				floor,
				capacity,
				used,
				status: used >= capacity ? "FULL" : rnd() > 0.95 ? "REPAIR" : "NORMAL",
				manager: name(),
				students: members.map((m, i) => ({ name: m.name, studentNo: m.studentNo, bedNo: `${i + 1}号床` }))
			});
		}
	}
});

/* ---------------- 一卡通 ---------------- */
export interface CardTx {
	id: string;
	cardNo: string;
	name: string;
	studentNo: string;
	bizType: string;
	amount: number;
	balance: number;
	place: string;
	time: string;
}

export interface CampusCard {
	id: string;
	cardNo: string;
	studentId: string;
	name: string;
	studentNo: string;
	className: string;
	balance: number;
	status: string;
	openDate: string;
}

export const cards: CampusCard[] = students.slice(0, 90).map((stu, i) => ({
	id: `CD${String(i + 1).padStart(4, "0")}`,
	cardNo: `62${String(int(100000000, 999999999))}${i}`,
	studentId: stu.id,
	name: stu.name,
	studentNo: stu.studentNo,
	className: stu.className,
	balance: Number((int(20, 800) + rnd()).toFixed(2)),
	status: rnd() > 0.95 ? "FROZEN" : "NORMAL",
	openDate: dayjs().subtract(int(60, 400), "day").format("YYYY-MM-DD")
}));

export const cardTxes: CardTx[] = [];
(() => {
	cards.forEach(card => {
		const count = int(3, 8);
		let balance = card.balance + 300;
		for (let i = 0; i < count; i++) {
			const isRecharge = rnd() > 0.78;
			const amount = isRecharge ? pick([50, 100, 200]) : -Number((int(3, 45) + rnd()).toFixed(2));
			balance = Number((balance + amount).toFixed(2));
			cardTxes.push({
				id: `TX${String(cardTxes.length + 1).padStart(5, "0")}`,
				cardNo: card.cardNo,
				name: card.name,
				studentNo: card.studentNo,
				bizType: isRecharge ? "RECHARGE" : "CONSUME",
				amount,
				balance,
				place: isRecharge ? "校园卡充值中心" : pick(PLACES),
				time: today.subtract(int(0, 20), "day").format("YYYY-MM-DD HH:mm:ss")
			});
		}
	});
})();

/* ---------------- 门禁 ---------------- */
export interface AccessRecord {
	id: string;
	personName: string;
	personNo: string;
	personType: string;
	device: string;
	direction: string;
	method: string;
	time: string;
	status: string;
	temperature?: number;
}

export const accessRecords: AccessRecord[] = Array.from({ length: 260 }, (_, i) => {
	const isStudent = rnd() > 0.25;
	const person = isStudent ? pick(students) : pick(teachers);
	const abnormal = rnd() > 0.93;
	return {
		id: `AC${String(i + 1).padStart(5, "0")}`,
		personName: person.name,
		personNo: isStudent ? (person as Student).studentNo : (person as Teacher).teacherNo,
		personType: isStudent ? "STUDENT" : "TEACHER",
		device: pick(DEVICES),
		direction: rnd() > 0.5 ? "IN" : "OUT",
		method: pick(["FACE", "CARD"]),
		time: today.subtract(int(0, 6), "day").format("YYYY-MM-DD") + ` ${String(int(6, 21)).padStart(2, "0")}:${String(int(0, 59)).padStart(2, "0")}:00`,
		status: abnormal ? "ABNORMAL" : "NORMAL",
		temperature: Number((36 + rnd() * 0.8).toFixed(1))
	};
});

/* ---------------- 通知 ---------------- */
export interface Notice {
	id: string;
	title: string;
	type: string;
	content: string;
	publisher: string;
	publishTime: string;
	readCount: number;
	top: boolean;
	status: string;
}

const NOTICE_TITLES = [
	"关于开展 2025 年秋季学期期中考试的通知",
	"校园一卡通系统升级维护公告",
	"关于加强学生宿舍安全管理的通知",
	"第十届校园文化艺术节报名通知",
	"关于调整作息时间的通知",
	"校园网络设备检修公告",
	"高三年级模拟考试成绩分析会通知",
	"关于评选优秀学生干部的通知",
	"图书馆新书上架通知",
	"食堂菜品满意度调查通知",
	"秋季运动会志愿者招募公告",
	"关于防范电信诈骗的安全提示",
	"学生心理健康普查通知",
	"关于规范教室多媒体设备使用的通知",
	"校园消防演练公告",
	"教师职称评审工作通知",
	"关于做好寒假前后安全工作的通知",
	"优秀班集体评选结果公示",
	"智慧校园 App 上线试运行公告",
	"关于征集校园文化活动方案的通知",
	"实验室安全培训通知",
	"校园绿化改造施工公告",
	"关于严禁学生携带违禁物品入校的通知",
	"校园歌手大赛决赛公告"
];

export const notices: Notice[] = NOTICE_TITLES.map((title, i) => ({
	id: `N${String(i + 1).padStart(4, "0")}`,
	title,
	type: i % 7 === 3 ? "WARNING" : i % 5 === 0 ? "ANNOUNCEMENT" : "NOTICE",
	content: `${title}\n\n各部门、各班级：\n\n为进一步做好学校相关工作，经学校研究决定，现将有关事项通知如下：\n\n一、高度重视，认真组织。各部门要结合实际，明确责任分工，确保各项工作落实到位。\n\n二、加强宣传，营造氛围。通过校园网、公众号、班级群等多种渠道广泛宣传，做到人人知晓。\n\n三、强化督导，确保实效。学校将对工作开展情况进行检查，检查结果纳入年度考核。\n\n特此通知。\n\n教务处\n${today.subtract(i, "day").format("YYYY年MM月DD日")}`,
	publisher: pick(["教务处", "学生处", "保卫处", "校办公室", "信息中心", "后勤集团"]),
	publishTime: today.subtract(i, "day").format("YYYY-MM-DD HH:mm:ss"),
	readCount: int(30, 2400),
	top: i < 3,
	status: "PUBLISHED"
}));

/* ---------------- 系统 ---------------- */
export interface SysUser {
	id: string;
	userName: string;
	nickName: string;
	phone: string;
	deptName: string;
	roleCode: string;
	roleName: string;
	status: string;
	lastLogin: string;
}

export const users: SysUser[] = [
	{ id: "U0001", userName: "admin", nickName: "系统管理员", phone: "13800000001", deptName: "信息中心", roleCode: "SUPER_ADMIN", roleName: "超级管理员", status: "ENABLED", lastLogin: today.format("YYYY-MM-DD HH:mm:ss") },
	{ id: "U0002", userName: "principal", nickName: "张校长", phone: "13800000002", deptName: "校办公室", roleCode: "PRINCIPAL", roleName: "校领导", status: "ENABLED", lastLogin: today.subtract(1, "day").format("YYYY-MM-DD HH:mm:ss") },
	{ id: "U0003", userName: "teacher01", nickName: "李老师", phone: "13800000003", deptName: "数学教研组", roleCode: "TEACHER", roleName: "科任教师", status: "ENABLED", lastLogin: today.subtract(2, "day").format("YYYY-MM-DD HH:mm:ss") },
	{ id: "U0004", userName: "master01", nickName: "王老师", phone: "13800000004", deptName: "高一(1)班", roleCode: "MASTER", roleName: "班主任", status: "ENABLED", lastLogin: today.subtract(3, "day").format("YYYY-MM-DD HH:mm:ss") },
	{ id: "U0005", userName: "warden01", nickName: "赵宿管", phone: "13800000005", deptName: "宿管中心", roleCode: "WARDEN", roleName: "宿舍管理员", status: "ENABLED", lastLogin: today.subtract(5, "day").format("YYYY-MM-DD HH:mm:ss") },
	{ id: "U0006", userName: "guard01", nickName: "孙保安", phone: "13800000006", deptName: "保卫处", roleCode: "GUARD", roleName: "安保人员", status: "DISABLED", lastLogin: today.subtract(9, "day").format("YYYY-MM-DD HH:mm:ss") }
];

export interface SysRole {
	id: string;
	roleName: string;
	roleCode: string;
	description: string;
	userCount: number;
	menuCount: number;
	status: string;
	/** 已授权的菜单/按钮 id */
	menuIds?: string[];
}

/** 全部已注册菜单 id（含按钮），用于超管授权 */
const ALL_MENU_IDS: string[] = [
	"G01", "G10", "G20", "G30", "G40", "G50",
	"M001", "M010", "M011", "M012", "M020", "M021", "M022", "M023", "M024", "M025",
	"M030", "M031", "M032", "M033", "M034", "M035", "M036", "M037",
	"M040", "M041", "M042", "M043", "M050", "M051", "M052", "M053", "M054", "M055",
	"M010-B1", "M010-B2", "M010-B3", "M010-B4", "M010-B5",
	"M011-B1", "M011-B2", "M011-B3", "M012-B1", "M012-B2", "M012-B3",
	"M020-B1", "M020-B2", "M020-B3", "M022-B1", "M022-B2", "M023-B1",
	"M030-B1", "M031-B1", "M033-B1", "M033-B2", "M034-B1", "M034-B2",
	"M024-B1", "M024-B2", "M024-B3"
];

export const roles: SysRole[] = [
	{ id: "R01", roleName: "超级管理员", roleCode: "SUPER_ADMIN", description: "拥有全部菜单与数据权限", userCount: 1, menuCount: ALL_MENU_IDS.length, status: "ENABLED", menuIds: ALL_MENU_IDS },
	{
		id: "R02",
		roleName: "校领导",
		roleCode: "PRINCIPAL",
		description: "查看全校数据与统计分析",
		userCount: 3,
		menuCount: 20,
		status: "ENABLED",
		menuIds: ["G01", "G10", "G20", "G30", "G40", "M001", "M010", "M011", "M012", "M020", "M021", "M022", "M023", "M024", "M030", "M031", "M032", "M033", "M041", "M042", "M043"]
	},
	{
		id: "R03",
		roleName: "班主任",
		roleCode: "MASTER",
		description: "管理本班学生、考勤与成绩",
		userCount: 12,
		menuCount: 12,
		status: "ENABLED",
		menuIds: ["G01", "G10", "G20", "G30", "M001", "M010", "M011", "M021", "M022", "M023", "M033", "M034", "M010-B1", "M010-B2", "M022-B1", "M023-B1", "M034-B1", "M034-B2"]
	},
	{
		id: "R04",
		roleName: "科任教师",
		roleCode: "TEACHER",
		description: "录入成绩、查看课表",
		userCount: 36,
		menuCount: 6,
		status: "ENABLED",
		menuIds: ["G01", "G20", "M001", "M021", "M022", "M023", "M022-B1"]
	},
	{
		id: "R05",
		roleName: "宿舍管理员",
		roleCode: "WARDEN",
		description: "宿舍与门禁管理",
		userCount: 8,
		menuCount: 5,
		status: "ENABLED",
		menuIds: ["G01", "G30", "M001", "M030", "M032", "M035"]
	},
	{
		id: "R06",
		roleName: "安保人员",
		roleCode: "GUARD",
		description: "门禁与安防记录查看",
		userCount: 14,
		menuCount: 4,
		status: "DISABLED",
		menuIds: ["G01", "G30", "M001", "M032"]
	}
];

/* ---------------- 汇总 ---------------- */
export const weeklyAttendance = Array.from({ length: 7 }, (_, i) => {
	const base = 92 + rnd() * 7;
	return {
		date: today.subtract(6 - i, "day").format("MM-DD"),
		rate: Number(base.toFixed(1)),
		normal: int(900, 1200),
		abnormal: int(10, 80)
	};
});

export const monthlyConsume = Array.from({ length: 12 }, (_, i) => ({
	month: `${i + 1}月`,
	amount: int(28000, 62000),
	recharge: int(12000, 40000)
}));

export const scoreDistribution = [
	{ name: "90 分以上", value: scores.filter(s => s.score >= 90).length, color: "#00B42A" },
	{ name: "80-89 分", value: scores.filter(s => s.score >= 80 && s.score < 90).length, color: "#165DFF" },
	{ name: "60-79 分", value: scores.filter(s => s.score >= 60 && s.score < 80).length, color: "#FF7D00" },
	{ name: "60 分以下", value: scores.filter(s => s.score < 60).length, color: "#F53F3F" }
];

export const gradeRank = GRADES.map(grade => ({
	grade,
	avg: Number((scores.filter(s => s.grade === grade).reduce((a, b) => a + b.score, 0) / (scores.filter(s => s.grade === grade).length || 1)).toFixed(1)),
	students: students.filter(s => s.grade === grade).length
}));

export const db = {
	classes,
	teachers,
	students,
	courses,
	schedules,
	attendances,
	scores,
	dorms,
	cards,
	cardTxes,
	accessRecords,
	notices,
	users,
	roles,
	weeklyAttendance,
	monthlyConsume,
	scoreDistribution,
	gradeRank,
	slotTimes
};
