export default [
	{
		name: "xtglIndex",
		path: "/xtgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "xtglIndex",
			zhTitle: "系统管理",
			group: "系统设置",
			icon: "system",
			sort: 60
		}
	}
];
