export interface AtomSubscriber<T> {
	(atom: T): void;
}

export default class BaseAtom<T> {
	#value: T;
	#subscribers: AtomSubscriber<this>[];

	constructor(value: T) {
		this.#value = value;
		this.#subscribers = [];
	}

	get value(): T {
		return this.#value;
	}

	subscribe(subscriber: AtomSubscriber<this>) {
		this.#subscribers.push(subscriber);
	}

	unsubscribe(subscriber: AtomSubscriber<this>) {
		this.#subscribers.filter(sub => sub !== subscriber)
	};

	protected hasSubscribers() {
		return this.#subscribers.length > 0;
	}

	protected notifySubscribers() {
		this.#subscribers.forEach(subscriber => subscriber(this));
	}

	protected setValue(newValue: T) {
		this.#value = newValue;
	}
}
