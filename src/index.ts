export class PromisifyerTimeout extends Error {
	public readonly requestID: number;

	constructor(requestID: number) {
		super(`Request ${requestID} timed out`);
		this.name = "PromisifyerTimeout";
		this.requestID = requestID;
	}
}

type PromiseResolver<T> = (value: T) => void;

interface PendingTask<T> {
	timeout: number | NodeJS.Timeout;
	resolver: PromiseResolver<T>;
}

interface PromisifyerOptions {
	/** Default timeout in milliseconds (default: 3000). */
	timeout: number;
}

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
			timeout: 3000,
			...(options || {}),
		};
	}

	public run(task: (requestID: number) => void): Promise<T> {
		const requestID = ++this.idCounter;

		return new Promise<T>((resolver, reject) => {
			const timeout = setTimeout(() => {
				// If the task is still registered now (after the timeout has elapsed),
				// cancel the request by removing the registration and rejecting the Promise.
				if (this.pendingTasks.has(requestID)) {
					this.pendingTasks.delete(requestID);
					reject(new PromisifyerTimeout(requestID));
				}
			}, this.options.timeout);

			this.pendingTasks.set(requestID, {
				resolver,
				timeout,
			});

			// Execute the task by passing in the request ID. It's the task's responsibility
			// to pass on the request ID as needed in order to make the event later return the
			// same  ID when `this.handler` is being called.
			task(requestID);
		});
	}

	/**
	 * This method must be registered as the event handler for the event that will
	 * provide the data we’re waiting for, e.g. a WebSocket event.
	 */
	public handler(originalRequestID: number, data: T): void {
		// Check if we're still interested in this event.
		const pendingTask = originalRequestID > 0 && this.pendingTasks.get(originalRequestID);
		if (pendingTask) {
			const { resolver, timeout } = pendingTask;
			clearTimeout(timeout as number);
			this.pendingTasks.delete(originalRequestID);
			resolver(data);
		}
	}
}
