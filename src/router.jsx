import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
// import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import NotFound from "./Pages/NotFound";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "dashboard",
                element: <Dashboard />,
            },

        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);

export default router;