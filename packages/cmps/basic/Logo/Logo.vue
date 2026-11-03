<!-- Logo -->
<template>
	<div class="n-logo">
		<div class="n-logo__mark">
			<svg viewBox="0 0 32 32" width="26" height="26">
				<path d="M16 4l12 6.4-12 6.4L4 10.4 16 4z" fill="#fff" />
				<path d="M16 20.4l8-4.3v5.1c0 3.2-3.6 5.8-8 5.8s-8-2.6-8-5.8v-5.1l8 4.3z" fill="#fff" opacity=".75" />
			</svg>
		</div>
		<div v-if="!isCollapse" class="n-logo__text">
			<div class="n-logo__title">{{ title }}</div>
			<div class="n-logo__sub">{{ subTitle }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ isCollapse?: boolean; title?: string; subTitle?: string }>(), {
	isCollapse: false,
	title: "智慧校园",
	subTitle: "SMART CAMPUS"
});
</script>

<style lang="less">
.n-logo {
	display: flex;
	align-items: center;
	gap: 10px;
	height: 56px;
	padding: 0 14px;
	overflow: hidden;
	white-space: nowrap;

	&__mark {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 9px;
		background: linear-gradient(135deg, #4080ff, #165dff);
		box-shadow: 0 4px 10px rgba(22, 93, 255, 0.4);
		flex: 0 0 32px;
	}

	&__text {
		line-height: 1.2;
	}

	&__title {
		font-size: 15px;
		font-weight: 700;
		color: #fff;
		letter-spacing: 1.2px;
	}

	&__sub {
		margin-top: 1px;
		font-size: 9.5px;
		color: rgba(255, 255, 255, 0.45);
		letter-spacing: 1.4px;
	}
}
</style>
