import type { App, Directive } from "vue";

/**
 * 修复 element 按钮点击后保持 active（焦点态）的问题
 * @desc v-fix-btn
 */
const fixBtn: Directive<HTMLElement> = {
	mounted(el) {
		el.addEventListener("mousedown", () => el.blur());
	},
	unmounted(el) {
		el.blur();
	}
};

export function fixBtnUse(app: App) {
	app.directive("fix-btn", fixBtn);
}

export default fixBtn;
