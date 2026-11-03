import { useSimpleCols } from "lmHooks/tools/useCols";

/** 课程列表列配置 */
export default () =>
	useSimpleCols([
		"select",
		"idx",
		"课程名称|courseName|text|minWidth:140-fixed:left",
		"课程编号|courseNo|minWidth:120",
		"授课教师|teacherName|minWidth:110",
		"年级|grade|minWidth:90",
		{
			col: "课程类型|type|tag|minWidth:100",
			setComProps: { dictType: "COURSE_TYPE" }
		},
		"学分|credit|text|minWidth:80-format:number",
		"课时|hours|text|minWidth:80-format:number",
		"学期|term|minWidth:100",
		"授课班级|className|minWidth:110",
		{
			col: "actions|查看:view-编辑:edit-删除:delete",
			setComProps: { fixed: "right", minWidth: 150 }
		}
	]);
