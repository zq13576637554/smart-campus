<!-- 通用导入页：下载模板 → 上传解析 → 校验 → 导入 -->
<template>
	<div class="import-page">
		<NCard :title="title">
			<ElSteps :active="step" align-center class="import-page__steps">
				<ElStep title="下载模板" description="按模板格式填写数据" />
				<ElStep title="上传文件" description="支持 CSV，单次上限 5MB" />
				<ElStep title="校验导入" description="确认无误后写入系统" />
			</ElSteps>

			<!-- 上传区 -->
			<div v-if="!rows.length" class="import-page__upload">
				<div class="import-page__template">
					<div class="import-page__template-title">1. 下载导入模板</div>
					<div class="import-page__template-desc">模板包含 {{ columns.length }} 列，标 * 为必填项</div>
					<div class="import-page__template-cols">
						<NTag v-for="col in columns" :key="col.prop" :type="col.required ? 'primary' : 'info'" fill>
							{{ col.label }}{{ col.required ? " *" : "" }}
						</NTag>
					</div>
					<ElButton type="primary" plain @click="downloadTemplate">下载 CSV 模板</ElButton>
				</div>

				<ElDivider direction="vertical" class="import-page__divider" />

				<div class="import-page__drop">
					<div class="import-page__template-title">2. 上传文件</div>
					<ElUpload
						drag
						action="#"
						:auto-upload="false"
						:show-file-list="false"
						accept=".csv,text/csv"
						:on-change="onFileChange"
					>
						<div class="import-page__drop-inner">
							<NIcon name="files" :size="30" />
							<p>将 CSV 文件拖到此处，或 <em>点击上传</em></p>
							<p class="import-page__drop-tip">仅支持 CSV（Excel 可另存为 CSV），首行为表头</p>
						</div>
					</ElUpload>
				</div>
			</div>

			<!-- 预览 -->
			<template v-else>
				<div class="import-page__summary">
					<div class="import-page__summary-item">
						<span>解析记录</span><strong>{{ rows.length }}</strong>
					</div>
					<div class="import-page__summary-item is-success">
						<span>校验通过</span><strong>{{ rows.length - errorCount }}</strong>
					</div>
					<div class="import-page__summary-item is-danger">
						<span>校验失败</span><strong>{{ errorCount }}</strong>
					</div>
					<div class="import-page__summary-actions">
						<ElButton @click="reset">重新上传</ElButton>
						<ElButton type="primary" :disabled="validRows.length === 0" :loading="submitting" @click="submit">
							导入有效数据（{{ validRows.length }}）
						</ElButton>
					</div>
				</div>

				<ElTable :data="previewRows" height="360" border class="import-page__table">
					<ElTableColumn type="index" label="#" width="60" />
					<ElTableColumn
						v-for="col in columns"
						:key="col.prop"
						:label="col.label"
						:min-width="col.width || 120"
					>
						<template #default="{ row }">
							<span :class="{ 'is-error': row.__errors?.length }">{{ row[col.prop] || "--" }}</span>
						</template>
					</ElTableColumn>
					<ElTableColumn label="校验结果" min-width="220">
						<template #default="{ row }">
							<NTag v-if="!row.__errors?.length" type="success" fill>通过</NTag>
							<div v-else class="import-page__errors">
								<NTag v-for="err in row.__errors" :key="err" type="danger" fill>{{ err }}</NTag>
							</div>
						</template>
					</ElTableColumn>
				</ElTable>

				<div v-if="result" class="import-page__result" :class="{ 'is-error': result.failed?.length }">
					<div class="import-page__result-title">
						导入完成：成功 {{ result.success }} 条，失败 {{ result.failed?.length || 0 }} 条
					</div>
					<div v-for="f in result.failed" :key="f.row" class="import-page__result-item">
						第 {{ f.row }} 行：{{ f.message }}
					</div>
					<div class="import-page__result-actions">
						<ElButton type="primary" @click="$emit('done')">完成</ElButton>
					</div>
				</div>
			</template>
		</NCard>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElDivider, ElMessage, ElStep, ElSteps, ElTable, ElTableColumn, ElUpload } from "lmLibs/element-plus";
