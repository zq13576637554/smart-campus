import { h } from "vue";
import { useSimpleCols } from "lmHooks/tools/useCols";

/** 班级列表列配置 */
export default () =>
	useSimpleCols([
		"select",
		"idx",
		"班级名称|className|text|minWidth:140-fixed:left",
		"班级编号|classNo|minWidth:120",
		"年级|grade|minWidth:90",
		"文理方向|major|minWidth:100",
		"班主任|headTeacher|minWidth:110",
		{
			col: "班级人数|studentCount|text|minWidth:100",
			tdFn: (h: any, ctx: any) => {
				const { row } = ctx.data;
				const color = row.studentCount > 34 ? "#F53F3F" : "#165DFF";
				return h("span", { style: { color, fontWeight: 600 } }, `${row.studentCount} 人`);
			}
		},
		"教室|room|minWidth:110",
		"创建时间|createdAt|text|minWidth:120",
		{
			col: "actions|查看:view-编辑:edit-删除:delete",
			setComProps: { fixed: "right", minWidth: 150 }
		}
	]);
