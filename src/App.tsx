import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CreateAlbumPage from "./pages/CreateAlbumPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import ParticipantSubmitPage from "./pages/ParticipantSubmitPage";
import ParticipantPaymentPage from "./pages/ParticipantPaymentPage";
import AlbumPreviewPage from "./pages/AlbumPreviewPage";
import EditSubmissionPage from "./pages/EditSubmissionPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import VerifiedSuccessPage from "./pages/VerifiedSuccessPage";
import VerifyEmailRequiredPage from "./pages/VerifyEmailRequiredPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/submit/:albumId" element={<ParticipantSubmitPage />} />
            <Route path="/edit-submission/:token" element={<EditSubmissionPage />} />
            <Route path="/album/:albumId/payment" element={<ParticipantPaymentPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verify" element={<VerifyEmailPage />} />
            <Route path="/verified-success" element={<VerifiedSuccessPage />} />
            <Route path="/demo" element={<ParticipantSubmitPage />} />
            
            {/* Verification required page (requires auth but not verification) */}
            <Route
              path="/verify-email-required"
              element={
                <ProtectedRoute requireVerification={false}>
                  <VerifyEmailRequiredPage />
                </ProtectedRoute>
              }
            />
            
            {/* Auth routes (redirect if logged in) */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPasswordPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <PublicOnlyRoute>
                  <ResetPasswordPage />
                </PublicOnlyRoute>
              }
            />
            
            {/* Protected routes (require authentication AND email verification) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireVerification={true}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/album/new"
              element={
                <ProtectedRoute requireVerification={true}>
                  <CreateAlbumPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/album/:albumId"
              element={
                <ProtectedRoute requireVerification={true}>
                  <AlbumDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/album/:albumId/edit"
              element={
                <ProtectedRoute requireVerification={true}>
                  <CreateAlbumPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/album/:albumId/preview"
              element={
                <ProtectedRoute requireVerification={true}>
                  <AlbumPreviewPage />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
