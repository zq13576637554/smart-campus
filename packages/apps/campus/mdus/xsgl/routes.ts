export default [
	{
		name: "xsglIndex",
		path: "/xsgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "xsglIndex",
			zhTitle: "学生档案",
			group: "学籍管理",
			icon: "student",
			sort: 10
		}
	},
	{
		name: "xsglForm",
		path: "/xsgl/form/",
		component: () => import("./views/Form/index.vue"),
		meta: {
			title: "xsglForm",
			zhTitle: "编辑学生",
			group: "学籍管理",
			hideMenu: true,
			closeKeepAlive: true
		}
	},
	{
		name: "xsglDetail",
		path: "/xsgl/detail/",
		component: () => import("./views/Detail/index.vue"),
		meta: {
			title: "xsglDetail",
			zhTitle: "学生详情",
			group: "学籍管理",
			hideMenu: true,
			closeKeepAlive: true
		}
	},
	{
		name: "xsglImport",
		path: "/xsgl/import/",
		component: () => import("./views/Import/index.vue"),
		meta: {
			title: "xsglImport",
			zhTitle: "批量导入",
			group: "学籍管理",
			hideMenu: true,
			closeKeepAlive: true
		}
	}
];
