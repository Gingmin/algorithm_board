import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { api } from "../api";
import type { Category, Problem, Attempt } from "../types";
import { DIFFICULTY_LABELS } from "../types";

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function Dashboard() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);

    useEffect(() => {
        Promise.all([api.getCategories(), api.getProblems(), api.getAttempts()]).then(([c, p, a]) => {
            setCategories(c);
            setProblems(p);
            setAttempts(a);
        });
    }, []);

    const totalProblems = problems.length;
    const solvedIds = new Set(attempts.filter((a) => a.passed).map((a) => a.problemId));
    const solvedCount = solvedIds.size;
    const totalAttempts = attempts.length;
    const passRate = totalAttempts > 0 ? Math.round((attempts.filter((a) => a.passed).length / totalAttempts) * 100) : 0;
    const avgTime = totalAttempts > 0 ? Math.round(attempts.reduce((s, a) => s + a.timeSpent, 0) / totalAttempts) : 0;
    const avgExecTime = totalAttempts > 0 ? (attempts.reduce((s, a) => s + a.executionTime, 0) / totalAttempts).toFixed(1) : "0";

    const categoryStats = categories.map((cat) => {
        const catProblems = problems.filter((p) => p.categoryId === cat.id);
        const catSolved = catProblems.filter((p) => solvedIds.has(p.id)).length;
        return { name: cat.name.replace(/\s*\(.*\)/, ""), total: catProblems.length, solved: catSolved };
    });

    const difficultyStats = [1, 2, 3, 4, 5]
        .map((d) => {
            const dProblems = problems.filter((p) => p.difficulty === d);
            const dSolved = dProblems.filter((p) => solvedIds.has(p.id)).length;
            return { name: DIFFICULTY_LABELS[d], total: dProblems.length, solved: dSolved };
        })
        .filter((d) => d.total > 0);

    const pieData = [
        { name: "풀이 완료", value: solvedCount },
        { name: "미풀이", value: totalProblems - solvedCount },
    ];

    const recentAttempts = [...attempts]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 10)
        .reverse()
        .map((a, i) => ({
            name: `#${i + 1}`,
            time: a.timeSpent,
            exec: Number(a.executionTime.toFixed(1)),
            passed: a.passed ? 1 : 0,
        }));

    const cardData = [
        { label: "전체 문제", value: totalProblems, sub: `${solvedCount} 풀이 완료`, color: "text-blue-500" },
        { label: "총 제출", value: totalAttempts, sub: `정답률 ${passRate}%`, color: "text-green-500" },
        { label: "평균 소요시간", value: `${Math.floor(avgTime / 60)}분 ${avgTime % 60}초`, sub: "제출당", color: "text-amber-500" },
        { label: "평균 실행시간", value: `${avgExecTime}ms`, sub: "제출당", color: "text-purple-500" },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <h1 className="text-xl font-bold text-c-text">대시보드</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cardData.map((card) => (
                    <div key={card.label} className="p-4 border border-c-border rounded-lg bg-c-bg-2">
                        <div className="text-xs text-c-text-2 mb-1">{card.label}</div>
                        <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                        <div className="text-xs text-c-text-2 mt-1">{card.sub}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-c-border rounded-lg bg-c-bg-2">
                    <h3 className="text-sm font-semibold text-c-text mb-4">카테고리별 진행률</h3>
                    {categoryStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={categoryStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                                <YAxis tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                                <Tooltip contentStyle={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                                <Bar dataKey="total" fill="#94a3b8" name="전체" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="solved" fill="#3b82f6" name="풀이" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] text-c-text-2 text-sm">데이터 없음</div>
                    )}
                </div>

                <div className="p-5 border border-c-border rounded-lg bg-c-bg-2">
                    <h3 className="text-sm font-semibold text-c-text mb-4">풀이 현황</h3>
                    {totalProblems > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] text-c-text-2 text-sm">데이터 없음</div>
                    )}
                </div>

                <div className="p-5 border border-c-border rounded-lg bg-c-bg-2">
                    <h3 className="text-sm font-semibold text-c-text mb-4">난이도별 분포</h3>
                    {difficultyStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={difficultyStats} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis type="number" tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} width={80} />
                                <Tooltip contentStyle={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                                <Bar dataKey="total" fill="#94a3b8" name="전체" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="solved" fill="#22c55e" name="풀이" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] text-c-text-2 text-sm">데이터 없음</div>
                    )}
                </div>

                <div className="p-5 border border-c-border rounded-lg bg-c-bg-2">
                    <h3 className="text-sm font-semibold text-c-text mb-4">최근 제출 소요시간 추이</h3>
                    {recentAttempts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={recentAttempts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                                <YAxis tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                                <Tooltip contentStyle={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                                <Line type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={2} name="소요시간(초)" dot={{ fill: "#3b82f6" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] text-c-text-2 text-sm">아직 제출 이력이 없습니다</div>
                    )}
                </div>
            </div>
        </div>
    );
}
