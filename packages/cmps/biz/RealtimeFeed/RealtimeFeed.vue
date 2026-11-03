<!-- 实时事件浮窗 -->
<template>
	<div class="realtime-feed">
		<div class="realtime-feed__fab" :class="{ 'is-active': visible }" @click="toggle">
			<span class="realtime-feed__pulse"></span>
			<span class="realtime-feed__icon">
				<ElIcon><Bell /></ElIcon>
			</span>
			<span class="realtime-feed__text">实时</span>
			<span v-if="unread" class="realtime-feed__badge">{{ unread > 99 ? "99+" : unread }}</span>
		</div>

		<ElDrawer v-model="visible" title="实时动态" size="380px" append-to-body @open="unread = 0">
			<div class="realtime-feed__list">
				<div v-for="item in events" :key="item.id" class="realtime-feed__item" :class="`is-${item.level}`">
					<div class="realtime-feed__item-head">
						<NTag :type="tagType(item.level)" fill>{{ REALTIME_TYPE_TEXT[item.type] }}</NTag>
						<span class="realtime-feed__time">{{ item.time }}</span>
					</div>
					<div class="realtime-feed__title">{{ item.title }}</div>
					<div class="realtime-feed__content">{{ item.content }}</div>
				</div>
				<Empty v-if="!events.length" text="暂无实时事件" :padding="30" />
			</div>
		</ElDrawer>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElDrawer, ElIcon, ElNotification } from "lmLibs/element-plus";
import { Bell } from "@element-plus/icons-vue";
import NTag from "lmCmpsBasic/NTag";
import Empty from "lmCmpsBasic/Empty";
import { getHistory, onRealtime, REALTIME_TYPE_TEXT, startRealtime, stopRealtime, type RealtimeEvent } from "lmHooks/socket/useRealtime";

const visible = ref(false);
const unread = ref(0);
const events = ref<RealtimeEvent[]>([]);
let off: (() => void) | undefined;

const tagType = (level: string) => (level === "danger" ? "danger" : level === "warning" ? "warning" : level === "success" ? "success" : "info");

const toggle = () => (visible.value = !visible.value);

onMounted(() => {
	startRealtime();
	events.value = [...getHistory()];
	off = onRealtime(event => {
		events.value = [event, ...events.value].slice(0, 60);
		if (visible.value) return;
		unread.value += 1;
		if (event.level === "danger") {
			ElNotification({ title: event.title, message: event.content, type: "warning", duration: 4000 });
		}
	});
});

onBeforeUnmount(() => {
	off?.();
	stopRealtime();
});
</script>

<style lang="less">
.realtime-feed {
	&__fab {
		position: fixed;
		right: 22px;
		bottom: 26px;
		z-index: 2000;
		display: flex;
		align-items: center;
		gap: 6px;
		height: 40px;
		padding: 0 14px;
		border-radius: 20px;
		background: var(--sc-card);
		border: 1px solid var(--sc-border);
		box-shadow: 0 8px 24px rgba(29, 33, 41, 0.14);
		font-size: 12.5px;
		color: var(--sc-text-2);
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			color: var(--sc-primary);
			border-color: var(--sc-primary-border);
			transform: translateY(-2px);
		}
	}

	&__pulse {
		position: absolute;
		left: 10px;
		top: 50%;
		width: 6px;
		height: 6px;
		margin-top: -3px;
		border-radius: 50%;
		background: var(--sc-success);
		box-shadow: 0 0 0 0 rgba(0, 180, 42, 0.5);
		animation: rt-pulse 2s infinite;
	}

	&__icon {
		display: inline-flex;
		margin-left: 10px;
	}

	&__badge {
		position: absolute;
		top: -6px;
		right: -4px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 9px;
		background: var(--sc-danger);
		color: #fff;
		font-size: 11px;
		line-height: 18px;
		text-align: center;
	}

	&__list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	&__item {
		padding: 10px 12px;
		border-radius: var(--sc-radius);
		background: var(--sc-bg);
		border-left: 3px solid var(--sc-primary);

		&.is-warning {
			border-left-color: var(--sc-warning);
		}

		&.is-danger {
			border-left-color: var(--sc-danger);
			background: var(--sc-danger-soft);
		}

		&.is-success {
			border-left-color: var(--sc-success);
		}

		&-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 6px;
		}
	}

	&__time {
		font-size: 11px;
		color: var(--sc-text-3);
		font-variant-numeric: tabular-nums;
	}

	&__title {
		font-size: 13px;
		font-weight: 500;
		color: var(--sc-text-1);
	}

	&__content {
		margin-top: 3px;
		font-size: 12px;
		line-height: 1.6;
		color: var(--sc-text-3);
	}
}

@keyframes rt-pulse {
	0% {
		box-shadow: 0 0 0 0 rgba(0, 180, 42, 0.5);
	}
	70% {
		box-shadow: 0 0 0 8px rgba(0, 180, 42, 0);
	}
	100% {
		box-shadow: 0 0 0 0 rgba(0, 180, 42, 0);
	}
}
</style>
