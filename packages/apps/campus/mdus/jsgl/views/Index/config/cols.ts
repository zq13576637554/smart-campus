import { h } from "vue";
import { useSimpleCols } from "lmHooks/tools/useCols";

/** 教职工列表列配置 */
export default () =>
	useSimpleCols([
		"select",
		"idx",
		{
			col: "教师|name|text|minWidth:150-fixed:left",
			tdFn: (h: any, ctx: any) => {
				const { row } = ctx.data;
				return h("div", { class: "student-cell" }, [
					h(
						"span",
						{ class: "student-cell__avatar", style: { background: row.avatarColor || "#00B42A" } },
						row.name?.slice(0, 1)
					),
					h("div", { class: "student-cell__info" }, [
						h("div", { class: "student-cell__name" }, row.name),
						h("div", { class: "student-cell__no" }, row.teacherNo)
					])
				]);
			}
		},
		"学科|subject|minWidth:100",
		{
			col: "职称|title|tag|minWidth:100",
			setComProps: { dictType: "TEACHER_TITLE" }
		},
		"所属教研组|deptName|minWidth:130",
		{
			col: "在职状态|status|tag|minWidth:100",
			setComProps: { dictType: "TEACHER_STATUS" }
		},
		"联系电话|phone|minWidth:130",
		"任教课程|courseCount|text|minWidth:100-format:number",
		"入职日期|joinDate|minWidth:120",
		{
			col: "actions|查看:view-编辑:edit-删除:delete",
			setComProps: { fixed: "right", minWidth: 150 }
		}
	]);
