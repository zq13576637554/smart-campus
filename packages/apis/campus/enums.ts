/**
 * @file 本地字典（远端字典接口不可用时的兜底）
 * @desc 键名与 mock 接口 $enumsByType 返回一致
 */
import type { DictMap } from "lmStore/modules/dict";

export const LOCAL_DICTS: DictMap = {
	STUDENT_STATUS: [
		{ label: "在读", value: "STUDYING", type: "success" },
		{ label: "休学", value: "SUSPENDED", type: "warning" },
		{ label: "毕业", value: "GRADUATED", type: "info" },
		{ label: "退学", value: "QUIT", type: "danger" }
	],
	GENDER: [
		{ label: "男", value: "M", type: "info" },
		{ label: "女", value: "F", type: "info" }
	],
	TEACHER_STATUS: [
		{ label: "在职", value: "ON_JOB", type: "success" },
		{ label: "休假", value: "VACATION", type: "warning" },
		{ label: "离职", value: "LEFT", type: "info" }
	],
	TEACHER_TITLE: [
		{ label: "教授", value: "PROFESSOR", type: "danger" },
		{ label: "副教授", value: "ASSOCIATE", type: "warning" },
		{ label: "讲师", value: "LECTURER", type: "primary" },
		{ label: "助教", value: "ASSISTANT", type: "info" }
	],
	COURSE_TYPE: [
		{ label: "必修", value: "REQUIRED", type: "danger" },
		{ label: "选修", value: "ELECTIVE", type: "primary" },
		{ label: "实践", value: "PRACTICE", type: "success" }
	],
	ATTENDANCE_TYPE: [
		{ label: "正常", value: "NORMAL", type: "success" },
		{ label: "迟到", value: "LATE", type: "warning" },
		{ label: "早退", value: "EARLY", type: "warning" },
		{ label: "缺勤", value: "ABSENT", type: "danger" },
		{ label: "请假", value: "LEAVE", type: "info" }
	],
	CHECK_METHOD: [
		{ label: "人脸识别", value: "FACE", type: "primary" },
		{ label: "刷卡", value: "CARD", type: "success" },
		{ label: "二维码", value: "QRCODE", type: "warning" },
		{ label: "手动登记", value: "MANUAL", type: "info" }
	],
	DORM_STATUS: [
		{ label: "正常", value: "NORMAL", type: "success" },
		{ label: "满员", value: "FULL", type: "warning" },
		{ label: "维修中", value: "REPAIR", type: "danger" }
	],
	CARD_BIZ_TYPE: [
		{ label: "消费", value: "CONSUME", type: "danger" },
		{ label: "充值", value: "RECHARGE", type: "success" },
		{ label: "退款", value: "REFUND", type: "warning" }
	],
	ACCESS_DIRECTION: [
		{ label: "进校", value: "IN", type: "success" },
		{ label: "出校", value: "OUT", type: "info" }
	],
	ACCESS_STATUS: [
		{ label: "正常", value: "NORMAL", type: "success" },
		{ label: "异常", value: "ABNORMAL", type: "danger" }
	],
	PERSON_TYPE: [
		{ label: "学生", value: "STUDENT", type: "primary" },
		{ label: "教师", value: "TEACHER", type: "success" },
		{ label: "访客", value: "VISITOR", type: "warning" }
	],
	NOTICE_TYPE: [
		{ label: "通知", value: "NOTICE", type: "primary" },
		{ label: "公告", value: "ANNOUNCEMENT", type: "info" },
		{ label: "预警", value: "WARNING", type: "danger" }
	],
	EXAM_TYPE: [
		{ label: "期中考试", value: "MIDTERM", type: "warning" },
		{ label: "期末考试", value: "FINAL", type: "danger" },
		{ label: "月考", value: "MONTHLY", type: "primary" },
		{ label: "随堂测验", value: "QUIZ", type: "info" }
	],
	SCORE_LEVEL: [
		{ label: "优秀", value: "EXCELLENT", type: "success" },
		{ label: "良好", value: "GOOD", type: "primary" },
		{ label: "及格", value: "PASS", type: "warning" },
		{ label: "不及格", value: "FAIL", type: "danger" }
	],
	YES_OR_NO: [
		{ label: "是", value: "1", type: "success" },
		{ label: "否", value: "0", type: "info" }
	],
	USER_STATUS: [
		{ label: "启用", value: "ENABLED", type: "success" },
		{ label: "停用", value: "DISABLED", type: "danger" }
	],
	TERM: [
		{ label: "2025-2026 学年第一学期", value: "2025-1", type: "primary" },
		{ label: "2024-2025 学年第二学期", value: "2024-2", type: "info" },
		{ label: "2024-2025 学年第一学期", value: "2024-1", type: "info" }
	]
};

export default LOCAL_DICTS;
