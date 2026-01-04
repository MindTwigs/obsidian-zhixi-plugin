import { addIcon, App, Plugin, ViewStateResult } from "obsidian";
import { MyWebView, TAB_HOME, TAB_PAGE } from "view";

function goHome(app: App) {
	const workspace = app.workspace;
	const tabs = workspace.getLeavesOfType(TAB_HOME);
	for (const tab of tabs) {
		workspace.setActiveLeaf(tab, { focus: true });
		return;
	}
	const tab = workspace.getLeaf(true);
	void tab.setViewState({
		type: TAB_HOME,
		active: true,
	});
}

export default class ZhixiPlugin extends Plugin {
	onload() {
		addIcon(
			"iconZhixi",
			`<path fill="currentColor"
				d="M18.76 25.04C19.12 25.34 19.04 25.78 18.95 26.04L18.88 26.22C15.9 32.14 14.79 37.26 15.53 41.6C16.61 41.59 17.71 41.5 18.84 41.34C25.08 48.81 35.53 55.26 48.64 59.77C51.8 54.56 53.7 48.38 54.32 41.22L54.46 39.43L54.52 38.95C54.61 38.38 54.79 37.82 55.24 37.71C55.81 37.57 56.29 38.16 56.63 38.72L56.83 39.08L56.91 39.24C59.83 44.58 60.97 52.53 60.34 63.09C62.31 63.54 64.32 63.95 66.37 64.32C69.7 57.35 70.46 47.42 67.49 33.82L67.18 32.43L67.05 31.91L66.94 31.39C66.84 30.79 66.83 30.27 67.14 30.07C67.68 29.68 68.97 30.6 69.85 31.62C73.93 36.63 76.46 41.08 78.73 46.7L79.18 47.84C81.59 53.75 82.74 59.54 82.64 65.22L82.6 66.28L82.56 67.02L82.51 67.84L82.4 69.2L82.3 70.2L82.14 71.54L81.93 72.97L81.72 74.18C81.68 74.38 81.64 74.59 81.6 74.8L81.34 76.07C79.64 83.81 75.67 93.68 66.23 100C51.73 109.3 36.58 110.78 20.78 104.47L17.9 109.5C5.53 104.48 -3.43 94.65 -9.01 80.01C-13.45 63.28 -11.84 49.53 -4.2 38.67L-3.73 38.03L-3.15 37.29L-2.47 36.46L-1.69 35.53L-0.8 34.51C-0.64 34.33 -0.48 34.15 -0.32 33.96C0.99 35.36 2.48 36.53 4.06 37.47L4.93 35.97L5.33 35.31L5.78 34.6L6.28 33.84C8.23 30.98 11.42 27.31 17.13 23.95L17.39 23.83C17.7 23.7 18.16 23.57 18.48 23.88L18.76 25.04ZM34.86 70.53C32.29 71.36 30.89 74.13 31.73 76.71C32.57 79.29 35.33 80.71 37.91 79.88C40.49 79.05 41.89 76.28 41.05 73.7C40.21 71.12 37.45 69.7 34.86 70.53Z"
				transform="translate(50, 50) scale(0.85) translate(-37.5, -60)"
			></path>`,
		);
		this.addRibbonIcon("iconZhixi", "知犀", () => {
			goHome(this.app);
		});
		this.registerView(TAB_HOME, (leaf) => new HomeView(leaf));
		this.registerView(TAB_PAGE, (leaf) => new PageView(leaf));
	}

	onunload() {
		console.warn("unloading ZhixiPlugin");
		// this.app.workspace.detachLeavesOfType(TAB_PAGE);
		// this.app.workspace.detachLeavesOfType(TAB_HOME);
	}
}

class HomeView extends MyWebView {
	getViewType(): string {
		return TAB_HOME;
	}
	getDisplayText(): string {
		return "知犀思维导图";
	}
	onOpen(): Promise<void> {
		const page = this.webview(TAB_HOME);
		page.src = this.origin + "/space?page=owner#app=obsidian";

		return Promise.resolve();
	}
}
class PageView extends MyWebView {
	url?: string;
	title = "知犀";

	getViewType(): string {
		return TAB_PAGE;
	}
	getDisplayText(): string {
		return this.title;
	}
	getState(): Record<string, unknown> {
		const state = super.getState();
		state.url = this.url;
		return state;
	}
	async setState(state: { url?: string }, result: ViewStateResult) {
		if (!state.url) return;
		const reHome = new RegExp(`^${this.origin}(/desktop)?/space`);
		const page = this.webview(TAB_PAGE);

		page.addEventListener("page-title-updated", (e: { title: string }) => {
			this.title = e.title;
			if ("titleEl" in this) {
				const { titleEl } = this as unknown as {
					titleEl: { setText(t: string): void };
				};
				const leaf = this.leaf as unknown as { updateHeader(): void };
				titleEl.setText(this.title);
				leaf.updateHeader();
			}
		});
		page.addEventListener("will-navigate", (e: { url: string }) => {
			if (reHome.test(e.url)) {
				page.stop(); // 返回文件列表
				this.leaf.detach();
				return goHome(this.app);
			}
			this.url = e.url;
		});
		page.src = this.url = state.url;

		return super.setState(state, result);
	}
}
