import { useGetProfile, useDeleteNeed, useDeleteResource, useGetNeed, useIsCallerAdmin, useDeleteProfile, useGetProfileMembers } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Home, Mail, Phone, MapPin, X, Users, Trash2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FunctionType, ResourceCategory, ResourceHave, ProfileRole } from '../backend';
import { formatDistanceToNow } from 'date-fns';
import { useFileUrl } from '../blob-storage/FileStorage';
import ClubMemberManagementDialog from './ClubMemberManagementDialog';

interface ProfileViewProps {
  profile?: any;
  profileId?: string;
  isOwnProfile: boolean;
  onBack: () => void;
}

const FUNCTION_LABELS: Record<FunctionType, string> = {
  [FunctionType.production]: 'Production',
  [FunctionType.processing]: 'Processing',
  [FunctionType.distribution]: 'Distribution',
  [FunctionType.wasteManagement]: 'Waste Management',
  [FunctionType.education]: 'Education/Information',
  [FunctionType.equipmentSpace]: 'Equipment/Space',
};

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  [ResourceCategory.foodDrink]: 'Food/Drink',
  [ResourceCategory.storageSpace]: 'Storage Space',
  [ResourceCategory.kitchenSpace]: 'Kitchen Space',
  [ResourceCategory.distributionSpace]: 'Distribution Space',
  [ResourceCategory.equipment]: 'Equipment',
  [ResourceCategory.publicity]: 'Publicity',
  [ResourceCategory.other]: 'Other',
};

export default function ProfileView({ profile: propProfile, profileId, isOwnProfile, onBack }: ProfileViewProps) {
  const { data: fetchedProfile, isLoading: profileLoading, error: profileError } = useGetProfile(profileId || null);
  const profile = propProfile || fetchedProfile;
  const { mutate: deleteNeed } = useDeleteNeed();
  const { mutate: deleteResource } = useDeleteResource();
  const { mutate: deleteProfile } = useDeleteProfile();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const { data: members = [] } = useGetProfileMembers(profile?.id || null);
  const { identity } = useInternetIdentity();
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [showMemberManagement, setShowMemberManagement] = useState(false);

  // Get profile picture URL from blob storage if it's a path
  const shouldFetchUrl = profile?.profilePicture && !profile.profilePicture.startsWith('http');
  const { data: profilePictureUrl } = useFileUrl(shouldFetchUrl ? profile.profilePicture : '');

  const displayProfilePicture = profile?.profilePicture?.startsWith('http') 
    ? profile.profilePicture 
    : profilePictureUrl;

  // Check if current user is a club admin for this profile
  const isClubAdmin = members.some(
    (member) =>
      member.principal.toString() === identity?.getPrincipal().toString() &&
      member.role === ProfileRole.clubAdmin
  );

  const canManageMembers = isAdmin || isClubAdmin;
  const canDeleteProfile = isAdmin;

  const handleDeleteProfile = () => {
    if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      deleteProfile(profile.id, {
        onSuccess: () => {
          onBack();
        },
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <CardTitle>Profile Not Found</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The profile you're looking for could not be loaded. It may have been deleted or you may not have permission to view it.
            </p>
            <Button onClick={onBack} variant="outline" className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="mb-4">
              ← Back
            </Button>
            <div className="flex items-center space-x-2">
              {canManageMembers && (
                <Button
                  variant="outline"
                  onClick={() => setShowMemberManagement(true)}
                  className="space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Members</span>
                </Button>
              )}
              {canDeleteProfile && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteProfile}
                  className="space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Profile</span>
                </Button>
              )}
            </div>
          </div>

          <Card className="shadow-xl">
            <CardHeader className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={displayProfilePicture || undefined} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                    {profile.organizationName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <h1 className="text-3xl font-bold">{profile.organizationName}</h1>
                  <div className="flex flex-wrap gap-2">
                    {profile.functions.map((func: FunctionType) => (
                      <Badge key={func} variant="secondary">
                        {FUNCTION_LABELS[func]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm sm:col-span-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-primary">Needs</span>
                  <Badge variant="secondary">{profile.needs?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.needs && profile.needs.length > 0 ? (
                    profile.needs.map((needId: string) => (
                      <NeedItem
                        key={needId}
                        needId={needId}
                        canDelete={isOwnProfile || isAdmin || isClubAdmin}
                        onDelete={() => deleteNeed(needId)}
                        onView={() => setSelectedNeedId(needId)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No needs posted
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-secondary">Resources</span>
                  <Badge variant="secondary">{profile.resources?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.resources && profile.resources.length > 0 ? (
                    profile.resources.map((resourceId: string) => (
                      <ResourceItem
                        key={resourceId}
                        resourceId={resourceId}
                        canDelete={isOwnProfile || isAdmin || isClubAdmin}
                        onDelete={() => deleteResource(resourceId)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No resources posted
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <button
          onClick={onBack}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        >
          <Home className="w-6 h-6" />
        </button>
      </div>

      <NeedDialog needId={selectedNeedId} onClose={() => setSelectedNeedId(null)} />

      {showMemberManagement && profile && (
        <ClubMemberManagementDialog
          profileId={profile.id}
          open={showMemberManagement}
          onClose={() => setShowMemberManagement(false)}
        />
      )}
    </>
  );
}

function NeedItem({
  needId,
  canDelete,
  onDelete,
  onView,
}: {
  needId: string;
  canDelete: boolean;
  onDelete: () => void;
  onView: () => void;
}) {
  const { data: need } = useGetNeed(needId);

  if (!need) return null;

  const endDate = new Date(Number(need.endDate) / 1000000);

  return (
    <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
      <button onClick={onView} className="flex-1 text-left space-y-1">
        <p className="text-sm font-medium">{CATEGORY_LABELS[need.category]}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{need.description}</p>
        <p className="text-xs text-muted-foreground">
          Until {formatDistanceToNow(endDate, { addSuffix: true })}
        </p>
      </button>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function ResourceItem({
  resourceId,
  canDelete,
  onDelete,
}: {
  resourceId: string;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const { actor } = useActor();
  const [resource, setResource] = useState<ResourceHave | null>(null);

  useEffect(() => {
    if (actor) {
      actor.getResourceHave(resourceId).then(setResource);
    }
  }, [actor, resourceId]);

  if (!resource) return null;

  return (
    <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{CATEGORY_LABELS[resource.category]}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function NeedDialog({ needId, onClose }: { needId: string | null; onClose: () => void }) {
  const { data: need } = useGetNeed(needId);

  if (!need) return null;

  const startDate = new Date(Number(need.startDate) / 1000000);
  const endDate = new Date(Number(need.endDate) / 1000000);

  return (
    <Dialog open={!!needId} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{CATEGORY_LABELS[need.category]}</DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <p className="text-foreground">{need.description}</p>
            <Separator />
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Start:</span> {startDate.toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">End:</span> {endDate.toLocaleDateString()}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
