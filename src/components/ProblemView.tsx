import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../api";
import type { Problem, Attempt, TestResult } from "../types";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "../types";
import CodeEditor from "./CodeEditor";
import Timer from "./Timer";
import TestResults from "./TestResults";
import AttemptHistory from "./AttemptHistory";
import { v4 as uuidv4 } from "uuid";

function runCode(code: string, testCases: { id: string; input: string; expectedOutput: string }[]): Promise<{ testResults: TestResult[]; totalTime: number }> {
    return new Promise((resolve) => {
        const workerCode = `
      self.onmessage = function(e) {
        const { code, testCases } = e.data;
        const results = [];
        let totalTime = 0;

        for (const tc of testCases) {
          try {
            const args = JSON.parse(tc.input);
            const expected = JSON.parse(tc.expectedOutput);

            const fn = new Function('return (' + code + ')')();

            const start = performance.now();
            const actual = fn(...args);
            const elapsed = performance.now() - start;
            totalTime += elapsed;

            const actualStr = JSON.stringify(actual);
            const expectedStr = JSON.stringify(expected);
            const passed = actualStr === expectedStr;

            results.push({
              testCaseId: tc.id,
              input: tc.input,
              expected: expectedStr,
              actual: actualStr,
              passed,
              executionTime: elapsed,
            });
          } catch (err) {
            results.push({
              testCaseId: tc.id,
              input: tc.input,
              expected: tc.expectedOutput,
              actual: '',
              passed: false,
              executionTime: 0,
              error: String(err),
            });
          }
        }

        self.postMessage({ testResults: results, totalTime });
      };
    `;

        const blob = new Blob([workerCode], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);

        const timeout = setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve({
                testResults: testCases.map((tc) => ({
                    testCaseId: tc.id,
                    input: tc.input,
                    expected: tc.expectedOutput,
                    actual: "",
                    passed: false,
                    executionTime: 0,
                    error: "시간 초과 (5초)",
                })),
                totalTime: 5000,
            });
        }, 5000);

        worker.onmessage = (e) => {
            clearTimeout(timeout);
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve(e.data);
        };

        worker.onerror = (err) => {
            clearTimeout(timeout);
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve({
                testResults: testCases.map((tc) => ({
                    testCaseId: tc.id,
                    input: tc.input,
                    expected: tc.expectedOutput,
                    actual: "",
                    passed: false,
                    executionTime: 0,
                    error: String(err.message),
                })),
                totalTime: 0,
            });
        };

        worker.postMessage({ code, testCases });
    });
}

