import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { ProductDetail } from "./pages/ProductDetail";
import { Analytics } from "./pages/Analytics";
import { Alerts } from "./pages/Alerts";
import { AddProduct } from "./pages/AddProduct";
import { Settings } from "./pages/Settings";
import { QuickBilling } from "./pages/QuickBilling";
import { History } from "./pages/History";
import { TopSellingProducts } from "./pages/TopSellingProducts";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/app",
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "inventory",
            element: <Inventory />,
          },
          {
            path: "history",
            element: <History />,
          },
          {
            path: "top-selling",
            element: <TopSellingProducts />,
          },
          {
            path: "product/:id",
            element: <ProductDetail />,
          },
          {
            path: "analytics",
            element: <Analytics />,
          },
          {
            path: "alerts",
            element: <Alerts />,
          },
          {
            path: "add-product",
            element: <AddProduct />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
          {
            path: "quick-billing",
            element: <QuickBilling />,
          },
        ],
      },
    ],
  },
]);
