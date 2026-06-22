import { useState, useEffect } from "react";
import { api } from "../api";
import type { Category, Problem, TestCase } from "../types";
import { DIFFICULTY_LABELS } from "../types";
import { v4 as uuidv4 } from "uuid";
import ExportImport from "./ExportImport";

export default function AdminPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [activeTab, setActiveTab] = useState<"categories" | "problems" | "data">("categories");
    const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
    const [newCatName, setNewCatName] = useState("");

    const reload = () => {
        Promise.all([api.getCategories(), api.getProblems()]).then(([c, p]) => {
            setCategories(c);
            setProblems(p);
        });
    };

    useEffect(reload, []);

    const addCategory = async () => {
        if (!newCatName.trim()) return;
        await api.createCategory({
            id: uuidv4(),
            name: newCatName.trim(),
            order: categories.length + 1,
        });
        setNewCatName("");
        reload();
    };

    const deleteCategory = async (id: string) => {
        if (!confirm("이 카테고리를 삭제하시겠습니까? 소속 문제도 함께 확인해주세요.")) return;
        await api.deleteCategory(id);
        reload();
    };

    const deleteProblem = async (id: string) => {
        if (!confirm("이 문제를 삭제하시겠습니까?")) return;
        await api.deleteProblem(id);
        reload();
    };

    const tabs = [
        { key: "categories" as const, label: "카테고리 관리" },
        { key: "problems" as const, label: "문제 관리" },
        { key: "data" as const, label: "데이터 관리" },
    ];

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-xl font-bold mb-6 text-c-text">관리 페이지</h1>

            <div className="flex border-b border-c-border mb-6">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => {
                            setActiveTab(t.key);
                            setEditingProblem(null);
                        }}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px bg-transparent cursor-pointer transition-colors ${
                            activeTab === t.key ? "border-c-primary text-c-primary" : "border-transparent text-c-text-2 hover:text-c-text"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {activeTab === "categories" && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCategory()}
                            placeholder="새 카테고리 이름"
                            className="flex-1 px-3 py-2 text-sm border border-c-border rounded-lg bg-c-bg text-c-text outline-none focus:border-c-primary"
                        />
                        <button
                            onClick={addCategory}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-c-primary text-white border-none cursor-pointer hover:bg-c-primary-dark transition-colors"
                        >
                            추가
                        </button>
                    </div>

                    <div className="space-y-2">
                        {categories.map((cat, i) => (
                            <div key={cat.id} className="flex items-center gap-3 p-3 border border-c-border rounded-lg bg-c-bg-2">
                                <span className="text-sm text-c-text-2 w-8">#{i + 1}</span>
                                <span className="flex-1 text-sm font-medium text-c-text">{cat.name}</span>
                                <span className="text-xs text-c-text-2">{problems.filter((p) => p.categoryId === cat.id).length}문제</span>
                                <button onClick={() => deleteCategory(cat.id)} className="text-xs text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer">
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "problems" && !editingProblem && (
                <div className="space-y-4">
                    <button
                        onClick={() => setEditingProblem(createEmptyProblem(categories[0]?.id || ""))}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-c-primary text-white border-none cursor-pointer hover:bg-c-primary-dark transition-colors"
                    >
                        새 문제 추가
                    </button>

                    <div className="space-y-2">
                        {problems.map((prob) => {
                            const cat = categories.find((c) => c.id === prob.categoryId);
                            return (
                                <div key={prob.id} className="flex items-center gap-3 p-3 border border-c-border rounded-lg bg-c-bg-2">
                                    <span className="text-xs text-c-text-2 bg-c-bg-3 px-2 py-0.5 rounded">{cat?.name || "미분류"}</span>
                                    <span className="flex-1 text-sm font-medium text-c-text">{prob.title}</span>
                                    <span className="text-xs text-c-text-2">
                                        난이도 {prob.difficulty} | {prob.testCases.length} 테스트
                                    </span>
                                    <button onClick={() => setEditingProblem(prob)} className="text-xs text-c-primary hover:underline bg-transparent border-none cursor-pointer">
                                        편집
                                    </button>
                                    <button onClick={() => deleteProblem(prob.id)} className="text-xs text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer">
                                        삭제
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === "problems" && editingProblem && (
                <ProblemEditor
                    problem={editingProblem}
                    categories={categories}
                    onSave={async (p) => {
                        const isNew = !problems.find((x) => x.id === p.id);
                        if (isNew) {
                            await api.createProblem(p);
                        } else {
                            await api.updateProblem(p.id, p);
                        }
                        setEditingProblem(null);
                        reload();
                    }}
                    onCancel={() => setEditingProblem(null)}
                />
            )}

            {activeTab === "data" && <ExportImport onImport={reload} />}
        </div>
    );
}

function createEmptyProblem(categoryId: string): Problem {
    return {
        id: uuidv4(),
        categoryId,
        title: "",
        content: "",
        language: "javascript",
        difficulty: 3,
        timeLimit: 15,
        performanceLimit: 50,
        template: "function solution() {\n  // 여기에 코드를 작성하세요\n  \n}",
        testCases: [],
        bookmarked: false,
        memo: "",
        createdAt: new Date().toISOString(),
    };
}

function ProblemEditor({ problem, categories, onSave, onCancel }: { problem: Problem; categories: Category[]; onSave: (p: Problem) => void; onCancel: () => void }) {
    const [form, setForm] = useState<Problem>(problem);

    const update = <K extends keyof Problem>(key: K, value: Problem[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
    };

    const addTestCase = () => {
        const tc: TestCase = { id: uuidv4(), input: "[]", expectedOutput: "" };
        update("testCases", [...form.testCases, tc]);
    };

    const updateTestCase = (id: string, field: keyof TestCase, value: string) => {
        update(
            "testCases",
            form.testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc)),
        );
    };

    const removeTestCase = (id: string) => {
        update(
            "testCases",
            form.testCases.filter((tc) => tc.id !== id),
        );
    };

    const inputClass = "w-full px-3 py-2 text-sm border border-c-border rounded-lg bg-c-bg text-c-text outline-none focus:border-c-primary";
    const labelClass = "block text-sm font-medium text-c-text mb-1";

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-c-text">{problem.title ? "문제 편집" : "새 문제 추가"}</h2>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg bg-c-bg-3 text-c-text border-none cursor-pointer hover:bg-c-border transition-colors">
                        취소
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-c-primary text-white border-none cursor-pointer hover:bg-c-primary-dark transition-colors"
                    >
                        저장
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>제목</label>
                    <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} placeholder="예: 두 수의 합 (Two Sum)" />
                </div>
                <div>
                    <label className={labelClass}>카테고리</label>
                    <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className={inputClass}>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div>
                    <label className={labelClass}>난이도</label>
                    <select value={form.difficulty} onChange={(e) => update("difficulty", Number(e.target.value) as Problem["difficulty"])} className={inputClass}>
                        {[1, 2, 3, 4, 5].map((d) => (
                            <option key={d} value={d}>
                                {DIFFICULTY_LABELS[d]}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>언어</label>
                    <select value={form.language} onChange={(e) => update("language", e.target.value)} className={inputClass}>
                        <option value="javascript">JavaScript</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>목표 시간 (분)</label>
                    <input type="number" value={form.timeLimit} onChange={(e) => update("timeLimit", Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>목표 성능 (ms)</label>
                    <input type="number" value={form.performanceLimit} onChange={(e) => update("performanceLimit", Number(e.target.value))} className={inputClass} />
                </div>
            </div>

            <div>
                <label className={labelClass}>문제 내용 (Markdown)</label>
                <textarea
                    value={form.content}
                    onChange={(e) => update("content", e.target.value)}
                    className={`${inputClass} h-48 resize-y font-mono`}
                    placeholder="마크다운으로 문제를 작성하세요..."
                />
            </div>

            <div>
                <label className={labelClass}>코드 템플릿</label>
                <textarea
                    value={form.template}
                    onChange={(e) => update("template", e.target.value)}
                    className={`${inputClass} h-24 resize-y font-mono`}
                    placeholder="function solution() { ... }"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className={labelClass}>테스트 케이스</label>
                    <button onClick={addTestCase} className="text-xs text-c-primary hover:underline bg-transparent border-none cursor-pointer">
                        + 테스트 케이스 추가
                    </button>
                </div>
                <div className="space-y-2">
                    {form.testCases.map((tc, i) => (
                        <div key={tc.id} className="flex items-start gap-2 p-3 border border-c-border rounded-lg bg-c-bg-2">
                            <span className="text-xs text-c-text-2 mt-2">#{i + 1}</span>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-c-text-2">입력 (JSON 배열)</label>
                                    <input
                                        type="text"
                                        value={tc.input}
                                        onChange={(e) => updateTestCase(tc.id, "input", e.target.value)}
                                        className={`${inputClass} font-mono text-xs`}
                                        placeholder="[[1,2,3], 5]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-c-text-2">기대 출력 (JSON)</label>
                                    <input
                                        type="text"
                                        value={tc.expectedOutput}
                                        onChange={(e) => updateTestCase(tc.id, "expectedOutput", e.target.value)}
                                        className={`${inputClass} font-mono text-xs`}
                                        placeholder="[0, 1]"
                                    />
                                </div>
                            </div>
                            <button onClick={() => removeTestCase(tc.id)} className="mt-4 text-xs text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer">
                                삭제
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
