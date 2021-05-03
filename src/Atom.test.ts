import { atom } from './atoms';
import Atom from './Atom';
import { delay, noOp } from './testHelpers';

describe('atom', () => {
	it('creates an Atom', () => {
		const test = atom(10);

		expect(test).toBeInstanceOf(Atom);
	});
});

describe('Atom', () => {
	describe('construction', () => {
		it('does not blow up', () => {
			expect(() => atom(10)).not.toThrow();
		});

		it('sets the initial value', () => {
			const test = atom(10);

			expect(test.value).toEqual(10);
		});
	});

	describe('.set', () => {
		it('changes the value immediately', () => {
			const test = atom(10);

			expect(test.value).toEqual(10);
			test.set(20);
			expect(test.value).toEqual(20);
		});

		it('prevents any updates from firing', async () => {
			const test = atom(10);

			test.update(n => n + 10);
			test.update(n => n + 10);
			test.set(0);
			await delay(50);
			expect(test.value).toEqual(0);
		});
	});

	describe('.update', () => {
		it('does not update the value immediately', () => {
			const test = atom(10);

			test.update(n => n + 10);
			expect(test.value).toEqual(10);
		});

		it('accepts an update function', async () => {
			const test = atom(10);

			test.update(n => n + 10);
			await delay(10);
			expect(test.value).toEqual(20);
		});

		it('accpets a value', async () => {
			const test = atom(10);

			test.update(test.value + 10);
			await delay(50);
			expect(test.value).toEqual(20);
		});

		it('runs updates in order', async () => {
			const expectedValues = ['first', 'second'];
			let expectedIndex = 0;

			const test = atom('initial');

			const subscriber = (t: Atom<string>) => {
				expect(t.value).toEqual(expectedValues[expectedIndex]);
				expectedIndex += 1;

				if (expectedIndex >= expectedValues.length) {
					test.unsubscribe(subscriber);
				}
			};
			test.subscribe(subscriber);

			expect(test.value).toEqual('initial');
			test.update('first');
			test.update('second');
			await delay(50);
		});
	});

	describe('.subscribe', () => {
		it('allows clients to subscribe', () => {
			const test = atom(10);

			expect(() => test.subscribe(noOp)).not.toThrow();
		});

		it('notifies subscribers when value changes', async () => {
			const test = atom(10);

			test.subscribe(t => {
				expect(t.value).toEqual(20);
			});

			test.set(20);
			await delay(10);
		});
	});

	describe('.unsubscribe', () => {
		it('allows clients to unsubscribe', () => {
			const test = atom(10);

			expect(() => test.unsubscribe(noOp)).not.toThrow();
		});

		it('removes the subscriber and no longer calls it', async () => {
			const test = atom(10);

			const subscriber = (_t: Atom<number>) => {
				throw new Error('This should not have been called');
			};

			test.subscribe(subscriber);
			test.unsubscribe(subscriber);
			test.set(20);
			await delay(10);
		});
	});
});
