import BaseAtom from './BaseAtom';
import { IMutableAtom, RestParameters } from './types';

/**
 * A ReactionMutation is a function that receives the current value of an atom
 * and a set of any arguments, and returns a new value for the atom.
 * @typeparam T The type of the atom's value and the first argument to the
 *   mutation.
 */
export interface ReactionMutation<T> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(value: T, ...args: any[]): T;
}

/**
 * A ReactionMutationMapping maps a friendly name (string) to a ReactionMutation,
 * this mapping is used in the creation for Reactor's to define the mutation
 * set for the reactor instance.
 * @typeparam T The type of the atom's value and so the type that each mutation
 *   should be handled.
 */
export interface ReactionMutationMapping<T> {
	[key: string]: ReactionMutation<T>;
}

/**
 * A ReactionFunction is similar to a [[ReactionMutation]], it differs in the
 * argument list and return type. A ReactionMutation should receive the current
 * atom's value as it's first argument and return a new value for the atom while
 * the ReactionFunction is meant to wrap a Mutation, as a function it takes the
 * same set of arguments as the Mutation except for the first argument and does
 * not return a value.
 * @typeparam T The type of the atom's value and therefore the type of the
 *   ReactionMutation should handle
 * @typeparam M The ReactionMutation that this ReactionFunction is meant to
 *   wrap.
 */
export interface ReactionFunction<T, M extends ReactionMutation<T>> {
	(...args: RestParameters<M>): void;
}

/**
 * A ReactionFunctionMapping is a mapping of frinedly string keys to a
 * ReactionFunction, similar to the [[ReactionMutationMapping]]. The mutation
 * mapping and function mapping will contain the set of keys but they differ in
 * pointing to functions instead of mutations.
 * @typeparam T The type of the atom's value and therefore the type of the
 *   ReactionMutations that are wrapped.
 * @typeparam R The ReactionMutationMapping that is wrapped, since the mutation
 *   and function mappings share keys they need to be bound to each other.
 */
export type ReactionFunctionMapping<T, R extends ReactionMutationMapping<T>> = {
	[K in keyof R]: ReactionFunction<T, R[K]>;
};

/**
 * A Reactor is a specialized [[Atom]] wrapper that behaves similar to an atom but
 * provides pre-defined and pre-bound functions for interacting with a an atom.
 * This is useful if you have an atom and you wish to provide a specialized
 * interface on top of `update` that allows a client to react to the event or
 * extract them for later use.
 *
 * ### Example
 *
 * For example, here is the Atom counter example redefined to use the reactor.
 *
 * ```typescript
 * const counter = reactor(atom(0), {
 *   increment: value => value + 1,
 * });
 *
 * const countDisplay = document.querySelector('#count-display');
 * counter.subscribe(atom => {
 *   countDisplay.textContent = `Current count: ${atom.value}`;
 * });
 *
 * const incrementButton = document.querySelector('#increment-button');
 * const incr = counter.extract('increment');
 * incrementButton.addEventListener('click', incr);
 * ```
 *
 * @typeparam T The type of the wrapped atom's value.
 * @typeparam R The ReactionMutationMapping provided to the Reactor.
 * @internal **DO NOT USE** Prefer the [[reactor]] factory function to manually
 *   creating instances of this class.
 */
export default class Reactor<T, R extends ReactionMutationMapping<T>> extends BaseAtom<T> {
	/**
	 * The wrapped atom that reactor is providing functionality for, this has to
	 * be a mutable atom that supports updating it's value otherwise there is no
	 * benefit to having a reactor.
	 */
	#atom: IMutableAtom<T>;

	/**
	 * The reaction function mapping, which contains a mapping of pre-bound
	 * reaction functions that will call the provided reaction mutation (based on
	 * key) and update the wrapped atom's value.
	 */
	#reactions: ReactionFunctionMapping<T, R>;

	/**
	 * The list of reaction keys that this reactor supports. This is useful if
	 * you want to extract all the functions or something.
	 */
	#reactionKeys: string[];

	/**
	 * Create a new Reactor from the provided mutable atom and the set of reactions.
	 * @param atom The mutable atom to be extended by this reactor.
	 * @param reactions The object defining the name and mutation function for
	 *   all reactions the reactor should have access to.
	 */
	constructor(atom: IMutableAtom<T>, reactions: R) {
		super(atom.value);
		this.#atom = atom;
		this.#reactions = {} as ReactionFunctionMapping<T, R>;
		this.#reactionKeys = Object.keys(reactions);

		if (this.#reactionKeys.length < 1) {
			throw new TypeError('Reactor requires at least one reaction.');
		}

		for (const [key, reaction] of Object.entries(reactions)) {
			this.#reactions[key as keyof R] = this.wrapReaction(reaction);
		}

		this.#atom.subscribe(this.subscriber);
	}

