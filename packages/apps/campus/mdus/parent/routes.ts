export default [
	{
		name: "parentIndex",
		path: "/parent/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "parentIndex",
			zhTitle: "家长端",
			group: "校园生活",
			icon: "user",
			sort: 47,
			/** 独立移动端页面，不套管理后台外壳 */
			fullscreen: true,
			closeKeepAlive: true,
			hideMenu: true
		}
	}
];
