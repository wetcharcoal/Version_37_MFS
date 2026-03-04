import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { useSearchProfiles, useRequestJoin } from '../hooks/useQueries';
import { Profile, JoinRequestStatus } from '../backend';
import { Search, Building2, ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

interface MemberJoinPageProps {
  onBack?: () => void;
  existingStatus?: JoinRequestStatus;
}

export default function MemberJoinPage({ onBack, existingStatus }: MemberJoinPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(!!existingStatus);
  const [requestStatus, setRequestStatus] = useState<JoinRequestStatus | null>(existingStatus || null);
  
  const { data: searchResults = [] } = useSearchProfiles(searchTerm);
  const { mutate: requestJoin, isPending } = useRequestJoin();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleSubmitRequest = () => {
    if (!selectedProfile) return;

    requestJoin(selectedProfile.id, {
      onSuccess: () => {
        setHasSubmitted(true);
        setRequestStatus('pending' as JoinRequestStatus);
      },
    });
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center py-12 px-4">
        <Card className="max-w-2xl w-full shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            {requestStatus === 'pending' && (
              <>
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-10 h-10 text-yellow-600" />
                </div>
                <CardTitle className="text-3xl">Request Pending</CardTitle>
                <CardDescription className="text-base">
                  Your request to join <span className="font-semibold text-foreground">{selectedProfile?.organizationName}</span> has been submitted.
                </CardDescription>
              </>
            )}
            {requestStatus === 'approved' && (
              <>
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <CardTitle className="text-3xl">Request Approved!</CardTitle>
                <CardDescription className="text-base">
                  Your request has been approved. Please refresh the page to access your organization.
                </CardDescription>
              </>
            )}
            {requestStatus === 'denied' && (
              <>
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <CardTitle className="text-3xl">Request Denied</CardTitle>
                <CardDescription className="text-base">
                  Your request to join was not approved. You can submit a new request to a different organization.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {requestStatus === 'pending' && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">
                  A club administrator will review your request. You will be notified once a decision is made.
                </p>
                <p className="text-sm text-muted-foreground">
                  In the meantime, you can log out and check back later.
                </p>
              </div>
            )}
            {requestStatus === 'approved' && (
              <Button 
                className="w-full h-12 text-base font-semibold" 
                onClick={() => window.location.reload()}
              >
                Continue to Home
              </Button>
            )}
            {requestStatus === 'denied' && (
              <Button 
                className="w-full h-12 text-base font-semibold" 
                onClick={() => {
                  setHasSubmitted(false);
                  setRequestStatus(null);
                  setSelectedProfile(null);
                }}
              >
                Submit New Request
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full h-12 text-base" 
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        <Card className="shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Join an Organization
            </CardTitle>
            <CardDescription className="text-center text-base">
              Search for an organization and request to join as a member
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="search">Search Organizations</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search organizations..."
                  className="pl-10"
                />
              </div>
            </div>

            {searchTerm && (
              <div className="space-y-3">
                <Label>Search Results ({searchResults.length})</Label>
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No organizations found matching "{searchTerm}"
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {searchResults.map((profile) => (
                        <Card
                          key={profile.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedProfile?.id === profile.id
                              ? 'ring-2 ring-primary bg-primary/5'
                              : ''
                          }`}
                          onClick={() => setSelectedProfile(profile)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-2">
                                <h3 className="font-semibold text-lg">{profile.organizationName}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {profile.bio || 'No description available'}
                                </p>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <span>{profile.address}</span>
                                </div>
                              </div>
                              {selectedProfile?.id === profile.id && (
                                <Badge className="bg-primary">Selected</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {selectedProfile && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Selected Organization</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedProfile.organizationName}</p>
                    <p className="text-sm text-muted-foreground">{selectedProfile.address}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmitRequest}
              disabled={!selectedProfile || isPending}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting Request...
                </>
              ) : (
                'Submit Join Request'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
