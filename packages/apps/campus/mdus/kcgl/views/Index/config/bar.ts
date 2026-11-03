import { useSimpleBars } from "lmHooks/tools/useBars";

const GRADES = ["高一", "高二", "高三"].map(g => ({ label: g, value: g }));

/** 课程查询条件 */
export default () =>
	useSimpleBars([
		"课程名称|courseName|input",
		"授课教师|teacherName|input",
		{
			bar: "课程类型|type|enum-type:COURSE_TYPE",
			config: { itemValue: "" }
		},
		{
			bar: "年级|grade|select",
			config: { props: { options: GRADES } }
		}
	]);
