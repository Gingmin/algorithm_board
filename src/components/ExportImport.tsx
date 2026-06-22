import { useState } from "react";
import { api } from "../api";

interface ExportImportProps {
    onImport: () => void;
}

export default function ExportImport({ onImport }: ExportImportProps) {
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState("");

    const handleExport = async () => {
        try {
            const data = await api.exportAll();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `algorithm-board-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setMessage("내보내기 완료!");
        } catch {
            setMessage("내보내기 실패");
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setMessage("");

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.categories) {
                for (const cat of data.categories) {
                    try {
                        await api.createCategory(cat);
                    } catch {
                        /* skip duplicates */
                    }
                }
            }
            if (data.problems) {
                for (const prob of data.problems) {
                    try {
                        await api.createProblem(prob);
                    } catch {
                        /* skip duplicates */
                    }
                }
            }
            if (data.attempts) {
                for (const att of data.attempts) {
                    try {
                        await api.createAttempt(att);
                    } catch {
                        /* skip duplicates */
                    }
                }
            }

            setMessage(`가져오기 완료! (${data.categories?.length || 0} 카테고리, ${data.problems?.length || 0} 문제, ${data.attempts?.length || 0} 풀이)`);
            onImport();
        } catch {
            setMessage("가져오기 실패: 파일 형식을 확인해주세요");
        } finally {
            setImporting(false);
            e.target.value = "";
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-5 border border-c-border rounded-lg bg-c-bg-2">
                <h3 className="text-sm font-semibold text-c-text mb-3">데이터 내보내기</h3>
                <p className="text-xs text-c-text-2 mb-3">모든 카테고리, 문제, 풀이 이력을 JSON 파일로 저장합니다.</p>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-c-primary text-white border-none cursor-pointer hover:bg-c-primary-dark transition-colors"
                >
                    JSON 파일로 내보내기
                </button>
            </div>

            <div className="p-5 border border-c-border rounded-lg bg-c-bg-2">
                <h3 className="text-sm font-semibold text-c-text mb-3">데이터 가져오기</h3>
                <p className="text-xs text-c-text-2 mb-3">JSON 백업 파일에서 데이터를 복원합니다. 기존 데이터에 추가됩니다.</p>
                <label className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-c-bg-3 text-c-text cursor-pointer hover:bg-c-border transition-colors">
                    {importing ? "가져오는 중..." : "JSON 파일 선택"}
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={importing} />
                </label>
            </div>

            {message && (
                <div
                    className={`p-3 rounded-lg text-sm ${message.includes("실패") ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}
                >
                    {message}
                </div>
            )}
        </div>
    );
}
