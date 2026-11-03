import { computed } from "vue";
import { useAppStore } from "lmStore/modules/app";

/** 系统配置： logo、标题、版权、主题等 */
export function useSystem() {
	const appStore = useAppStore();

	const systemConfig = computed(() => appStore.getSystemConfig || {});
	const productName = computed(() => systemConfig.value.productName || appStore.getProductName || "智慧校园");
	const tenantData = computed(() => appStore.getTenantData || {});
	const userInfo = computed(() => appStore.getUserInfo || {});

	return { appStore, systemConfig, productName, tenantData, userInfo };
}

/** 主题变量（预留深色模式切换能力） */
export function useTheme() {
	const appStore = useAppStore();
	const isDark = computed(() => appStore.getSystemConfig?.theme === "dark");

	const toggleTheme = () => {
		const next = isDark.value ? "light" : "dark";
		appStore.setSystemConfig({ ...appStore.getSystemConfig, theme: next });
		document.documentElement.classList.toggle("dark", next === "dark");
		return next;
	};

	return { isDark, toggleTheme };
}

export default useSystem;
