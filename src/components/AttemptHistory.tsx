import { useState } from "react";
import type { Attempt } from "../types";

interface AttemptHistoryProps {
    attempts: Attempt[];
    onViewCode: (code: string) => void;
}

export default function AttemptHistory({ attempts, onViewCode }: AttemptHistoryProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (attempts.length === 0) {
        return <div className="text-center py-6 text-c-text-2 text-sm">아직 풀이 이력이 없습니다</div>;
    }

    return (
        <div className="space-y-2">
            {attempts.map((a) => {
                const mm = String(Math.floor(a.timeSpent / 60)).padStart(2, "0");
                const ss = String(a.timeSpent % 60).padStart(2, "0");
                const passCount = a.testResults.filter((r) => r.passed).length;
                const isExpanded = expandedId === a.id;
                const date = new Date(a.submittedAt);

                return (
                    <div key={a.id} className="border border-c-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : a.id)}
                            className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-c-bg-3 transition-colors"
                        >
                            <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${a.passed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                            >
                                {a.passed ? "PASS" : "FAIL"}
                            </span>
                            <span className="text-sm font-semibold text-c-text">{a.attemptNumber}차 시기</span>
                            <span className="text-xs text-c-text-2">
                                {passCount}/{a.testResults.length} 통과
                            </span>
                            <span className="text-xs text-c-text-2 font-mono">
                                {mm}:{ss}
                            </span>
                            <span className="text-xs text-c-text-2">{a.executionTime.toFixed(1)}ms</span>
                            <span className="flex-1" />
                            <span className="text-xs text-c-text-2">
                                {date.toLocaleDateString("ko-KR")} {date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`text-c-text-2 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-3 border-t border-c-border">
                                <div className="flex justify-end mt-2 mb-2">
                                    <button onClick={() => onViewCode(a.code)} className="text-xs text-c-primary hover:underline bg-transparent border-none cursor-pointer">
                                        이 코드 불러오기
                                    </button>
                                </div>
                                <pre className="bg-c-bg-3 p-3 rounded-lg text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">{a.code}</pre>
                                <div className="mt-2 space-y-1">
                                    {a.testResults.map((r, i) => (
                                        <div key={r.testCaseId} className="flex items-center gap-2 text-xs">
                                            <span className={`font-bold ${r.passed ? "text-green-500" : "text-red-500"}`}>{r.passed ? "PASS" : "FAIL"}</span>
                                            <span className="text-c-text-2">#{i + 1}</span>
                                            {r.error && <span className="text-red-400 truncate">{r.error}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
