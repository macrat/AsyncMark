AsyncMark
=========

A benchmarking library for javascript that supports Promise.

[![NPM](https://nodei.co/npm/asyncmark.png)](https://nodei.co/npm/asyncmark/)

[![Build Status](https://travis-ci.org/macrat/AsyncMark.svg?branch=master)](https://travis-ci.org/macrat/AsyncMark)
[![Test Coverage](https://api.codeclimate.com/v1/badges/cd3cd1561b170ca42584/test_coverage)](https://codeclimate.com/github/macrat/AsyncMark/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/cd3cd1561b170ca42584/maintainability)](https://codeclimate.com/github/macrat/AsyncMark/maintainability)
[![license](https://img.shields.io/github/license/macrat/AsyncMark.svg)](https://github.com/macrat/AsyncMark/blob/master/LICENSE)
[![document](https://macrat.github.io/AsyncMark/badge.svg)](https://macrat.github.io/AsyncMark/)

## be simple
``` javascript
import Benchmark from 'asyncmark';


new Benchmark(function() {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, 100);
    });
}).run().catch(console.error);
```

## be customizable
``` javascript
import {Suite} from 'asyncmark';


const suite = new Suite({
    name: 'ways to find a character',
    beforeEach() {
        this.text = 'hello world';
    },
    parallel: true,
});

suite.add(function() {
    /o/.test(this.text);
});

suite.add({
    name: 'String#indexOf',
    before() {
        console.log('starting String#indexOf...');
    },
    fun() {
        this.text.indexOf('o') > -1;
    },
});

suite.add(new Benchmark({
    name: 'String#match',
    fun() {
        Boolean(this.text.match(/o/));
    },
    after(result) {
        console.log('String#match is done! ' + result);
    },
}));

suite.run()
    .then(results => {
        let min = results[0];
        results.forEach(x => {
            if (min.average > x.average) {
                min = x;
            }
        });
        console.log(min.name + ' is best way!');
    }).
    catch(err => console.error(err));
```

## installation
### Node.js
``` shell
$ npm install asyncmark
```

#### ES6
``` javascript
import Benchmark, {Suite} from 'asyncmark';
```

#### CommonJS
``` javascript
const AsyncMark = require('asyncmark');

const Benchmark = AsyncMark.Benchmark;
const Suite = AsyncMark.Suite;
```

### Browser
``` html
<script src="https://unpkg.com/asyncmark"></script>
<script>
const Benchmark = AsyncMark.Benchmark;
const Suite = AsyncMark.Suite;
</script>
```
