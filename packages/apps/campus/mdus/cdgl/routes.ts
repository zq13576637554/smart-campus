export default [
	{
		name: "cdglIndex",
		path: "/cdgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "cdglIndex",
			zhTitle: "菜单权限",
			group: "系统设置",
			icon: "menu",
			sort: 51
		}
	}
];
