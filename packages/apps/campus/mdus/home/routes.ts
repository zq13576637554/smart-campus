export default [
	{
		name: "homeIndex",
		path: "/home/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "homeIndex",
			zhTitle: "首页",
			group: "工作台",
			icon: "home",
			sort: 1
		}
	}
];
