<!-- 应用外壳：侧边栏 + 头部 + 内容区 -->
<template>
	<div class="app-layout" :class="{ 'is-collapse': isCollapse }">
		<aside class="app-layout__aside">
			<div class="app-layout__logo">
				<slot name="logo">
					<Logo :is-collapse="isCollapse" />
				</slot>
			</div>
			<div class="app-layout__menu">
				<slot name="menu"></slot>
			</div>
			<div v-if="!isCollapse" class="app-layout__aside-footer">v1.0.0 · 智慧校园</div>
		</aside>

		<!-- 移动端遮罩 -->
		<div class="app-layout__mask" @click="$emit('toggle')"></div>

		<div class="app-layout__main">
			<header class="app-layout__header">
				<slot name="header"></slot>
			</header>
			<main class="app-layout__content">
				<div class="app-layout__page">
					<slot></slot>
				</div>
			</main>
		</div>
	</div>
</template>

<script setup lang="ts">
import Logo from "lmCmpsBasic/Logo";

defineProps<{ isCollapse?: boolean }>();
defineEmits<{ (e: "toggle"): void }>();
</script>

<style lang="less">
@aside-width: 224px;
@aside-collapse-width: 64px;

.app-layout {
	display: flex;
	height: 100vh;
	width: 100%;
	overflow: hidden;
	background: var(--sc-bg);

	&__aside {
		display: flex;
		flex-direction: column;
		width: @aside-width;
		flex: 0 0 @aside-width;
		background: #0b1733;
		background-image: radial-gradient(120% 60% at 0% 0%, rgba(22, 93, 255, 0.28) 0%, rgba(11, 23, 51, 0) 60%),
			linear-gradient(180deg, #0d1b3e 0%, #0b1733 100%);
		border-right: 1px solid rgba(255, 255, 255, 0.04);
		transition: width 0.22s ease, flex-basis 0.22s ease;
		overflow: hidden;
		z-index: 10;
	}

	&.is-collapse &__aside {
		width: @aside-collapse-width;
		flex-basis: @aside-collapse-width;
	}

	&__logo {
		flex: 0 0 56px;
		display: flex;
		align-items: center;
	}

	&__menu {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 10px 0 12px;

		&::-webkit-scrollbar {
			width: 0;
		}
	}

	&__aside-footer {
		flex: 0 0 38px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.3);
		letter-spacing: 0.4px;
	}

	&__main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	&__header {
		flex: 0 0 auto;
		background: var(--sc-card);
		border-bottom: 1px solid var(--sc-border);
		z-index: 9;
	}

	&__content {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 12px;
	}

	&__page {
		height: 100%;
		min-height: 0;
	}

	&__mask {
		display: none;
	}
}

/* ---------------- 移动端适配 ---------------- */
@media (max-width: 1024px) {
	.app-layout__aside {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		z-index: 40;
		transform: translateX(-100%);
		transition: transform 0.24s ease;
		box-shadow: 8px 0 32px rgba(0, 0, 0, 0.28);
	}

	.app-layout:not(.is-collapse) .app-layout__aside {
		transform: translateX(0);
	}

	.app-layout:not(.is-collapse) .app-layout__mask {
		display: block;
		position: fixed;
		inset: 0;
		z-index: 39;
		background: rgba(6, 12, 24, 0.45);
	}

	.app-layout__content {
		padding: 8px;
	}
}

@media (max-width: 768px) {
	.app-layout__content {
		padding: 6px;
	}
}
</style>
