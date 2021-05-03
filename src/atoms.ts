import ReadonlyAtom, { ReadonlyAtomStarter } from './ReadonlyAtom';
import Atom from './Atom';
import { IAtom } from './types';
import Projector, { ProjectionFunction } from './Projector';

/**
 * readonlyAtom will create a new ReadonlyAtom instance with the provided
 * initial value and start function. Readonly atoms are atoms that do not allow
 * users to set or modify values, just read; however, this does not mean their
 * value has to be static. If only an initialValue is provided then the returned
 * readonly atom will have a static value, however if you also pass in a start
 * function, this will receive a set function as an argument and from here you
 * can do whatever you might need, such as running a timeout or interval or
 * any other mechanism you need to periodically update the atoms value.
 *
 * ### Examples
 *
 * A really common example case is a clock:
 *
 * ```typescript
 * const clock = readonlyAtom(new Date(), (set) => {
 *   set(new Date());
 *
 *   const interval = setInterval(() => {
 *     set(new Date());
 *   }, 1000);
 *
 *   return () => {
 *     clearInterval(interval);
 *   };
 * });
 *
 * const dateTimeDisplay = document.getElementById("date-time");
 *
 * clock.subscribe((atom) => {
 *   dateTimeDisplay.textContent = atom.value.toLocaleString();
 * });
 * ```
 *
 * See it on [CodePen](https://codepen.io/bbuck/pen/dyNBQev).
 *
 * Another possible example would be to handle other values set by something
 * else, such as the window scroll event, which can be throttled to prevent
 * unnecessary spam.
 *
 * ```typescript
 * const scrollContainer = document.body;
 * const scrollTop = readonlyAtom(scrollContainer.scrollTop, (set) => {
 *   set(scrollContainer.scrollTop);
 *
 *   const onScroll = throttle(
 *     () => {
 *       set(scrollContainer.scrollTop);
 *     },
 *     200,
 *     true
 *   );
 *
 *   scrollContainer.addEventListener("scroll", onScroll);
 *
 *   () => {
 *     scrollContainer.removeEventListener("scroll", onScroll);
 *   };
 * });
 *
 * const display = document.getElementById("scroll-value");
 *
 * scrollTop.subscribe((atom) => {
 *   display.textContent = Math.round(atom.value);
 * });
 * ```
 *
 * See it on [CodePen](https://codepen.io/bbuck/pen/wvgLQQY).
 *
 * @param initialValue The initial value of the ReadonlyAtom.
 * @param start The start function that should run if the ReadonlyAtom is live
 *   or has subscribers.
 * @returns The ReadonlyAtom instance that can be used as readonly storage.
 * @typeparam T The type of the atom's value.
 */
export const readonlyAtom = <T>(initialValue: T, start?: ReadonlyAtomStarter<T>): ReadonlyAtom<T> =>
	new ReadonlyAtom(initialValue, start);

/**
 * The atom is the core of @nuka/sate. It represents a piece of data that can
 * be set or udpated anywhere in an application and provides the capability
 * for a user to subscribe and listen for the changes. This allows your data to
 * be used in a variety of places around your application while also allowing
 * the consumers that need to respond to changes the capability of knowing when
 * the value has been modified. Examples can range from user authentication
 * tokens, application objects, counts, or any other data where you may need
 * access to it in more than one place but wish to be notified when it's value
 * has changed.
 *
 * ### Example
 *
 * ```typescript
 * const counter = atom(0);
 *
 * const countDisplay = document.getElementById("display-counter");
 * counter.subscribe((atom) => {
 *   countDisplay.textContent = `Current count: ${atom.value}`;
 * });
 *
 * const incrementButton = document.getElementById("increment-counter");
 * incrementButton.addEventListener("click", () => counter.update((n) => n + 1));
 * ```
 *
 * See it on [CodePen](https://codepen.io/bbuck/pen/yLgwBGL).
 *
 * @param value The initial value of the atom.
 * @returns A new atom containing the initial value ready for use.
 * @typeparam T The type of the atom's value.
 */
export const atom = <T>(value: T): Atom<T> => new Atom(value);

/**
 * Typings for the `projector` function, supporting up to twelve atoms and a
 * twelve argument projection function.
 */
