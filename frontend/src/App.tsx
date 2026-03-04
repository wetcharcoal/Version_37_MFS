import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetJoinRequestStatus, useGetProfileMemberships } from './hooks/useQueries';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import RegistrationPage from './pages/RegistrationPage';
import MemberJoinPage from './pages/MemberJoinPage';
import HomePage from './pages/HomePage';
import { Toaster } from './components/ui/sonner';

function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: joinRequestStatus, isLoading: joinStatusLoading } = useGetJoinRequestStatus();
  const { data: memberships, isLoading: membershipsLoading } = useGetProfileMemberships();

  if (isInitializing || (identity && (profileLoading || membershipsLoading))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  // If user has a profile OR has memberships, go to home
  if (userProfile || (memberships && memberships.length > 0)) {
    return (
      <>
        <HomePage />
        <Toaster />
      </>
    );
  }

  // If user has a pending or approved join request, show the join page with status
  if (!joinStatusLoading && joinRequestStatus && joinRequestStatus !== 'denied') {
    return (
      <>
        <MemberJoinPage existingStatus={joinRequestStatus} />
        <Toaster />
      </>
    );
  }

  // Otherwise show onboarding choice
  return (
    <>
      <OnboardingPage />
      <Toaster />
    </>
  );
}

export default App;
