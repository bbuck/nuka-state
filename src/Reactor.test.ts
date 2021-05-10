import { atom } from './atoms';
import Reactor from './Reactor';
import { delay } from './testHelpers';

describe('Reactor', () => {
	const generateReactor = () => {
		const counter = atom(0);
		const counterReactor = new Reactor(counter, {
			increment: (value: number, incr = 1) => value + incr,
			decrement: (value: number, decr = 1) => value - decr,
		});

		return [counter, counterReactor] as const;
	};

	describe('construction', () => {
		const [counter, counterReactor] = generateReactor();

		it('has the same value as the atom', () => {
			expect(counterReactor.value).toEqual(counter.value);
			counter.set(10);
			expect(counterReactor.value).toEqual(counter.value);
		});
	});

	describe('.react', () => {
		it('updates the underlying atom', async () => {
			const [counter, counterReactor] = generateReactor();

			expect(counter.value).toEqual(0);
			counterReactor.react('increment');
			await delay(10);
			expect(counter.value).toEqual(1);
		});

		it('updates the underlying atom with arguments', async () => {
			const [counter, counterReactor] = generateReactor();

			expect(counter.value).toEqual(0);
			counterReactor.react('increment', 10);
			await delay(10);
			expect(counter.value).toEqual(10);
		});

		it('calling two different reactions', async () => {
			const [counter, counterReactor] = generateReactor();

			expect(counter.value).toEqual(0);
			counterReactor.react('increment');
			await delay(10);
			expect(counter.value).toEqual(1);
			counterReactor.react('decrement');
			await delay(10);
			expect(counter.value).toEqual(0);
		});

		it('fires the subscribers on the atom', async () => {
			const [counter, counterReactor] = generateReactor();

			let fired = false;
			counter.subscribe(count => {
				fired = true;

				expect(count.value).toEqual(1);
			});

			counterReactor.react('increment');
			await delay(10);
			if (!fired) {
				throw 'subscriber was not fired';
			}
		});
	});

	describe('.extract', () => {
		it('updates the underlying atom', async () => {
			const [counter, counterReactor] = generateReactor();
			const incr = counterReactor.extract('increment');

			expect(counter.value).toEqual(0);
			incr();
			await delay(10);
			expect(counter.value).toEqual(1);
		});

		it('updates the underlying atom with arguments', async () => {
			const [counter, counterReactor] = generateReactor();
			const incr = counterReactor.extract('increment');

			expect(counter.value).toEqual(0);
			incr(10);
			await delay(10);
			expect(counter.value).toEqual(10);
		});

		it('calling two different reactions', async () => {
			const [counter, counterReactor] = generateReactor();
			const incr = counterReactor.extract('increment');
			const decr = counterReactor.extract('decrement');

			expect(counter.value).toEqual(0);
			incr();
			await delay(10);
			expect(counter.value).toEqual(1);
			decr();
			await delay(10);
			expect(counter.value).toEqual(0);
		});

		it('fires the subscribers on the atom', async () => {
			const [counter, counterReactor] = generateReactor();
			const incr = counterReactor.extract('increment');

			let fired = false;
			counter.subscribe(count => {
				fired = true;

				expect(count.value).toEqual(1);
			});

			incr();
			await delay(10);
			if (!fired) {
				throw 'subscriber was not fired';
			}
		});
	});
});
