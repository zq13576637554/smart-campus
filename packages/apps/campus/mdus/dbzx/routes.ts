export default [
	{
		name: "dbzxIndex",
		path: "/dbzx/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "dbzxIndex",
			zhTitle: "待办中心",
			group: "工作台",
			icon: "todo",
			sort: 2
		}
	}
];
