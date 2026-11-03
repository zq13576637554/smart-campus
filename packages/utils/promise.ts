/**
 * wrapper promise operation
 *  : simulated go and python `fn` grammars
 *
 * @param {Promise} p promise object
 * @returns {array} an array object
 * 	the `0` index value is error object,the other `1` index value is data from `then`
 *
 * @example const [err, res] = await sync(apiCall(params))
 */
export function sync<T>(p: Promise<T>) {
	return p.then((d: T) => [null, d] as [null, T]).catch((e: Error) => [e] as [Error]);
}

/** 延时 */
export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/** 并发限流 */
export function limitConcurrency<T>(tasks: (() => Promise<T>)[], limit = 5): Promise<T[]> {
	const results: T[] = [];
	let running = 0;
	let index = 0;
	return new Promise((resolve, reject) => {
		const next = () => {
			if (index >= tasks.length && running === 0) return resolve(results);
			while (running < limit && index < tasks.length) {
				const cur = index++;
				running++;
				tasks[cur]()
					.then(res => {
						results[cur] = res;
					})
					.catch(reject)
					.finally(() => {
						running--;
						next();
					});
			}
		};
		next();
	});
}
