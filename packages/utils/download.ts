/** 触发浏览器下载 */
export function downloadFile(blob: Blob, fileName: string) {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.style.display = "none";
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}

/** 按 URL 下载 */
export function downloadByUrl(url: string, fileName: string) {
	const link = document.createElement("a");
	link.style.display = "none";
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/** 文本导出为文件 */
export function downloadText(text: string, fileName: string, type = "text/plain;charset=utf-8") {
	downloadFile(new Blob(["\ufeff" + text], { type }), fileName);
}

/** 对象数组导出为 CSV */
export function exportCsv(rows: Record<string, any>[], headers: { label: string; prop: string }[], fileName: string) {
	const head = headers.map(h => h.label).join(",");
	const body = rows
		.map(row => headers.map(h => `"${String(row[h.prop] ?? "").replace(/"/g, '""')}"`).join(","))
		.join("\n");
	downloadText(`${head}\n${body}`, fileName.endsWith(".csv") ? fileName : `${fileName}.csv`);
}
