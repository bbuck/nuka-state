import BaseAtom from './BaseAtom';
import { IMutableAtom, RestParameters } from './types';

export interface ReactionMutation<T> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(value: T, ...args: any[]): T;
}

export interface ReactionMutationMapping<T> {
	[key: string]: ReactionMutation<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ReactionFunction<T, M extends (value: T, ...args: any[]) => any> {
	(...args: RestParameters<M>): void;
}

export type ReactionFunctionMapping<T, R extends ReactionMutationMapping<T>> = {
	[K in keyof R]: ReactionFunction<T, R[K]>;
};

export default class Reactor<T, R extends ReactionMutationMapping<T>> extends BaseAtom<T> {
	#atom: IMutableAtom<T>;
	#reactions: ReactionFunctionMapping<T, R>;

	constructor(atom: IMutableAtom<T>, reactions: R) {
		super(atom.value);
		this.#atom = atom;
		this.#reactions = {} as ReactionFunctionMapping<T, R>;

		for (const [key, reaction] of Object.entries(reactions)) {
			this.#reactions[key as keyof R] = this.wrapReaction(reaction);
		}

		this.#atom.subscribe(this.subscriber);
	}

	get value(): T {
		return this.#atom.value;
	}

	releaseAtom(): void {
		this.#atom.unsubscribe(this.subscriber);
	}

	react(reactionName: keyof R, ...args: RestParameters<R[typeof reactionName]>): void {
		const reaction = this.#reactions[reactionName];

		reaction(...args);
	}

	extract(reactionName: keyof R): ReactionFunction<T, R[keyof R]> {
		return this.#reactions[reactionName];
	}

	private wrapReaction<M extends ReactionMutation<T>>(reaction: M): ReactionFunction<T, M> {
		return (...args: RestParameters<typeof reaction>): void => {
			const newValue = reaction(this.#atom.value, ...args);
			this.#atom.update(newValue);
		};
	}

	private subscriber = (_atom: IMutableAtom<T>): void => {
		this.notifySubscribers();
	};
}
