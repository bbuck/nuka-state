/**
 * AtomSubscriber is any function that is callable, the one and only argument
 * will be the atom instance subscribed to. Subscribers should not return
 * any values as they will be ignored if there is a return value.
 * @typeparam T The type of the atom that was subscribed to.
 */
export interface AtomSubscriber<T> {
	(atom: T): void;
}

/**
 * BaseAtom provides the basic functionality for atoms such as the readonly
 * value property and handling subscribers. These are the basic requirements
 * required to meet the [[IAtom]] interface.
 * @typeparam T The type of the atom's value.
 * @internal **DO NOT USE** This is a base class for other atoms, prefer
 *   [[readonlyAtom]] or [[atom]] or another constructor function.
 */
export default class BaseAtom<T> {
	/**
	 * The value of the atom, BaseAtom does not provide any means for updating
	 * this after the object is created.
	 * @typeparam T Teh atom's value.
	 */
	#value: T;

	/**
	 * The list of active subscribers listening or value changes on this atom.
	 * Subscribers are called anytime the value is updated.
	 * @typeparam this The specific class that was subscribed to.
	 */
	#subscribers: AtomSubscriber<this>[];

	constructor(value: T) {
		this.#value = value;
		this.#subscribers = [];
	}

	/**
	 * This readonly property will return the current active value of the atom.
	 * @returns The current value of the atom.
	 */
	get value(): T {
		return this.#value;
	}

	/**
	 * Subscribe to the atom's value updates with the given subscriber. This
	 * subscriber will be called with the instance of the atom anytime it's value
	 * changes (of course the BaseAtom does not have a public mechanism for the
	 * value to change).
	 * @param subscriber The subscriber to add to the list of subscribers
	 *   listening for value changes.
	 */
	subscribe(subscriber: AtomSubscriber<this>): void {
		this.#subscribers.push(subscriber);
	}

	/**
	 * Unsubscribe the given subscriber from value updates on this atom. If the
	 * subscriber is in the list of subscribers it will be removed, and if it's
	 * no already a subscriber then nothing will happen. If `null` is passed
	 * instead of a subscriber then all subscribers will be removed.
	 * @param subscriber The subscriber to remove or null to remove all
	 *   subscribers.
	 */
	unsubscribe(subscriber: AtomSubscriber<this> | null): void {
		if (null) {
			this.#subscribers = [];

			return;
		}

		this.#subscribers = this.#subscribers.filter(sub => sub !== subscriber);
	}

	/**
	 * An internal test that determines if any subscribers are currently
	 * subscribed to this atom's value changes.
	 * @returns A boolean representing if there are any subscribers currently
	 *   subscribed to this atom.
	 */
	protected hasSubscribers(): boolean {
		return this.#subscribers.length > 0;
	}

	/**
	 * An internal helper that will fire all the subscribers passing `this` to
	 * them, this is typically only triggered in response to value changes.
	 */
	protected notifySubscribers(): void {
		this.#subscribers.forEach(subscriber => subscriber(this));
	}

	/**
	 * An internal helper that will update the value of the atom. Note that it's
	 * protected, there is no public way to modify a BaseAtom's value this is
	 * for subclasses to used.
	 * @param newValue The new value for the atom's value field.
	 */
	protected setValue(newValue: T): void {
		this.#value = newValue;
	}
}
