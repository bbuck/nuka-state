import ReadonlyAtom, { ReadonlyAtomStarter } from './ReadonlyAtom';
import Atom from './Atom';

/**
 * readonlyAtom will create a new ReadonlyAtom instance with the provided
 * initial value and start function.
 * @param initialValue The initial value of the ReadonlyAtom.
 * @param start The start function that should run if the ReadonlyAtom is live
 *   or has subscribers.
 * @returns The ReadonlyAtom instance that can be used as readonly storage.
 * @typeparam T The type of the atom's value.
 */
export const readonlyAtom = <T>(initialValue: T, start: ReadonlyAtomStarter<T>): ReadonlyAtom<T> => new ReadonlyAtom(initialValue, start);

export const atom = <T>(value: T): Atom<T> => new Atom(value);
