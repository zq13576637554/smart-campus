import { defineStore } from "pinia";
import type { RouteLocationNormalized } from "vue-router";

export interface TagView {
	path: string;
	fullPath: string;
	name: string;
	title: string;
	query?: Record<string, any>;
	affix?: boolean;
}

const HOME: TagView = { path: "/home/", fullPath: "/home/", name: "homeIndex", title: "首页", affix: true };

export const useTagsStore = defineStore({
	id: "tags",
	state: () => ({
		visitedViews: [HOME] as TagView[],
		cachedViews: ["homeIndex"] as string[]
	}),
	getters: {
		getVisitedViews: state => state.visitedViews,
		getCachedViews: state => state.cachedViews
	},
	actions: {
		addView(route: RouteLocationNormalized) {
			const meta = (route.meta || {}) as any;
			if (meta.hideTag) return;
			const title = meta.zhTitle || meta.title || String(route.name || "");
			if (!route.name || !title) return;

			const exist = this.visitedViews.find(v => v.fullPath === route.fullPath);
			if (!exist) {
				this.visitedViews.push({
					path: route.path,
					fullPath: route.fullPath,
					name: String(route.name),
					title,
					query: route.query,
					affix: !!meta.affix
				});
			} else {
				exist.title = title;
			}

			if (!meta.closeKeepAlive && !this.cachedViews.includes(String(route.name))) {
				this.cachedViews.push(String(route.name));
			}
		},
		delView(fullPath: string) {
			const view = this.visitedViews.find(v => v.fullPath === fullPath);
			this.visitedViews = this.visitedViews.filter(v => v.fullPath !== fullPath || v.affix);
			if (view) this.cachedViews = this.cachedViews.filter(n => n !== view.name);
			return view;
		},
		delOthers(fullPath: string) {
			this.visitedViews = this.visitedViews.filter(v => v.affix || v.fullPath === fullPath);
			this.cachedViews = this.visitedViews.map(v => v.name);
		},
		delAll() {
			this.visitedViews = this.visitedViews.filter(v => v.affix);
			this.cachedViews = this.visitedViews.map(v => v.name);
		},
		reset() {
			this.visitedViews = [HOME];
			this.cachedViews = ["homeIndex"];
		}
	}
});
