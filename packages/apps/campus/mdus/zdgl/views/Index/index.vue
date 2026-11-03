<!-- 数据字典 -->
<template>
	<div class="dict-page">
		<!-- 左：字典类型 -->
		<aside class="dict-page__types">
			<div class="dict-page__types-head">
				<span>字典类型</span>
				<ElButton link type="primary" @click="openType()">新增</ElButton>
			</div>
			<div class="dict-page__types-list">
				<div
					v-for="t in types"
					:key="t.id"
					class="dict-page__type"
					:class="{ 'is-active': t.type === currentType?.type }"
					@click="selectType(t)"
				>
					<div class="dict-page__type-main">
						<span class="dict-page__type-name">{{ t.name }}</span>
						<span class="dict-page__type-code">{{ t.type }}</span>
					</div>
					<NTag :type="t.builtin ? 'info' : 'primary'" fill>{{ t.items.length }}</NTag>
				</div>
				<Empty v-if="!types.length" text="暂无字典" :padding="24" />
			</div>
		</aside>

		<!-- 右：字典项 -->
		<section class="dict-page__items">
			<div class="dict-page__items-head">
				<div>
					<span class="dict-page__items-title">{{ currentType?.name || "请选择字典" }}</span>
					<span v-if="currentType" class="dict-page__items-code">{{ currentType.type }}</span>
				</div>
				<div class="dict-page__items-actions">
					<ElButton v-if="currentType" @click="openType(currentType)">编辑类型</ElButton>
					<ElButton
						v-if="currentType && !currentType.builtin"
						type="danger"
						plain
						@click="removeType(currentType)"
					>删除类型</ElButton>
					<ElButton type="primary" :disabled="!currentType" @click="openItem()">新增字典项</ElButton>
				</div>
			</div>

			<ElTable :data="currentType?.items || []" stripe row-key="value" class="dict-page__table">
				<ElTableColumn label="标签" prop="label" min-width="160" />
				<ElTableColumn label="值" prop="value" min-width="160" />
				<ElTableColumn label="标签样式" min-width="140">
					<template #default="{ row }">
						<NTag :type="row.type || 'info'" fill>{{ row.label }}</NTag>
					</template>
				</ElTableColumn>
				<ElTableColumn label="操作" width="140" align="right">
					<template #default="{ row }">
						<ElButton link type="primary" @click="openItem(row)">编辑</ElButton>
						<ElButton link type="danger" @click="removeItem(row)">删除</ElButton>
					</template>
				</ElTableColumn>
				<template #empty>
					<Empty :text="currentType ? '该字典还没有配置项' : '请先在左侧选择字典类型'" :padding="30" />
				</template>
			</ElTable>
		</section>

		<!-- 字典类型弹窗 -->
		<Dialog v-model="typeVisible" :title="typeForm.id ? '编辑字典类型' : '新增字典类型'" width="480px" @ok="saveType">
			<ElForm :model="typeForm" label-width="90px">
				<ElFormItem label="字典名称" required>
					<ElInput v-model="typeForm.name" placeholder="如：学籍状态" />
				</ElFormItem>
				<ElFormItem label="字典编码" required>
					<ElInput v-model="typeForm.type" placeholder="如：STUDENT_STATUS" :disabled="!!typeForm.id" />
				</ElFormItem>
				<ElFormItem label="备注">
					<ElInput v-model="typeForm.remark" type="textarea" :rows="2" placeholder="选填" />
				</ElFormItem>
			</ElForm>
		</Dialog>

		<!-- 字典项弹窗 -->
		<Dialog v-model="itemVisible" :title="itemForm.id ? '编辑字典项' : '新增字典项'" width="480px" @ok="saveItem">
			<ElForm :model="itemForm" label-width="90px">
				<ElFormItem label="标签" required>
					<ElInput v-model="itemForm.label" placeholder="如：在读" />
				</ElFormItem>
				<ElFormItem label="值" required>
					<ElInput v-model="itemForm.value" placeholder="如：STUDYING" :disabled="!!itemForm.id" />
				</ElFormItem>
				<ElFormItem label="标签样式">
					<ElSelect v-model="itemForm.tagType" style="width: 100%">
						<ElOption v-for="o in tagOptions" :key="o.value" :label="o.label" :value="o.value">
							<NTag :type="o.value" fill>{{ o.label }}</NTag>
						</ElOption>
					</ElSelect>
				</ElFormItem>
				<ElFormItem label="排序">
					<ElInputNumber v-model="itemForm.sort" :min="0" :max="999" style="width: 100%" />
				</ElFormItem>
			</ElForm>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
	ElButton,
	ElForm,
	ElFormItem,
	ElInput,
	ElInputNumber,
	ElMessage,
	ElMessageBox,
	ElOption,
	ElSelect,
	ElTable,
	ElTableColumn
} from "lmLibs/element-plus";
import NTag from "lmCmpsBasic/NTag";
import Empty from "lmCmpsBasic/Empty";
import Dialog from "lmCmpsBasic/Dialog";
import {
	$dictItemDeletePost,
	$dictItemSavePost,
	$dictTypeDeletePost,
	$dictTypeSavePost,
	$dictTypesGet,
	type DictTypeItem
} from "lmApisCampus/api/system";
import { $enumsByTypeGet } from "lmApisCampus/api/auth";
import { sync } from "lmUtils/promise";
import { useDict } from "lmHooks/tools/useDict";

