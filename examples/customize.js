const AsyncMark = require('../dist/index.js');


const suite = new AsyncMark.Suite({
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

suite.add(new AsyncMark.Benchmark({
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
