export default [
	{
		name: "rzglIndex",
		path: "/rzgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "rzglIndex",
			zhTitle: "操作日志",
			group: "系统设置",
			icon: "document",
			sort: 54
		}
	}
];
