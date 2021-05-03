import BaseAtom from './BaseAtom';

/**
 * A function that will update the value of an atom. It receives the atom's
 * current value as its argument and is expected to return the atom's next value
 * as the return value.
 * @typeparam T The type of the atom's value.
 */
export interface AtomUpdateFunction<T> {
	(arg: T): T;
}

/**
 * An atom updater is either a new value or a function that will generate the
 * next value for the atom.
 * @typeparam T The type of the atom's value.
 */
export type AtomUpdater<T> = T | AtomUpdateFunction<T>;

/**
 * Atom is the most basic unit of state. It contains a single value that can be
 * set or updated in many places and these changes can be subscribed to allowing
 * your application to be reactive. There are two ways to update an atoms value,
 * you can either set it or udpate it. Setting the atom's value will clear all
 * future updates and replace the value immediately, notifying subscribers. If
 * you opt to update the value instead then your update function (or value) will
 * be applied after all previous updates have been applied. This is useful if
 * each new state value builds on the previous state value and ensures that
 * each update is firing with the latest value as it's argument.
 *
 * ### Example
 *
 * ```typescript
 * const counter = atom(0);
 *
 * const countDisplay = document.querySelector('#count-display');
 * counter.subscribe(atom => {
 *   countDisplay.textContent = `Current count: ${atom.value}`;
 * });
 *
 * const incrementButton = document.querySelector('#increment-button');
 * incrementButton.addEventListener('click', () => counter.update(n => n + 1));
 * ```
 *
 * @typeparam T The type of the atom's value.
 */
export default class Atom<T> extends BaseAtom<T> {
	/**
	 * The updater queue used to keep track of the order and amount of requested
	 * updates to the atom's current value.
	 */
	#updaterQueue: AtomUpdateFunction<T>[];

	/**P
	 * The update timeout, this is tracked since setting an atom's value will
	 * clear future updates so must cancel the asynchronous update timer.
	 */
	#updateTimeout: ReturnType<typeof setTimeout> | undefined;

	/**
	 * Creates a new Atom with an initial value.
	 * @param value The intitial value of the atom.
	 */
	constructor(value: T) {
		super(value);
		this.#updaterQueue = [];
	}

	/**
	 * Queue and update for the atom's value. There is no guarantee that when this
	 * is called the value will be udpdated immediately, the update is queued and
	 * set up to be called in order with other updates. After each update the atom
	 * will notify subscribers the value has changed.
	 * @param updater The new value, or update function, that will be called when
	 *   this update's place in the queue is reached.
	 */
	update(updater: AtomUpdater<T>): void {
		let newUpdater: AtomUpdateFunction<T>;
		if (typeof updater !== 'function') {
			newUpdater = (_: T) => updater;
		} else {
			newUpdater = updater as AtomUpdateFunction<T>;
		}

		this.queueUpdate(newUpdater);
	}

	/**
	 * Set, much like update, will modify the value of the atom. The core difference
	 * between set and update though is that set is immediate and will clear any
	 * future updates. If you think of the counter example you would prefer to
	 * use update to add or subtract from the current value; but, you would want
	 * to use set in the case of resetting it's value back to 0 as it would be
	 * immediate and also cancel any pending updates. Set does still notify
	 * subscribers that the value has changed.
	 * @param value The new value of the atom that should be set immediately.
	 */
	set(value: T): void {
		this.clearUpdateQueue();
		this.setValue(value);
		this.notifySubscribers();
	}

	/**
	 * Clears the update queue, emptying it out as well as clearing an update
	 * timeout if once is currently pending execution.
	 */
	protected clearUpdateQueue(): void {
		if (this.#updateTimeout) {
			clearTimeout(this.#updateTimeout);
			this.#updateTimeout = undefined;
		}
		this.#updaterQueue = [];
	}

	/**
	 * This method is a helper for `update` and is responsible for actually
	 * putting the update function into the queue. It also determines if needs to
	 * initiate an update timer. The update timer is only active when there are
	 * pending updates so it's possible we need to kick off the update timer in
	 * cases where we're updating the value after a period of no updates.
	 * @param updater The update function that should be added to the pending
	 *   update queue.
	 */
	protected queueUpdate(updater: AtomUpdateFunction<T>): void {
		this.#updaterQueue.push(updater);

		if (!this.#updateTimeout) {
			this.#updateTimeout = setTimeout(this.runUpdate, 0);
		}
	}

	/**
	 * This method is a helper and is what is forward to setTimeout to handle
	 * dequeing the latest update and executing it. This method will also clear
	 * the update timer so that it's always unset when there is no timer running.
	 * Once the update is applied it will then reset the timeout if there are
	 * still updates remaining in the queue otherwise it ends without restarting
	 * a timer.
	 */
	protected runUpdate = (): void => {
		this.#updateTimeout = undefined;

		const updater = this.#updaterQueue.shift();
		if (typeof updater === 'function') {
			const newValue = updater(this.value);
			this.setValue(newValue);
			this.notifySubscribers();
		}

		if (this.#updaterQueue.length > 0) {
			this.#updateTimeout = setTimeout(this.runUpdate, 0);
		}
	};
}
