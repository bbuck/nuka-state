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
				await delay(50);
				expect(atom.value).toEqual(10);
			});
		});

		describe('.subscribe', () => {
			it('updates the value when there is a subscriber', async () => {
				const atom = readonlyAtom(10, set => {
					setTimeout(() => set(30), 50);

					return noOp;
				});

				expect(atom.value).toEqual(10);
				atom.subscribe(noOp);
				await delay(75);
				expect(atom.value).toEqual(30);
			});

			it('notifies the subscriber when the value changes', async () => {
				let expectedValue = 20;

				const atom = readonlyAtom(10, set => {
					const interval = setInterval(() => {
						set(atom.value + 10);
					}, 50);

					return () => clearInterval(interval);
				});

				const subscriber = (a: ReadonlyAtom<number>) => {
					expect(a.value).toEqual(expectedValue);
					expectedValue += 10;

					if (expectedValue > 40) {
						atom.unsubscribe(subscriber);
					}
				};

				atom.subscribe(subscriber);

				await delay(175);
			});
		});

		describe('.unsubscribe', () => {
			it('stops updating when unsubscribing', async () => {
				const atom = readonlyAtom(10, set => {
					const interval = setInterval(() => {
						set(atom.value + 10);
					}, 50);

					return () => clearInterval(interval);
				});

				expect(atom.value).toEqual(10);
				atom.subscribe(noOp);
				await delay(75);
				expect(atom.value).toEqual(20);
				atom.unsubscribe(noOp);
				await delay(50);
				expect(atom.value).toEqual(20);
			});
		});

		describe('.setLive', () => {
			it("updates the value when when it's live", async () => {
				const atom = readonlyAtom(10, set => {
					setTimeout(() => set(30), 40);

					return noOp;
				});

				expect(atom.value).toEqual(10);
				atom.setLive(true);
				await delay(75);
				expect(atom.value).toEqual(30);
			});

			it('stops updating when no longer marked as live', async () => {
				const atom = readonlyAtom(10, set => {
					const interval = setInterval(() => {
						set(atom.value + 10);
					}, 50);

					return () => clearInterval(interval);
				});

				expect(atom.value).toEqual(10);
				atom.setLive(true);
				await delay(75);
				expect(atom.value).toEqual(20);
				atom.setLive(false);
				await delay(50);
				expect(atom.value).toEqual(20);
			});
		});

		describe('general usage', () => {
			it('marking as not live while subscribed does not stop updates', async () => {
				const atom = readonlyAtom(10, set => {
					const interval = setInterval(() => {
						set(atom.value + 10);
					}, 50);

					return () => clearInterval(interval);
				});

				expect(atom.value).toEqual(10);
				atom.setLive(true);
				atom.subscribe(noOp);
				await delay(75);
				expect(atom.value).toEqual(20);
				atom.setLive(false);
				await delay(50);
				expect(atom.value).toEqual(30);
				atom.unsubscribe(noOp);
			});

			it('does not update without being live or having subscribers', async () => {
				const atom = readonlyAtom(10, set => {
					const interval = setInterval(() => {
						set(atom.value + 10);
					}, 50);

					return () => clearInterval(interval);
				});

				expect(atom.value).toEqual(10);
				await delay(75);
				expect(atom.value).toEqual(10);
			});

			it('unsubscribe while marked live does not stop updates', async () => {
				const atom = readonlyAtom(10, set => {
					const interval = setInterval(() => {
						set(atom.value + 10);
					}, 50);

					return () => clearInterval(interval);
				});

				expect(atom.value).toEqual(10);
				atom.setLive(true);
				atom.subscribe(noOp);
				await delay(75);
				expect(atom.value).toEqual(20);
				atom.unsubscribe(noOp);
				await delay(50);
				expect(atom.value).toEqual(30);
				atom.setLive(false);
			});
		});
	});
});
