export const seconds = (seconds: number): number => seconds * 1000;

export const delay = (time: number): Promise<never> => new Promise(resolve => setTimeout(resolve, time));

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noOp = (): void => {};
