/**
 * @file 全局常量
 * @desc 本地缓存的键名统一在此维护，避免各业务模块写魔法字符串
 */

const APP_NAME = "CAMPUS";

/** 全局 TOKEN 缓存键（JSON：{ token, tokenHead, expiresIn }） */
export const STORAGE_TOKEN_KEY = `${APP_NAME}_TOKEN_INFO`;
/** 全局登录人员信息缓存键 */
export const STORAGE_USER_KEY = `${APP_NAME}_USER_INFO`;
/** 全局登录类型缓存键 */
export const STORAGE_LOGIN_TYPE = `${APP_NAME}_LOGIN_TYPE`;
/** 全局菜单缓存键 */
export const STORAGE_MENU_LIST = `${APP_NAME}_MENU_LIST`;
/** 全局角色缓存键 */
export const STORAGE_ROLE_KEY = `${APP_NAME}_ROLE_KEY`;
/** 系统配置缓存键 */
export const STORAGE_SYSTEM_CONFIG = `${APP_NAME}_SYSTEM_CONFIG`;
/** 字典缓存键 */
export const STORAGE_DICT_KEY = `${APP_NAME}_DICT`;
/** 页签缓存键 */
export const STORAGE_TAG_VIEWS = `${APP_NAME}_TAG_VIEWS`;
/** 按钮权限码缓存键 */
export const STORAGE_AUTH_KEY = `${APP_NAME}_AUTH_CODES`;
/** 租户信息 */
export const STORAGE_TENANT_KEY = "TENANT_KEY";
/** 应用（子系统）列表 */
export const STORAGE_APPLICATION_LIST = "APPLICATION_LIST";
/** 当前校区 */
export const STORAGE_CAMPUS_KEY = `${APP_NAME}_CAMPUS`;

export type EnvType = "dev" | "test" | "prod";

/** 分页默认值 */
export const DEFAULT_PAGE = { pageNumber: 1, pageSize: 20 };

/** 请求超时时间（ms） */
export const REQUEST_TIMEOUT = 30000;

export { APP_NAME };
