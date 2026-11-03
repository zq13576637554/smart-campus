export default [
	{
		name: "tzggIndex",
		path: "/tzgg/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "tzggIndex",
			zhTitle: "通知公告",
			group: "校园生活",
			icon: "notice",
			sort: 40
		}
	},
	{
		name: "tzggDetail",
		path: "/tzgg/detail/",
		component: () => import("./views/Detail/index.vue"),
		meta: {
			title: "tzggDetail",
			zhTitle: "公告详情",
			group: "校园生活",
			hideMenu: true,
			closeKeepAlive: true
		}
	}
];
