import BaseAtom, { AtomSubscriber } from './BaseAtom';
import ReadonlyAtom from './ReadonlyAtom';
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
 * There is a slight optimization that Projector will do, it will try and sniff
 * if any input atom-like objects are a ReadonlyAtom, and if so it will only
 * subscribe to them if there are subscribers to the Projector so that the
 * readonly atom isn't running when nothings is subscribed.
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
export default class Projector<T> extends BaseAtom<T> {
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
	 * This list contains all non-readonly atoms that will be subscribed to at
	 * all times.
	 */
	#regularAtoms: IAtom<unknown>[];

	/**
	 * This is the list of readonly atoms that will only be subscribed to when
	 * the projector has subscribers.
	 */
	#readonlyAtoms: ReadonlyAtom<unknown>[];

	/**
	 * This is a flag that denotes whether or not the projector is currently
	 * subscribed to readonly atoms. This is used to prevents multiple
	 * subscriptions to readonly atoms which would cause the readonly atoms to
	 * continue running as if they has a subscriber when in reality it would be
	 * a duplicate and no a valid subscriber.
	 */
	#subscribedToReadonlyAtoms: boolean;

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

	/**
	 * This will unsubscribe from every atom passed in, including readonly atoms.
	 * It is intended to be used internally and/or before a projector whose input
	 * atoms outlive it fall out of scope to prevent memory leaks.
	 */
	unsubscribeFromAtoms(): void {
		this.#allAtoms.forEach(atom => {
			atom.unsubscribe(this.update);
		});

		this.#subscribedToReadonlyAtoms = false;
	}

	/**
	 * This will subscribe to all regular atoms, and if there is at least one
	 * subscriber then all readonly atoms as well.
	 */
	subscribeToAtoms(): void {
		this.unsubscribeFromAtoms();

		this.#regularAtoms.forEach(atom => {
			atom.subscribe(this.update);
		});

		this.subscribeToReadonlyAtoms();
	}

	/**
	 * This just triggers a subscription to readonly atoms (if it's the first
	 * subscriber) when a subscriber subscribes otherwise this simply calls the
	 * BaseAtom subscribe function.
	 * @param subscriber The subscriber function wishing to be called when the
	 *   projectors value changes.
	 */
	subscribe(subscriber: AtomSubscriber<this>): void {
		super.subscribe(subscriber);
		this.subscribeToReadonlyAtoms();
	}

	/**
	 * This just triggers unsubscription (if it's the last subscriber) when a
	 * subscriber chooses to unsubscribe. Otherwise this simple calls BaseAtoms
	 * unsubscribe function.
	 * @param subscriber The subscriber that no longer wishes to be called when
	 *   the projectors value changes.
	 */
	unsubscribe(subscriber: AtomSubscriber<this>): void {
		super.unsubscribe(subscriber);
		this.unsubscribeFromReadonlyAtoms();
	}

	/**
	 * Subscribe to readonly atoms if there are subscribers, and there are
	 * readonly atoms and the projector is not already subscribed to readonly
	 * atoms.
	 */
	private subscribeToReadonlyAtoms() {
		if (this.#readonlyAtoms.length > 0 && this.hasSubscribers() && !this.#subscribedToReadonlyAtoms) {
			this.#subscribedToReadonlyAtoms = true;

			this.#readonlyAtoms.forEach(atom => {
				atom.subscribe(this.update);
			});
		}
	}

	/**
	 * Unsubscribe from readonly atoms only if we're subscribed to readonly atoms.
	 */
	private unsubscribeFromReadonlyAtoms(): void {
		if (!this.#subscribedToReadonlyAtoms) {
			return;
		}

		this.#readonlyAtoms.forEach(atom => {
			atom.unsubscribe(this.update);
		});

		this.#subscribedToReadonlyAtoms = false;
	}

	/**
	 * This function is passed, as subscriber, to all atoms passed to the projector
	 * and simply maps the current atom values and passes them to the projection
	 * function to generate a new value. This new value is the set as the projectors
	 * new value and then all of the projectors subscribers are notified.
	 */
	private update = (_atom: IAtom<unknown>): void => {
		const args = this.#allAtoms.map(atom => atom.value);
		const newValue = this.#projection(...args);

		this.setValue(newValue);
		this.notifySubscribers();
	};
}
