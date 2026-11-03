<!-- 顶栏：折叠按钮 + 面包屑 + 用户信息 -->
<template>
	<div class="tool-header">
		<div class="tool-header__left">
			<MenuToggle :is-collapse="isCollapse" @toggle="$emit('toggle')" />
			<slot name="left">
				<BreadCrumb />
			</slot>
		</div>

		<div class="tool-header__right">
			<!-- 校区切换 -->
			<ElDropdown trigger="click" @command="onCampus">
				<div class="tool-header__campus">
					<ElIcon><OfficeBuilding /></ElIcon>
					<span>{{ campus.name }}</span>
					<ElIcon class="tool-header__arrow"><ArrowDown /></ElIcon>
				</div>
				<template #dropdown>
					<ElDropdownMenu>
						<ElDropdownItem v-for="c in campuses" :key="c.id" :command="c.id">
							{{ c.name }}
						</ElDropdownItem>
					</ElDropdownMenu>
				</template>
			</ElDropdown>

			<ElTooltip :content="t('切换到深色')" placement="bottom">
				<span class="tool-header__action" @click="onToggleTheme">
					<ElIcon>
						<component :is="isDark ? Sunny : Moon" />
					</ElIcon>
				</span>
			</ElTooltip>

			<ElTooltip :content="locale === 'zh' ? 'Switch to English' : '切换为中文'" placement="bottom">
				<span class="tool-header__action tool-header__lang" @click="toggleLocale">
					{{ locale === "zh" ? "EN" : "中" }}
				</span>
			</ElTooltip>

			<ElTooltip :content="t('全屏')" placement="bottom">
				<span class="tool-header__action" @click="onFullscreen">
					<ElIcon><FullScreen /></ElIcon>
				</span>
			</ElTooltip>

			<ElTooltip :content="t('通知')" placement="bottom">
				<ElBadge :value="noticeCount" :hidden="!noticeCount" class="tool-header__badge">
					<span class="tool-header__action" @click="router.push('/msg/')">
						<ElIcon><Bell /></ElIcon>
					</span>
				</ElBadge>
			</ElTooltip>

			<ElDropdown trigger="click" @command="onCommand">
				<div class="tool-header__user">
					<ElAvatar :size="28" :src="userInfo.avatar">
						{{ (userInfo.nickName || userInfo.userName || "管").slice(0, 1) }}
					</ElAvatar>
					<div class="tool-header__user-info">
						<div class="tool-header__user-name">{{ userInfo.nickName || userInfo.userName || "管理员" }}</div>
						<div class="tool-header__user-dept">{{ userInfo.deptName || "智慧校园" }}</div>
					</div>
					<ElIcon class="tool-header__arrow"><ArrowDown /></ElIcon>
				</div>
				<template #dropdown>
					<ElDropdownMenu>
						<ElDropdownItem command="profile">{{ t("个人中心") }}</ElDropdownItem>
						<ElDropdownItem command="password">{{ t("修改密码") }}</ElDropdownItem>
						<ElDropdownItem divided command="logout">{{ t("退出登录") }}</ElDropdownItem>
					</ElDropdownMenu>
				</template>
			</ElDropdown>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ArrowDown, Bell, FullScreen, Moon, OfficeBuilding, Sunny } from "@element-plus/icons-vue";
import {
	ElAvatar,
	ElBadge,
	ElDropdown,
	ElDropdownItem,
	ElDropdownMenu,
	ElIcon,
	ElMessage,
	ElTooltip
} from "lmLibs/element-plus";
import MenuToggle from "lmCmpsBasic/MenuToggle";
import BreadCrumb from "lmCmpsBiz/BreadCrumb";
import { useRouter } from "vue-router";
import { useAppStore } from "lmStore/modules/app";
import { clearAuthStorage } from "lmUtils/auth";
import { toggleFullscreen } from "lmUtils/dom";
import { $messageUnreadGet } from "lmApisCampus/api/system";
import { $campusesGet } from "lmApisCampus/api/dashboard";
import { useTheme } from "lmHooks/core/useApp";
import { locale, setLocale, t } from "lmLibs/i18n";
import { sync } from "lmUtils/promise";

