/**
 * element-plus 统一出口
 * @desc 业务代码不直接依赖 element-plus，便于后续替换/升级。
 *       注意：这里不能再默认导出整包（`export default ElementPlus` 会把全量组件拖进产物），
 *       组件由各页面按需 import，再由打包器 tree-shaking。
 */
import zhCn from "element-plus/es/locale/lang/zh-cn";

export * from "element-plus";
export { zhCn };
export type { FormInstance, FormRules, TableInstance, TabsPaneContext, Action } from "element-plus";
