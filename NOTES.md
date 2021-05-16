# Greasemonkey Notes

## API

* [Greasemonkey API](https://wiki.greasespot.net/Greasemonkey_Manual:API)

## API Usage

There is only one object provided to user scripts now, named `GM`. It has several properties and several methods:
* `getResourceUrl`,
* `deleteValue`/`getValue`/`listValues`/`setValue`,
* `xmlHttpRequest`.

To use these methods set `@grant`, e.g.:

```
// @grant GM.setValue
```

The return values of these methods are `Promise`'s. The `async` and `await` keywords make asynchronous promises easy to work with. For example:

```
// ==UserScript==
// @name     GM set/get demo
// @grant    GM.getValue
// @grant    GM.setValue
// ==/UserScript==

(async function() {
  console.log('Starting the get/set demo ...');
  let i = await GM.getValue('i', 0);
  console.log(`This time, i was ${i}.`);
  GM.setValue('i', i+1);
})();
```

## Extensions

### jQuery

Has to be explicitly provided in the [metadata block](https://wiki.greasespot.net/Metadata_Block):

```
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
```

### waitForKeyElements

* [CoeJoder fork](https://github.com/CoeJoder/waitForKeyElements.js)
* [original](https://gist.github.com/BrockA/2625891)

A utility function that detects and handles AJAXed content.

```
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
```