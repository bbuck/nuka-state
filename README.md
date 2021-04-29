# @nuka/state

## Installation

TODO: Publish to NPM and provide installation insructions

## Description

`@nuka/state` is an application state-management library that focus on small
units of state instead of large chunks of global state. The idea is that small
state changes should not affect parts of a project that don't care/depend on
those changes. This is accomplished with the **atom**, the smallest unit of state
storage in `@nuka/state`. You encapsulate your state values in an **atom** and then
you can use the value anywhere in your project. Combine that with subscribing
to the item to be notified when the value is modified and you can react to
state changes no matter when or where they occur.

Here is a simple counter example:

```javascript
import { atom } from '@nuka/state';

// This is the magic, counter is now an atom and ready to be used.
const counter = atom(0);

const countDisplay = document.querySelector('#count-display');
// subscribe functions receive the atom as their argument allowing for flexible
// definition patterns
counter.subscribe(atom => {
	countDisplay.textContent = `Current count: ${atom.value}`;
});

const incrementButton = document.querySelector('#increment-button');
// update receives the current value and should return the next new value,
// updates are queued and fired in order so multiple increments back to back
// will not cause any race conditions modifying the value.
incrementButton.addEventListener('click', () => counter.update(n => n + 1));
```

[Try it out on CodePen!](https://codepen.io/bbuck/pen/yLgwBGL?editors=0010)

## Roadmap

- [x] Project setup (mostly done, maybe some minor cleanup here and there)
- [x] BaseAtom (base implementation for an atom)
- [x] ReadonlyAtom (readonly atom implementation with dynamic update options)
- [x] Atom (mostly implemented, basic core library feature)
- [ ] more documentation
- [ ] more tests
- [ ] Product (a combination of several atoms into a single atom-like structure)
- [ ] Reactor (a atom-like wrapper around atoms that provide named actions for
      use.
- [ ] Projector (an atom-like structure that takes one or more atoms and provides
      a different value, such as taking two count atoms and providing their
      sum as it's value).
- [ ] Publish to NPM
- [ ] (Sister project) React hook bindings allowing components to respond to
      atom updates.
- [ ] (Sister project) DOM tools to simplify working with atoms and native DOM
      APIs.

## Contributing

Contributions are totally welcome and greatly appreciated. In order to contribute
please follow these simple steps:

1. Find or create an issue detailing the problem you're looking to solve.
1. Fork `nuka-state` and create a branch for your work.
1. Solve the problem (this step could be hard!)
1. Commit your work and create a pull request against the `develop` branch
1. Wait for a review from an existing maintainer or contributor
1. Enjoy the fruits of your labor as your work has been merged (there may be a
   delay between merging the PR and it being published on NPM)!

# Contributors

Brandon Buck / @bbuck (Creator/maintainer)
