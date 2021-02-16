export class PromisifyerTimeout extends Error {
	public readonly reference: number;

	constructor(reference: number) {
		super(`Request ${reference} timed out`);
		this.name = "PromisifyerTimeout";
		this.reference = reference;
	}
}

type PromiseResolver<T> = (value: T) => void;

interface PendingTask<T> {
	timeout: number | NodeJS.Timeout;
	resolver: PromiseResolver<T>;
}

interface PromisifyerOptions {
	/**
	 * Timeout in milliseconds that is applied to all `run` requests.
	 * 
	 * Default: 3000
	 */
	timeout: number;
}

const defaultOptions: PromisifyerOptions = {
	timeout: 3000,
};

/**
 * Merges two technically unrelated events into one Promise with a timeout.
 */
export default class Promisifyer<T> {
	private options: PromisifyerOptions;
	private idCounter = 0;
	private pendingTasks = new Map<number, PendingTask<T>>();

	/**
	 * @param handler A handler function that needs to be registered here and as the event handler
	 * for whatever receives the asynchynous response data.
	 */
	constructor (options?: Partial<PromisifyerOptions>) {
		this.options = {
			...defaultOptions,
			...(options || {}),
		};
	}

	public run(task: (ref: number) => void): Promise<T> {
		const reference = ++this.idCounter;

		return new Promise<T>((resolver, reject) => {
			const timeout = setTimeout(() => {
				// If the task is still registered now (after the timeout has elapsed),
				// cancel the request by removing the registration and rejecting the Promise.
				if (this.pendingTasks.has(reference)) {
					this.pendingTasks.delete(reference);
					reject(new PromisifyerTimeout(reference));
				}
			}, this.options.timeout);

			this.pendingTasks.set(reference, {
				resolver,
				timeout,
			});

			// Execute the task by passing in the request ID. It's the task's responsibility
			// to pass on the request ID as needed in order to make the event later return the
			// same  ID when `this.handler` is being called.
			task(reference);
		});
	}

	/**
	 * This method must be used as or called in the event handler for the event
	 * that will provide the data we’re waiting for, e.g. a WebSocket event.
	 * @param reference The original reference that had been passed around.
	 * @param data The actual response data.
	 */
	public handler(reference: number, data: T): void {
		// Check if we're still interested in this event.
		const pendingTask = reference > 0 && this.pendingTasks.get(reference);
		if (pendingTask) {
			const { resolver, timeout } = pendingTask;
			clearTimeout(timeout as number);
			this.pendingTasks.delete(reference);
			resolver(data);
		}
	}
}
