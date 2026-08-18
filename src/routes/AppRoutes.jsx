import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "../components/adminlayout/Layout";

import PortalSelection from "../pages/PortalSelection/PortalSelection";

import Login from "../pages/Auth/Login/Login";
import Otp from "../pages/Auth/OTP/OTP";
import ForgotPassword from "../pages/Auth/ForgotPassword/ForgotPassword";

import Dashboard from "../pages/Dashboard/Dashboard";
import Departments from "../pages/Departments/Departments";
import Contractors from "../pages/Contractors/Contractors";
import Employees from "../pages/Employees/Employees";
import Buildings from "../pages/Buildings/Buildings";
import Floors from "../pages/Floors/Floors";
import Zones from "../pages/Zones/Zones";
import Rooms from "../pages/Rooms/Rooms";
import MechanicalWorks from "../pages/MechanicalWorks/MechanicalWorks";
import ElectricalWorks from "../pages/ElectricalWorks/ElectricalWorks";
import NewRequest from "../pages/Request/NewRequest/NewRequest";
import Reports from "../pages/Reports/Reports";
import Activity from "../pages/Settings/Activity/Activity";
import SafetyPrecaution from "../pages/Settings/SafetyPrecaution/SafetyPrecaution";
import ZoneRoomSeeder from "../pages/Settings/ZoneRoomSeeder";
import LogsReports from "../pages/LogsReports/LogsReports";
import LogHistory from "../pages/LogHistroy/LogHistroy";
import ExecutiveDashboard from "../pages/ExecutiveDashboard/ExecutiveDashboard";


import ProtectedRoute from "../components/common/ProtectedRoute";
import PublicRoute from "../components/common/PublicRoute";
import ListRequest from "../pages/Request/ListRequest/ListRequest";
import PolygonEditor from "../pages/PolygonEditor/PolygonEditor";

function AppRoutes() {
  return (
    <BrowserRouter basename="/development/m3south">
      <Routes>

        {/* Public Routes - restricted if user has valid token */}
        <Route path="/" element={<PortalSelection />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/otp" element={<PublicRoute><Otp /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path='/polygons' element={<PolygonEditor />} />

        {/* Protected Layout */}

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/executive-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin", "admin", "SuperAdmin", "superadmin", "Department", "department", "Department1", "department1"]}>
                <ExecutiveDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractors"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Contractors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/location/buildings"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Buildings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/location/floors"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Floors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/location/zones"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Zones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/location/rooms"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Rooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mechanical-works"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department1"]}>
                <MechanicalWorks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/electrical-works"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department1"]}>
                <ElectricalWorks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-request"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Subcontractor", "Department", "Department1"]}>
                <NewRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list-request"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Subcontractor", "Department", "Department1", "Observer"]}>
                <ListRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["Admin", "admin", "SuperAdmin", "superadmin", "Department", "department", "Department1", "department1", "Subcontractor", "subcontractor", "Observer", "observer"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/activity"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Activity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/safety/precaution"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <SafetyPrecaution />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/seed-zones-rooms"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <ZoneRoomSeeder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs-reports"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <LogsReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log-history"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department", "Department1"]}>
                <LogHistory />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
        </Route> */}

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;