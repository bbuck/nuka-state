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

/**
 * Extract the value of the IAtom type provided. This allows breaking an IAtom
 * down to it's component parts, used for typings that require such a thing.
 * @typeparams T The IAtom to extract the value type from.
 */
export type AtomValueType<T> = T extends IAtom<infer A> ? A : never;

/**
 * RestParameters is a special type that extracts all but the first parameter
 * types from the function type provided. If the type isn't a function then
 * the type returned is `never`.
 * @typeparam F The function type for which all but the first parameters should
 *   be extracted from.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RestParameters<F> = F extends (x: any, ...args: infer P) => any ? P : never;
