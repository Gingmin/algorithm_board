import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProblemView from "./components/ProblemView";
import AdminPage from "./components/AdminPage";
import Dashboard from "./components/Dashboard";

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<ProblemView />} />
                <Route path="/problem/:id" element={<ProblemView />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Route>
        </Routes>
    );
}
