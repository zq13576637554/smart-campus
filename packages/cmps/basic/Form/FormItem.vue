<!-- 单个表单项：按 type 渲染具体组件 -->
<template>
	<ElCol v-if="!isHidden" v-bind="colProps">
		<!-- 分组标题 -->
		<div v-if="item.type === 'title'" class="form-item__title">
			<span>{{ item.label }}</span>
			<slot name="title-extra"></slot>
		</div>

		<!-- 占位 -->
		<div v-else-if="item.type === 'gap'" class="form-item__gap"></div>

		<!-- 自定义插槽 -->
		<template v-else-if="item.type === 'slot'">
			<slot :name="item.slot || item.prop" :form="form" :item="item"></slot>
		</template>

		<!-- 详情只读 -->
		<div v-else-if="enableDetailMode" class="form-item__detail" :class="item.formClass">
			<span class="form-item__detail-label">{{ item.label }}</span>
			<span class="form-item__detail-value">{{ detailValue }}</span>
		</div>

		<!-- 表单控件 -->
		<ElFormItem
			v-else
			:label="item.label"
			:prop="item.prop"
			:rules="item.rules"
			:class="item.formClass"
			:label-width="labelWidth"
		>
			<template v-if="item.tips" #label>
				<span class="form-item__label">
					{{ item.label }}
					<ElTooltip :content="item.tips" placement="top">
						<ElIcon class="form-item__tips"><QuestionFilled /></ElIcon>
					</ElTooltip>
				</span>
			</template>

			<!-- 文本 -->
			<ElInput
				v-if="item.type === 'input' || !item.type"
				:model-value="value"
				:disabled="isDisabled"
				:placeholder="placeholder"
				clearable
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 多行文本 -->
			<ElInput
				v-else-if="item.type === 'textarea'"
				:model-value="value"
				type="textarea"
				:rows="3"
				:disabled="isDisabled"
				:placeholder="placeholder"
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 数字 -->
			<ElInputNumber
				v-else-if="item.type === 'number'"
				:model-value="value"
				:disabled="isDisabled"
				controls-position="right"
				style="width: 100%"
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 下拉 -->
			<ElSelect
				v-else-if="item.type === 'select'"
				:model-value="value"
				:disabled="isDisabled"
				:placeholder="placeholder"
				clearable
				filterable
				style="width: 100%"
				v-bind="item.yours"
				@update:model-value="setValue"
			>
				<ElOption v-for="opt in selectOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
			</ElSelect>

			<!-- 字典下拉 -->
			<EnumSelect
				v-else-if="item.type === 'enumSelect'"
				:model-value="value"
				:dict-type="item.dictType || item.yours?.dictType"
				:disabled="isDisabled"
				:placeholder="placeholder"
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 单选 -->
			<ElRadioGroup v-else-if="item.type === 'radios'" :model-value="value" :disabled="isDisabled" v-bind="item.yours" @update:model-value="setValue">
				<ElRadio v-for="opt in selectOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</ElRadio>
			</ElRadioGroup>

			<!-- 开关 -->
			<ElSwitch v-else-if="item.type === 'switch'" :model-value="value" :disabled="isDisabled" v-bind="item.yours" @update:model-value="setValue" />

			<!-- 日期 -->
			<ElDatePicker
				v-else-if="item.type === 'date'"
				:model-value="value"
				type="date"
				value-format="YYYY-MM-DD"
				:disabled="isDisabled"
				:placeholder="placeholder"
				style="width: 100%"
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 日期时间 -->
			<ElDatePicker
				v-else-if="item.type === 'datetime'"
				:model-value="value"
				type="datetime"
				value-format="YYYY-MM-DD HH:mm:ss"
				:disabled="isDisabled"
				:placeholder="placeholder"
				style="width: 100%"
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 日期区间 -->
			<ElDatePicker
				v-else-if="item.type === 'daterange'"
				:model-value="value"
				type="daterange"
				value-format="YYYY-MM-DD"
				start-placeholder="开始日期"
				end-placeholder="结束日期"
				:disabled="isDisabled"
				style="width: 100%"
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 树选择 -->
			<ElTreeSelect
				v-else-if="item.type === 'treeSelect'"
				:model-value="value"
				:data="item.yours?.data || []"
				:disabled="isDisabled"
				:placeholder="placeholder"
				check-strictly
				style="width: 100%"
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 远程搜索 -->
			<RemoteSelect
				v-else-if="item.type === 'remoteSelect'"
				:model-value="value"
				:disabled="isDisabled"
				:placeholder="placeholder"
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 级联 -->
			<ElCascader
				v-else-if="item.type === 'cascader'"
				:model-value="value"
				:options="item.options || []"
				:disabled="isDisabled"
				style="width: 100%"
				v-bind="item.yours"
				@update:model-value="setValue"
			/>

			<!-- 上传（演示环境仅记录文件名） -->
			<ElUpload
				v-else-if="item.type === 'upload'"
				:file-list="fileList"
				action="#"
				:auto-upload="false"
				:limit="item.yours?.limit || 5"
				:on-change="onFileChange"
				:on-remove="onFileRemove"
				v-bind="item.yours"
			>
				<ElButton type="primary" plain>选择文件</ElButton>
				<template #tip>
					<div class="el-upload__tip">{{ item.yours?.tips || "支持图片、文档，最多 5 个" }}</div>
				</template>
			</ElUpload>

			<!-- 只读文本 -->
			<div v-else-if="item.type === 'text'" class="form-item__text">{{ value || "--" }}</div>

			<div v-if="item.tips && item.type !== 'upload'" class="form-item__tip-text">{{ item.tips }}</div>
		</ElFormItem>
	</ElCol>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { QuestionFilled } from "@element-plus/icons-vue";
