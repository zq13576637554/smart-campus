/**
 * @file 通用导入定义
 * @desc 各数据类型的导入列、校验规则与提交方式，供 /dzzx/import/ 使用。
 *       学生的定义与 /xsgl/import/ 保持一致；其余三类走通用落库接口。
 */
import { $studentImportPost } from "../api/academic";
import { $dataImportPost } from "../api/dataCenter";

export interface ImportColumnDef {
	label: string;
	prop: string;
	required?: boolean;
	width?: number;
	tips?: string;
	validator?: (value: string, row: Record<string, any>) => string | undefined;
}

export interface ImportDef {
	key: string;
	title: string;
	templateName: string;
	columns: ImportColumnDef[];
	submitApi: (rows: Record<string, any>[]) => Promise<{ success: number; failed: { row: number; message: string }[] }>;
}

const phoneRule = (v: string) => (v && !/^1[3-9]\d{9}$/.test(v) ? "手机号格式不正确" : undefined);

export const IMPORT_DEFS: Record<string, ImportDef> = {
	student: {
		key: "student",
		title: "学生档案批量导入",
		templateName: "学生档案导入模板",
		columns: [
			{ label: "姓名", prop: "name", required: true, width: 100, tips: "张三" },
			{ label: "学号", prop: "studentNo", required: true, width: 130, tips: "202600001" },
			{
				label: "性别",
				prop: "gender",
				width: 80,
				validator: v => (v && !["男", "女"].includes(v) ? "性别只能填写男或女" : undefined)
			},
			{ label: "班级", prop: "className", required: true, width: 130, tips: "高一(1)班" },
			{ label: "手机号", prop: "phone", width: 140, validator: phoneRule },
			{ label: "宿舍", prop: "dorm", width: 110 },
			{ label: "床位", prop: "bedNo", width: 90 },
			{ label: "监护人", prop: "guardian", width: 100 },
			{ label: "监护人电话", prop: "guardianPhone", width: 140 }
		],
		submitApi: (rows: Record<string, any>[]) => $studentImportPost(rows) as any
	},

	teacher: {
		key: "teacher",
		title: "教职工批量导入",
		templateName: "教职工导入模板",
		columns: [
			{ label: "姓名", prop: "name", required: true, width: 100, tips: "李老师" },
			{ label: "工号", prop: "teacherNo", required: true, width: 130, tips: "T2026001" },
			{ label: "学科", prop: "subject", required: true, width: 110, tips: "数学" },
			{ label: "职称", prop: "title", width: 110, tips: "一级教师" },
			{ label: "性别", prop: "gender", width: 80, validator: v => (v && !["男", "女"].includes(v) ? "性别只能填写男或女" : undefined) },
			{ label: "手机号", prop: "phone", width: 140, validator: phoneRule }
		],
		submitApi: (rows: Record<string, any>[]) => $dataImportPost({ type: "teacher", rows })
	},

	course: {
		key: "course",
		title: "课程批量导入",
		templateName: "课程导入模板",
		columns: [
			{ label: "课程名称", prop: "courseName", required: true, width: 140, tips: "高等数学" },
			{ label: "课程编码", prop: "courseNo", required: true, width: 130, tips: "MATH101" },
			{
				label: "学分",
				prop: "credit",
				width: 90,
				validator: v => (v && !/^[1-9]\d?$/.test(v) ? "学分需为 1-99 的整数" : undefined)
			},
			{ label: "任课教师", prop: "teacherName", width: 110, tips: "王老师" },
			{ label: "年级", prop: "grade", width: 90, tips: "高一" }
		],
		submitApi: (rows: Record<string, any>[]) => $dataImportPost({ type: "course", rows })
	},

	score: {
		key: "score",
		title: "成绩批量导入",
		templateName: "成绩导入模板",
		columns: [
			{ label: "学号", prop: "studentNo", required: true, width: 130, tips: "202400001" },
			{ label: "姓名", prop: "name", required: true, width: 100, tips: "张三" },
			{ label: "学科", prop: "courseName", required: true, width: 110, tips: "数学" },
			{
				label: "成绩",
				prop: "score",
				required: true,
				width: 90,
				validator: v => {
					const n = Number(v);
					if (!Number.isFinite(n) || n < 0 || n > 150) return "成绩需在 0-150 之间";
					return undefined;
				}
			},
			{ label: "考试", prop: "examType", width: 120, tips: "期中考试" }
		],
		submitApi: (rows: Record<string, any>[]) => $dataImportPost({ type: "score", rows })
	}
};

/** 导入类型下拉选项 */
export const IMPORT_OPTIONS = Object.values(IMPORT_DEFS).map(d => ({ label: d.title.replace("批量导入", ""), value: d.key }));