defineProps<{ isCollapse?: boolean }>();
defineEmits<{ (e: "toggle"): void }>();

const router = useRouter();
const appStore = useAppStore();
const userInfo = computed(() => appStore.getUserInfo || {});
const noticeCount = ref(Number(appStore.getSystemConfig?.noticeCount || 0));

/** 未读消息数 */
const loadUnread = async () => {
	const [err, res] = await sync($messageUnreadGet());
	if (!err && res) noticeCount.value = (res as any).count || 0;
};

const campus = computed(() => appStore.getCampus);
const campuses = ref<any[]>([]);

const loadCampuses = async () => {
	const [err, res] = await sync($campusesGet());
	if (!err) campuses.value = (res as any) || [];
};

const onCampus = (id: string) => {
	const hit = campuses.value.find(c => c.id === id);
	if (!hit || hit.id === campus.value.id) return;
	appStore.setCampus({ id: hit.id, name: hit.name });
	ElMessage.success(`已切换到「${hit.name}」`);
};

/* ---------------- 主题 ---------------- */
const { isDark, toggleTheme } = useTheme();

const onToggleTheme = () => {
	const next = toggleTheme();
	try {
		const pref = JSON.parse(localStorage.getItem("CAMPUS_PREF") || "{}");
		localStorage.setItem("CAMPUS_PREF", JSON.stringify({ ...pref, theme: next }));
	} catch {
		localStorage.setItem("CAMPUS_PREF", JSON.stringify({ theme: next }));
	}
	ElMessage.success(next === "dark" ? "已切换到深色模式" : "已切换到浅色模式");
};

/* ---------------- 语言 ---------------- */
const toggleLocale = () => {
	const next = locale.value === "zh" ? "en" : "zh";
	setLocale(next);
	ElMessage.success(next === "en" ? "Language switched to English" : "已切换为中文");
};

onMounted(() => {
	loadUnread();
	loadCampuses();
});

const onFullscreen = () => toggleFullscreen();

const onCommand = (cmd: string) => {
	if (cmd === "logout") {
		clearAuthStorage();
		appStore.clear();
		router.replace("/login/");
		return;
	}
	if (cmd === "profile") {
		router.push("/grzx/");
		return;
	}
	ElMessage.info("演示环境暂不支持修改密码");
};
</script>

<style lang="less">
.tool-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 54px;
	padding: 0 14px;

	&__left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	&__right {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	&__action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 6px;
		color: #4e5969;
		cursor: pointer;

		&:hover {
			background: #f2f3f5;
		}
	}

	&__campus {		display: flex;
		align-items: center;
		gap: 5px;
		height: 30px;
		padding: 0 10px;
		margin-right: 4px;
		border-radius: var(--sc-radius-sm);
		border: 1px solid var(--sc-border);
		font-size: 12.5px;
		color: var(--sc-text-2);
		cursor: pointer;

		&:hover {
			color: var(--sc-primary);
			border-color: var(--sc-primary-border);
		}
	}

	&__lang {
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.5px;
		color: var(--sc-text-2);
	}

	&__badge {
		display: flex;
	}

	&__user {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 8px;
		border-radius: 6px;
		cursor: pointer;

		&:hover {
			background: var(--sc-bg-sunken);
		}
	}

	&__user-info {
		line-height: 1.25;
	}

	&__user-name {
		font-size: 13px;
		color: var(--sc-text-1);
	}

	&__user-dept {
		font-size: 11px;
		color: var(--sc-text-3);
	}

	&__arrow {
		font-size: 12px;
		color: var(--sc-text-3);
	}

	/* ---------------- 移动端：只留菜单键 + 通知 + 头像 ---------------- */
	@media (max-width: 768px) {
		padding: 0 8px;

		&__left {
			flex: 1;
			min-width: 0;
		}

		.bread-crumb {
			display: none;
		}

		&__campus,
		&__lang {
			display: none;
		}

		&__user-info {
			display: none;
		}

		&__action {
			width: 28px;
			height: 28px;
		}
	}
}
</style>
