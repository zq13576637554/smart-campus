import { Input, Select, Radios, Date, Text, Upload, RenderTitle, RenderGap } from "lmIreposF";
import { useDiyConfig } from "lmHooks/tools/useForm";
import type { FormItem } from "lmCmpsBasic/Form/types";

const { formatConfig } = useDiyConfig();

const Col = { span: 12 };
const ColFull = { span: 24 };

/** 学生档案表单配置 */
export function itemsFun(classOptions: { label: string; value: string }[], gradeOptions: { label: string; value: string }[]): FormItem[] {
	return formatConfig<FormItem>(
		[
			RenderTitle({ label: "基本信息", prop: "__base__", colProps: ColFull }),

			Input({
				label: "姓名",
				prop: "name",
				colProps: Col,
				rules: [{ required: true, message: "请输入学生姓名", trigger: "blur" }],
				yours: { placeholder: "请输入学生姓名", maxlength: 20, clearable: true }
			}),

			Radios({
				label: "性别",
				prop: "gender",
				colProps: Col,
				rules: [{ required: true, message: "请选择性别", trigger: "change" }],
				options: [
					{ label: "男", value: "M" },
					{ label: "女", value: "F" }
				]
			}),

			Input({
				label: "学号",
				prop: "studentNo",
				colProps: Col,
				rules: [{ required: true, message: "请输入学号", trigger: "blur" }],
				yours: { placeholder: "请输入学号，如 202400001", maxlength: 20 }
			}),

			Date({
				label: "出生日期",
				prop: "birthday",
				colProps: Col,
				yours: { placeholder: "请选择出生日期", style: "width:100%" }
			}),

			RenderTitle({ label: "学籍信息", prop: "__school__", colProps: ColFull }),

			Select({
				label: "所属班级",
				prop: "classId",
				colProps: Col,
				rules: [{ required: true, message: "请选择所属班级", trigger: "change" }],
				yours: { placeholder: "请选择所属班级", options: classOptions, filterable: true }
			}),

			Select({
				label: "年级",
				prop: "grade",
				colProps: Col,
				rules: [{ required: true, message: "请选择年级", trigger: "change" }],
				yours: { placeholder: "请选择年级", options: gradeOptions }
			}),

			Select({
				label: "学籍状态",
				prop: "status",
				colProps: Col,
				dictType: "STUDENT_STATUS",
				type: "enumSelect",
				yours: { placeholder: "请选择学籍状态" }
			}),

			Date({
				label: "入学日期",
				prop: "enrollDate",
				colProps: Col,
				yours: { placeholder: "请选择入学日期", style: "width:100%" }
			}),

			Input({
				label: "宿舍",
				prop: "dorm",
				colProps: Col,
				yours: { placeholder: "如 A 栋301" }
			}),

			Input({
				label: "床位",
				prop: "bedNo",
				colProps: Col,
				yours: { placeholder: "如 3号床" }
			}),

			RenderTitle({ label: "联系与监护", prop: "__contact__", colProps: ColFull }),

			Input({
				label: "联系电话",
				prop: "phone",
				colProps: Col,
				rules: [
					{ required: true, message: "请输入联系电话", trigger: "blur" },
					{ pattern: /^1[3-9]\d{9}$/, message: "手机号格式不正确", trigger: "blur" }
				],
				yours: { placeholder: "请输入 11 位手机号", maxlength: 11 }
			}),

			Input({
				label: "身份证号",
				prop: "idCard",
				colProps: Col,
				yours: { placeholder: "请输入身份证号", maxlength: 18 }
			}),

			Input({
				label: "监护人",
				prop: "guardian",
				colProps: Col,
				yours: { placeholder: "请输入监护人姓名" }
			}),

			Input({
				label: "监护人电话",
				prop: "guardianPhone",
				colProps: Col,
				yours: { placeholder: "请输入监护人电话", maxlength: 11 }
			}),

			Text({
				label: "家庭住址",
				prop: "address",
				colProps: ColFull,
				yours: { placeholder: "请输入家庭住址", rows: 2, maxlength: 100 }
			}),

			Text({
				label: "备注",
				prop: "remark",
				colProps: ColFull,
				yours: { placeholder: "选填", rows: 2, maxlength: 200 }
			}),

			Upload({
				label: "附件材料",
				prop: "files",
				colProps: ColFull,
				yours: { limit: 5, tips: "支持图片、PDF，最多 5 个文件" }
			}),

			RenderGap({ prop: "__gap__", colProps: ColFull })
		],
		"/xsgl/form"
	);
}

export default itemsFun;
