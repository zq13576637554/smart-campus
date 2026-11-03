import { h } from "vue";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useDiyConfig } from "lmHooks/tools/useForm";

const { formatConfig } = useDiyConfig();

/**
 * 表格列配置
 * @desc DSL：标题|字段|渲染器-参数|表头参数（多参数用 - 连接）
 *       tdFn 签名：(h, { data: { row, $index }, col, emit }) => VNode
 */
export default () =>
	formatConfig(
		useSimpleCols([
			"select",
			"idx",
			{
				col: "学生|name|text|minWidth:150-fixed:left",
				tdFn: (h: any, ctx: any) => {
					const { row } = ctx.data;
					return h("div", { class: "student-cell" }, [
						h(
							"span",
							{ class: "student-cell__avatar", style: { background: row.avatarColor || "#165DFF" } },
							row.name?.slice(0, 1)
						),
						h("div", { class: "student-cell__info" }, [
							h("div", { class: "student-cell__name" }, row.name),
							h("div", { class: "student-cell__no" }, row.studentNo)
						])
					]);
				}
			},
			"性别|gender|enum-type:GENDER|minWidth:80",
			"班级|className|minWidth:110",
			"年级|grade|minWidth:90",
			{
				col: "学籍状态|status|tag|minWidth:100",
				setComProps: { dictType: "STUDENT_STATUS" }
			},
			"宿舍|dorm|minWidth:110",
			{
				col: "联系方式|phone|text|minWidth:130",
				tdFn: (h: any, ctx: any) => {
					const { row } = ctx.data;
					return h("span", {}, String(row.phone || "").replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"));
				}
			},
			"入学日期|enrollDate|text-format:date-type:ymd-join:2|minWidth:120",
			{
				col: "监护人|guardian|text|minWidth:120",
				tdFn: (h: any, ctx: any) => {
					const { row } = ctx.data;
					return h("div", {}, [
						h("div", {}, row.guardian),
						h("div", { class: "text-secondary", style: { fontSize: "11px" } }, row.guardianPhone)
					]);
				}
			},
			{
				col: "actions|查看:view-编辑:edit-删除:delete",
				setComProps: { fixed: "right", minWidth: 150 }
			}
		]),
		"/xsgl/col"
	);
