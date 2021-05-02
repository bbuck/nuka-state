import { readonlyAtom } from './atoms';
import ReadonlyAtom from './ReadonlyAtom';
import { delay, noOp } from './testHelpers';

describe('readonlyAtom', () => {
	it('constructs a ReadonlyAtom', () => {
		const atom = readonlyAtom(10);

		expect(atom).toBeInstanceOf(ReadonlyAtom);
	});
});

describe('ReadonlyAtom', () => {
	describe('looks like an atom (IAtom)', () => {
		const atom = readonlyAtom(10);

		it('has a value property', () => {
			expect(atom.value).toEqual(10);
		});

		it('has a subscribe function', () => {
			expect(atom.subscribe).toBeInstanceOf(Function);
		});

		it('has an unsubscribe function', () => {
			expect(atom.unsubscribe).toBeInstanceOf(Function);
		});
	});

	describe('static value', () => {
		describe('construction', () => {
			it('does not break without a start function', () => {
				expect(() => readonlyAtom(10)).not.toThrow();
			});
		});

		describe('.value', () => {
			it('returns the expected initial value', () => {
				const atom = readonlyAtom(10);

				expect(atom.value).toEqual(10);
			});

			it('can handle null and undefined', () => {
				const nullAtom = readonlyAtom(null);
				const undefinedAtom = readonlyAtom(undefined);

				expect(nullAtom.value).toEqual(null);
				expect(undefinedAtom.value).toEqual(undefined);
			});
		});
	});

	describe('with a start function', () => {
		describe('construction', () => {
			it('uses the initialValue (does not update value)', async () => {
				const atom = readonlyAtom(10, set => {
					setTimeout(() => set(30), 0);

					return noOp;
				});

				expect(atom.value).toEqual(10);

				await delay(100);

				expect(atom.value).toEqual(10);
			});

			it('updates the value when there is a subscriber', async () => {
				const atom = readonlyAtom(10, set => {
					setTimeout(() => set(30), 200);

					return noOp;
				});

				expect(atom.value).toEqual(10);

				atom.subscribe(noOp);

				await delay(400);

				expect(atom.value).toEqual(30);
			});

			it("updates the value when when it's live", async () => {
				const atom = readonlyAtom(10, set => {
					setTimeout(() => set(30), 200);

					return noOp;
				});

				expect(atom.value).toEqual(10);

				atom.setLive(true);

				await delay(400);

				expect(atom.value).toEqual(30);
			});

			it('stops updating when there are no subscribers', async () => {
				const atom = readonlyAtom(10, set => {
					const interval = setInterval(() => {
						set(atom.value + 10);
					}, 200);

					return () => clearInterval(interval);
				});

				expect(atom.value).toEqual(10);

				atom.subscribe(noOp);

				await delay(300);

				expect(atom.value).toEqual(20);
				atom.unsubscribe(noOp);

				await delay(200);

				expect(atom.value).toEqual(20);
			});

			it('stops updating when no longer marked as live', async () => {
				const atom = readonlyAtom(10, set => {
					const interval = setInterval(() => {
						set(atom.value + 10);
					}, 200);

					return () => clearInterval(interval);
				});

				expect(atom.value).toEqual(10);

				atom.setLive(true);

				await delay(300);

				expect(atom.value).toEqual(20);
				atom.setLive(false);

				await delay(200);

				expect(atom.value).toEqual(20);
			});

			it('unsubscribe while marked live does not stop updates', async () => {
				const atom = readonlyAtom(10, set => {
					const interval = setInterval(() => {
						set(atom.value + 10);
					}, 200);

					return () => clearInterval(interval);
				});

				expect(atom.value).toEqual(10);
				atom.setLive(true);
				atom.subscribe(noOp);

				await delay(250);

				expect(atom.value).toEqual(20);
				atom.unsubscribe(noOp);

				await delay(200);

				expect(atom.value).toEqual(30);
				atom.setLive(false);
			});
		});
	});
});
