const AsyncMark = require('../dist/index.js');


const benchmark = new AsyncMark.Benchmark({
    number: 1,
    before() {
        this.token += '[benchmark]';
        console.log('  5: Benchmark#before', this.token);
    },
    beforeEach() {
        console.log('  8: Benchmark#beforeEach', this.token);
    },
    fun() {
        console.log('    9: Benchmark#fun', this.token);
    },
    afterEach() {
        console.log('  10: Benchmark#afterEach', this.token);
    },
    after() {
        console.log('  13: Benchmark#after', this.token);
    },
});


const child = new AsyncMark.Suite({
    benchmarkDefault: {number: 1},
    before() {
        this.token += '[child suite]';
        console.log(' 3: Suite#before', this.token);
    },
    beforeEach() {
        console.log(' 4: Suite#beforeEach', this.token);
    },
    beforeTest() {
        console.log('7: Suite#beforeTest (child suite)', this.token);
    },
    afterTest() {
        console.log('11: Suite#afterTest (child suite)', this.token);
    },
    afterEach() {
        console.log(' 14: Suite#afterEach', this.token);
    },
    after() {
        console.log(' 15: Suite#after', this.token);
    },
});


const parent_ = new AsyncMark.Suite({
    before() {
        this.token = '[parent suite]';
        console.log('1: Suite#before', this.token);
    },
    beforeEach() {
        console.log('2: Suite#beforeEach', this.token);
    },
    beforeTest() {
        console.log('6: Suite#beforeTest (parent suite)', this.token);
    },
    afterTest() {
        console.log('12: Suite#afterTest (parent suite)', this.token);
    },
    afterEach() {
        console.log('16: Suite#afterEach', this.token);
    },
    after() {
        console.log('17: Suite#after', this.token);
    },
});

child.add(benchmark);
parent_.add(child);
parent_.run().catch(err => console.error(err));
