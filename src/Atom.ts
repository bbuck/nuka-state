import BaseAtom from './BaseAtom';

export interface AtomUpdateFunction<T> {
	(arg: T): T;
}

export type AtomUpdater<T> = T | AtomUpdateFunction<T>;

export default class Atom<T> extends BaseAtom<T> {
	#updaterQueue: AtomUpdateFunction<T>[];
	#updateTimeout: ReturnType<typeof setTimeout> | undefined;

	constructor(value: T) {
		super(value);
		this.#updaterQueue = [];
	}

	update(updater: AtomUpdater<T>) {
		let newUpdater: AtomUpdateFunction<T>;
		if (typeof updater !== 'function') {
			newUpdater = (_: T) => updater;
		} else {
			newUpdater = updater as AtomUpdateFunction<T>;
		}

		this.queueUpdate(newUpdater);
	}

	set(value: T) {
		this.clearUpdateQueue();
		this.setValue(value);
		this.notifySubscribers();
	}

	protected clearUpdateQueue() {
		if (this.#updateTimeout) {
			clearTimeout(this.#updateTimeout);
			this.#updateTimeout = undefined;
		}
		this.#updaterQueue = [];
	}

	protected queueUpdate(updater: AtomUpdateFunction<T>) {
		this.#updaterQueue.push(updater);

		if (!this.#updateTimeout) {
			this.#updateTimeout = setTimeout(this.runUpdate, 0);
		}
	}

	protected runUpdate = () => {
		this.#updateTimeout = undefined;

		const updater = this.#updaterQueue.shift();
		if (typeof updater === "function") {
			const newValue = updater(this.value);
			this.setValue(newValue);
		}

		if (this.#updaterQueue.length > 0) {
			this.#updateTimeout = setTimeout(this.runUpdate, 0);
		}
	}
}
