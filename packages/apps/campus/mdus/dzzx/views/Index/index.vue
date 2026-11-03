<!-- 导入导出中心：统一入口 -->
<template>
	<div class="dc-page">
		<header class="dc-page__head">
			<div>
				<div class="dc-page__title">导入导出中心</div>
				<div class="dc-page__sub">
					统一管理各类业务数据的导入模板与导出任务；导出记录可在「导出记录」中追溯并重新下载
				</div>
			</div>
		</header>

		<div class="dc-page__body">
			<ElTabs v-model="tab" class="dc-page__tabs">
				<!-- 导入 -->
				<ElTabPane label="数据导入" name="import">
					<div class="dc-grid">
						<div v-for="t in imports" :key="t.key" class="dc-card">
							<div class="dc-card__head">
								<div class="dc-card__icon"><NIcon :name="t.icon" :size="18" /></div>
								<div class="dc-card__title-box">
									<div class="dc-card__title">{{ t.label }}</div>
									<div class="dc-card__meta">{{ t.module }} · 现有 {{ t.count }} 条</div>
								</div>
								<NTag :type="t.available ? 'success' : 'info'" fill>{{ t.available ? "可用" : "开发中" }}</NTag>
							</div>

							<div class="dc-card__fields">
								导入字段 {{ t.columns.length }} 项：
								<span class="dc-card__field" v-for="c in t.columns" :key="c.prop" :class="{ 'is-required': c.required }">
									{{ c.label }}
								</span>
							</div>

							<div class="dc-card__actions">
								<ElButton size="small" @click="downloadTemplate(t)">
									<ElIcon><Download /></ElIcon>
									下载模板
								</ElButton>
								<ElButton size="small" type="primary" :disabled="!t.available" @click="goImport(t)">
									<ElIcon><Upload /></ElIcon>
									去导入
								</ElButton>
							</div>
						</div>
					</div>

					<div class="dc-page__tip">
						四类数据均支持在线导入：下载模板 → 填写 → 上传校验 → 只导入有效行；带 <b>*</b> 的字段为必填。
					</div>
				</ElTabPane>

				<!-- 导出 -->
				<ElTabPane label="数据导出" name="export">
					<div class="dc-grid">
						<div v-for="t in exports" :key="t.key" class="dc-card">
							<div class="dc-card__head">
								<div class="dc-card__icon is-export"><NIcon :name="t.icon" :size="18" /></div>
								<div class="dc-card__title-box">
									<div class="dc-card__title">{{ t.label }}</div>
									<div class="dc-card__meta">{{ t.module }} · 共 {{ t.count }} 条</div>
								</div>
							</div>

							<div class="dc-card__fields">
								导出字段 {{ t.columns.length }} 项：{{ t.columns.map(c => c.label).join("、") }}
							</div>

							<div class="dc-card__actions">
								<ElButton size="small" type="primary" :loading="exporting === t.key" @click="doExport(t)">
									<ElIcon><Download /></ElIcon>
									导出 CSV
								</ElButton>
							</div>
						</div>
					</div>
				</ElTabPane>

				<!-- 记录 -->
				<ElTabPane label="导出记录" name="logs">
					<ElTable :data="logs" height="100%" stripe>
						<ElTableColumn prop="fileName" label="文件名" min-width="240" show-overflow-tooltip />
						<ElTableColumn prop="typeLabel" label="数据类型" width="140" />
						<ElTableColumn prop="total" label="条数" width="100" align="right" />
						<ElTableColumn prop="operator" label="操作人" width="130" />
						<ElTableColumn prop="time" label="导出时间" width="180" />
						<ElTableColumn prop="status" label="状态" width="100">
							<template #default="{ row }">
								<NTag type="success" fill>{{ row.status }}</NTag>
							</template>
						</ElTableColumn>
						<ElTableColumn label="操作" width="120" fixed="right">
							<template #default="{ row }">
								<ElButton link type="primary" :loading="exporting === row.typeKey" @click="reExport(row)">
									重新导出
								</ElButton>
							</template>
						</ElTableColumn>
						<template #empty>
							<Empty text="还没有导出记录" :padding="40" />
						</template>
					</ElTable>
				</ElTabPane>
			</ElTabs>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElIcon, ElMessage, ElTable, ElTableColumn, ElTabPane, ElTabs } from "lmLibs/element-plus";
import { Download, Upload } from "@element-plus/icons-vue";
import NIcon from "lmCmpsBasic/NIcon";
import NTag from "lmCmpsBasic/NTag";
import Empty from "lmCmpsBasic/Empty";
import {
	$dataExportLogPost,
	$dataExportLogsGet,
	$dataExportPost,
	$dataTypesGet,
	type ExportLog,
	type ExportType,
	type ImportType
} from "lmApisCampus/api/dataCenter";
import { useAppStore } from "lmStore/modules/app";
import { sync } from "lmUtils/promise";
import { downloadText, exportCsv } from "lmUtils/download";

