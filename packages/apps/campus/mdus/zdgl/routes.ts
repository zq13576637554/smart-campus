export default [
	{
		name: "zdglIndex",
		path: "/zdgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "zdglIndex",
			zhTitle: "数据字典",
			group: "系统设置",
			icon: "files",
			sort: 52
		}
	}
];
