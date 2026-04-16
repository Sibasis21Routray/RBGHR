import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./component/ProtectedRoute";
import UserForm from "./component/Form";
import SubAdminPage from "./component/SubAdminPage";
import SubUserPage from "./component/SubUserPage";
import AdminPage from "./component/AdminPage";
import Register from "./component/Register";
import Login from "./component/Login";
import Logout from "./component/Logout";
import ResetPassword from "./component/ResetPassword";
import AdminPanel from "./component/AdminPannel";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/user"
            element={
              <ProtectedRoute requiredRoles={["user"]}>
                <UserForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-user"
            element={
              <ProtectedRoute requiredRoles={["sub-user", "subuser"]}>
                <SubUserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-admin"
            element={
              <ProtectedRoute requiredRoles={["sub-admin", "subadmin"]}>
                <SubAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route 
          path="/admin/panel"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          } 
          />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<Login />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
