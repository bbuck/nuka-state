import BaseAtom from './BaseAtom';
import { IAtom } from './types';

// TODO: Find a better type
/**
 * A projection function is a function that takes a set of atom values and
 * returns a new value for the projector.
 * @typeparam The type of the projectors's value.
 */
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
 * Projectors act like atoms, so they can be consumed by other projectors or
 * other atom-consuming API functions.
 *
 * Since ReadonlyAtom's do not start until they are either live or have at least
 * on subscriber, if you pass a ReadonlyAtom to a Projector the projector will
 * automatically subscribe to the readonly atom therefore having it run. So be
 * mindful that any ReadonlyAtom's given to a projector will remain active. If
 * you want to "turn off" ReadonlyAtoms ensure that you call
 * `unsubscribeFromAtoms` and of course resubscribe by calling
 * `subscribeToAtoms` when you wish to resume using a projector.
 *
 * #### NOTE
 *
 * Due to the fact that projectors subscribe to the atoms they are created
 * with, if you wish to stop using a projector (have it fall out of scope) you
 * must manually call `unsubscribeFromAtoms` or else the projector will not be
 * garbage collected as it's subscription function to all atoms will keep it in
 * memory. If the atoms that thep projector was created for/with will also fall
 * out of scope this is not required.
 *
 * ### Examples
 *
 * Probably the simpleist example of a projector is summing up multiple count
 * atoms.
 *
 * ```typescript
 * const counter1 = atom(0);
 * const counter2 = atom(0);
 *
 * const display1 = document.getElementById("display-counter-1");
 * counter1.subscribe((count) => {
 *   display1.textContent = `Current count: ${count.value}`;
 * });
 *
 * const incr1 = document.getElementById("increment-counter-1");
 * incr1.addEventListener("click", () => counter1.update((n) => n + 1));
 *
 * const display2 = document.getElementById("display-counter-2");
 * counter2.subscribe((count) => {
 *   display2.textContent = `Current count: ${count.value}`;
 * });
 *
 * const incr2 = document.getElementById("increment-counter-2");
 * incr2.addEventListener("click", () => counter2.update((n) => n + 1));
 *
 * const sum = projector(counter1, counter2, (a, b) => a + b);
 *
 * const sumDisplay = document.getElementById("display-sum");
 * sum.subscribe((sum) => {
 *   sumDisplay.textContent = `Total count: ${sum.value}`;
 * });
 * ```
 *
 * Projectors don't always have to be used with multiple atoms, somtimes you
 * just want to be able to have and update data from a single atom in a
 * different way. Like showing the full name for a user.
 *
 * ```typescript
 * const user = atom({
 *   firstName: 'Peter',
 *   lastName: 'Programmer',
 * });
 *
 * const fullName = projector(user, u => `${u.firstName} ${u.lastName}`);
 *
 * const firstNameInput = document.getElementById('first-name');
 * firstNameInput.value = user.value.firstName;
 * firstNameInput.addEventListener('input', event => {
 *   user.update(oldUser => ({ ...oldUser, firstName: event.target.value }));
 * });
 *
 * const lastNameInput = document.getElementById('last-name');
 * lastNameInput.value = user.value.lastName;
 * lastNameInput.addEventListener('input', event => {
 *   user.update(oldUser => ({ ...oldUser, lastName: event.target.value }));
 * });
 *
 * const fullNameDisplay = document.getElementById('display-full-name');
 * fullNameDisplay.textContent = fullName.value;
 * fullName.subscribe(name => {
 *   fullNameDisplay.textContent = name.value;
 * });
 * ```
 *
 * A simple and clean way to control how data is rendered, just modify `fullName`'s
 * projection function to, say, change the computed value to `last, first`
 * instead.
 *
 * @typeparam T The type of the projector's value.
 * @internal **DO NOT USE** Prefer using the [[projector]] factory function to
 *   manually creating instances of this class.
 */
export default class Projector<T> extends BaseAtom<T | undefined> {
	/**
	 * The projection function is a function that will be executed with the values
	 * of the provided atoms and is expected to return the new value of the
	 * projector.
	 */
	#projection: ProjectionFunction<T>;

	/**
	 * This maintains the list of all atoms that the projector projects. These
	 * will be iterated and mapped to their values before being passed to the
	 * projection function.
	 */
	#allAtoms: IAtom<unknown>[];

	/**
	 * This allows the projector to track if it's currently subscribed to it's
	 * atoms or not, this prevents multiple subscriptions which could cause
	 * memory leaks or unexpected behaviors (like keeping readonly atoms active
	 * when they shouldn't be.
	 */
	#subscribed: boolean;

	/**
	 * Construct and set up a new Projector. This first calls the BaseAtom
	 * constructor with the initial projected value by grabbing the current value
	 * of all atoms passed in and the calling the projection function. This
	 * ensures the Projector always has a value. Then it initializes all the
	 * instance variables and splits all the atoms passed in into regular and
	 * readonly atoms before finally subscribing to all the atoms (excluding
	 * readonly atoms).
	 * @param atoms The list of input atoms that the projector will subscribe to
	 *   and whose values will be projected with the help fo the projection
	 *   function.
	 * @param projection The projection function receives, as arguments, the values
	 *   of the set of atoms passed in and returns a new value for the projector
	 *   based on the atom's input values. These should be treated as readonly as
	 *   the projection function should not modify the input values at all.
	 */
	constructor(atoms: IAtom<unknown>[], projection: ProjectionFunction<T>) {
		super(undefined);

		this.#projection = projection;
		this.#allAtoms = atoms;
		this.#subscribed = false;

		this.subscribeToAtoms();
	}

	/**
	 * Project overrides the value getter because it computes the current value
	 * lazily in case the projection function does something expensive.
	 */
	get value(): T {
		let currentValue = super.value;
		if (currentValue === undefined) {
			const args = this.#allAtoms.map(atom => atom.value);
			currentValue = this.#projection(...args);
			this.setValue(currentValue);
		}

		return currentValue;
	}

	/**
	 * This will unsubscribe from every atom passed in, including readonly atoms.
	 * It is intended to be used internally and/or before a projector whose input
	 * atoms outlive it fall out of scope to prevent memory leaks.
	 */
	unsubscribeFromAtoms(): void {
		if (!this.#subscribed) {
			return;
		}

		this.#allAtoms.forEach(atom => {
			atom.unsubscribe(this.update);
		});

		this.#subscribed = false;
	}

	/**
	 * This will subscribe to all regular atoms, and if there is at least one
	 * subscriber then all readonly atoms as well.
	 */
	subscribeToAtoms(): void {
		if (this.#subscribed) {
			return;
		}

		this.#allAtoms.forEach(atom => {
			atom.subscribe(this.update);
		});

		this.#subscribed = true;
	}

	/**
	 * This function is passed, as subscriber, to all atoms passed to the projector
	 * and simply maps the current atom values and passes them to the projection
	 * function to generate a new value. This new value is the set as the projectors
	 * new value and then all of the projectors subscribers are notified.
	 */
	private update = (_atom: IAtom<unknown>): void => {
		this.setValue(undefined);
		this.notifySubscribers();
	};
}
