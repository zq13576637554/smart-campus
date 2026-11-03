export default [
	{
		name: "msgIndex",
		path: "/msg/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "msgIndex",
			zhTitle: "消息中心",
			group: "系统设置",
			icon: "notice",
			sort: 53
		}
	}
];
