import BaseAtom from './BaseAtom';

describe('BaseAtom', () => {
	// BaseAtom is abstract, have to test a subclass so let's make one that's
	// empty.
	class TestAtom<T> extends BaseAtom<T> {}

	describe('constructing instances', () => {
		it('allows creation with new', () => {
			expect(() => new TestAtom(null)).not.toThrow();
		});
	});

	describe('get value', () => {
		it('allows access to the value via the getter', () => {
			const atom = new TestAtom([]);
			expect(() => atom.value.length).not.toThrow();
		});

		it.each([
			['number', 10],
			['string', 'string'],
			['boolean', true],
			['boolean', false],
			['null', null],
			['undefined', undefined],
			['object', {}],
			['array', []],
		])('when created with a %s it returns the same value', (_typ, value) => {
			const atom = new TestAtom(value);

			expect(atom.value).toEqual(value);
		});
	});

	describe('.subscribe', () => {
		it('allows users to subscribe', () => {
			const atom = new TestAtom(10);

			// eslint-disable-next-line @typescript-eslint/no-empty-function
			expect(() => atom.subscribe(_atom => {})).not.toThrow();
		});
	});

	describe('.unsubscribe', () => {
		it('allows users to unsubscribe', () => {
			const atom = new TestAtom(10);

			// eslint-disable-next-line @typescript-eslint/no-empty-function
			expect(() => atom.unsubscribe(_atom => {})).not.toThrow();
		});
	});
});
