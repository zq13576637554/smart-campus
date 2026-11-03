export default [
	{
		name: "loginIndex",
		path: "/login/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "loginIndex",
			zhTitle: "登录",
			isOpen: true,
			hideMenu: true,
			hideTag: true
		}
	}
];
