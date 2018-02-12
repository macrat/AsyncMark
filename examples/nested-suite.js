const AsyncMark = require('../dist/asyncmark.js');


const benchmark = new AsyncMark.Benchmark({
    number: 1,
    before() {
        this.token += '[benchmark]';
        console.log('  5: Benchmark#before', this.token);
    },
    beforeEach() {
        console.log('  6: Benchmark#beforeEach', this.token);
    },
    fun() {
        console.log('    7: Benchmark#fun', this.token);
    },
    afterEach() {
        console.log('  8: Benchmark#afterEach', this.token);
    },
    after() {
        console.log('  9: Benchmark#after', this.token);
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
    afterEach() {
        console.log(' 10: Suite#afterEach', this.token);
    },
    after() {
        console.log(' 11: Suite#after', this.token);
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
    afterEach() {
        console.log('12: Suite#afterEach', this.token);
    },
    after() {
        console.log('13: Suite#after', this.token);
    },
});

child.add(benchmark);
parent_.add(child);
parent_.run().catch(err => console.error(err));
