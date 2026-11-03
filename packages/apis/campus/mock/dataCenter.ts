/**
 * @file 导入导出中心数据
 * @desc 统一维护「可导入 / 可导出」的数据类型、字段与条数，并提供导出数据组装。
 */
import { dayjs } from "lmUtils/time";
import { db } from "./db";
import { auditLogs, leaves } from "./extra";
import { assets, bills } from "./extra2";

export interface DataColumn {
	label: string;
	prop: string;
	required?: boolean;
}

export interface ImportTypeDef {
	key: string;
	label: string;
	module: string;
	icon: string;
	/** 是否已开放导入 */
	available: boolean;
	/** 开放导入时的跳转地址 */
	route?: string;
	columns: DataColumn[];
	/** 库中现有条数 */
	count: number;
}

export interface ExportTypeDef {
	key: string;
	label: string;
	module: string;
	icon: string;
	columns: DataColumn[];
	count: number;
}

export interface ExportLog {
	id: string;
	fileName: string;
	typeKey: string;
	typeLabel: string;
	total: number;
	operator: string;
	time: string;
	status: string;
}

/* ---------------- 导入类型 ---------------- */

export const IMPORT_TYPES: ImportTypeDef[] = [
	{
		key: "student",
		label: "学生档案",
		module: "学籍管理",
		icon: "student",
		available: true,
		route: "/xsgl/import/",
		count: db.students.length,
		columns: [
			{ label: "姓名", prop: "name", required: true },
			{ label: "学号", prop: "studentNo", required: true },
			{ label: "性别", prop: "genderText", required: true },
			{ label: "班级", prop: "className", required: true },
			{ label: "手机号", prop: "phone", required: true },
			{ label: "宿舍", prop: "dorm" },
			{ label: "床位", prop: "bed" }
		]
	},
	{
		key: "teacher",
		label: "教职工",
		module: "学籍管理",
		icon: "teacher",
		available: false,
		count: db.teachers.length,
		columns: [
			{ label: "姓名", prop: "name", required: true },
			{ label: "工号", prop: "teacherNo", required: true },
			{ label: "学科", prop: "subject", required: true },
			{ label: "职称", prop: "title" },
			{ label: "手机号", prop: "phone" }
		]
	},
	{
		key: "course",
		label: "课程",
		module: "教学管理",
		icon: "course",
		available: false,
		count: db.courses.length,
		columns: [
			{ label: "课程名称", prop: "courseName", required: true },
			{ label: "课程编码", prop: "courseCode", required: true },
			{ label: "学分", prop: "credit" },
			{ label: "任课教师", prop: "teacherName" }
		]
	},
	{
		key: "score",
		label: "成绩",
		module: "教学管理",
		icon: "score",
		available: false,
		count: db.scores.length,
		columns: [
			{ label: "学号", prop: "studentNo", required: true },
			{ label: "姓名", prop: "name", required: true },
			{ label: "学科", prop: "courseName", required: true },
			{ label: "成绩", prop: "score", required: true },
			{ label: "考试", prop: "examName" }
		]
	}
];

/* ---------------- 导出类型 ---------------- */

export const EXPORT_TYPES: ExportTypeDef[] = [
	{
		key: "student",
		label: "学生档案",
		module: "学籍管理",
		icon: "student",
		count: db.students.length,
		columns: [
			{ label: "学号", prop: "studentNo" },
			{ label: "姓名", prop: "name" },
			{ label: "性别", prop: "genderText" },
			{ label: "班级", prop: "className" },
			{ label: "年级", prop: "grade" },
			{ label: "学籍状态", prop: "statusText" },
			{ label: "宿舍", prop: "dorm" },
			{ label: "联系电话", prop: "phone" }
		]
	},
	{
		key: "teacher",
		label: "教职工",
		module: "学籍管理",
		icon: "teacher",
		count: db.teachers.length,
		columns: [
			{ label: "工号", prop: "teacherNo" },
			{ label: "姓名", prop: "name" },
			{ label: "学科", prop: "subject" },
			{ label: "职称", prop: "title" },
			{ label: "手机号", prop: "phone" }
		]
	},
	{
		key: "attendance",
		label: "考勤明细",
		module: "校园生活",
		icon: "attendance",
		count: db.attendances.length,
		columns: [
			{ label: "日期", prop: "date" },
			{ label: "姓名", prop: "name" },
			{ label: "班级", prop: "className" },
			{ label: "类型", prop: "typeText" },
			{ label: "打卡方式", prop: "methodText" },
			{ label: "设备", prop: "device" }
		]
	},
	{
		key: "score",
		label: "成绩明细",
		module: "教学管理",
		icon: "score",
		count: db.scores.length,
		columns: [
			{ label: "学号", prop: "studentNo" },
			{ label: "姓名", prop: "name" },
			{ label: "班级", prop: "className" },
			{ label: "学科", prop: "courseName" },
			{ label: "成绩", prop: "score" }
		]
	},
	{
		key: "leave",
		label: "请假记录",
		module: "校园生活",
		icon: "schedule",
		count: leaves.length,
		columns: [
			{ label: "姓名", prop: "studentName" },
			{ label: "学号", prop: "studentNo" },
			{ label: "班级", prop: "className" },
			{ label: "类型", prop: "type" },
			{ label: "开始日期", prop: "startDate" },
			{ label: "结束日期", prop: "endDate" },
			{ label: "天数", prop: "days" },
			{ label: "状态", prop: "statusText" }
		]
	},
	{
		key: "bill",
		label: "缴费账单",
		module: "校园生活",
		icon: "card",
		count: bills.length,
		columns: [
			{ label: "学号", prop: "studentNo" },
			{ label: "姓名", prop: "studentName" },
			{ label: "班级", prop: "className" },
			{ label: "费用类型", prop: "feeType" },
			{ label: "应收(元)", prop: "amount" },
			{ label: "已缴(元)", prop: "paid" },
			{ label: "状态", prop: "statusText" },
			{ label: "到期日", prop: "dueDate" }
		]
	},
	{
		key: "asset",
		label: "资产台账",
		module: "系统设置",
		icon: "files",
		count: assets.length,
		columns: [
			{ label: "资产编码", prop: "code" },
			{ label: "资产名称", prop: "name" },
			{ label: "分类", prop: "category" },
			{ label: "状态", prop: "statusText" },
			{ label: "使用人", prop: "owner" },
			{ label: "存放位置", prop: "location" }
		]
	},
	{
		key: "log",
		label: "操作日志",
		module: "系统设置",
		icon: "document",
		count: auditLogs.length,
		columns: [
			{ label: "时间", prop: "time" },
			{ label: "操作人", prop: "nickName" },
			{ label: "账号", prop: "userName" },
			{ label: "模块", prop: "module" },
			{ label: "操作", prop: "action" },
			{ label: "结果", prop: "result" },
			{ label: "IP", prop: "ip" }
		]
	}
];

