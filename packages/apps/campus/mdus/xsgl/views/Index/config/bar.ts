import { useSimpleBars } from "lmHooks/tools/useBars";
import { useDiyConfig } from "lmHooks/tools/useForm";

const { formatConfig } = useDiyConfig();

/**
 * 查询条件配置
 * @desc DSL：标题|字段|组件-参数
 */
export default (classOptions: { label: string; value: string }[]) =>
	formatConfig(
		useSimpleBars([
			"姓名|name|input",
			"学号|studentNo|input",
			{
				bar: "性别|gender|enum-type:GENDER",
				config: { itemValue: "" }
			},
			{
				bar: "所属班级|classId|select",
				config: { props: { options: classOptions } }
			},
			{
				bar: "学籍状态|status|enum-type:STUDENT_STATUS",
				config: { itemValue: "" }
			},
			{
				bar: "入学时间|enrollDate|date-type:daterange-startKey:startEnrollDate-endKey:endEnrollDate",
				config: {
					props: { format: "YYYY/MM/DD", valueFormat: "YYYY-MM-DD" }
				}
			}
		]),
		"/xsgl/bar"
	);
