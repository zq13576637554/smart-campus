/** DOM 查询 */
export const $ = <T extends Element = HTMLElement>(selector: string, parent: ParentNode = document): T | null =>
	parent.querySelector<T>(selector);

export const $$ = <T extends Element = HTMLElement>(selector: string, parent: ParentNode = document): T[] =>
	Array.from(parent.querySelectorAll<T>(selector));

/** class 操作 */
export const hasClass = (el: Element, cls: string) => el.classList.contains(cls);
export const addClass = (el: Element, cls: string) => el.classList.add(cls);
export const removeClass = (el: Element, cls: string) => el.classList.remove(cls);
export const toggleClass = (el: Element, cls: string) => el.classList.toggle(cls);

/** 元素平滑滚动到可视区 */
export function scrollIntoView(el?: Element | null, block: ScrollLogicalPosition = "center") {
	el?.scrollIntoView({ behavior: "smooth", block });
}

/** 滚动到顶部 */
export function scrollToTop(el?: Element | Window | null) {
	if (!el) return;
	if (el instanceof Window) el.scrollTo({ top: 0, behavior: "smooth" });
	else el.scrollTo({ top: 0, behavior: "smooth" });
}

/** 复制文本 */
export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const input = document.createElement("textarea");
		input.value = text;
		document.body.appendChild(input);
		input.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(input);
		return ok;
	}
}

/** 是否移动端 */
export const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

/** 全屏 */
export function toggleFullscreen(el: HTMLElement = document.documentElement) {
	if (!document.fullscreenElement) el.requestFullscreen?.();
	else document.exitFullscreen?.();
}
