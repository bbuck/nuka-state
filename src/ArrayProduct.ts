import BaseAtom from './BaseAtom';
import { AtomValueType, IAtom } from './types';

export type IAtomTuple = readonly IAtom<unknown>[];

export type ArrayProductTypes<T extends IAtomTuple> = {
	[I in keyof T]: AtomValueType<T[I]>;
} & { length: T['length'] };

export default class ArrayProduct<T extends IAtomTuple> extends BaseAtom<ArrayProductTypes<T>> {
	#allAtoms: T;

	constructor(...atoms: T) {
		// we ingore `setValue` and `#value` but we need to force this super call
		// to allow it.
		super(([] as unknown) as ArrayProductTypes<T>);
		this.#allAtoms = atoms;
	}

	get value(): ArrayProductTypes<T> {
		const values: unknown = this.#allAtoms.map(atom => atom.value);

		return values as ArrayProductTypes<T>;
	}
}
