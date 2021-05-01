import { atom, projector } from './atoms';

describe('Projector', () => {
	describe('.value', () => {
		it('is set based on the projection return type', () => {
			const count1 = atom(10);
			const count2 = atom(4);

			const countSum = projector(count1, count2, (a, b) => a + b);

			expect(countSum.value).toEqual(14);
		});
	});
});
