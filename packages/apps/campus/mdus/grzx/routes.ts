export default [
	{
		name: "grzxIndex",
		path: "/grzx/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "grzxIndex",
			zhTitle: "个人中心",
			group: "系统设置",
			hideMenu: true,
			icon: "user",
			sort: 90
		}
	}
];
