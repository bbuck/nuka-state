import * as Nuka from './index';

declare global {
	interface Window {
		Nuka: typeof Nuka;
	}
}

if (window) {
	window.Nuka = Nuka;
}