export default function ProblemView() {
    const { id } = useParams();
    const [problem, setProblem] = useState<Problem | null>(null);
    const [code, setCode] = useState("");
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [totalExecTime, setTotalExecTime] = useState(0);
    const [running, setRunning] = useState(false);
    const [memo, setMemo] = useState("");
    const [showMemo, setShowMemo] = useState(false);
    const [activeTab, setActiveTab] = useState<"results" | "history">("results");
    const timeRef = useRef(0);

    useEffect(() => {
        if (!id) {
            setProblem(null);
            return;
        }
        Promise.all([api.getProblem(id), api.getAttemptsByProblem(id)]).then(([p, a]) => {
            setProblem(p);
            setCode(p.template);
            setMemo(p.memo || "");
            setAttempts(a);
            setTestResults([]);
        });
    }, [id]);

    const handleTimeUpdate = useCallback((s: number) => {
        timeRef.current = s;
    }, []);

    const handleRun = async () => {
        if (!problem) return;
        setRunning(true);
        const result = await runCode(code, problem.testCases);
        setTestResults(result.testResults);
        setTotalExecTime(result.totalTime);
        setRunning(false);
        setActiveTab("results");
    };

    const handleSubmit = async () => {
        if (!problem) return;
        setRunning(true);
        const result = await runCode(code, problem.testCases);
        setTestResults(result.testResults);
        setTotalExecTime(result.totalTime);

        const allPassed = result.testResults.every((r) => r.passed);
        const attemptNumber = attempts.length + 1;

        const attempt: Omit<Attempt, "id"> = {
            problemId: problem.id,
            attemptNumber,
            code,
            timeSpent: timeRef.current,
            executionTime: result.totalTime,
            passed: allPassed,
            testResults: result.testResults,
            submittedAt: new Date().toISOString(),
        };

        const saved = await api.createAttempt({ ...attempt, id: uuidv4() });
        setAttempts((prev) => [...prev, saved]);
        setRunning(false);
        setActiveTab("results");
    };

    const handleBookmark = async () => {
        if (!problem) return;
        const updated = await api.updateProblem(problem.id, { bookmarked: !problem.bookmarked });
        setProblem({ ...problem, bookmarked: updated.bookmarked });
    };

    const handleSaveMemo = async () => {
        if (!problem) return;
        await api.updateProblem(problem.id, { memo });
        setProblem({ ...problem, memo });
    };

    if (!id) {
        return (
            <div className="flex items-center justify-center h-full text-c-text-2">
                <div className="text-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-40">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <p className="text-lg font-medium">좌측에서 문제를 선택하세요</p>
                    <p className="text-sm mt-1">알고리즘 문제를 풀고 실력을 키워보세요</p>
                </div>
            </div>
        );
    }

    if (!problem) {
        return <div className="flex items-center justify-center h-full text-c-text-2">로딩 중...</div>;
    }

    return (
        <div className="h-full overflow-auto">
            <div className="max-w-5xl mx-auto p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-c-text mb-2">{problem.title}</h1>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}>{DIFFICULTY_LABELS[problem.difficulty]}</span>
                            <span className="text-xs text-c-text-2 bg-c-bg-3 px-2 py-0.5 rounded">{problem.language}</span>
                            <span className="text-xs text-c-text-2">
                                목표: {problem.timeLimit}분 / {problem.performanceLimit}ms
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMemo(!showMemo)}
                            className="p-2 rounded-lg hover:bg-c-bg-3 text-c-text-2 cursor-pointer border-none bg-transparent transition-colors"
                            title="메모"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleBookmark}
                            className={`p-2 rounded-lg hover:bg-c-bg-3 cursor-pointer border-none bg-transparent transition-colors ${problem.bookmarked ? "text-amber-500" : "text-c-text-2"}`}
                            title={problem.bookmarked ? "북마크 해제" : "북마크"}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={problem.bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Memo */}
                {showMemo && (
                    <div className="border border-c-border rounded-lg p-4 bg-c-bg-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-c-text">메모</span>
                            <button
                                onClick={handleSaveMemo}
                                className="text-xs px-3 py-1 rounded-md bg-c-primary text-white border-none cursor-pointer hover:bg-c-primary-dark transition-colors"
                            >
                                저장
                            </button>
                        </div>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="이 문제에 대한 메모를 작성하세요..."
                            className="w-full h-20 p-2 text-sm border border-c-border rounded-md bg-c-bg text-c-text resize-y outline-none focus:border-c-primary"
                        />
                    </div>
                )}

                {/* Problem content */}
                <div className="border border-c-border rounded-lg p-5 bg-c-bg-2">
                    <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.content}</ReactMarkdown>
                    </div>
                </div>

                {/* Timer + Actions */}
                <div className="flex items-center justify-between">
                    <Timer onTimeUpdate={handleTimeUpdate} timeLimit={problem.timeLimit} />
                    <div className="flex gap-2">
                        <button
                            onClick={handleRun}
                            disabled={running}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-c-bg-3 text-c-text border-none cursor-pointer hover:bg-c-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {running ? "실행 중..." : "실행"}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={running}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-c-primary text-white border-none cursor-pointer hover:bg-c-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            제출
                        </button>
                    </div>
                </div>

                {/* Code Editor */}
                <CodeEditor value={code} onChange={setCode} language={problem.language} height="350px" />

                {/* Tabs */}
                <div>
                    <div className="flex border-b border-c-border mb-4">
                        <button
                            onClick={() => setActiveTab("results")}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px cursor-pointer bg-transparent transition-colors ${
                                activeTab === "results" ? "border-c-primary text-c-primary" : "border-transparent text-c-text-2 hover:text-c-text"
                            }`}
                        >
                            실행 결과
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px cursor-pointer bg-transparent transition-colors ${
                                activeTab === "history" ? "border-c-primary text-c-primary" : "border-transparent text-c-text-2 hover:text-c-text"
                            }`}
                        >
                            풀이 이력 ({attempts.length})
                        </button>
                    </div>

                    {activeTab === "results" && <TestResults results={testResults} totalTime={totalExecTime} performanceLimit={problem.performanceLimit} />}

                    {activeTab === "history" && <AttemptHistory attempts={attempts} onViewCode={(c) => setCode(c)} />}
                </div>
            </div>
        </div>
    );
}
