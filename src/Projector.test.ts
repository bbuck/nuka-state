import { atom, projector, readonlyAtom } from './atoms';
import Projector from './Projector';
import { delay, noOp } from './testHelpers';

describe('projector', () => {
	it('creates a Projector', () => {
		const test = projector(atom(10), n => n);

		expect(test).toBeInstanceOf(Projector);
	});
});

describe('Projector', () => {
	describe('looks like an atom (IAtom)', () => {
		const test = projector(atom(10), n => n);

		it('has a value property', () => {
			expect(test.value).toEqual(10);
		});

		it('has a subscribe function', () => {
			expect(test.subscribe).toBeInstanceOf(Function);
		});

		it('has an unsubscribe function', () => {
			expect(test.unsubscribe).toBeInstanceOf(Function);
		});
	});

	describe('.value', () => {
		it('is set based on the projection return type', () => {
			const count1 = atom(10);
			const count2 = atom(4);

			const countSum = projector(count1, count2, (a, b) => a + b);

			expect(countSum.value).toEqual(14);
		});

		it('updates when atoms update', () => {
			const count1 = atom(10);
			const count2 = atom(4);

			const countSum = projector(count1, count2, (a, b) => a + b);

			expect(countSum.value).toEqual(14);
			count2.set(6);
			expect(countSum.value).toEqual(16);
			count1.set(20);
			expect(countSum.value).toEqual(26);
		});

		it('listens to readonlyAtom changes without subscribers', async () => {
			const testAtom = readonlyAtom(10, set => {
				const interval = setInterval(() => {
					set(testAtom.value + 10);
				}, 10);

				return () => clearInterval(interval);
			});

			const test = projector(testAtom, n => n);
			expect(test.value).toEqual(10);
			await delay(15);
			test.unsubscribeFromAtoms();
			expect(test.value).toEqual(20);
		});

		it('continues updating when readonlyAtom loses subscribers', async () => {
			const testAtom = readonlyAtom(10, set => {
				const interval = setInterval(() => {
					set(testAtom.value + 10);
				}, 40);

				return () => clearInterval(interval);
			});

			const test = projector(testAtom, n => n);
			test.subscribe(noOp);
			await delay(50);
			test.unsubscribe(noOp);
			await delay(40);
			test.unsubscribeFromAtoms();
			expect(test.value).toEqual(30);
		});
	});

	describe('.subscribe', () => {
		it('allows clients to subscribe', () => {
			const count = atom(0);
			const test = projector(count, n => n);
			expect(() => test.subscribe(noOp)).not.toThrow();
		});

		it('calls the function when the value is updated', async () => {
			const count = atom(0);

			const test = projector(count, n => n + 1);

			const subscriber = (proj: Projector<number>) => {
				expect(proj.value).toEqual(11);

				proj.unsubscribe(subscriber);
			};
			test.subscribe(subscriber);

			count.set(10);
			await delay(10);
			expect(test.value).toEqual(11);
		});
	});

	describe('.unsubscribe', () => {
		it('allows clients to unsubscribe', () => {
			const count = atom(0);
			const test = projector(count, n => n);

			expect(() => test.unsubscribe(noOp)).not.toThrow();
		});

		it('no longer calls the function when the value is updated', async () => {
			const count = atom(0);

			const test = projector(count, n => n + 1);

			const subscriber = (_proj: Projector<number>) => {
				throw new Error('Shouldnot be called');
			};
			test.subscribe(subscriber);
			test.unsubscribe(subscriber);

			count.set(10);
			await delay(10);
			expect(test.value).toEqual(11);
		});
	});

	describe('get .value', () => {
		it('only projects when the value property is accessed', async () => {
			const count = atom(0);
			let valueProjected = 0;
			const proj = projector(count, n => {
				valueProjected += 1;

				return n;
			});

			expect(proj.value).toEqual(0);
			expect(valueProjected).toEqual(1);
			count.update(n => n + 1);
			count.update(n => n + 1);
			await delay(10);
			expect(proj.value).toEqual(2);
			expect(valueProjected).toEqual(2);
		});
	});
});
