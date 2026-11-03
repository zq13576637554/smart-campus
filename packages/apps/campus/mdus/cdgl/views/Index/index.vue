<!-- 菜单与按钮权限 -->
<template>
	<div class="menu-page">
		<!-- 角色 -->
		<aside class="menu-page__roles">
			<div class="menu-page__roles-head">角色</div>
			<div class="menu-page__roles-list">
				<div
					v-for="role in roles"
					:key="role.id"
					class="menu-page__role"
					:class="{ 'is-active': role.id === currentRole?.id }"
					@click="selectRole(role)"
				>
					<div>
						<div class="menu-page__role-name">{{ role.roleName }}</div>
						<div class="menu-page__role-code">{{ role.roleCode }}</div>
					</div>
					<NTag :type="role.status === 'ENABLED' ? 'success' : 'info'" fill>{{ role.userCount }} 人</NTag>
				</div>
				<Empty v-if="!roles.length" text="暂无角色" :padding="24" />
			</div>
		</aside>

		<!-- 权限树 -->
		<section class="menu-page__tree">
			<div class="menu-page__tree-head">
				<div>
					<span class="menu-page__tree-title">{{ currentRole?.roleName || "请选择角色" }}</span>
					<span class="menu-page__tree-desc">勾选该角色可访问的菜单与操作按钮</span>
				</div>
				<div class="menu-page__tree-actions">
					<ElButton @click="checkAll(true)">全选</ElButton>
					<ElButton @click="checkAll(false)">清空</ElButton>
					<ElButton type="primary" :loading="saving" @click="save">保存授权</ElButton>
				</div>
			</div>

			<div class="menu-page__tree-body" v-loading="loading">
				<ElTree
					ref="treeRef"
					:data="tree"
					node-key="id"
					show-checkbox
					default-expand-all
					:props="{ label: 'title', children: 'children' }"
					:default-checked-keys="checkedKeys"
				>
					<template #default="{ data }">
						<span class="menu-page__node">
							<NTag :type="typeTag(data.type)" fill>{{ typeText(data.type) }}</NTag>
							<span class="menu-page__node-title">{{ data.title }}</span>
							<span v-if="data.auth" class="menu-page__node-auth">{{ data.auth }}</span>
							<span v-else-if="data.path" class="menu-page__node-path">{{ data.path }}</span>
							<NTag v-if="data.visible === false" type="info" fill>隐藏</NTag>
						</span>
					</template>
				</ElTree>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import { ElButton, ElMessage, ElTree } from "lmLibs/element-plus";
import NTag from "lmCmpsBasic/NTag";
import Empty from "lmCmpsBasic/Empty";
import { $menuTreeGet, $systemRoleAuthPost, $systemRoleMenusGet, $systemRolePagePost, type MenuTreeNode } from "lmApisCampus/api/system";
import { sync } from "lmUtils/promise";

const roles = ref<any[]>([]);
const currentRole = ref<any>(null);
const tree = ref<MenuTreeNode[]>([]);
const checkedKeys = ref<string[]>([]);
const treeRef = ref();
const loading = ref(false);
const saving = ref(false);

const typeText = (type: string) => (type === "group" ? "分组" : type === "menu" ? "菜单" : "按钮");
const typeTag = (type: string) => (type === "group" ? "warning" : type === "menu" ? "primary" : "info");

const loadRoles = async () => {
	const [err, res] = await sync($systemRolePagePost({ pageNumber: 1, pageSize: 100 }));
	if (!err) {
		roles.value = (res as any).content;
		if (!currentRole.value) selectRole(roles.value[0]);
	}
};

const loadTree = async () => {
	const [err, res] = await sync($menuTreeGet());
	if (!err) tree.value = (res as any) || [];
};

const selectRole = async (role: any) => {
	if (!role) return;
	currentRole.value = role;
	loading.value = true;
	try {
		const [err, res] = await sync($systemRoleMenusGet({ id: role.id }));
		checkedKeys.value = err ? [] : ((res as any) || []);
		await nextTick();
		treeRef.value?.setCheckedKeys(checkedKeys.value);
	} finally {
		loading.value = false;
	}
};

const flattenIds = (nodes: MenuTreeNode[]): string[] => nodes.flatMap(n => [n.id, ...(n.children ? flattenIds(n.children) : [])]);

const checkAll = (checked: boolean) => {
	treeRef.value?.setCheckedKeys(checked ? flattenIds(tree.value) : []);
};

const save = async () => {
	if (!currentRole.value) return;
	saving.value = true;
	try {
		const checked = treeRef.value?.getCheckedKeys() || [];
		const half = treeRef.value?.getHalfCheckedKeys() || [];
		const [err] = await sync($systemRoleAuthPost({ id: currentRole.value.id, menuIds: [...checked, ...half] }));
		if (err) return;
		ElMessage.success(`已保存「${currentRole.value.roleName}」的授权，重新登录后生效`);
	} finally {
		saving.value = false;
	}
};

onMounted(async () => {
	await Promise.all([loadRoles(), loadTree()]);
	if (currentRole.value) await selectRole(currentRole.value);
});
</script>

<style lang="less">
.menu-page {
	display: flex;
	gap: 12px;
	height: 100%;
	min-height: 0;

	&__roles {
		flex: 0 0 240px;
		display: flex;
		flex-direction: column;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		overflow: hidden;

		&-head {
			padding: 14px 16px;
			border-bottom: 1px solid var(--sc-border);
			font-size: 14px;
			font-weight: 600;
		}

		&-list {
			flex: 1;
			overflow: auto;
			padding: 8px;
		}
	}

	&__role {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 9px 10px;
		border-radius: var(--sc-radius-sm);
		cursor: pointer;
		transition: background 0.15s;

		&:hover {
			background: var(--sc-bg-sunken);
		}

		&.is-active {
			background: var(--sc-primary-soft);
		}

		&-name {
			font-size: 13px;
			color: var(--sc-text-1);
		}

		&-code {
			margin-top: 2px;
			font-size: 11px;
			color: var(--sc-text-3);
			font-family: Menlo, Consolas, monospace;
		}
	}

	&__tree {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		overflow: hidden;

		&-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: 14px 16px;
			border-bottom: 1px solid var(--sc-border);
		}

		&-title {
			font-size: 15px;
			font-weight: 600;
		}

		&-desc {
			margin-left: 8px;
			font-size: 12px;
			color: var(--sc-text-3);
		}

		&-actions {
			display: flex;
			gap: 8px;
		}

		&-body {
			flex: 1;
			overflow: auto;
			padding: 12px 16px;
		}
	}

	&__node {
		display: inline-flex;
		align-items: center;
		gap: 8px;

		&-title {
			font-size: 13px;
			color: var(--sc-text-1);
		}

		&-auth,
		&-path {
			font-size: 11.5px;
			color: var(--sc-text-3);
			font-family: Menlo, Consolas, monospace;
		}
	}

	.el-tree-node__content {
		height: 34px;
		border-radius: var(--sc-radius-sm);

		&:hover {
			background: var(--sc-bg-sunken);
		}
	}
}
</style>
