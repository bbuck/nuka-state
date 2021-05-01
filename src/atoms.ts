import ReadonlyAtom, { ReadonlyAtomStarter } from './ReadonlyAtom';
import Atom from './Atom';

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
 * const clock = readonlyAtom(new Date(), set => {
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
 * ```
 *
 * See it on [CodePen](https://codepen.io/bbuck/pen/dyNBQev).
 *
 * Another possible example would be to handle other values set by something
 * else, such as the window scroll event, which can be debounced to prevent
 * unnecessary spam.
 *
 * ```typescript
 * const scrollTop = readonlyAtom(scrollContainer.scrollTop, (set) => {
 *   set(scrollContainer.scrollTop);
 *
 *   const onScroll = throttle(
 *     () => {
 *       set(scrollContainer.scrollTop);
 *     }, 200, true);
 *
 *   scrollContainer.addEventListener("scroll", onScroll);
 *
 *   () => {
 *     scrollContainer.removeEventListener("scroll", onScroll);
 *   };
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
 * const countDisplay = document.querySelector('#count-display');
 * counter.subscribe(atom => {
 *   countDisplay.textContent = `Current count: ${atom.value}`;
 * });
 *
 * const incrementButton = document.querySelector('#increment-button');
 * incrementButton.addEventListener('click', () => counter.update(n => n + 1));
 * ```
 *
 * @param value The initial value of the atom.
 * @returns A new atom containing the initial value ready for use.
 * @typeparam T The type of the atom's value.
 */
export const atom = <T>(value: T): Atom<T> => new Atom(value);
