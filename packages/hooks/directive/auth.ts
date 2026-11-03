import type { App, Directive } from "vue";
import { hasAuth } from "lmUtils/auth";

/**
 * 按钮级权限指令
 * @example <ElButton v-auth:student:add>新增</ElButton>
 * @desc 无权限时移除元素（而非隐藏），避免被绕过
 */
const auth: Directive<HTMLElement, any> = {
	mounted(el, binding) {
		const code = binding.arg || binding.value;
		if (!hasAuth(code)) {
			el.parentNode?.removeChild(el);
		}
	}
};

export function authUse(app: App) {
	app.directive("auth", auth);
}

export default auth;