interface ProjectorCreator {
	/**
	 * When a single atom-like is being passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 */
	<T, A1>(atom1: IAtom<A1>, projection: (a1: Readonly<A1>) => T): Projector<T>;
	/**
	 * When two atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 */
	<T, A1, A2>(atom1: IAtom<A1>, atom2: IAtom<A2>, projection: (a1: Readonly<A1>, a2: Readonly<A2>) => T): Projector<T>;
	/**
	 * When three atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 */
	<T, A1, A2, A3>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		projection: (a1: Readonly<A1>, a2: Readonly<A2>, a3: Readonly<A3>) => T,
	): Projector<T>;
	/**
	 * When four atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 * @typeparam A4 The type of the fourth atom passed in and type of the fourth
	 *   argument to the projection function.
	 */
	<T, A1, A2, A3, A4>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		atom4: IAtom<A4>,
		projection: (a1: Readonly<A1>, a2: Readonly<A2>, a3: Readonly<A3>, a4: Readonly<A4>) => T,
	): Projector<T>;
	/**
	 * When five atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 * @typeparam A4 The type of the fourth atom passed in and type of the fourth
	 *   argument to the projection function.
	 * @typeparam A5 The type of the fifth atom passed in and type of the fifth
	 *   argument to the projection function.
	 */
	<T, A1, A2, A3, A4, A5>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		atom4: IAtom<A4>,
		atom5: IAtom<A5>,
		projection: (a1: Readonly<A1>, a2: Readonly<A2>, a3: Readonly<A3>, a4: Readonly<A4>, a5: Readonly<A5>) => T,
	): Projector<T>;
	/**
	 * When six atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 * @typeparam A4 The type of the fourth atom passed in and type of the fourth
	 *   argument to the projection function.
	 * @typeparam A5 The type of the fifth atom passed in and type of the fifth
	 *   argument to the projection function.
	 * @typeparam A6 The type of the sixth atom passed in and type of the sixth
	 *   argument to the projection function.
	 */
	<T, A1, A2, A3, A4, A5, A6>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		atom4: IAtom<A4>,
		atom5: IAtom<A5>,
		atom6: IAtom<A6>,
		projection: (
			a1: Readonly<A1>,
			a2: Readonly<A2>,
			a3: Readonly<A3>,
			a4: Readonly<A4>,
			a5: Readonly<A5>,
			a6: Readonly<A6>,
		) => T,
	): Projector<T>;
	/**
	 * When seven atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 * @typeparam A4 The type of the fourth atom passed in and type of the fourth
	 *   argument to the projection function.
	 * @typeparam A5 The type of the fifth atom passed in and type of the fifth
	 *   argument to the projection function.
	 * @typeparam A6 The type of the sixth atom passed in and type of the sixth
	 *   argument to the projection function.
	 * @typeparam A7 The type of the seventh atom passed in and type of the seventh
	 *   argument to the projection function.
	 */
	<T, A1, A2, A3, A4, A5, A6, A7>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		atom4: IAtom<A4>,
		atom5: IAtom<A5>,
		atom6: IAtom<A6>,
		atom7: IAtom<A7>,
		projection: (
			a1: Readonly<A1>,
			a2: Readonly<A2>,
			a3: Readonly<A3>,
			a4: Readonly<A4>,
			a5: Readonly<A5>,
			a6: Readonly<A6>,
			a7: Readonly<A7>,
		) => T,
	): Projector<T>;
	/**
	 * When eight atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 * @typeparam A4 The type of the fourth atom passed in and type of the fourth
	 *   argument to the projection function.
	 * @typeparam A5 The type of the fifth atom passed in and type of the fifth
	 *   argument to the projection function.
	 * @typeparam A6 The type of the sixth atom passed in and type of the sixth
	 *   argument to the projection function.
	 * @typeparam A7 The type of the seventh atom passed in and type of the seventh
	 *   argument to the projection function.
	 * @typeparam A8 The type of the eighth atom passed in and type of the eighth
	 *   argument to the projection function.
	 */
	<T, A1, A2, A3, A4, A5, A6, A7, A8>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		atom4: IAtom<A4>,
		atom5: IAtom<A5>,
		atom6: IAtom<A6>,
		atom7: IAtom<A7>,
		atom8: IAtom<A8>,
		projection: (
			a1: Readonly<A1>,
			a2: Readonly<A2>,
			a3: Readonly<A3>,
			a4: Readonly<A4>,
			a5: Readonly<A5>,
			a6: Readonly<A6>,
			a7: Readonly<A7>,
			a8: Readonly<A8>,
		) => T,
	): Projector<T>;
	/**
	 * When nine atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 * @typeparam A4 The type of the fourth atom passed in and type of the fourth
	 *   argument to the projection function.
	 * @typeparam A5 The type of the fifth atom passed in and type of the fifth
	 *   argument to the projection function.
	 * @typeparam A6 The type of the sixth atom passed in and type of the sixth
	 *   argument to the projection function.
	 * @typeparam A7 The type of the seventh atom passed in and type of the seventh
	 *   argument to the projection function.
	 * @typeparam A8 The type of the eighth atom passed in and type of the eighth
	 *   argument to the projection function.
	 * @typeparam A9 The type of the ninth atom passed in and type of the ninth
	 *   argument to the projection function.
	 */
	<T, A1, A2, A3, A4, A5, A6, A7, A8, A9>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		atom4: IAtom<A4>,
		atom5: IAtom<A5>,
		atom6: IAtom<A6>,
		atom7: IAtom<A7>,
		atom8: IAtom<A8>,
		atom9: IAtom<A9>,
		projection: (
			a1: Readonly<A1>,
			a2: Readonly<A2>,
			a3: Readonly<A3>,
			a4: Readonly<A4>,
			a5: Readonly<A5>,
			a6: Readonly<A6>,
			a7: Readonly<A7>,
			a8: Readonly<A8>,
			a9: Readonly<A9>,
		) => T,
	): Projector<T>;
	/**
	 * When ten atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 * @typeparam A4 The type of the fourth atom passed in and type of the fourth
	 *   argument to the projection function.
	 * @typeparam A5 The type of the fifth atom passed in and type of the fifth
	 *   argument to the projection function.
	 * @typeparam A6 The type of the sixth atom passed in and type of the sixth
	 *   argument to the projection function.
	 * @typeparam A7 The type of the seventh atom passed in and type of the seventh
	 *   argument to the projection function.
	 * @typeparam A8 The type of the eighth atom passed in and type of the eighth
	 *   argument to the projection function.
	 * @typeparam A9 The type of the ninth atom passed in and type of the ninth
	 *   argument to the projection function.
	 * @typeparam A10 The type of the tenth atom passed in and type of the tenth
	 *   argument to the projection function.
	 */
	<T, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		atom4: IAtom<A4>,
		atom5: IAtom<A5>,
		atom6: IAtom<A6>,
		atom7: IAtom<A7>,
		atom8: IAtom<A8>,
		atom9: IAtom<A9>,
		atom10: IAtom<A10>,
		projection: (
			a1: Readonly<A1>,
			a2: Readonly<A2>,
			a3: Readonly<A3>,
			a4: Readonly<A4>,
			a5: Readonly<A5>,
			a6: Readonly<A6>,
			a7: Readonly<A7>,
			a8: Readonly<A8>,
			a9: Readonly<A9>,
			a10: Readonly<A10>,
		) => T,
	): Projector<T>;
	/**
	 * When eleven atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 * @typeparam A4 The type of the fourth atom passed in and type of the fourth
	 *   argument to the projection function.
	 * @typeparam A5 The type of the fifth atom passed in and type of the fifth
	 *   argument to the projection function.
	 * @typeparam A6 The type of the sixth atom passed in and type of the sixth
	 *   argument to the projection function.
	 * @typeparam A7 The type of the seventh atom passed in and type of the seventh
	 *   argument to the projection function.
	 * @typeparam A8 The type of the eighth atom passed in and type of the eighth
	 *   argument to the projection function.
	 * @typeparam A9 The type of the ninth atom passed in and type of the ninth
	 *   argument to the projection function.
	 * @typeparam A10 The type of the tenth atom passed in and type of the tenth
	 *   argument to the projection function.
	 * @typeparam A11 The type of the eleventh atom passed in and type of the
	 *   eleventh argument to the projection function.
	 */
	<T, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		atom4: IAtom<A4>,
		atom5: IAtom<A5>,
		atom6: IAtom<A6>,
		atom7: IAtom<A7>,
		atom8: IAtom<A8>,
		atom9: IAtom<A9>,
		atom10: IAtom<A10>,
		atom11: IAtom<A11>,
		projection: (
			a1: Readonly<A1>,
			a2: Readonly<A2>,
			a3: Readonly<A3>,
			a4: Readonly<A4>,
			a5: Readonly<A5>,
			a6: Readonly<A6>,
			a7: Readonly<A7>,
			a8: Readonly<A8>,
			a9: Readonly<A9>,
			a10: Readonly<A10>,
			a11: Readonly<A11>,
		) => T,
	): Projector<T>;
	/**
	 * When twelve atom-like objects are passed.
	 *
	 * @typeparam T The return type of the projection function at type of the
	 *   projector's value.
	 * @typeparam A1 The type of the first atom passed in and type of the first
	 *   argument to the projection function.
	 * @typeparam A2 The type of the second atom passed in and type of the second
	 *   argument to the projection function.
	 * @typeparam A3 The type of the third atom passed in and type of the third
	 *   argument to the projection function.
	 * @typeparam A4 The type of the fourth atom passed in and type of the fourth
	 *   argument to the projection function.
	 * @typeparam A5 The type of the fifth atom passed in and type of the fifth
	 *   argument to the projection function.
	 * @typeparam A6 The type of the sixth atom passed in and type of the sixth
	 *   argument to the projection function.
	 * @typeparam A7 The type of the seventh atom passed in and type of the seventh
	 *   argument to the projection function.
	 * @typeparam A8 The type of the eighth atom passed in and type of the eighth
	 *   argument to the projection function.
	 * @typeparam A9 The type of the ninth atom passed in and type of the ninth
	 *   argument to the projection function.
	 * @typeparam A10 The type of the tenth atom passed in and type of the tenth
	 *   argument to the projection function.
	 * @typeparam A11 The type of the eleventh atom passed in and type of the
	 *   eleventh argument to the projection function.
	 * @typeparam A12 The type of the twelth atom passed in and type of the twelth
	 *   argument to the projection function.
	 */
	<T, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12>(
		atom1: IAtom<A1>,
		atom2: IAtom<A2>,
		atom3: IAtom<A3>,
		atom4: IAtom<A4>,
		atom5: IAtom<A5>,
		atom6: IAtom<A6>,
		atom7: IAtom<A7>,
		atom8: IAtom<A8>,
		atom9: IAtom<A9>,
		atom10: IAtom<A10>,
		atom11: IAtom<A11>,
		atom12: IAtom<A12>,
		projection: (
			a1: Readonly<A1>,
			a2: Readonly<A2>,
			a3: Readonly<A3>,
			a4: Readonly<A4>,
			a5: Readonly<A5>,
			a6: Readonly<A6>,
			a7: Readonly<A7>,
			a8: Readonly<A8>,
			a9: Readonly<A9>,
			a10: Readonly<A10>,
			a11: Readonly<A11>,
			a12: Readonly<A12>,
		) => T,
	): Projector<T>;
}

