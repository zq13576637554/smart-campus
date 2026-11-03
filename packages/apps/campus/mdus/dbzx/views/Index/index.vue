<!-- 待办中心：跨模块汇总今日必办 -->
<template>
	<div class="todo-page">
		<!-- 头部 -->
		<header class="todo-page__head">
			<div class="todo-page__head-main">
				<div class="todo-page__title">今日待办</div>
				<div class="todo-page__sub">
					{{ today }} ·
					共 <b>{{ data.total }}</b> 项待处理<template v-if="data.urgentTotal">，其中
						<b class="is-urgent">{{ data.urgentTotal }}</b> 项紧急</template>
				</div>
			</div>
			<div class="todo-page__head-actions">
				<span class="todo-page__generated">更新于 {{ data.generatedAt?.slice(11) }}</span>
				<ElButton :loading="loading" @click="load">
					<ElIcon><Refresh /></ElIcon>
					刷新
				</ElButton>
			</div>
		</header>

		<!-- 分类卡片 -->
		<div class="todo-page__cards">
			<div class="todo-page__card is-all" :class="{ 'is-active': !active }" @click="select(null)">
				<div class="todo-page__card-icon"><NIcon name="grid" :size="18" /></div>
				<div>
					<div class="todo-page__card-label">全部待办</div>
					<div class="todo-page__card-count">{{ data.total }}<em>项</em></div>
				</div>
			</div>

			<div
				v-for="g in data.groups"
				:key="g.category"
				class="todo-page__card"
				:class="{ 'is-active': active === g.category }"
				@click="select(g.category)"
			>
				<div class="todo-page__card-icon"><NIcon :name="g.icon" :size="18" /></div>
				<div>
					<div class="todo-page__card-label">{{ g.label }}</div>
					<div class="todo-page__card-count">
						{{ g.count }}<em>项</em>
						<span v-if="g.urgent" class="todo-page__card-urgent">{{ g.urgent }} 紧急</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 清单 -->
		<div class="todo-page__list" v-loading="loading">
			<div class="todo-page__list-head">
				<span>{{ activeLabel }}</span>
				<span class="todo-page__list-count">{{ items.length }} 项</span>
			</div>

			<div v-for="item in items" :key="item.id" class="todo-page__item" :class="`is-${item.category}`">
				<span class="todo-page__bar"></span>

				<div class="todo-page__item-main">
					<div class="todo-page__item-title">
						{{ item.title }}
						<NTag v-if="item.level === 'urgent'" type="danger" fill>紧急</NTag>
					</div>
					<div class="todo-page__item-desc">{{ item.desc }}</div>
					<div class="todo-page__item-meta">
						<span>{{ item.meta }}</span>
						<span class="todo-page__dot">·</span>
						<span>{{ item.time }}</span>
					</div>
				</div>

				<ElButton type="primary" plain size="small" @click="go(item)">{{ item.action }}</ElButton>
			</div>

			<Empty
				v-if="!loading && !items.length"
				:text="active ? '该分类暂无待办' : '今日暂无待办，休息一下'"
				:padding="60"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElIcon } from "lmLibs/element-plus";
import { Refresh } from "@element-plus/icons-vue";
import NIcon from "lmCmpsBasic/NIcon";
import NTag from "lmCmpsBasic/NTag";
import Empty from "lmCmpsBasic/Empty";
import { $todoListPost, type TodoCategory } from "lmApisCampus/api/todo";
import { sync } from "lmUtils/promise";
import { dayjs } from "lmUtils/time";

const router = useRouter();

const loading = ref(false);
const active = ref<TodoCategory | null>(null);
const data = ref<any>({ total: 0, urgentTotal: 0, groups: [], items: [], generatedAt: "" });

const today = dayjs().format("YYYY年MM月DD日 dddd");

const items = computed<any[]>(() => data.value.items || []);
const activeLabel = computed(() => {
	if (!active.value) return "全部待办";
	const hit = (data.value.groups || []).find((g: any) => g.category === active.value);
	return hit?.label || "全部待办";
});

const load = async () => {
	loading.value = true;
	try {
		const [err, res] = await sync($todoListPost(active.value ? { category: active.value } : {}));
		if (!err) data.value = res;
	} finally {
		loading.value = false;
	}
};

