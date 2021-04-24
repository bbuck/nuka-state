import BaseAtom from './BaseAtom';

describe('BaseAtom', () => {
	describe('constructing instances', () => {
		it('allows creation with new', () => {
			expect(() => new BaseAtom(null)).not.toThrow();
		});
	});

	describe('value property', () => {
		it('allows access to the value via the getter', () => {
			const atom = new BaseAtom([]);
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
			const atom = new BaseAtom(value);

			expect(atom.value).toEqual(value);
		});
	});
});
