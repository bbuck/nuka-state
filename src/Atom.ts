import BaseAtom from './BaseAtom';

/**
 * A function that will update the value of an atom. It receives the atom's
 * current value as its argument and is expected to return the atom's next value
 * as the return value.
 * @typearg T The type of the atom's value.
 */
export interface AtomUpdateFunction<T> {
	(arg: T): T;
}

/**
 * An atom updater is either a new value or a function that will generate the
 * next value for the atom.
 * @typearg T The type of the atom's value.
 */
export type AtomUpdater<T> = T | AtomUpdateFunction<T>;

export default class Atom<T> extends BaseAtom<T> {
	#updaterQueue: AtomUpdateFunction<T>[];
	#updateTimeout: ReturnType<typeof setTimeout> | undefined;

	constructor(value: T) {
		super(value);
		this.#updaterQueue = [];
	}

	update(updater: AtomUpdater<T>): void {
		let newUpdater: AtomUpdateFunction<T>;
		if (typeof updater !== 'function') {
			newUpdater = (_: T) => updater;
		} else {
			newUpdater = updater as AtomUpdateFunction<T>;
		}

		this.queueUpdate(newUpdater);
	}

	set(value: T): void {
		this.clearUpdateQueue();
		this.setValue(value);
		this.notifySubscribers();
	}

	protected clearUpdateQueue(): void {
		if (this.#updateTimeout) {
			clearTimeout(this.#updateTimeout);
			this.#updateTimeout = undefined;
		}
		this.#updaterQueue = [];
	}

	protected queueUpdate(updater: AtomUpdateFunction<T>): void {
		this.#updaterQueue.push(updater);

		if (!this.#updateTimeout) {
			this.#updateTimeout = setTimeout(this.runUpdate, 0);
		}
	}

	protected runUpdate = (): void => {
		this.#updateTimeout = undefined;

		const updater = this.#updaterQueue.shift();
		if (typeof updater === 'function') {
			const newValue = updater(this.value);
			this.setValue(newValue);
		}

		if (this.#updaterQueue.length > 0) {
			this.#updateTimeout = setTimeout(this.runUpdate, 0);
		}
	};
}
