import type { App, Directive } from "vue";

/**
 * 表头吸顶
 * @desc v-table-sticky 绑定在 el-table 包裹元素上，滚动时表头固定在容器顶部
 */
const sticky: Directive<HTMLElement, number | undefined> = {
	mounted(el, binding) {
		const top = binding.value ?? 0;
		const header = el.querySelector(".el-table__header-wrapper") as HTMLElement | null;
		if (!header) return;
		const onScroll = () => {
			const rect = el.getBoundingClientRect();
			const headHeight = header.offsetHeight;
			if (rect.top < top) {
				header.style.transform = `translateY(${Math.min(top - rect.top, rect.height - headHeight)}px)`;
				header.style.zIndex = "10";
			} else {
				header.style.transform = "";
				header.style.zIndex = "";
			}
		};
		const scroller = el.closest(".el-scrollbar__wrap") || window;
		scroller.addEventListener("scroll", onScroll, { passive: true });
		(el as any).__stickyOff = () => scroller.removeEventListener("scroll", onScroll);
	},
	unmounted(el) {
		(el as any).__stickyOff?.();
	}
};

export default sticky;

export function createSticky(app: App) {
	app.directive("table-sticky", sticky);
}