import {
	ElButton,
	ElCascader,
	ElCol,
	ElDatePicker,
	ElFormItem,
	ElIcon,
	ElInput,
	ElInputNumber,
	ElOption,
	ElRadio,
	ElRadioGroup,
	ElSelect,
	ElSwitch,
	ElTooltip,
	ElTreeSelect,
	ElUpload
} from "lmLibs/element-plus";
import EnumSelect from "lmCmpsBasic/EnumSelect";
import RemoteSelect from "lmCmpsBasic/RemoteSelect";
import type { FormItem } from "./types";

const props = defineProps<{
	item: FormItem;
	form: Record<string, any>;
	disabled?: boolean;
	enableDetailMode?: boolean;
	labelWidth?: string;
}>();

const emit = defineEmits<{ (e: "change", payload: { prop: string; value: any }): void }>();

const colProps = computed(() => ({ span: 12, ...(props.item.colProps || {}) }));
const value = computed(() => props.form?.[props.item.prop]);
const placeholder = computed(() => props.item.yours?.placeholder || `请输入${props.item.label || ""}`);

const isHidden = computed(() => {
	const { hidden } = props.item;
	return typeof hidden === "function" ? hidden(props.form) : !!hidden;
});

const isDisabled = computed(() => {
	const { disabled } = props.item;
	return typeof disabled === "function" ? disabled(props.form) : !!disabled || !!props.disabled;
});

const selectOptions = computed(() => props.item.options || props.item.yours?.options || []);

const detailValue = computed(() => {
	const v = props.form?.[props.item.prop];
	if (props.item.detailFormat) return props.item.detailFormat(v, props.form);
	if (v === undefined || v === null || v === "") return "--";
	if (Array.isArray(v)) return v.join("、");
	if (typeof v === "boolean") return v ? "是" : "否";
	return v;
});

const setValue = (val: any) => emit("change", { prop: props.item.prop, value: val });

/** 上传：演示环境仅记录文件名 */
const fileList = computed(() => (props.form?.[props.item.prop] || []).map((f: any, i: number) => ({ name: f.name || f, url: f.url, uid: i })));
const onFileChange = (file: any, files: any[]) => {
	emit(
		"change",
		{ prop: props.item.prop, value: files.map(f => ({ name: f.name, url: f.url || "" })) }
	);
};
const onFileRemove = (_file: any, files: any[]) => {
	emit("change", { prop: props.item.prop, value: files.map(f => ({ name: f.name, url: f.url || "" })) });
};
</script>

<style lang="less">
.form-item {
	&__title {
		display: flex;
		align-items: center;
		margin: 4px 0 16px;
		font-size: 15px;
		font-weight: 600;
		color: #1d2129;

		&::before {
			content: "";
			width: 4px;
			height: 14px;
			margin-right: 8px;
			background: #165dff;
			border-radius: 2px;
		}
	}

	&__gap {
		height: 8px;
	}

	&__label {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}

	&__tips {
		font-size: 12px;
		color: #c9cdd4;
		cursor: help;
	}

	&__tip-text {
		margin-top: 4px;
		font-size: 12px;
		color: #86909c;
	}

	&__text {
		color: #1d2129;
		word-break: break-all;
	}

	&__detail {
		display: flex;
		align-items: flex-start;
		min-height: 40px;
		padding: 8px 0;
		border-bottom: 1px dashed #f2f3f5;

		&-label {
			flex: 0 0 110px;
			color: #86909c;
		}

		&-value {
			flex: 1;
			color: #1d2129;
			word-break: break-all;
		}
	}
}
</style>
