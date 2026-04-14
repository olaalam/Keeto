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
import CategoryAdd from "./Pages/Category/CategoryAdd";
import Category from "./Pages/Category/Category";
import SubCategoryAdd from "./Pages/SubCategory/SubCategoryAdd";
import SubCategory from "./Pages/SubCategory/SubCategory";
import Restaurant from "./Pages/Restaurant/Restaurant";
import RestaurantAdd from "./Pages/Restaurant/RestaurantAdd";
import Addons from "./Pages/Addons/Addons";
import AddonsAdd from "./Pages/Addons/AddonsAdd";
import AddonsCat from "./Pages/AddonsCat/AddonsCat";
import AddonsCatAdd from "./Pages/AddonsCat/AddonsCatAdd";
import DeliveryZone from "./Pages/DeliveryZone/DeliveryZone";
import DeliveryZoneAdd from "./Pages/DeliveryZone/DeliveryZoneAdd";
import Food from "./Pages/Food/Food";
import FoodAdd from "./Pages/Food/FoodAdd";

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
            {
                path: "categories",
                element: <Category />,
            },
            {
                path: "categories/add",
                element: <CategoryAdd />,
            },
            {
                path: "categories/edit/:id",
                element: <CategoryAdd />,
            },
            {
                path: "sub-categories",
                element: <SubCategory />,
            },
            {
                path: "sub-categories/add",
                element: <SubCategoryAdd />,
            },
            {
                path: "sub-categories/edit/:id",
                element: <SubCategoryAdd />,
            },
            {
                path: "restaurants",
                element: <Restaurant />,
            },
            {
                path: "restaurants/add",
                element: <RestaurantAdd />,
            },
            {
                path: "restaurants/edit/:id",
                element: <RestaurantAdd />,
            },
            {
                path: "addons",
                element: <Addons />,
            },
            {
                path: "addons/add",
                element: <AddonsAdd />,
            },
            {
                path: "addons/edit/:id",
                element: <AddonsAdd />,
            },
            {
                path: "addons-categories",
                element: <AddonsCat />,
            },
            {
                path: "addons-categories/add",
                element: <AddonsCatAdd />,
            },
            {
                path: "addons-categories/edit/:id",
                element: <AddonsCatAdd />,
            },
            {
                path: "delivery-zones",
                element: <DeliveryZone />,
            },
            {
                path: "delivery-zones/add",
                element: <DeliveryZoneAdd />,
            },
            {
                path: "delivery-zones/edit/:id",
                element: <DeliveryZoneAdd />,
            },
            {
                path: "foods",
                element: <Food />,
            },
            {
                path: "foods/add",
                element: <FoodAdd />,
            },
            {
                path: "foods/edit/:id",
                element: <FoodAdd />,
            },
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);
export default router;