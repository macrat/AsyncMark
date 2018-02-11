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

## installation
### Node.js
``` shell
$ npm install git+https://github.com/macrat/PromiseBench.git
```

#### ES6
``` javascript
import Benchmark, {Suite} from 'promise-bench';
```

#### CommonJS
``` javascript
const PromiseBench = require('promise-bench');

const Benchmark = PromiseBench.Benchmark;
const Suite = PromiseBench.Suite;
```

### Browser
``` html
<script src="https://rawgit.com/macrat/PromiseBench/master/dist/promise-bench.web.js"></script>
<script>
const Benchmark = PromiseBench.Benchmark;
const Suite = PromiseBench.Suite;
</script>
```
