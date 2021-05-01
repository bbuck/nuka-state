import BaseAtom, { AtomSubscriber } from './BaseAtom';

/**
 * ReadonlyAtomSetter is the tep of the `set` function passed to the `start`
 * function provided to a [[ReadonlyAtom]].
 * @typeparam T The type of the atom's value.
 */
export type ReadonlyAtomSetter<T> = (value: T) => void;

/**
 * ReadonlyAtomStarter is a function that initiates the value setting for a
 * [[ReadonlyAtom]], this method is called when the first subscriber to a
 * [[ReadonlyAtom]] subscribes and is expected to return a stop function that will
 * cleanup any intervals or timeouts, etc... that the start function created.
 * This stop function is called when the last subscriber unsubscribes from the
 * [[ReadonlyAtom]] so that anything that is running is only going to run while
 * being listened to.
 *
 * It's good practice to always seed with an updated value (if applicable) when
 * the start function is called, for example consider this [[ReadonlyAtom]] that
 * represents the current time:
 *
 * ```typescript
 * const clock = readonlyAtom(new Date().toLocaleString(), set => {
 *   set(new Date().toLocaleString());
 *
 *   const interval = setInterval(() => {
 *     set(new Date().toLocaleString());
 *   }, 1000);
 *
 *   return () => {
 *     clearInterval(interval);
 *   };
 * });
 * ```
 *
 * Despite providing an initial value we also set an updated value as the first
 * line in the start function so that after a period of no subscribers we can
 * ensure that we have an updated value instead of a stale value. This does not
 * apply to all use cases though, in some cases there may not be an updated
 * value you can set, perhaps if you're [[ReadonlyAtom]] is representing the current
 * user or something that would require a network request for fresh data.
 * @typeparam T The type of the atom's value.
 */
export type ReadonlyAtomStarter<T> = (set: ReadonlyAtomSetter<T>) => VoidFunction | undefined;

/**
 * ReadonlyAtom is a specialized atom that does not provide any public method
 * for setting their values. This means they do not have an `update` or `set`
 * function that can be called by other code and can only be read via `value`;
 * however, this does not mean that their value cannot be modified after they
 * are created.
 *
 * There are two ways to use ReadonlyAtom's, the first of which is as a normal
 * atom with a value that will never change. You can do this by using the
 * [[readonlyAtom]] function and passing in just it's first argument:
 *
 * ```typescript
 * const ten = readonlyAtom(10);
 * ```
 *
 * In this example `ten` will always hold the value `10`, since we did not pass
 * a start function that would receive the setter we can be assured that it's
 * value is static for the lifetime of the atom. While it is still possible to
 * subscribe to these static atoms, they are essentially no-op, since there
 * would be no way for the atom's value to change subscribe requests are
 * ignored.
 *
 * The other, and maybe more useful, method of using a ReadonlyAtom is one that
 * receives a start function in addition to the intitial value that allows it's
 * value to be updated in response to something. These kinds of ReadonlyAtoms
 * are created by providing a start function as the second argument to
 * [[readonlyAtom]], a smiple example would be an atom that acts like a clock:
 *
 * ```typescript
 * const clock = readonlyAtom(new Date(), set => {
 *   set(new Date());
 *
 *   const interval = setInterval(() => {
 *     set(new Date());
 *   }, 1000);
 *
 *   return () => {
 *     clearInterval(interval);
 *   };
 * });
 * ```
 *
 * In the above example we create a ReadonlyAtom that will have it's value
 * updated ever second via an interval. We do this by passing in a start
 * function which receives one argument, `set` which lets you set the value of
 * the atom and should return a stop function to clean up any intervals or
 * timeouts or anything else that should be stopped.
 *
 * Since the value will change we can subscribe to listen for the value updates
 * like any other atom. And subscription is key for these atoms. For efficiency
 * sake the start function will not be called until there is at least one
 * subscriber on the atom and it will be halted when the last subscriber
 * unsubscribes. This is why you would typically want to update the value at
 * the beginning of your start function so that subscribers can read and use
 * the latest values.
 *
 * If you do need your readonly atom to run even without subscribers you can
 * use `setLive` to switch it to a live atom which means that it will call the
 * start function and will not call stop regardless of how many subscribers it
 * has. This should be used sparingly because any resources will be constantly
 * running, it's better to try and work in using the subscribe functions for the
 * lifetime you use the atom instead of having it constatly live.
 * @typeparam T The type of the atom's value.
 * @internal Prefer [[readonlyAtom]] to manually creating instances of
 *   this class.
 */
