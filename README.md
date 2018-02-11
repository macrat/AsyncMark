PromiseBench
============

A benchmarking library for javascript that supports Promise.

[![license](https://img.shields.io/github/license/macrat/PromiseBench.svg)](https://github.com/macrat/PromiseBench/blob/master/LICENSE)
[![document](https://macrat.github.io/PromiseBench/badge.svg)](https://macrat.github.io/PromiseBench/)

## be simple
``` javascript
import Benchmark from 'promise-bench';


new Benchmark({
	name: 'timeout',
	fun() {
		return new Promise((resolve, reject) => {
			setTimeout(resolve, 100);
		});
	},
}).run().catch(console.error);
```

## be customizable
``` javascript
import {Suite} from 'promise-bench';


new Suite({
	beforeEach() {
		this.text = 'hello world';
	},
	async: true,
})
.add(function() {
	/o/.test(this.text);
})
.add({
	name: 'String#indexOf'
	before() {
		console.log('starting String#indexOf...');
	},
	fun() {
		this.text.indexOf('o') > -1;
	},
})
.add({
	name: 'String#match'
	fun() {
		!!this.text.match(/o/);
	},
	after(result) {
		console.log('String#match is done! ' + result);
	},
})
.run()
```
