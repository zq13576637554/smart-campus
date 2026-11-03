import { useSimpleBars } from "lmHooks/tools/useBars";

const GRADES = ["高一", "高二", "高三"].map(g => ({ label: g, value: g }));

/** 班级查询条件 */
export default () =>
	useSimpleBars([
		"班级名称|className|input",
		{
			bar: "年级|grade|select",
			config: { props: { options: GRADES } }
		},
		{
			bar: "文理方向|major|select",
			config: {
				props: {
					options: [
						{ label: "理科", value: "理科" },
						{ label: "文科", value: "文科" },
						{ label: "综合", value: "综合" }
					]
				}
			}
		}
	]);
