import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../api";
import type { Category, Problem, Attempt } from "../types";
import { DIFFICULTY_LABELS } from "../types";

type SolveStatus = "passed" | "failed" | "none";

function buildSolveMap(attempts: Attempt[]): Record<string, SolveStatus> {
    const map: Record<string, SolveStatus> = {};
    for (const a of attempts) {
        if (a.passed) {
            map[a.problemId] = "passed";
        } else if (map[a.problemId] !== "passed") {
            map[a.problemId] = "failed";
        }
    }
    return map;
}

export default function Sidebar() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState("");
    const [solveMap, setSolveMap] = useState<Record<string, SolveStatus>>({});
    const navigate = useNavigate();
    const { id: selectedId } = useParams();
    const location = useLocation();

    const isMainPage = location.pathname === "/" || location.pathname.startsWith("/problem/");

    useEffect(() => {
        Promise.all([api.getCategories(), api.getProblems(), api.getAttempts()]).then(([cats, probs, attempts]) => {
            setCategories(cats);
            setProblems(probs);
            setSolveMap(buildSolveMap(attempts));
        });
    }, []);

    useEffect(() => {
        const handler = () => {
            api.getAttempts().then((attempts) => setSolveMap(buildSolveMap(attempts)));
        };
        window.addEventListener("attempt-submitted", handler);
        return () => window.removeEventListener("attempt-submitted", handler);
    }, []);

    if (!isMainPage) return null;

    const toggleExpand = (catId: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(catId)) next.delete(catId);
            else next.add(catId);
            return next;
        });
    };

    const filtered = filter ? problems.filter((p) => p.title.toLowerCase().includes(filter.toLowerCase())) : problems;

    const bookmarked = problems.filter((p) => p.bookmarked);

    return (
        <aside className="w-72 min-w-[18rem] border-r border-c-border bg-c-bg-2 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-c-border">
                <input
                    type="text"
                    placeholder="문제 검색..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-c-border bg-c-bg text-c-text outline-none focus:border-c-primary transition-colors"
                />
            </div>

            <div className="flex-1 overflow-auto p-2">
                {bookmarked.length > 0 && (
                    <div className="mb-2">
                        <button
                            onClick={() => toggleExpand("__bookmarks__")}
                            className="flex items-center gap-1.5 w-full px-2 py-1.5 text-sm font-semibold text-amber-500 hover:bg-c-bg-3 rounded-md cursor-pointer border-none bg-transparent text-left"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            <span className="flex-1">북마크</span>
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`transition-transform ${expanded.has("__bookmarks__") ? "rotate-90" : ""}`}
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                        {expanded.has("__bookmarks__") && (
                            <div className="ml-3">
                                {bookmarked.map((p) => (
                                    <ProblemItem key={p.id} problem={p} selected={selectedId === p.id} solveStatus={solveMap[p.id] || "none"} onClick={() => navigate(`/problem/${p.id}`)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {categories.map((cat) => {
                    const catProblems = filtered.filter((p) => p.categoryId === cat.id);
                    if (filter && catProblems.length === 0) return null;
                    return (
                        <div key={cat.id} className="mb-1">
                            <button
                                onClick={() => toggleExpand(cat.id)}
                                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-sm font-semibold text-c-text hover:bg-c-bg-3 rounded-md cursor-pointer border-none bg-transparent text-left"
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={`transition-transform ${expanded.has(cat.id) ? "rotate-90" : ""}`}
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                                <span className="flex-1">{cat.name}</span>
                                <span className="text-xs text-c-text-2">{catProblems.length}</span>
                            </button>
                            {expanded.has(cat.id) && (
                                <div className="ml-3">
                                    {catProblems.map((p) => (
                                        <ProblemItem key={p.id} problem={p} selected={selectedId === p.id} solveStatus={solveMap[p.id] || "none"} onClick={() => navigate(`/problem/${p.id}`)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}

const SOLVE_ICON: Record<SolveStatus, { color: string; symbol: string; label: string }> = {
    passed: { color: "text-green-500", symbol: "✓", label: "통과" },
    failed: { color: "text-red-400", symbol: "✗", label: "실패" },
    none: { color: "text-c-text-2", symbol: "○", label: "미풀이" },
};

const DIFF_BG: Record<number, string> = {
    1: "bg-green-500/15 text-green-600 dark:text-green-400",
    2: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    3: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
    4: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    5: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function ProblemItem({ problem, selected, solveStatus, onClick }: { problem: Problem; selected: boolean; solveStatus: SolveStatus; onClick: () => void }) {
    const icon = SOLVE_ICON[solveStatus];
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 w-full px-3 py-1.5 text-sm rounded-md cursor-pointer border-none text-left transition-colors ${
                selected ? "bg-c-primary text-white" : "bg-transparent text-c-text hover:bg-c-bg-3"
            }`}
        >
            <span className={`text-xs font-bold flex-shrink-0 w-4 text-center ${selected ? "text-white" : icon.color}`} title={icon.label}>
                {icon.symbol}
            </span>
            <span className="flex-1 truncate">{problem.title}</span>
            <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 leading-tight ${
                    selected ? "bg-white/20 text-white" : DIFF_BG[problem.difficulty]
                }`}
            >
                {DIFFICULTY_LABELS[problem.difficulty]}
            </span>
        </button>
    );
}