import NCard from "lmCmpsBasic/NCard";
import NTag from "lmCmpsBasic/NTag";
import NIcon from "lmCmpsBasic/NIcon";
import { downloadText } from "lmUtils/download";

export interface ImportColumn {
	label: string;
	prop: string;
	required?: boolean;
	width?: number;
	tips?: string;
	/** 单元格校验，返回错误信息 */
	validator?: (value: string, row: Record<string, any>) => string | undefined;
}

const props = withDefaults(
	defineProps<{
		title?: string;
		/** 模板列定义 */
		columns?: ImportColumn[];
		/** 提交接口，返回成功/失败统计 */
		submitApi?: (rows: Record<string, any>[]) => Promise<{ success: number; failed: { row: number; message: string }[] }>;
		/** 模板文件名 */
		templateName?: string;
	}>(),
	{ title: "批量导入", columns: () => [], submitApi: undefined, templateName: "导入模板" }
);

const emit = defineEmits<{ (e: "done"): void }>();

const rows = ref<Record<string, any>[]>([]);
const submitting = ref(false);
const step = ref(0);
const result = ref<{ success: number; failed: { row: number; message: string }[] } | null>(null);

const previewRows = computed(() => rows.value.slice(0, 200));
const errorCount = computed(() => rows.value.filter(r => r.__errors?.length).length);
/** 只提交校验通过的行 */
const validRows = computed(() => rows.value.filter(r => !r.__errors?.length));

/** 下载模板 */
const downloadTemplate = () => {
	const header = props.columns.map(c => c.label).join(",");
	const example = props.columns
		.map(c => {
			const tips = c.tips || "";
			if (/日期|时间/.test(c.label)) return "2026-09-01";
			if (/手机|电话/.test(c.label)) return "13800000000";
			if (/性别/.test(c.label)) return "男";
			if (/状态/.test(c.label)) return "";
			return tips || `示例${c.label}`;
		})
		.join(",");
	downloadText(`${header}\n${example}\n`, `${props.templateName}.csv`);
};

/** 简易 CSV 解析（支持引号、逗号、换行） */
const parseCsv = (text: string): string[][] => {
	const clean = text.replace(/^\ufeff/, "");
	const cells: string[][] = [];
	let row: string[] = [];
	let cur = "";
	let quoted = false;

	for (let i = 0; i < clean.length; i++) {
		const ch = clean[i];
		if (quoted) {
			if (ch === '"' && clean[i + 1] === '"') {
				cur += '"';
				i++;
			} else if (ch === '"') {
				quoted = false;
			} else {
				cur += ch;
			}
			continue;
		}
		if (ch === '"') quoted = true;
		else if (ch === ",") {
			row.push(cur.trim());
			cur = "";
		} else if (ch === "\n") {
			row.push(cur.trim());
			cells.push(row);
			row = [];
			cur = "";
		} else if (ch !== "\r") {
			cur += ch;
		}
	}
	if (cur || row.length) {
		row.push(cur.trim());
		cells.push(row);
	}
	return cells.filter(r => r.some(c => c !== ""));
};

const onFileChange = async (file: any) => {
	const raw: File = file.raw;
	if (!raw) return;
	if (raw.size > 5 * 1024 * 1024) {
		ElMessage.error("文件超过 5MB 限制");
		return;
	}
	const text = await raw.text();
	const cells = parseCsv(text);
	if (cells.length < 2) {
		ElMessage.error("文件为空或缺少数据行");
		return;
	}

	const header = cells[0];
	const indexMap = props.columns.map(c => header.findIndex(h => h.replace(/\s|\*/g, "") === c.label));

	rows.value = cells.slice(1).map(cellRow => {
		const record: Record<string, any> = { __errors: [] };
		props.columns.forEach((col, i) => {
			const value = indexMap[i] > -1 ? cellRow[indexMap[i]] || "" : "";
			record[col.prop] = value;
		});
		// 校验
		props.columns.forEach(col => {
			if (col.required && !record[col.prop]) record.__errors.push(`${col.label}不能为空`);
			if (col.validator) {
				const err = col.validator(record[col.prop], record);
				if (err) record.__errors.push(err);
			}
		});
		return record;
	});

	step.value = 2;
	ElMessage.success(`已解析 ${rows.value.length} 条记录`);
};

