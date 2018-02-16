setTimeout(() => {


const __l__ = console.log;
const __e__ = console.error;

let __log__ = [];
let __bench_result__ = [];
let __executing__ = false;


console.log = function() {
    __l__(...arguments);
    __log__.push({
        type: 'out',
        message: Array.prototype.map.call(arguments, arg => String(arg)).join(' '),
    });
    __update_output__();
}

console.error = function() {
    __e__(...arguments);
    __log__.push({
        type: 'err',
        message: Array.prototype.map.call(arguments, arg => String(arg)).join(' '),
    });
    __update_output__();
}


const __initial__script__ = `// write benchmark here
// and press Ctrl-Return to execute.

new AsyncMark.Suite({
    beforeEach() {
        this.array = [];
        for (let i=0; i<100000; i++) {
            this.array.push(i*2);
        }
    },
    benchmarkDefault: {
        number: 100,
    },
})
.add({
    name: 'for',
    fun() {
        for (let i=0; i<this.array.length; i++) {
            this.array[i];
        }
    },
})
.add({
    name: 'for in',
    fun() {
        for (const i in this.array) {
            this.array[i];
        }
    },
})
.add({
    name: 'for of',
    fun() {
        for (const x of this.array) {
            x;
        }
    },
})
.add({
    name: 'forEach',
    fun() {
        this.array.forEach(x => x);
    },
})
`;

const __cm__ = CodeMirror(document.getElementById('editor'), {
    value: __initial__script__,
    lineNumbers: true,
    lineWrapping: true,
    indentUnit: 4,
    scrollBarStyle: null,
});

__cm__.addKeyMap({
    'Ctrl-Enter': function(cm) {
        __execute__();
    },
});

__cm__.focus();


function __get_table_sorter__() {
    const asc = document.querySelector('thead th.asc');
    const desc = document.querySelector('thead th.desc');
    const current = asc || desc;
    const property = current.dataset.property;

    const getter = (property === 'count') ? (id => __bench_result__[id].result.dropOutlier().msecs.length)
                                          : (id => __bench_result__[id].result.dropOutlier()[property]);

    if (asc) {
        return function(x, y) {
            if (getter(x) < getter(y)) {
                return -1;
            } else if (getter(x) > getter(y)) {
                return 1;
            } else {
                return x - y;
            }
        }
    } else {
        return function(x, y) {
            if (getter(x) < getter(y)) {
                return 1;
            } else if (getter(x) > getter(y)) {
                return -1;
            } else {
                return y - x;
            }
        }
    }
}


const __update_output__ = _.throttle(() => setTimeout(function() {
    const outputs = __log__.map(msg => {
        const elm = document.createElement('pre');
        elm.classList.add('message');
        elm.classList.add(msg.type === 'out' ? 'message-stdout' : 'message-stderr');
        elm.innerText = msg.message;
        return elm;
    });
    const area = document.getElementById('logarea');
    area.innerText = '';
    outputs.forEach(x => area.appendChild(x));
    area.scrollTo(0, area.scrollHeight);
}, 100), 100);


const __update_table__ = _.throttle(() => setTimeout(function() {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    const ids = [];
    for (const id in __bench_result__) {
        ids.push(id);
    }

    ids.sort(__get_table_sorter__());

    const opsFormat = d3.format(',.3f');
    const msecFormat = d3.format(',.4f');
    const rateFormat = d3.format('.2%');
    const triedFormat = d3.format(',d');

    ids.forEach(id => {
        const data = __bench_result__[id];
        const result = data.result.dropOutlier();

        const tr = document.createElement('tr');
        tbody.appendChild(tr);

        const name = document.createElement('th');
        tr.appendChild(name);
        name.innerText = data.name;

        if (data.result.msecs.length > 0) {
            const ops = document.createElement('td');
            ops.innerText = opsFormat(result.opsPerSec);
            tr.appendChild(ops);

            const msec = document.createElement('td');
            msec.innerText = msecFormat(result.average);
            tr.appendChild(msec);

            const err = document.createElement('td');
            err.innerText = rateFormat(result.errorRate);
            tr.appendChild(err);

            const times = document.createElement('td');
            times.innerText = triedFormat(result.msecs.length);
            tr.appendChild(times);
        }
    });
}, 100), 100);


const __update_graph__ = _.throttle(() => setTimeout(function() {
    setTimeout(() => {
        const bins = 10;

        const timedata = [];
        const names = [];
        const histdata = [];
        for (const x of __bench_result__) {
            names.push(x.name);
            timedata.push(x.plotdata);

            const min = 1000 / x.result.slowest;
            const max = 1000 / x.result.fastest + 0.01;
            const step = (max - min) / bins;
            const opssecs = x.result.msecs.map(msec => 1000 / msec);
            const hist = [];
            for (let i=-1; i<=bins; i++) {
                const low = min + i * step;
                const high = min + (i + 1) * step;
                hist.push({
                    'ops/sec': (low + high) / 2,
                    count: opssecs.filter(t => (low <= t && t <= high)).length,
                })
            }
            histdata.push(hist);
        }

        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';
		MG.data_graphic({
			title: 'operations / msec',
			chart_type: histdata.length > 0 ? 'line' : 'missing-data',
			data: timedata,
            legend: names,
			width: timeline.clientWidth,
			height: timeline.clientHeight,
            right: 120,
            left: 100,
            area: false,
			x_accessor: 'time',
			y_accessor: 'ops/sec',
            y_label: 'ops/sec',
			x_sort: true,
			target: timeline,
		});

        const histogram = document.getElementById('histogram');
        histogram.innerHTML = '';
		MG.data_graphic({
			title: 'histogram of ops/sec',
			chart_type: histdata.length > 0 ? 'line' : 'missing-data',
			data: histdata,
            markers: __bench_result__.map(x => ({'label': x.name, 'ops/sec': x.result.dropOutlier().opsPerSec})),
			interpolate: d3.curveLinear,
			missing_is_zero: true,
            legend: names,
			width: timeline.clientWidth,
			height: timeline.clientHeight,
            right: 120,
            left: 100,
            area: false,
			x_accessor: 'ops/sec',
			y_accessor: 'count',
            x_label: 'ops/sec',
            y_label: 'count',
			target: histogram,
		});
    }, 1);
}, 200), 200);


function __run_suite__(suite) {
    __update_table__();
    __update_graph__();

    const runner = new AsyncMark.Suite({
        before() {
            __bench_result__ = [];
        },
        beforeTest(_, count, benchmark) {
            if (count === 0) {
                benchmark.__bench_id = __bench_result__.length;
                __bench_result__.push({
                    name: benchmark.name,
                    plotdata: [],
                    result: new AsyncMark.Result(benchmark.name, []),
                });
                __update_table__();
                __update_graph__();
            }
        },
        afterTest(_, count, benchmark, msec) {
            const result = __bench_result__[benchmark.__bench_id];

            result.plotdata.push({
                time: new Date(),
                'ops/sec': msec === 0 ? 1000 / 0.005 : 1000 / msec,
            });
            result.result.msecs.push(msec);

            __update_table__();
            __update_graph__();
        },
    });
    runner.add(suite);
    return runner.run();
}


function __execute__() {
    if (__executing__) {
        return;
    }
    __executing__ = true;
    document.getElementById('executebtn').classList.remove('btn-enabled');

    setTimeout(() => {
        __log__ = [];
        __update_output__();

        const p = (async function() {
            __l__('start execute');
            document.getElementById('logarea').innerText = '';
            const suite = eval(__cm__.getDoc().getValue());

            if (!suite || !suite.run) {
                return Promise.reject('benchmark code was not found');
            }

            await __run_suite__(suite);

            document.getElementById('executebtn').classList.add('btn-enabled');
            __executing__ = false;

            __l__('done execute');
            return await Promise.resolve();
        })();

        p.catch(err => {
            console.error(err.stack || err);
            __e__(err);
        })
    }, 100);
}


__update_graph__();
window.addEventListener('resize', __update_graph__);
document.getElementById('executebtn').addEventListener('click', __execute__);;

document.querySelectorAll('thead th').forEach(elm => {
    elm.addEventListener('click', () => {
        if (elm.classList.contains('asc')) {
            elm.classList.remove('asc');
            elm.classList.add('desc');
        } else {
            document.querySelectorAll('thead th').forEach(x => {
                x.classList.remove('asc');
                x.classList.remove('desc');
            });
            elm.classList.add('asc');
        }
        __update_table__();
    });
});


}, 10);
