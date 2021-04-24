import { AtomSubscriber } from "./BaseAtom";

/**
 * IAtom is an interface that will match the basic intended behavior of any atoms
 * which is reading their value and subscribing to value updates.
 * @typeparam T The type of the atom's value.
 */
export interface IAtom<T> {
	readonly value: T;
	subscribe: (subscriber: AtomSubscriber<this>) => void;
	unsubscribe: (subscriber: AtomSubscriber<this>) => void;
}
