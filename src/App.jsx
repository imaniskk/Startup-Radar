import { useState } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import AccountNavigation from "./components/AccountNavigation";
import DiscoverPage from "./pages/DiscoverPage";
import LoginPage from "./pages/LoginPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import AccountPage from "./pages/AccountPage";
import EditAccountPage from "./pages/EditAccountPage";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import useSavedStartups from "./auth/useSavedStartups";
import PublicProfilePage from "./pages/PublicProfilePage";
import FounderProfilePage from "./pages/FounderProfilePage";
import JobsPage from "./pages/JobsPage";
import JobOpeningPage from "./pages/JobOpeningPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import FounderJobsPage from "./pages/FounderJobsPage";
import "./App.css";

function AppLayout() {
  const { user } = useAuth();
  return <AccountLayout key={user?.id || "guest"} />;
}

function AccountLayout() {
  const { session } = useAuth();
  const saves = useSavedStartups(session);
  // Search and filter states
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All");
  const [showSaved, setShowSaved] = useState(false);

  return (
    <div className="app-layout">
      <div className="app-shell">
        <AccountNavigation />
        <Outlet context={{
          search,
          setSearch,
          selectedIndustry,
          setSelectedIndustry,
          selectedLocation,
          setSelectedLocation,
          selectedStage,
          setSelectedStage,
          ...saves,
          showSaved,
          setShowSaved,
        }} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DiscoverPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:openingId" element={<JobOpeningPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="founder/jobs" element={<FounderJobsPage />} />
            <Route path="applicants/:userId" element={<PublicProfilePage />} />
            <Route path="founders/:userId" element={<FounderProfilePage />} />
            <Route path="account/edit" element={<EditAccountPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="create-account" element={<CreateAccountPage />} />
            <Route path="*" element={<main><h1>Page not found</h1><p>Use the navigation to continue.</p></main>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
