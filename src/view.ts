import { ItemView } from "obsidian";
import type { WebviewTag } from "electron";

export const TAB_HOME = "space";
export const TAB_PAGE = "web-page";

export class MyWebView extends ItemView {
	readonly origin = "https://www.zhixi.com";

	getViewType(): string {
		return "my-webview";
	}
	getDisplayText(): string {
		return "";
	}
	protected webview(type: string): WebviewTag {
		this.containerEl.empty();
		const webview = this.contentEl.doc.createElement("webview");
		webview.setAttribute("allowfullscreen", "");
		webview.setAttribute("allowpopups", "");
		webview.addClass(type);

		this.containerEl.appendChild(webview);
		this.hookWindowOpen(webview);

		return webview;
	}
	protected hookWindowOpen(webview: WebviewTag) {
		webview.addEventListener("dom-ready", () => {
			void webview.executeJavaScript(`
				window.open = function (url) {
					if (url instanceof SVGAnimatedString) url = url.baseVal;
					console.debug(JSON.stringify({ type: "open", url }));
				};
				document.addEventListener("click", (e) => {
					const target = e.target || e.srcElement;
					const a = target.closest('a[target*="blank"]');
					if (a) {
						e.preventDefault();
						window.open(a.href);
					}
				});
			`);
			// webview.openDevTools();
		});
		webview.addEventListener("console-message", (e) => {
			if (e.level) return;
			let message: ConsoleMessage | undefined;
			try {
				message = JSON.parse(e.message) as ConsoleMessage;
			} catch {
				// ignore it!
			}
			if (message?.type === "open") {
				void this.openURL(message.url);
			}
		});
	}

	protected async openURL(url: string) {
		// console.log("openURL", url);
		const { origin, app } = this;
		let path = url;
		if (path.startsWith(origin)) {
			path = path.slice(origin.length);
		}
		if (/^https?:/.test(path)) {
			const { shell } = window.require("electron");
			return shell.openExternal(path);
		}
		const { pathname } = new URL(origin + path);
		const tabs = app.workspace.getLeavesOfType(TAB_PAGE);
		for (const tab of tabs) {
			const { state } = tab.getViewState();
			if (!state?.url) continue;
			const url = new URL(state.url as string);
			if (url.pathname === pathname) {
				app.workspace.setActiveLeaf(tab, { focus: true });
				return;
			}
		}
		void app.workspace.getLeaf(true).setViewState({
			type: TAB_PAGE,
			state: { url: origin + path },
			active: true,
		});
	}
}

type ConsoleMessage =
	| {
			type: "open";
			url: string;
	  }
	| {
			type: "invoke";
			data: unknown;
	  };
