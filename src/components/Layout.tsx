import { Outlet, NavLink } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useTheme } from "../context/ThemeContext";

export default function Layout() {
    const { dark, toggle } = useTheme();

    return (
        <div className="flex flex-col h-screen bg-c-bg">
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-2.5 border-b border-c-border bg-c-bg-2">
                <div className="flex items-center gap-6">
                    <NavLink to="/" className="text-lg font-bold text-c-primary no-underline tracking-tight">
                        Algorithm Board
                    </NavLink>
                    <nav className="flex gap-1">
                        {[
                            { to: "/", label: "풀이" },
                            { to: "/admin", label: "관리" },
                            { to: "/dashboard", label: "대시보드" },
                        ].map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === "/"}
                                className={({ isActive }) =>
                                    `px-3 py-1.5 rounded-md text-sm font-medium no-underline transition-colors ${
                                        isActive ? "bg-c-primary text-white" : "text-c-text-2 hover:bg-c-bg-3"
                                    }`
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <button
                    onClick={toggle}
                    className="p-2 rounded-lg hover:bg-c-bg-3 transition-colors text-c-text-2 cursor-pointer border-none bg-transparent"
                    title={dark ? "라이트 모드" : "다크 모드"}
                >
                    {dark ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