/* ---------------- 枚举文案 ---------------- */

const ATT_TYPE: Record<string, string> = { NORMAL: "正常", LATE: "迟到", EARLY: "早退", ABSENT: "缺勤", LEAVE: "请假" };
const METHOD: Record<string, string> = { FACE: "人脸识别", CARD: "刷卡", QRCODE: "二维码", MANUAL: "手动" };
const LEAVE_STATUS: Record<string, string> = { PENDING: "待审批", APPROVED: "已通过", REJECTED: "已驳回" };
const BILL_STATUS: Record<string, string> = { PAID: "已缴清", PARTIAL: "部分缴纳", UNPAID: "未缴纳" };
const ASSET_STATUS: Record<string, string> = { IN_USE: "使用中", IDLE: "闲置", REPAIRING: "维修中", SCRAPPED: "已报废" };

/** 组装导出数据 */
export function buildExportData(key: string): { columns: DataColumn[]; rows: Record<string, any>[]; fileName: string } {
	const type = EXPORT_TYPES.find(t => t.key === key);
	if (!type) throw new Error("未知的导出类型");

	const stamp = dayjs().format("YYYYMMDD-HHmm");
	const fileName = `${type.label}-${stamp}.csv`;

	let rows: Record<string, any>[] = [];

	switch (key) {
		case "student":
			rows = db.students.map(s => ({
				...s,
				genderText: s.gender === "M" ? "男" : s.gender === "F" ? "女" : s.gender,
				statusText:
					s.status === "STUDYING" ? "在读" : s.status === "SUSPENDED" ? "休学" : s.status === "GRADUATED" ? "毕业" : "退学"
			}));
			break;
		case "teacher":
			rows = db.teachers.map(t => ({ ...t }));
			break;
		case "attendance":
			rows = db.attendances.map(a => ({
				...a,
				typeText: ATT_TYPE[a.type] || a.type,
				methodText: METHOD[a.method] || a.method
			}));
			break;
		case "score":
			rows = db.scores.map(s => ({ ...s }));
			break;
		case "leave":
			rows = leaves.map(l => ({ ...l, statusText: LEAVE_STATUS[l.status] || l.status }));
			break;
		case "bill":
			rows = bills.map(b => ({ ...b, statusText: BILL_STATUS[b.status] || b.status }));
			break;
		case "asset":
			rows = assets.map(a => ({ ...a, statusText: ASSET_STATUS[a.status] || a.status }));
			break;
		case "log":
			rows = auditLogs.map(l => ({ ...l }));
			break;
		default:
			rows = [];
	}

	return { columns: type.columns, rows, fileName };
}

/* ---------------- 导出记录 ---------------- */

const OPERATORS = ["系统管理员", "张校长", "王老师", "李老师"];
const SEED_TYPES = ["student", "attendance", "score", "bill", "log", "asset"];

export const exportLogs: ExportLog[] = Array.from({ length: 6 }, (_, i) => {
	const typeKey = SEED_TYPES[i % SEED_TYPES.length];
	const type = EXPORT_TYPES.find(t => t.key === typeKey)!;
	const time = dayjs().subtract(i * 7 + 2, "hour");
	return {
		id: `EX${String(i + 1).padStart(5, "0")}`,
		fileName: `${type.label}-${time.format("YYYYMMDD-HHmm")}.csv`,
		typeKey,
		typeLabel: type.label,
		total: Math.max(1, Math.round(type.count * (0.3 + i * 0.1))),
		operator: OPERATORS[i % OPERATORS.length],
		time: time.format("YYYY-MM-DD HH:mm:ss"),
		status: "成功"
	};
});