	/**
	 * Reactor's value property differs from BaseAtom as Reactor doesn't internally
	 * track a current value but instead forwards the wrapped atom's current value.
	 * @return The wrapped atom's current value with a Readonly type wrapper.
	 */
	get value(): Readonly<T> {
		return this.#atom.value;
	}

	/**
	 * This method is here for when you wish to release a reactor so it can be
	 * safely garbage collected. If the wrapped atom will outlive the reactor then
	 * it's a good idea to release the atom, which breaks the subscription link
	 * between the reactor and the wrapped atom (so only use this when you need
	 * this behavior).
	 */
	releaseAtom(): void {
		this.#atom.unsubscribe(this.subscriber);
	}

	/**
	 * React is the core powerhouse of the Reactor. Once the reactor is created
	 * with a set of mutations you can trigger a reaction by calling react and
	 * passing in the name of a valid mutation. You also pass any additional
	 * arguments that the mutation expects here.
	 * @param reactionName The name of a reaction that was defined in the set of
	 *   mutations provided when the reactor was created.
	 * @param args The rest of the arguments that should all be forwarded to the
	 *   desired mutation.
	 * @typeparam Key The key defined in the reaction mapping.
	 */
	react<Key extends keyof R>(reactionName: Key, ...args: RestParameters<R[Key]>): void {
		const reaction = this.#reactions[reactionName];

		reaction(...args);
	}

	/**
	 * Return the set of keys that are the names of all valid mutations that the
	 * reactor was created with.
	 * @return An array containing all the keys of valid reactions.
	 */
	keys(): Readonly<string[]> {
		return this.#reactionKeys;
	}

	/**
	 * Extract is also a powerhouse of the Reactor. Where `react` let's you call
	 * the reaction directly `extract` will return the reaction as a function
	 * that can be called without the need to reference the original atom or the
	 * reactor, useful for passing functions around to handlers.
	 * The return value of `extract` is also stable, so if you use an extracted
	 * reaction as the listener to a DOM event you can extract it again and use
	 * the value to unbind the listener for cleanup.
	 * @param reactionName The name of the defined reaciton that you wish to
	 *   extract in the form a of a re-usable function.
	 * @return A function that can be called, and when called will mutate the atom
	 *   according to the reactions original defintion when the reactor was
	 *   created.
	 * @typeparam Key The key defined in the reaction mapping.
	 */
	extract<Key extends keyof R>(reactionName: Key): ReactionFunction<T, R[Key]> {
		return this.#reactions[reactionName];
	}

	/**
	 * Similar to extract, this will extract reactions from the reactor as standalone
	 * functions. The difference is this extracts multiple reactions and returns
	 * a mapping of these reactions.
	 * @param reactionNames The names of all the reactions to extract and store
	 *   into the mapping.
	 * @return A mapping where each key request points to an approparite reaction
	 *   as passed to the reactor when it was created.
	 * @typeparam Key The key defined in the reaction mapping.
	 */
	multiExtract<Key extends keyof R>(...reactionNames: Key[]): ReactionFunctionMapping<T, R> {
		const mapping = {} as ReactionFunctionMapping<T, R>;
		for (const key of reactionNames) {
			mapping[key] = this.extract(key);
		}

		return mapping;
	}

	/**
	 * This is a helper that wraps the mutation version of a reaction and returns
	 * the usable version of the reaction that will be called by `react` or
	 * returned by `extract`.
	 * @param reaction The reaction mutation to wrap with a reaction function.
	 * @return The reaction function that will be used to execute the mutation
	 *   provided.
	 * @typeparam M The mutation type used for extracting parameter information.
	 */
	private wrapReaction<M extends ReactionMutation<T>>(reaction: M): ReactionFunction<T, M> {
		return (...args: RestParameters<typeof reaction>): void => {
			const newValue = reaction(this.#atom.value, ...args);
			this.#atom.update(newValue);
		};
	}

	/**
	 * A helper function that is used to subscribe to an atom's value. This is
	 * a simple function that simply notifies the reactors subscribers when the
	 * atom's value has changed thereby essentially just bubbling the subscription
	 * up the chain.
	 */
	private subscriber = (_atom: IMutableAtom<T>): void => {
		this.notifySubscribers();
	};
}