const { dictStore } = useDict();

const types = ref<DictTypeItem[]>([]);
const currentType = ref<DictTypeItem | null>(null);
const typeVisible = ref(false);
const itemVisible = ref(false);

const typeForm = reactive<Record<string, any>>({ id: "", name: "", type: "", remark: "" });
const itemForm = reactive<Record<string, any>>({ id: "", label: "", value: "", tagType: "info", sort: 0 });

const tagOptions = [
	{ label: "主色", value: "primary" },
	{ label: "成功", value: "success" },
	{ label: "警告", value: "warning" },
	{ label: "危险", value: "danger" },
	{ label: "中性", value: "info" }
];

const load = async () => {
	const [err, res] = await sync($dictTypesGet());
	if (err) return;
	types.value = (res as any) || [];
	if (!currentType.value || !types.value.some(t => t.id === currentType.value!.id)) {
		currentType.value = types.value[0] || null;
	} else {
		currentType.value = types.value.find(t => t.id === currentType.value!.id) || null;
	}
};

const selectType = (t: DictTypeItem) => (currentType.value = t);

const openType = (t?: DictTypeItem) => {
	Object.assign(typeForm, { id: t?.id || "", name: t?.name || "", type: t?.type || "", remark: t?.remark || "" });
	typeVisible.value = true;
};

const saveType = async () => {
	if (!typeForm.name || !typeForm.type) {
		ElMessage.warning("请填写字典名称与编码");
		return;
	}
	const [err] = await sync($dictTypeSavePost({ ...typeForm }));
	if (err) return;
	ElMessage.success("保存成功");
	typeVisible.value = false;
	await load();
	refreshDict();
};

const removeType = async (t: DictTypeItem) => {
	const ok = await ElMessageBox.confirm(`确认删除字典「${t.name}」及其全部字典项？`, "删除确认", { type: "warning" }).catch(() => false);
	if (!ok) return;
	const [err] = await sync($dictTypeDeletePost({ id: t.id }));
	if (!err) {
		ElMessage.success("已删除");
		currentType.value = null;
		await load();
		refreshDict();
	}
};

const openItem = (row?: any) => {
	if (!currentType.value) return;
	Object.assign(itemForm, {
		id: row?.value || "",
		label: row?.label || "",
		value: row?.value || "",
		tagType: row?.type || "info",
		sort: row?.sort ?? currentType.value.items.length
	});
	itemVisible.value = true;
};

const saveItem = async () => {
	if (!itemForm.label || !itemForm.value) {
		ElMessage.warning("请填写标签与值");
		return;
	}
	const [err] = await sync($dictItemSavePost({ ...itemForm, type: currentType.value?.type }));
	if (err) return;
	ElMessage.success("保存成功");
	itemVisible.value = false;
	await load();
	refreshDict();
};

const removeItem = async (row: any) => {
	const ok = await ElMessageBox.confirm(`确认删除字典项「${row.label}」？`, "删除确认", { type: "warning" }).catch(() => false);
	if (!ok) return;
	const [err] = await sync($dictItemDeletePost({ type: currentType.value!.type, id: row.value }));
	if (!err) {
		ElMessage.success("已删除");
		await load();
		refreshDict();
	}
};

/** 字典变更后同步前端缓存，保证 EnumSelect / 标签列立即生效 */
const refreshDict = async () => {
	const [err, res] = await sync($enumsByTypeGet());
	if (!err) dictStore.initDict(res as any, 3600);
};

onMounted(load);
</script>

<style lang="less">
.dict-page {
	display: flex;
	gap: 12px;
	height: 100%;
	min-height: 0;

	&__types {
		flex: 0 0 260px;
		display: flex;
		flex-direction: column;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		overflow: hidden;

		&-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
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

	&__type {
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

		&-main {
			min-width: 0;
		}

		&-name {
			display: block;
			font-size: 13px;
			color: var(--sc-text-1);
		}

		&-code {
			display: block;
			margin-top: 2px;
			font-size: 11px;
			color: var(--sc-text-3);
			font-family: Menlo, Consolas, monospace;
		}
	}

	&__items {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		padding: 14px 16px;
		overflow: hidden;

		&-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding-bottom: 12px;
		}

		&-title {
			font-size: 15px;
			font-weight: 600;
		}

		&-code {
			margin-left: 8px;
			font-size: 12px;
			color: var(--sc-text-3);
			font-family: Menlo, Consolas, monospace;
		}

		&-actions {
			display: flex;
			gap: 8px;
		}
	}

	&__table {
		flex: 1;
		min-height: 0;
	}
}
</style>
