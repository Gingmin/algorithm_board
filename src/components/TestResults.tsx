import type { TestResult } from "../types";

interface TestResultsProps {
    results: TestResult[];
    totalTime: number;
    performanceLimit?: number;
}

export default function TestResults({ results, totalTime, performanceLimit }: TestResultsProps) {
    if (results.length === 0) return null;

    const allPassed = results.every((r) => r.passed);
    const passCount = results.filter((r) => r.passed).length;
    const perfOk = performanceLimit ? totalTime <= performanceLimit : true;

    return (
        <div className="border border-c-border rounded-lg overflow-hidden">
            <div className={`flex items-center justify-between px-4 py-3 ${allPassed ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                <div className="flex items-center gap-2">
                    {allPassed ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    )}
                    <span className={`font-semibold text-sm ${allPassed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                        {allPassed ? "모든 테스트 통과!" : "테스트 실패"}
                    </span>
                    <span className="text-xs text-c-text-2">
                        ({passCount}/{results.length} 통과)
                    </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className={`font-medium ${perfOk ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
                        실행시간: {totalTime.toFixed(2)}ms
                        {performanceLimit && ` / ${performanceLimit}ms`}
                    </span>
                </div>
            </div>

            <div className="divide-y divide-c-border">
                {results.map((r, i) => (
                    <div key={r.testCaseId} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                            {r.passed ? <span className="text-green-500 text-xs font-bold">PASS</span> : <span className="text-red-500 text-xs font-bold">FAIL</span>}
                            <span className="text-sm font-medium text-c-text">테스트 #{i + 1}</span>
                            <span className="text-xs text-c-text-2">{r.executionTime.toFixed(2)}ms</span>
                        </div>

                        {r.error ? (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3 text-sm text-red-700 dark:text-red-400 font-mono whitespace-pre-wrap">{r.error}</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                    <div className="text-xs text-c-text-2 mb-1">입력</div>
                                    <code className="block bg-c-bg-3 p-2 rounded text-xs font-mono break-all">{r.input}</code>
                                </div>
                                <div>
                                    <div className="text-xs text-c-text-2 mb-1">기대값</div>
                                    <code className="block bg-c-bg-3 p-2 rounded text-xs font-mono break-all">{r.expected}</code>
                                </div>
                                <div>
                                    <div className="text-xs text-c-text-2 mb-1">실제값</div>
                                    <code
                                        className={`block p-2 rounded text-xs font-mono break-all ${
                                            r.passed ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
                                        }`}
                                    >
                                        {r.actual}
                                    </code>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
