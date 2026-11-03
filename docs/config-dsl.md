# 配置 DSL 参考

本项目的表格列、查询条件、表单字段都可以用「配置」描述，而不是写模板。这一层对应
`rs.ict-saas` 中 `@fy/hook` 的 `useSimpleCols` / `useSimpleBars`，语法保持兼容。

实现位置：

- 解析引擎：`packages/libs/schema.ts`
- 列渲染器注册：`packages/hooks/tools/useCols.ts` → `packages/irepos/c/*`
- 查询栏注册：`packages/hooks/tools/useBars.ts` → `packages/irepos/f/*` + 基础组件
- 表单字段工厂：`packages/irepos/f/fields.ts`

---

## 一、表格列（useSimpleCols）

```
标题|字段|渲染器-参数1-参数2|表头参数1-表头参数2
```

- 第 3 段是「渲染器 + 参数」，参数用 `-` 连接，每个参数形如 `key:value[:类型]`；
- 第 4 段是透传给 `el-table-column` 的属性（`width` / `minWidth` / `fixed` / `align` / `sortable` …）；
- 参数值写 `true` / `false` 会转成布尔，`:n` 后缀转数字（如 `toFixed:2:n`）。

### 内置渲染器

| 渲染器 | 示例 | 说明 |
| --- | --- | --- |
| `text`（默认） | `"姓名|name"` | 文本，空值显示 `--` |
| `text` + format | `"入学日期|enrollDate|text-format:date-type:ymd-join:2"` | 见下方格式化参数 |
| `tag` | `"状态|status|tag|minWidth:100"` | 标签，配合 `setComProps` |
| `enum` | `"性别|gender|enum-type:GENDER"` | 字典文本，取字典颜色 |
| `link` | `"学号|studentNo|link"` | 可点击链接，触发 `on-tb-event-watch` 的 `link` 事件 |
| `progress` | `"入住率|rate|progress"` | 进度条（0-1 自动转百分比） |
| `tbDialog` | `"明细|count|tbDialog"` | 点击后由页面弹出明细表格 |
| `idx` | `"idx"` | 序号列（自动叠加分页偏移） |
| `select` | `"select"` | 多选列 |
| `actions` | `"actions|查看:view-编辑:edit-删除:delete"` | 操作列，超过 3 个折叠为「更多」 |

### text 的格式化参数

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| `format` | `date` / `number` / `array` / `object` / `datetimerange` | 格式化类型 |
| `type` | `ym` `md` `ymd` `ymdhm` `ymdhms` `hms` `hm` | 日期格式（配合 `format:date`） |
| `join` | `1` / `2` | 日期分隔符：`-` / `/` |
| `toFixed` | 数字 | 小数位（配合 `format:number`） |
| `key` | `a+b` | 取嵌套字段（配合 `format:array/object`） |

### 对象写法（需要自定义渲染时）

```ts
{
  col: "学生|name|text|minWidth:150-fixed:left",
  tdFn: (h, { data, col, emit }) => h("div", {}, data.row.name)
}
```

> `tdFn` 的签名是 `(h, ctx)`，`ctx = { data: { row, $index, column }, col, emit, tb, dictLabel, dictType }`。

### 字典标签

```ts
{ col: "学籍状态|status|tag", setComProps: { dictType: "STUDENT_STATUS" } }
```

`Tag` 渲染器会优先用 `dictType` 查字典文本与颜色；也可以完全自定义：

```ts
{ col: "状态|status|tag", setComProps: row => ({ type: "success", text: "在读" }) }
```

### 操作列

```ts
"actions|查看:view-编辑:edit-删除:delete"
// 带权限码： "查看:view:student:view"
// 带跳转路径： "查看:view:/student/detail/"
{ col: "actions|查看:view-编辑:edit", setComProps: { fixed: "right", minWidth: 150 } }
```

页面通过 `@on-tb-event-watch="onTbAction"` 接收 `{ key, data }`，`key` 即 `action`。

---

## 二、查询条件（useSimpleBars）

```
标题|字段|组件-参数
```

| 组件 | 示例 | 说明 |
| --- | --- | --- |
| `input` | `"姓名|name|input"` | 文本输入 |
| `select` | `"班级|classId|select"` | 下拉，需在 `config.props.options` 传选项 |
| `enum` | `"状态|status|enum-type:STUDENT_STATUS"` | 字典下拉 |
| `date` | `"日期|date|date-type:daterange-startKey:startDate-endKey:endDate"` | 日期区间 |
| `remoteSelect` | `"货号|code|remoteSelect"` | 远程搜索 |
| `treeSelect` | `"部门|deptId|treeSelect"` | 树选择 |

对象的写法可以传 `config`：

```ts
{
  bar: "学籍状态|status|enum-type:STUDENT_STATUS",
  config: { itemValue: "", props: { clearable: true } }
}
```

- `itemValue`：默认值；
- `props`：透传给组件的属性；
- 日期区间会自动拆成 `startKey` / `endKey` 两个查询参数（`NPageBasic` 中处理）。

---

## 三、表单字段（irepos/f）

字段工厂返回**可序列化**的对象，`Form` 组件按 `type` 渲染：

```ts
export interface FormItem {
  label?: string;
  prop: string;
  type?: string;
  colProps?: { span?: number };
  rules?: any[];
  yours?: Record<string, any>;   // 透传给控件
  options?: { label: string; value: any }[];
  dictType?: string;
  hidden?: boolean | ((form) => boolean);
  disabled?: boolean | ((form) => boolean);
  tips?: string;
  defaultValue?: any;
  slot?: string;
}
```

支持的类型：`input` `textarea` `number` `select` `enumSelect` `radios` `switch` `date`
`datetime` `daterange` `treeSelect` `remoteSelect` `cascader` `upload` `text` `title` `gap` `slot`。

```ts
Radios({
  label: "性别",
  prop: "gender",
  options: [{ label: "男", value: "M" }, { label: "女", value: "F" }],
  rules: [{ required: true, message: "请选择性别", trigger: "change" }]
})
```

详情模式（`enable-detail-mode`）下所有字段渲染为「标签 + 值」，可用 `detailFormat` 自定义展示。

---

## 四、扩展一个新渲染器

```ts
// packages/irepos/c/Rate.ts
export default function rate(config: Record<string, any> = {}) {
  return {
    label: "评分",
    prop: "__rate__",
    minWidth: 120,
    tdFn: (_h, ctx) => h("span", `${ctx.data.row[ctx.col.prop]} 分`),
    ...config
  };
}

// packages/hooks/tools/useCols.ts
colRegistry.init([... , { key: "rate", com: Rate }]);
```

之后即可写 `"评分|score|rate|minWidth:120"`。

---

## 五、扩展一个新查询组件

```ts
// packages/hooks/tools/useBars.ts
initBarComponent([{ key: "area", com: AreaCascader }]);
```

之后即可写 `"区域|areaId|area"`。
