import { AtomUpdater } from './Atom';
import { AtomSubscriber } from './BaseAtom';

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

/**
 * IMutableAtom, like IAtom, is an interface that matches any typical atom but
 * also, more specifically, atoms that can be mutated. This means they have a
 * set and update function that allows the value of the Atom to be manupulated.
 * @typeparams T The type of the atom's value.
 */
export interface IMutableAtom<T> extends IAtom<T> {
	set(value: T): void;
	update(updater: AtomUpdater<T>): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RestParameters<F> = F extends (x: any, ...args: infer P) => any ? P : never;