/** 切换分类：重新请求（保持 groups 计数为全量） */
const select = (category: TodoCategory | null) => {
	if (active.value === category) return;
	active.value = category;
	load();
};

/** 跳转到对应模块处理 */
const go = (item: any) => {
	router.push(item.route);
};

onMounted(load);
</script>

<style lang="less">
.todo-page {
	display: flex;
	flex-direction: column;
	gap: 12px;
	height: 100%;
	min-height: 0;

	&__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 16px 18px;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
	}

	&__title {
		font-size: 18px;
		font-weight: 600;
		color: var(--sc-text-1);
	}

	&__sub {
		margin-top: 4px;
		font-size: 12.5px;
		color: var(--sc-text-3);

		b {
			color: var(--sc-text-1);

			&.is-urgent {
				color: var(--sc-danger);
			}
		}
	}

	&__head-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	&__generated {
		font-size: 11.5px;
		color: var(--sc-text-4);
	}

	&__cards {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 12px;
	}

	&__card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		background: var(--sc-card);
		border: 1px solid transparent;
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		cursor: pointer;
		transition: all 0.16s;

		&:hover {
			transform: translateY(-1px);
			box-shadow: var(--sc-shadow-2);
		}

		&.is-active {
			border-color: var(--sc-primary);
			background: var(--sc-primary-soft);
		}

		&-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			border-radius: 10px;
			background: var(--sc-bg-sunken);
			color: var(--sc-primary);
			flex: 0 0 36px;
		}

		&-label {
			font-size: 12.5px;
			color: var(--sc-text-3);
		}

		&-count {
			font-size: 20px;
			font-weight: 700;
			color: var(--sc-text-1);
			font-variant-numeric: tabular-nums;

			em {
				margin-left: 2px;
				font-size: 11px;
				font-style: normal;
				font-weight: 400;
				color: var(--sc-text-3);
			}
		}

		&-urgent {
			margin-left: 6px;
			padding: 1px 6px;
			border-radius: 8px;
			background: var(--sc-danger-soft);
			color: var(--sc-danger);
			font-size: 10.5px;
			vertical-align: 2px;
		}
	}

	&__list {
		flex: 1;
		min-height: 0;
		overflow: auto;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		padding: 6px 0 12px;
	}

	&__list-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 18px;
		font-size: 13.5px;
		font-weight: 600;
		color: var(--sc-text-1);
		border-bottom: 1px solid var(--sc-border);
	}

	&__list-count {
		font-size: 12px;
		font-weight: 400;
		color: var(--sc-text-3);
	}

	&__item {
		position: relative;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 18px 14px 22px;
		border-bottom: 1px solid var(--sc-border);

		&:last-child {
			border-bottom: none;
		}

		&:hover {
			background: var(--sc-bg);
		}

		&-main {
			flex: 1;
			min-width: 0;
		}

		&-title {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 13.5px;
			color: var(--sc-text-1);
		}

		&-desc {
			margin-top: 3px;
			font-size: 12.5px;
			color: var(--sc-text-2);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&-meta {
			margin-top: 4px;
			font-size: 11.5px;
			color: var(--sc-text-3);
		}
	}

	&__bar {
		position: absolute;
		left: 8px;
		top: 50%;
		transform: translateY(-50%);
		width: 3px;
		height: 26px;
		border-radius: 2px;
		background: var(--sc-primary);
	}

	&__item.is-leave &__bar {
		background: #165dff;
	}

	&__item.is-repair &__bar {
		background: #ff7d00;
	}

	&__item.is-visitor &__bar {
		background: #722ed1;
	}

	&__item.is-bill &__bar {
		background: #f53f3f;
	}

	&__dot {
		margin: 0 6px;
		color: var(--sc-text-4);
	}

	@media (max-width: 1200px) {
		&__cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 768px) {
		&__head {
			flex-direction: column;
			padding: 14px;
		}

		&__head-actions {
			width: 100%;
			justify-content: space-between;
		}

		&__cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 8px;
		}

		&__card {
			padding: 10px 12px;
		}

		&__item {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
			padding: 12px 14px 12px 20px;
		}

		&__item-desc {
			white-space: normal;
		}
	}
}
</style>
