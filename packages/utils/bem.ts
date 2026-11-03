/**
 * BEM 命名工具
 * @example const b = useBem("campus-student"); b() => "campus-student"; b("name", { active: true }) => "campus-student__name campus-student__name--active"
 */
export function useBem(block: string) {
	return (el?: string, mods?: Record<string, any> | string) => {
		const base = el ? `${block}__${el}` : block;
		if (!mods) return base;
		if (typeof mods === "string") return `${base} ${base}--${mods}`;
		return Object.keys(mods)
			.filter(k => mods[k])
			.map(k => `${base}--${k}`)
			.concat(base)
			.join(" ");
	};
}

export default useBem;
