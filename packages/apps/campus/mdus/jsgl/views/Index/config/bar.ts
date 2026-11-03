import { useSimpleBars } from "lmHooks/tools/useBars";

const SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "政治", "历史", "地理", "体育", "信息技术", "音乐", "美术"];

/** 教职工查询条件 */
export default () =>
	useSimpleBars([
		"姓名|name|input",
		"工号|teacherNo|input",
		{
			bar: "学科|subject|select",
			config: { props: { options: SUBJECTS.map(s => ({ label: s, value: s })) } }
		},
		{
			bar: "职称|title|enum-type:TEACHER_TITLE",
			config: { itemValue: "" }
		},
		{
			bar: "在职状态|status|enum-type:TEACHER_STATUS",
			config: { itemValue: "" }
		}
	]);
