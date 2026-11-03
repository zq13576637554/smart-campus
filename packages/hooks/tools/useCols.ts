/**
 * @file 表格列简化配置
 * @desc 注册列渲染器后，可用 DSL 字符串描述列：
 *   "姓名|name"                            -> 文本列
 *   "状态|status|tag|minWidth:120"          -> 标签列
 *   "actions|查看:view-编辑:edit"            -> 操作列
 */
import Actions from "lmIreposC/Actions";
import Idx from "lmIreposC/Idx";
import Link from "lmIreposC/Link";
import Progress from "lmIreposC/Progress";
import Select from "lmIreposC/Select";
import Tag from "lmIreposC/Tag";
import TbDialog from "lmIreposC/TbDialog";
import Text from "lmIreposC/Text";
import EnumText from "lmIreposC/EnumText";
import { colRegistry, useSimpleCols as parseCols } from "lmLibs/schema";

colRegistry.init([
	{ key: "idx", com: Idx },
	{ key: "actions", com: Actions },
	{ key: "link", com: Link },
	{ key: "select", com: Select },
	{ key: "tag", com: Tag },
	{ key: "tbDialog", com: TbDialog },
	{ key: "progress", com: Progress },
	{ key: "text", com: Text },
	{ key: "enum", com: EnumText }
]);

export const useSimpleCols = (list: any[]) => parseCols(list);

export { colRegistry };
