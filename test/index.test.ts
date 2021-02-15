import Promisifyer, { PromisifyerTimeout } from '../src/index';

describe('Promisifyer', () => {
	test('should return result if delay is 0ms', async () => {
		expect.assertions(1);
		const promisifyer = new Promisifyer();
		const result = await promisifyer.run((requestID) => {
			setTimeout(() => {
				promisifyer.handler(requestID, 'hello 0');
			}, 0);
		});
		expect(result).toBe('hello 0');
	});

	test('should return result if delay is 100ms', async (): Promise<void> => {
		expect.assertions(1);
		const promisifyer = new Promisifyer();
		const result = await promisifyer.run((requestID) => {
			setTimeout(() => {
				promisifyer.handler(requestID, 'hello 100');
			}, 100);
		});
		expect(result).toBe('hello 100');
	});

	test('should return result if delay is more than timeout from options', async (): Promise<void> => {
		expect.assertions(1);
		const promisifyer = new Promisifyer({ timeout: 200 });
		const result = await promisifyer.run((requestID) => {
			setTimeout(() => {
				promisifyer.handler(requestID, 'hello 100');
			}, 100);
		});
		expect(result).toBe('hello 100');
	});

	test('should reject result if delay is more than timeout set in options', async (): Promise<void> => {
		expect.assertions(1);
		const promisifyer = new Promisifyer({ timeout: 100 });
		try {
			await promisifyer.run((requestID) => {
				setTimeout(() => {
					promisifyer.handler(requestID, 'hello 200');
				}, 200);
			});
		} catch (err) {
			expect(err).toBeInstanceOf(PromisifyerTimeout);
		}
	});

	test('should reject after the default timeout of 3000ms', async (): Promise<void> => {
		expect.assertions(1);
		const promisifyer = new Promisifyer();
		try {
			await promisifyer.run((requestID) => {
				// Don't do anything.
			});
		} catch (err) {
			expect(err).toBeInstanceOf(PromisifyerTimeout);
		}
	});
});
