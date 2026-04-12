import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
// import Dashboard from "./pages/Dashboard";
import NotFound from "./Pages/NotFound";
import Home from "./Pages/Home";
import AdminAdd from "./Pages/Admins/AdminAdd";
import Admin from "./Pages/Admins/Admin";
import Layout from "./components/Layout";
import Country from "./Pages/Country/Country";
import CountryAdd from "./Pages/Country/CountryAdd";
import City from "./Pages/City/City";
import CityAdd from "./Pages/City/CityAdd";
import Zone from "./Pages/Zone/Zone";
import ZoneAdd from "./Pages/Zone/ZoneAdd";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <Layout /> {/* استخدمي Layout هنا بدلاً من Home لتنظيم الصفحة */}
            </ProtectedRoute>
        ),
        children: [
            {
                index: true, // ليعرض صفحة Home عند الدخول على "/" مباشرة
                element: <Home />,
            },
            {
                path: "admins",
                element: <Admin />,
            },
            {
                path: "admins/add",
                element: <AdminAdd />,
            },
            {
                path: "admins/edit/:id",
                element: <AdminAdd />,
            },
            {
                path: "countries",
                element: <Country />,
            },
            {
                path: "countries/add",
                element: <CountryAdd />,
            },
            {
                path: "countries/edit/:id",
                element: <CountryAdd />,
            },
            {
                path: "cities",
                element: <City />,
            },
            {
                path: "cities/add",
                element: <CityAdd />,
            },
            {
                path: "cities/edit/:id",
                element: <CityAdd />,
            },
            {
                path: "zones",
                element: <Zone />,
            },
            {
                path: "zones/add",
                element: <ZoneAdd />,
            },
            {
                path: "zones/edit/:id",
                element: <ZoneAdd />,
            },
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);
export default router;