export default class ReadonlyAtom<T> extends BaseAtom<T> {
	#start: ReadonlyAtomStarter<T> | undefined;
	#stop: VoidFunction | undefined;
	#live: boolean;

	static isReadonlyAtom(obj: unknown): obj is ReadonlyAtom<unknown> {
		if (typeof obj === 'object') {
			return obj?.constructor?.name === 'ReadonlyAtom';
		}

		return false;
	}

	constructor(initialValue: T, start?: ReadonlyAtomStarter<T>) {
		super(initialValue);

		this.#start = start;
		this.#live = false;
	}

	/**
	 * This method allows you to mark the atom as live, or not live, which provides
	 * some additional controls on the how the ReadonlyAtom behaves. If the atom
	 * is marked as live then it will run as if there is always at least one
	 * subscriber and if it's then marked as no longer live it will stop as if the
	 * last subscriber has stopped.
	 * @param isLive Whether or not to mark this atom as live or not.
	 */
	setLive(isLive: boolean): void {
		if (this.#live === isLive) {
			return;
		}

		if (this.#live && !this.hasSubscribers() && this.#stop) {
			this.#stop();
		}

		if (!this.#live && this.#start) {
			this.#stop = this.#start(this.setter);
		}

		this.#live = isLive;
	}

	/**
	 * For the most part, this behaves like [[BaseAtom]]'s subscribe function;
	 * however, the difference is that if this ReadonlyAtom is not live and has
	 * no subscribers this will also call the provided start function (if
	 * provided). If there is no start function provided to the ReadonlyAtom then
	 * this basically becomes a no-op function since there would be no changes to
	 * respond to.
	 * @param subscriber The subscribe function that will be called when the value
	 *   of this atom is mutated.
	 */
	subscribe(subscriber: AtomSubscriber<this>): void {
		// there is no reason to subscribe if we don't have a start function (so
		// no changes happening at all)
		if (!this.#start) {
			return;
		}

		if (!this.hasSubscribers() && !this.#live) {
			this.#stop = this.#start(this.setter);
		}

		super.subscribe(subscriber);
	}

	/**
	 * For the most part, this behaves like [[BaseAtom]]'s unsubscribe function;
	 * however, the difference is that if this ReadonlyAtom is not live and the
	 * last subscriber unsubscribes then we call the stop function retuned by the
	 * provided start (if they both exist). If no start function is provided this
	 * method will essentially become a no-op since we do not accept subscribers
	 * in this situation as well.
	 * @param subscriber The function that was passed to the subscribe method and
	 *   that should be removed from the list of subscribers.
	 */
	unsubscribe(subscriber: AtomSubscriber<this> | null): void {
		// without a start function, we don't track subscribers so we have nothing
		// to unsubscribe
		if (!this.#start) {
			return;
		}

		super.unsubscribe(subscriber);

		if (!this.hasSubscribers() && this.#stop && !this.#live) {
			this.#stop();
		}
	}

	/**
	 * This is the `set` function passed to the start function provided to a
	 * ReadonlyAtom. It receives the next intended value of the atom and notifies
	 * all subscribers of the change.
	 * @param value The new value of the atom.
	 */
	private setter = (value: T) => {
		this.setValue(value);
		this.notifySubscribers();
	};
}
