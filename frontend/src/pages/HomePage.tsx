import { useState, useEffect } from 'react';
import { useProfile, useGetProfileMemberships } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import ResourcesNeedsView from '../components/ResourcesNeedsView';
import ProfileView from '../components/ProfileView';
import NeedForm from '../components/NeedForm';
import HaveForm from '../components/HaveForm';
import ExchangeView from '../components/ExchangeView';
import EventsPage from '../components/EventsPage';
import AdminMaintenanceView from '../components/AdminMaintenanceView';
import Header from '../components/Header';
import OrganizationProfileChooserDialog from '../components/OrganizationProfileChooserDialog';
import ProfileLoadFallbackCard from '../components/ProfileLoadFallbackCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { AlertCircle } from 'lucide-react';

type View = 'home' | 'profile' | 'need' | 'have' | 'exchange' | 'events' | 'viewProfile' | 'admin';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { data: memberships = [], isLoading: membershipsLoading, error: membershipsError } = useGetProfileMemberships();
  const queryClient = useQueryClient();
  const [showProfileChooser, setShowProfileChooser] = useState(false);

  const handleViewProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setCurrentView('viewProfile');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedProfileId(null);
  };

  const handleRetryProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
    queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    queryClient.invalidateQueries({ queryKey: ['profileMemberships'] });
  };

  const handleOpenProfileChooser = () => {
    setShowProfileChooser(true);
  };

  // Refetch profile when navigating to profile view
  useEffect(() => {
    if (currentView === 'profile') {
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profileMemberships'] });
    }
  }, [currentView, queryClient]);

  // Show profile chooser if user has multiple memberships but no profile loaded
  useEffect(() => {
    if (
      currentView === 'profile' &&
      !profileLoading &&
      !membershipsLoading &&
      !profile &&
      memberships.length > 1
    ) {
      setShowProfileChooser(true);
    }
  }, [currentView, profile, profileLoading, memberships, membershipsLoading]);

  const handleProfileSelected = (profileId: string) => {
    localStorage.setItem('selectedProfileId', profileId);
    setShowProfileChooser(false);
    queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
  };

  // Check if profile data is invalid (missing required fields)
  const isProfileInvalid = profile && (!profile.id || !profile.organizationName);

  // Determine if we should show the fallback card
  const shouldShowFallback = 
    currentView === 'profile' && 
    !profileLoading && 
    !membershipsLoading && 
    (profileError || membershipsError || isProfileInvalid || (!profile && memberships.length > 0));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        profileName={profile?.organizationName || ''}
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <ResourcesNeedsView onViewProfile={handleViewProfile} />
        )}

        {currentView === 'profile' && (
          <>
            {profileLoading || membershipsLoading ? (
              <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground">Loading profile...</p>
                </div>
              </div>
            ) : shouldShowFallback ? (
              <ProfileLoadFallbackCard
                onRetry={handleRetryProfile}
                onChooseOrganization={memberships.length > 1 ? handleOpenProfileChooser : undefined}
                showChooseOrganization={memberships.length > 1}
                errorMessage={
                  profileError 
                    ? 'Failed to load profile data. Please try again.' 
                    : membershipsError 
                    ? 'Failed to load membership information. Please try again.'
                    : isProfileInvalid
                    ? 'Profile data is incomplete or corrupted.'
                    : 'Unable to determine which organization profile to display.'
                }
              />
            ) : profile ? (
              <ProfileView
                profile={profile}
                isOwnProfile={true}
                onBack={handleBackToHome}
              />
            ) : memberships.length === 0 ? (
              <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
                <Card className="max-w-md w-full">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-6 h-6 text-muted-foreground" />
                      <CardTitle>No Organization Profile</CardTitle>
                    </div>
                    <CardDescription>
                      Your account is not currently linked to any organization profile.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      To access your organization profile, you need to either:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      <li>Be assigned to an organization by an administrator</li>
                      <li>Have your join request approved by an organization</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                      Please contact an administrator if you believe this is an error.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <ProfileLoadFallbackCard
                onRetry={handleRetryProfile}
                onChooseOrganization={memberships.length > 1 ? handleOpenProfileChooser : undefined}
                showChooseOrganization={memberships.length > 1}
              />
            )}
          </>
        )}

        {currentView === 'viewProfile' && selectedProfileId && (
          <ProfileView
            profileId={selectedProfileId}
            isOwnProfile={false}
            onBack={handleBackToHome}
          />
        )}

        {currentView === 'need' && (
          <NeedForm onBack={handleBackToHome} onSuccess={handleBackToHome} />
        )}

        {currentView === 'have' && (
          <HaveForm onBack={handleBackToHome} onSuccess={handleBackToHome} />
        )}

        {currentView === 'exchange' && (
          <ExchangeView onViewProfile={handleViewProfile} onBack={handleBackToHome} />
        )}

        {currentView === 'events' && (
          <EventsPage onViewProfile={handleViewProfile} onBack={handleBackToHome} />
        )}

        {currentView === 'admin' && (
          <AdminMaintenanceView onBack={handleBackToHome} />
        )}
      </main>

      {showProfileChooser && memberships.length > 1 && (
        <OrganizationProfileChooserDialog
          memberships={memberships}
          onSelect={handleProfileSelected}
          onClose={() => setShowProfileChooser(false)}
        />
      )}
    </div>
  );
}