/**
 * Create a new projector, which will take in atom-like objects as input and
 * a function that combines their values into a new value. Commonly this is
 * referred to as a "computed value." Projectors can be used to many purposes,
 * if the new data is just a unique combination of existing values then it's
 * better to use a Projector which will automatically subscribe to the passed in
 * atom-like objects and update when they update. Coordinating this without a
 * projector is possible but why go through all that extra work?
 *
 * #### NOTE
 *
 * Since ReadonlyAtom's don't "start" when they don't have subscribers, Projector
 * tries to play smart and mimic this. If it detects that it received a
 * ReadonlyAtom as an input atom it will not subscribe to it unless the Projector
 * itself has a subscriber. If the ReadonlyAtom is live and running then the
 * Projector will be out of sync with it's current value. To fix this, provide
 * a no-op subscriber to the projector or subscribe to it to receive reactive
 * updates.
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
 * See it on [CodePen](https://codepen.io/bbuck/pen/QWdeMpe).
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
 * See it on [CodePen](https://codepen.io/bbuck/pen/gOgVxXQ)
 *
 * A simple and clean way to control how data is rendered, just modify `fullName`'s
 * projection function to, say, change the computed value to `last, first`
 * instead.
 *
 * @param args Args is a list of atoms followed by a projection function. **NOTE**
 *   Right now the limitation is that up to 12 atoms is supported (Typed), if
 *   more is necessary consider created a product from your atoms and passing
 *   that instead.
 * @returns A new projector that will act like an atom (has a value, subscribe,
 *   and unsubscribe function). This projector's projection function will be
 *   executed when any of the atoms provided are updated.
 */
export const projector: ProjectorCreator = <T>(...args: unknown[]): Projector<T> => {
	if (args.length < 2) {
		throw new TypeError('projector takes a minimum of two (2) arguments, an atom-like and a projection function');
	}

	const projection = args[args.length - 1] as ProjectionFunction<T>;
	const atoms: IAtom<unknown>[] = [];
	args.forEach((arg, index) => {
		if (index !== args.length - 1) {
			atoms.push(arg as IAtom<unknown>);
		}
	});

	return new Projector(atoms, projection);
};
