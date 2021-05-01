import BaseAtom, { AtomSubscriber } from './BaseAtom';
import ReadonlyAtom from './ReadonlyAtom';
import { IAtom } from './types';

// TODO: Find a better type
export interface ProjectionFunction<T> {
	(...args: unknown[]): T;
}

/**
 * The Projector is @nuka/state's equivalent to "computed" values. It takes one
 * or more input atom-like objects and a projection function and it sets it's
 * value based on the return of the projection function and all input atoms.
 * It will also subscribe to all the input atom-like objects so that if any of
 * their values are updated the projection function will run again.
 *
 * There is a slight optimization that Projector will do, it will try and sniff
 * if any input atom-like objects are a ReadonlyAtom, and if so it will only
 * subscribe to them if there are subscribers to the Projector so that the
 * readonly atom isn't running when nothings is subscribed.
 *
 * @typeparam T The type of the projector's value.
 * @internal **DO NOT USE** Prefer using the `projector` function to create new
 *   projectors.
 */
export default class Projector<T> extends BaseAtom<T> {
	#projection: ProjectionFunction<T>;
	#allAtoms: IAtom<unknown>[];
	#regularAtoms: IAtom<unknown>[];
	#readonlyAtoms: ReadonlyAtom<unknown>[];
	#subscribedToReadonlyAtoms: boolean;

	constructor(atoms: IAtom<unknown>[], projection: ProjectionFunction<T>) {
		super(projection(...atoms.map(atom => atom.value)));

		this.#projection = projection;
		this.#allAtoms = atoms;
		this.#regularAtoms = [];
		this.#readonlyAtoms = [];
		this.#subscribedToReadonlyAtoms = false;

		this.#allAtoms.forEach(atom => {
			if (ReadonlyAtom.isReadonlyAtom(atom)) {
				this.#readonlyAtoms.push(atom);
			} else {
				this.#regularAtoms.push(atom);
			}
		});

		this.subscribeToAtoms();
	}

	unsubscribeFromAtoms(): void {
		this.#allAtoms.forEach(atom => {
			atom.unsubscribe(this.update);
		});
	}

	subscribeToAtoms(): void {
		this.unsubscribeFromAtoms();

		this.#regularAtoms.forEach(atom => {
			atom.subscribe(this.update);
		});

		this.subscribeToReadonlyAtoms();
	}

	subscribe(subscriber: AtomSubscriber<this>): void {
		super.subscribe(subscriber);
		this.subscribeToReadonlyAtoms();
	}

	unsubscribe(subscriber: AtomSubscriber<this>): void {
		super.unsubscribe(subscriber);
		this.unsubscribeFromReadonlyAtoms();
	}

	private subscribeToReadonlyAtoms() {
		if (this.#readonlyAtoms.length > 0 && this.hasSubscribers() && !this.#subscribedToReadonlyAtoms) {
			this.#subscribedToReadonlyAtoms = true;

			this.#readonlyAtoms.forEach(atom => {
				atom.subscribe(this.update);
			});
		}
	}

	private unsubscribeFromReadonlyAtoms(): void {
		if (!this.#subscribedToReadonlyAtoms) {
			return;
		}

		this.#readonlyAtoms.forEach(atom => {
			atom.unsubscribe(this.update);
		});

		this.#subscribedToReadonlyAtoms = false;
	}

	private update = (_atom: IAtom<unknown>): void => {
		const args = this.#allAtoms.map(atom => atom.value);
		const newValue = this.#projection(...args);

		this.setValue(newValue);
		this.notifySubscribers();
	};
}
