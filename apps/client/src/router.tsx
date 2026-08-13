import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";
import Navbar from "./common/components/Navbar";
import AuthLayout from "./common/components/AuthLayout";
import DashboardLayout from "./common/components/DashboardLayout";
import ProtectedRoute from "./common/components/ProtectedRoute";
import GuestRoute from "./common/components/GuestRoute";
import { createLogger } from "./lib/logger";

const logger = createLogger("Router");

/* Public pages */
import HomePage from "./features/landing/HomePage";
import ChatPage from "./features/chat/ChatPage";

/* Auth pages */
import {
  LoginPage,
  SignupPage,
  VerifyEmailPage,
  ResetPasswordPage,
  OAuthCallback,
  NotFound,
} from "./features/auth";

/* Dashboard pages */


import Footer from "./common/components/Footer";
import ContactPage from "./features/landing/ContactPage";
import ScrollToTop from "./common/components/ScrollToTop";
import RequireRole from "./common/components/RequireRole";

/* Admin Pages */
import {
  AdminCertifications,
  AdminDataDownload,
  AdminDataPipeline,
  AdminEducation,
  AdminExperience,
  AdminProjects,
  AdminSkills,
  AdminUserDetail,
  AdminUsers,
  CampaignCreator,
  CampaignList,
} from "./features/admin";

import { BarcodeGenerator, CampaignFill, ProjectsPage } from "./features/projects";
import { ImageToPdf, PdfMerger } from "./features/projects/pdf";
import { DashboardChat, DashboardHome, ProfilePage } from "./features/dashboard";

/* Placeholder public pages */
function Analytics() {
  return (
    <div className="p-8 text-center text-2xl min-h-screen">
      Analytics (coming soon)
    </div>
  );
}
function Sandbox() {
  return (
    <div className="p-8 text-center text-2xl min-h-screen">
      Data Sandbox (coming soon)
    </div>
  );
}

function RouteLogger() {
  const location = useLocation();
  useEffect(() => {
    logger.log(`Navigated to ${location.pathname}`);
  }, [location]);
  return null;
}

/* Main layout: Navbar + content + Footer */
function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-[90vh]">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RouteLogger />
      <Routes>
        {/* Auth pages – only for guests */}
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
          </Route>
        </Route>

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/chat" element={<DashboardChat />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/dashboard/pdf/merge" element={<PdfMerger />} />
            <Route path="/dashboard/pdf/images-to-pdf" element={<ImageToPdf />} />
            <Route path="/dashboard/campaign" element={<CampaignList />} />
            <Route path="/dashboard/campaign/create" element={<CampaignCreator />} />
            <Route path="/dashboard/campaign/edit/:id" element={<CampaignCreator />} />

            {/* Admin protected dashboard routes */}
            <Route element={<RequireRole roles={["SUPERADMIN"]} />}>
              <Route path="/dashboard/users" element={<AdminUsers />} />
              <Route path="/dashboard/users/:id" element={<AdminUserDetail />} />
              <Route path="/dashboard/certifications" element={<AdminCertifications />} />
              <Route path="/dashboard/education" element={<AdminEducation />} />
              <Route path="/dashboard/experience" element={<AdminExperience />} />
              <Route path="/dashboard/skills" element={<AdminSkills />} />
              <Route path="/dashboard/projects" element={<AdminProjects />} />
              <Route path="/dashboard/data/download" element={<AdminDataDownload />} />
              <Route path="/dashboard/data/pipeline" element={<AdminDataPipeline />} />
              <Route path="/dashboard/barcode/generator" element={<BarcodeGenerator />} />
            </Route>
          </Route>
        </Route>

        {/* Public pages with main Navbar + Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/pdf/merge" element={<PdfMerger />} />
          <Route path="/pdf/images-to-pdf" element={<ImageToPdf />} />
          <Route path="/campaign/:id" element={<CampaignFill />} />
          <Route path="/barcode-generator" element={<BarcodeGenerator />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
