# Promisifyer

[![Build Status](https://travis-ci.org/Manc/promisifyer.svg?branch=master)](https://travis-ci.org/Manc/promisifyer)

**Promisifyer** is a tiny JavaScript (TypeScript) utility with no further dependencies that makes it easy to turn expected JavaScript events from sources that are technically independent from the code that initially triggered them (e.g. Web Worker, WebSocket, other browser or Node.js events), but logically related to something that has been triggered by code into one clean native `Promise`.

For example, in a browser environment, when you send a message to a Web Worker and expect a response, you have to wait for a message event from the Web Worker, but that event will not automatically be related to the code that triggered the event in the first place. And when something goes wrong, no message will ever come back.

Wouldn’t it be better if you could send the message and `await` the result as a `Promise` in order to process the result only one line later? When no response is being received within a set amount of time you can handle that with a predictable timout error.


## Installation

```sh
# Using npm 
npm install promisifyer
 
# Using yarn 
yarn add promisifyer
```


## Usage

```TypeScript
import Promisifyer, { PromisifyerTimeout } from "promisifyer";

const promisifyer = new Promisifyer<string>({
	timeout: 3000, // Timeout in milliseconds; optional; default: 3000
});

// This example handler could can be used for any kinds of events. The only thing
// that's important is that it calls `promisifyer.handler()`.
function exampleEventHandler(originalReference: number, result: string): void {
	// Whenever a response message is being received, pass the original reference
	// and the actual result to the handler of the `Promisifyer` instance:
	promisifyer.handler(originalReference, result);
}

function doSomething(username: string): Promise<string> {
	return promisifyer.run((reference) => {
		// Do something like sending off a message including the reference to anywhere.
		// Here we simply use `setTimeout` to simulate something asynchronous.
		setTimeout(() => {
			const mockResult = `Hello ${username}!`;
			exampleEventHandler(reference, mockResult);
		}, 1000);
	});
}

doSomething("World")
	.then(result => {
		console.log(result); // "Hello World!"
	})
	.catch(err => {
		console.log("Something went wrong!");
	});
```

Promisifyer manages the references and timeouts for you. Your responsibility is to adapt your asynchronous chain of passing data around to include the reference that is generated for each run.
