import { useState, useEffect, useRef, useCallback } from "react";

interface TimerProps {
    onTimeUpdate?: (seconds: number) => void;
    onRunningChange?: (running: boolean) => void;
    timeLimit?: number;
}

export default function Timer({ onTimeUpdate, onRunningChange, timeLimit }: TimerProps) {
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stop = useCallback(() => {
        setRunning(false);
        onRunningChange?.(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [onRunningChange]);

    const start = useCallback(() => {
        setRunning(true);
        onRunningChange?.(true);
    }, [onRunningChange]);

    const reset = useCallback(() => {
        stop();
        setSeconds(0);
        onTimeUpdate?.(0);
    }, [stop, onTimeUpdate]);

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setSeconds((s) => {
                    const next = s + 1;
                    onTimeUpdate?.(next);
                    return next;
                });
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [running, onTimeUpdate]);

    useEffect(() => {
        return () => {
            onRunningChange?.(false);
        };
    }, [onRunningChange]);

    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    const timeLimitSec = (timeLimit ?? 0) * 60;
    const overTime = timeLimit ? seconds > timeLimitSec : false;
    const progress = timeLimit ? Math.min((seconds / timeLimitSec) * 100, 100) : 0;

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <span className={`font-mono text-xl font-bold ${overTime ? "text-c-error" : "text-c-text"}`}>
                    {mm}:{ss}
                </span>
                {timeLimit && <span className="text-xs text-c-text-2">/ {timeLimit}분</span>}
            </div>

            {timeLimit && running && (
                <div className="w-24 h-1.5 bg-c-bg-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${overTime ? "bg-c-error" : "bg-c-primary"}`} style={{ width: `${progress}%` }} />
                </div>
            )}

            <div className="flex gap-1">
                {!running ? (
                    <button
                        onClick={start}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-c-primary text-white border-none cursor-pointer hover:bg-c-primary-dark transition-colors"
                    >
                        {seconds > 0 ? "계속" : "시작"}
                    </button>
                ) : (
                    <button onClick={stop} className="px-3 py-1 text-xs font-medium rounded-md bg-c-warn text-white border-none cursor-pointer hover:opacity-90 transition-colors">
                        일시정지
                    </button>
                )}
                <button onClick={reset} className="px-3 py-1 text-xs font-medium rounded-md bg-c-bg-3 text-c-text-2 border-none cursor-pointer hover:bg-c-border transition-colors">
                    초기화
                </button>
            </div>
        </div>
    );
}