const submit = async () => {
	if (!props.submitApi) return;
	submitting.value = true;
	try {
		const payload = validRows.value.map(r => {
			const { __errors, ...rest } = r;
			return rest;
		});
		result.value = await props.submitApi(payload);
		step.value = 3;
		if (!result.value.failed?.length) ElMessage.success("全部导入成功");
		else ElMessage.warning(`成功 ${result.value.success} 条，失败 ${result.value.failed.length} 条`);
	} catch (e: any) {
		ElMessage.error(e?.message || "导入失败");
	} finally {
		submitting.value = false;
	}
};

const reset = () => {
	rows.value = [];
	result.value = null;
	step.value = 0;
};
</script>

<style lang="less">
.import-page {
	height: 100%;
	overflow: auto;

	&__steps {
		margin-bottom: 24px;
	}

	&__upload {
		display: flex;
		gap: 24px;
		align-items: stretch;
	}

	&__template {
		flex: 1;
		padding: 20px;
		border: 1px dashed var(--sc-border-strong);
		border-radius: var(--sc-radius);
		background: var(--sc-bg);

		&-title {
			font-size: 14px;
			font-weight: 600;
			color: var(--sc-text-1);
			margin-bottom: 6px;
		}

		&-desc {
			font-size: 12.5px;
			color: var(--sc-text-3);
			margin-bottom: 12px;
		}

		&-cols {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-bottom: 16px;
		}
	}

	&__divider {
		height: auto;
	}

	&__drop {
		flex: 1;

		.el-upload,
		.el-upload-dragger {
			width: 100%;
		}
	}

	&__drop-inner {
		padding: 10px 0;
		color: var(--sc-text-3);

		p {
			margin: 6px 0 0;
			font-size: 13px;
		}

		em {
			color: var(--sc-primary);
			font-style: normal;
		}
	}

	&__drop-tip {
		font-size: 11.5px !important;
		color: var(--sc-text-4);
	}

	&__summary {
		display: flex;
		align-items: center;
		gap: 28px;
		padding: 12px 16px;
		margin-bottom: 12px;
		border-radius: var(--sc-radius);
		background: var(--sc-bg);

		&-item {
			display: flex;
			flex-direction: column;

			span {
				font-size: 12px;
				color: var(--sc-text-3);
			}

			strong {
				font-size: 18px;
				color: var(--sc-text-1);
			}

			&.is-success strong {
				color: var(--sc-success);
			}

			&.is-danger strong {
				color: var(--sc-danger);
			}
		}

		&-actions {
			margin-left: auto;
			display: flex;
			gap: 8px;
		}
	}

	&__table {
		.is-error {
			color: var(--sc-danger);
		}
	}

	&__errors {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	&__result {
		margin-top: 14px;
		padding: 12px 16px;
		border-radius: var(--sc-radius);
		background: #f6ffed;
		border: 1px solid #b7eb8f;

		&.is-error {
			background: var(--sc-danger-soft);
			border-color: #ffccc7;
		}

		&-title {
			font-size: 13.5px;
			font-weight: 600;
			color: var(--sc-text-1);
		}

		&-item {
			margin-top: 4px;
			font-size: 12.5px;
			color: var(--sc-danger);
		}

		&-actions {
			margin-top: 10px;
			text-align: right;
		}
	}
}

@media (max-width: 1100px) {
	.import-page__upload {
		flex-direction: column;
	}

	.import-page__divider {
		display: none;
	}
}
</style>
