<!-- 消息中心 -->
<template>
	<NPageBasic
		ref="pageRef"
		class="campus-msg-index"
		title="消息中心"
		row-key="id"
		:bars="bars"
		:cols="cols"
		:api="fetchData"
		:is-show-more-filter="true"
		@on-tb-event-watch="onTbAction"
	>
		<template #handle-buttons>
			<ElBadge :value="unread.count" :hidden="!unread.count" type="danger" class="msg-badge">
				<ElButton type="info" plain @click="readAll">全部已读</ElButton>
			</ElBadge>
			<ElButton type="primary" @click="router.push('/tzgg/')">查看公告</ElButton>
		</template>
	</NPageBasic>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElBadge, ElButton, ElMessage } from "lmLibs/element-plus";
import { useRouter } from "vue-router";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NTag from "lmCmpsBasic/NTag";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $messagePagePost, $messageReadAllPost, $messageReadPost, $messageUnreadGet } from "lmApisCampus/api/system";
import { sync } from "lmUtils/promise";
import { dayjs } from "lmUtils/time";
import { useAppStore } from "lmStore/modules/app";

const router = useRouter();
const appStore = useAppStore();
const pageRef = ref();
const unread = ref({ count: 0, important: 0 });

const TYPE: Record<string, { text: string; tag: string }> = {
	APPROVE: { text: "审批", tag: "primary" },
	WARNING: { text: "预警", tag: "danger" },
	SYSTEM: { text: "系统", tag: "info" },
	NOTICE: { text: "通知", tag: "warning" }
};

const bars = computed(() =>
	useSimpleBars([
		"关键词|keyword|input",
		{
			bar: "消息类型|type|select",
			config: {
				props: {
					options: Object.keys(TYPE).map(k => ({ label: TYPE[k].text, value: k }))
				}
			}
		},
		{
			bar: "阅读状态|read|select",
			config: {
				props: {
					options: [
						{ label: "未读", value: false },
						{ label: "已读", value: true }
					]
				}
			}
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		{
			col: "状态|read|text|width:70",
			tdFn: (h: any, ctx: any) =>
				ctx.data.row.read
					? h("span", { class: "msg-dot is-read" })
					: h("span", { class: "msg-dot is-unread" })
		},
		{
			col: "消息|title|text|minWidth:420",
			tdFn: (h: any, ctx: any) => {
				const { row } = ctx.data;
				return h("div", { class: "msg-cell" }, [
					h("div", { class: "msg-cell__title" }, [
						row.important && !row.read ? h("span", { class: "msg-cell__flag" }, "重要") : null,
						h("span", {}, row.title)
					]),
					h("div", { class: "msg-cell__content" }, row.content)
				]);
			}
		},
		{
			col: "类型|type|tag|width:100",
			setComProps: (row: any) => ({ type: TYPE[row.type]?.tag || "info", text: TYPE[row.type]?.text || "其他" })
		},
		"来源|from|width:120",
		"时间|time|text|minWidth:170",
		{ col: "actions|标记已读:read", setComProps: { fixed: "right", width: 120 } }
	])
);

const fetchData = (params: Record<string, any>) => $messagePagePost(params);

const loadUnread = async () => {
	const [err, res] = await sync($messageUnreadGet());
	if (!err) {
		unread.value = res as any;
		appStore.setSystemConfig({ ...appStore.getSystemConfig, noticeCount: unread.value.count });
	}
};

const onTbAction = async ({ key, data }: any) => {
	if (key !== "read") return;
	const row = data?.data?.row;
	if (row.read) {
		ElMessage.info("该消息已是已读状态");
		return;
	}
	const [err] = await sync($messageReadPost({ id: row.id }));
	if (!err) {
		ElMessage.success("已标记为已读");
		pageRef.value.doSearch(true, "search");
		loadUnread();
	}
};

const readAll = async () => {
	const [err] = await sync($messageReadAllPost());
	if (!err) {
		ElMessage.success("全部消息已读");
		pageRef.value.doSearch(false, "search");
		await loadUnread();
	}
};

onMounted(loadUnread);
</script>

<style lang="less">
.msg-badge {
	margin-right: 8px;
}

.msg-dot {
	display: inline-block;
	width: 7px;
	height: 7px;
	border-radius: 50%;

	&.is-unread {
		background: var(--sc-danger);
		box-shadow: 0 0 0 3px rgba(245, 63, 63, 0.12);
	}

	&.is-read {
		background: var(--sc-text-4);
	}
}

.msg-cell {
	&__title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--sc-text-1);
	}

	&__flag {
		padding: 0 5px;
		border-radius: 3px;
		background: #ffece8;
		color: var(--sc-danger);
		font-size: 11px;
		line-height: 16px;
	}

	&__content {
		margin-top: 3px;
		font-size: 12px;
		color: var(--sc-text-3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
</style>