const router = useRouter();
const appStore = useAppStore();

const tab = ref("import");
const imports = ref<ImportType[]>([]);
const exports = ref<ExportType[]>([]);
const logs = ref<ExportLog[]>([]);
const exporting = ref("");

const loadTypes = async () => {
	const [err, res] = await sync($dataTypesGet());
	if (err) return;
	imports.value = (res as any).imports || [];
	exports.value = (res as any).exports || [];
};

const loadLogs = async () => {
	const [err, res] = await sync($dataExportLogsGet());
	if (!err) logs.value = (res as any) || [];
};

/** 下载导入模板（仅表头，带 BOM 保证 Excel 中文不乱码） */
const downloadTemplate = (t: ImportType) => {
	const header = t.columns.map(c => (c.required ? `${c.label}*` : c.label)).join(",");
	const sample = t.columns.map(c => (c.required ? "必填" : "")).join(",");
	downloadText(`${header}\n${sample}`, `${t.label}-导入模板.csv`, "text/csv;charset=utf-8");
	ElMessage.success(`已下载「${t.label}」导入模板`);
};

const goImport = (t: ImportType) => {
	if (t.route) router.push(t.route);
};

/** 执行导出：取数 → 生成 CSV → 记一条导出记录 */
const doExport = async (t: ExportType) => {
	exporting.value = t.key;
	try {
		const [err, res] = await sync($dataExportPost({ key: t.key }));
		if (err) return;

		const data = res as any;
		exportCsv(data.rows, data.columns, data.fileName);

		await sync(
			$dataExportLogPost({
				typeKey: t.key,
				fileName: data.fileName,
				total: data.rows.length,
				operator: appStore.userInfo?.nickName
			})
		);
		loadLogs();
		ElMessage.success(`已导出「${t.label}」${data.rows.length} 条`);
	} finally {
		exporting.value = "";
	}
};

const reExport = (row: ExportLog) => {
	const hit = exports.value.find(t => t.key === row.typeKey);
	if (!hit) {
		ElMessage.warning("该类型已下线");
		return;
	}
	doExport(hit);
};

onMounted(() => {
	loadTypes();
	loadLogs();
});
</script>

<style lang="less">
.dc-page {
	display: flex;
	flex-direction: column;
	gap: 12px;
	height: 100%;
	min-height: 0;

	&__head {
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
		line-height: 1.7;
		color: var(--sc-text-3);
	}

	&__body {
		flex: 1;
		min-height: 0;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		padding: 8px 18px 16px;
		overflow: hidden;
	}

	&__tabs {
		height: 100%;
		display: flex;
		flex-direction: column;

		:deep(.el-tabs__content) {
			flex: 1;
			min-height: 0;
		}

		:deep(.el-tab-pane) {
			height: 100%;
			display: flex;
			flex-direction: column;
			overflow: auto;
		}
	}

	&__tip {
		margin-top: 14px;
		padding: 10px 12px;
		border-radius: var(--sc-radius);
		background: var(--sc-warning-soft);
		font-size: 12px;
		line-height: 1.7;
		color: var(--sc-text-2);

		b {
			color: var(--sc-danger);
		}
	}
}

.dc-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 12px;
	padding: 6px 0 4px;
}

.dc-card {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 16px;
	border: 1px solid var(--sc-border);
	border-radius: var(--sc-radius-lg);
	transition: box-shadow 0.16s;

	&:hover {
		box-shadow: var(--sc-shadow-2);
	}

	&__head {
		display: flex;
		align-items: flex-start;
		gap: 10px;
	}

	&__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: var(--sc-primary-soft);
		color: var(--sc-primary);
		flex: 0 0 36px;

		&.is-export {
			background: var(--sc-success-soft, #e8ffea);
			color: var(--sc-success);
		}
	}

	&__title-box {
		flex: 1;
		min-width: 0;
	}

	&__title {
		font-size: 14px;
		font-weight: 600;
		color: var(--sc-text-1);
	}

	&__meta {
		margin-top: 2px;
		font-size: 11.5px;
		color: var(--sc-text-3);
	}

	&__fields {
		font-size: 12px;
		line-height: 1.9;
		color: var(--sc-text-3);
	}

	&__field {
		display: inline-block;
		margin-right: 6px;
		padding: 1px 7px;
		border-radius: 9px;
		background: var(--sc-bg-sunken);
		color: var(--sc-text-2);

		&.is-required {
			background: var(--sc-danger-soft);
			color: var(--sc-danger);
		}
	}

	&__actions {
		display: flex;
		gap: 8px;
		margin-top: auto;

		.el-button {
			margin-left: 0;
		}
	}
}

@media (max-width: 768px) {
	.dc-page__body {
		padding: 6px 10px 12px;
	}

	.dc-grid {
		grid-template-columns: 1fr;
	}
}
</style>
