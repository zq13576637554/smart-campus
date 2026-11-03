<!-- 多页签 -->
<template>
	<div class="tag-views">
		<div class="tag-views__scroll">
			<div
				v-for="tag in tags"
				:key="tag.fullPath"
				class="tag-views__item"
				:class="{ 'is-active': tag.fullPath === currentFullPath }"
				@click="onClick(tag)"
			>
				<span class="tag-views__dot"></span>
				<span class="tag-views__text">{{ tag.title }}</span>
				<ElIcon v-if="!tag.affix" class="tag-views__close" @click.stop="onClose(tag)">
					<Close />
				</ElIcon>
			</div>
		</div>
		<ElDropdown trigger="click" class="tag-views__more" @command="onCommand">
			<ElIcon><ArrowDown /></ElIcon>
			<template #dropdown>
				<ElDropdownMenu>
					<ElDropdownItem command="others">关闭其他</ElDropdownItem>
					<ElDropdownItem command="all">关闭全部</ElDropdownItem>
				</ElDropdownMenu>
			</template>
		</ElDropdown>
	</div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { ArrowDown, Close } from "@element-plus/icons-vue";
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon } from "lmLibs/element-plus";
import { useRoute, useRouter } from "vue-router";
import { useTagsStore } from "lmStore/modules/tags";

const route = useRoute();
const router = useRouter();
const tagsStore = useTagsStore();

const tags = computed(() => tagsStore.getVisitedViews);
const currentFullPath = computed(() => route.fullPath);

watch(
	() => route.fullPath,
	() => {
		if (route.name && !String(route.name).startsWith("login")) tagsStore.addView(route);
	},
	{ immediate: true }
);

const onClick = (tag: any) => {
	if (tag.fullPath !== currentFullPath.value) router.push(tag.fullPath);
};

const onClose = (tag: any) => {
	const index = tags.value.findIndex(t => t.fullPath === tag.fullPath);
	tagsStore.delView(tag.fullPath);
	if (tag.fullPath === currentFullPath.value) {
		const next = tags.value[index] || tags.value[index - 1] || tags.value[0];
		router.push(next?.fullPath || "/home/");
	}
};

const onCommand = (cmd: string) => {
	if (cmd === "others") tagsStore.delOthers(currentFullPath.value);
	if (cmd === "all") {
		tagsStore.delAll();
		router.push("/home/");
	}
};
</script>

<style lang="less">
.tag-views {
	display: flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 12px;
	background: var(--sc-card);
	border-top: 1px solid var(--sc-border);

	&__scroll {
		flex: 1;
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}
	}

	&__item {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 24px;
		padding: 0 9px;
		font-size: 12px;
		color: var(--sc-text-2);
		background: var(--sc-bg);
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius-sm);
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s;

		&:hover {
			color: var(--sc-primary);
			border-color: var(--sc-primary-border);
		}

		&.is-active {
			color: #fff;
			background: var(--sc-primary);
			border-color: var(--sc-primary);
			box-shadow: 0 2px 6px rgba(22, 93, 255, 0.24);

			.tag-views__dot {
				background: var(--sc-card);
			}
		}
	}

	&__dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #c9cdd4;
	}

	&__close {
		font-size: 11px;
		border-radius: 50%;

		&:hover {
			background: rgba(0, 0, 0, 0.12);
		}
	}

	&__more {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		color: #4e5969;
		cursor: pointer;
		border-radius: 4px;

		&:hover {
			background: #f2f3f5;
		}
	}
}
</style>
