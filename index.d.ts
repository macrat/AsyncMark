export class Result {
    constructor(name: string, msecs: number[]);

    readonly total: number;
    readonly fastest: number;
    readonly slowest: number;
    readonly average: number;
    readonly variance: number;
    readonly std: number;
    readonly sem: number;
    readonly errorRange: number;
    readonly errorRate: number;
    readonly opsPerSec: number;

    dropOutlier(threshold?: number): Result;
    toString(): string;

    assert(...expected: number | string);
}


export class AssertRule {
    constructor(rule: string);

    check(msec: string): boolean;

    assert(result: Result, stackStartFn: function | null | undefined);
}


export interface TestCallbacks {
    beforeTest?: (count: number, benchmark: Benchmark) => Promise<void>;
    afterTest?: (count: number, benchmark: Benchmark, msec: number) => Promise<void>;
};


export interface BenchmarkOptions {
    name?: string;
    targetErrorRate?: number;
    maxNumber?: number;
    minNumber?: number;
    number?: number;
    before?: () => Promise<void>;
    beforeEach?: (count: number) => Promise<void>;
    fun?: () => Promise<void>;
    afterEach?: (count: number, msec: number) => Promise<void>;
    after?: (result: Result) => Promise<void>;
}


export interface SuiteOptions {
    name?: string;
    parallel?: boolean;
    before?: () => Promise<void>;
    beforeEach?: (count: number, benchmark: Benchmark) => Promise<void>;
    beforeTest?: (suiteCount: number, benchCount: number, benchmark: Benchmark) => Promise<void>;
    afterTest?: (suiteCount: number, benchCount: number, benchmark: Benchmark, msec: number) => Promise<void>;
    afterEach?: (count: number, benchmark: Benchmark, result: Result) => Promise<void>;
    after?: (results: Result[]) => Promise<void>;
    benchmarkDefault?: BenchmarkOptions;
}


export class Suite {
    constructor(options: SuiteOptions);

    name: string;
    benchmarkDefault: BenchmarkOptions;
    benchmarks: Benchmark[];
    parallel: boolean;

    before(count: number, benchmark: Benchmark): Promise<void>;
    beforeEach(count: number, benchmark: Benchmark): Promise<void>;
    beforeTest(suiteCount: number, benchCount: number, benchmark: Benchmark): Promise<void>;
    afterTest(suiteCount: number, benchCount: number, benchmark: Benchmark, msec: number): Promise<void>;
    afterEach(count: number, benchmark: Benchmark, result: Result): Promise<void>;
    after(results: Result[]): Promise<void>;

    addBenchmark(benchmark: Benchmark): Suite;
    addSuite(suite: Suite): Suite;
    add(child: Benchmark | Suite | BenchmarkOptions | (() => Promise<void>));

    run(context?: object, callbacks?: TestCallbacks): Promise<Result[]>;
}


export function timeit(fun: () => Promise<void>, context?: object, args?: any[]): Promise<number>;


export default Benchmark;
