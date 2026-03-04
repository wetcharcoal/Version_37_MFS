import { useAllNeeds, useAllResources, useAllProfiles, useGetProfile, useSearchProfiles, useSearchResources, useSearchNeeds, useIsCallerAdmin, useDeleteNeed, useDeleteResource } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState, useMemo } from 'react';
import { ResourceCategory, FunctionType, Profile } from '../backend';
import { formatDistanceToNow } from 'date-fns';
import { Search, X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface ResourcesNeedsViewProps {
  onViewProfile: (profileId: string) => void;
}

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  [ResourceCategory.foodDrink]: 'Food/Drink',
  [ResourceCategory.storageSpace]: 'Storage Space',
  [ResourceCategory.kitchenSpace]: 'Kitchen Space',
  [ResourceCategory.distributionSpace]: 'Distribution Space',
  [ResourceCategory.equipment]: 'Equipment',
  [ResourceCategory.publicity]: 'Publicity',
  [ResourceCategory.other]: 'Other',
};

const FUNCTION_LABELS: Record<FunctionType, string> = {
  [FunctionType.production]: 'Production',
  [FunctionType.processing]: 'Processing',
  [FunctionType.distribution]: 'Distribution',
  [FunctionType.wasteManagement]: 'Waste Management',
  [FunctionType.education]: 'Education/Information',
  [FunctionType.equipmentSpace]: 'Equipment/Space',
};

export default function ResourcesNeedsView({ onViewProfile }: ResourcesNeedsViewProps) {
  const { data: needs } = useAllNeeds();
  const { data: resources } = useAllResources();
  const { data: profiles } = useAllProfiles();
  const { data: isAdmin } = useIsCallerAdmin();
  const [selectedCategory, setSelectedCategory] = useState<{ category: ResourceCategory; description: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'need' | 'resource'; id: string; description: string } | null>(null);

  const { data: searchedProfiles } = useSearchProfiles(searchTerm);
  const { data: searchedResources } = useSearchResources(searchTerm);
  const { data: searchedNeeds } = useSearchNeeds(searchTerm);

  const { mutate: deleteNeed, isPending: deletingNeed } = useDeleteNeed();
  const { mutate: deleteResource, isPending: deletingResource } = useDeleteResource();

  const hasSearchResults = useMemo(() => {
    return searchTerm.length > 0 && (
      (searchedResources && searchedResources.length > 0) ||
      (searchedNeeds && searchedNeeds.length > 0) ||
      (isAdmin && searchedProfiles && searchedProfiles.length > 0)
    );
  }, [searchTerm, searchedProfiles, searchedResources, searchedNeeds, isAdmin]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSearchResults(value.length > 0);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleSearchResultClick = (profileId: string) => {
    handleClearSearch();
    onViewProfile(profileId);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'need') {
      deleteNeed(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    } else {
      deleteResource(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  };

  const isDeleting = deletingNeed || deletingResource;

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Montreal Food System
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Connecting organizations to share resources and meet needs
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={isAdmin ? "Search profiles, resources, or needs..." : "Search resources or needs..."}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-10 h-12 text-base shadow-lg"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <Card className="absolute top-full mt-2 w-full shadow-2xl z-50 max-h-96 overflow-hidden">
                  <ScrollArea className="max-h-96">
                    {hasSearchResults ? (
                      <div className="p-4 space-y-4">
                        {isAdmin && searchedProfiles && searchedProfiles.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Profiles</h3>
                            <div className="space-y-2">
                              {searchedProfiles.map((profile) => (
                                <button
                                  key={profile.id}
                                  onClick={() => handleSearchResultClick(profile.id)}
                                  className="w-full text-left p-3 hover:bg-accent rounded-lg transition-colors flex items-center space-x-3"
                                >
                                  <Avatar className="w-10 h-10">
                                    {profile.profilePicture ? (
                                      <AvatarImage src={`/assets/generated/${profile.profilePicture}`} alt={profile.organizationName} />
                                    ) : null}
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                                      {profile.organizationName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium">{profile.organizationName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {profile.functions.map(f => FUNCTION_LABELS[f]).join(', ')}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {searchedResources && searchedResources.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Resources</h3>
                            <div className="space-y-2">
                              {searchedResources.map((resource) => (
                                <SearchResourceItem
                                  key={resource.id}
                                  resource={resource}
                                  onClick={handleSearchResultClick}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {searchedNeeds && searchedNeeds.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Needs</h3>
                            <div className="space-y-2">
                              {searchedNeeds.map((need) => (
                                <SearchNeedItem
                                  key={need.id}
                                  need={need}
                                  onClick={handleSearchResultClick}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        No results found for "{searchTerm}"
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              )}
            </div>
          </div>

          <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
            {/* Needs Section */}
            <Card className="shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center space-x-2">
                  <span className="text-primary">Current Needs</span>
                  <Badge variant="secondary" className="text-base">
                    {needs?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-24rem)]">
                  <div className="space-y-3 pr-4">
                    {needs && needs.length > 0 ? (
                      needs.map((need) => (
                        <NeedItem
                          key={need.id}
                          need={need}
                          onViewProfile={onViewProfile}
                          onViewCategory={(category, description) =>
                            setSelectedCategory({ category, description })
                          }
                          onDelete={isAdmin ? (id, description) => setDeleteTarget({ type: 'need', id, description }) : undefined}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-12">
                        No needs posted yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Resources Section */}
            <Card className="shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center space-x-2">
                  <span className="text-secondary">Available Resources</span>
                  <Badge variant="secondary" className="text-base">
                    {resources?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-24rem)]">
                  <div className="space-y-3 pr-4">
                    {resources && resources.length > 0 ? (
                      resources.map((resource) => (
                        <ResourceItem
                          key={resource.id}
                          resource={resource}
                          onViewProfile={onViewProfile}
                          onDelete={isAdmin ? (id, description) => setDeleteTarget({ type: 'resource', id, description }) : undefined}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-12">
                        No resources posted yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Profiles Section - Only for Admins */}
            {isAdmin && (
              <Card className="shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl flex items-center space-x-2">
                    <span className="text-accent">All Profiles</span>
                    <Badge variant="secondary" className="text-base">
                      {profiles?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-24rem)]">
                    <div className="space-y-3 pr-4">
                      {profiles && profiles.length > 0 ? (
                        profiles.map((profile) => (
                          <ProfileItem
                            key={profile.id}
                            profile={profile}
                            onViewProfile={onViewProfile}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-12">
                          No profiles yet
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory && CATEGORY_LABELS[selectedCategory.category]}</DialogTitle>
            <DialogDescription className="pt-4">
              {selectedCategory?.description}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this {deleteTarget?.type}?</p>
              <p className="font-medium text-foreground">{deleteTarget?.description}</p>
              <p className="text-sm">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NeedItem({
  need,
  onViewProfile,
  onViewCategory,
  onDelete,
}: {
  need: any;
  onViewProfile: (profileId: string) => void;
  onViewCategory: (category: ResourceCategory, description: string) => void;
  onDelete?: (id: string, description: string) => void;
}) {
  const { data: profile, isLoading: profileLoading } = useGetProfile(need.profileId);
  const endDate = new Date(Number(need.endDate) / 1000000);

  const profileName = profileLoading ? 'Loading...' : profile?.organizationName || 'Missing profile';
  const profileMissing = !profileLoading && !profile;

  return (
    <div className="flex items-start justify-between p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onViewCategory(need.category, need.description)}
            className="text-base font-semibold text-primary hover:underline text-left"
          >
            {CATEGORY_LABELS[need.category]}
          </button>
          {profileMissing && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Missing profile
            </Badge>
          )}
        </div>
        <button
          onClick={() => onViewProfile(need.profileId)}
          className="text-sm text-muted-foreground hover:text-foreground block font-medium"
        >
          {profileName}
        </button>
        <p className="text-xs text-muted-foreground">
          Until {formatDistanceToNow(endDate, { addSuffix: true })}
        </p>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(need.id, `${CATEGORY_LABELS[need.category]} - ${need.description.substring(0, 50)}`)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function ResourceItem({
  resource,
  onViewProfile,
  onDelete,
}: {
  resource: any;
  onViewProfile: (profileId: string) => void;
  onDelete?: (id: string, description: string) => void;
}) {
  const { data: profile, isLoading: profileLoading } = useGetProfile(resource.profileId);

  const profileName = profileLoading ? 'Loading...' : profile?.organizationName || 'Missing profile';
  const profileMissing = !profileLoading && !profile;

  return (
    <div className="flex items-start justify-between p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-semibold text-secondary">
            {CATEGORY_LABELS[resource.category]}
          </p>
          {profileMissing && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Missing profile
            </Badge>
          )}
        </div>
        <button
          onClick={() => onViewProfile(resource.profileId)}
          className="text-sm text-muted-foreground hover:text-foreground block font-medium"
        >
          {profileName}
        </button>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(resource.id, `${CATEGORY_LABELS[resource.category]} - ${resource.description.substring(0, 50)}`)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function ProfileItem({
  profile,
  onViewProfile,
}: {
  profile: Profile;
  onViewProfile: (profileId: string) => void;
}) {
  return (
    <button
      onClick={() => onViewProfile(profile.id)}
      className="w-full flex items-center space-x-3 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all text-left"
    >
      <Avatar className="w-12 h-12">
        {profile.profilePicture ? (
          <AvatarImage src={`/assets/generated/${profile.profilePicture}`} alt={profile.organizationName} />
        ) : null}
        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
          {profile.organizationName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold truncate">{profile.organizationName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {profile.functions.map(f => FUNCTION_LABELS[f]).join(', ')}
        </p>
      </div>
    </button>
  );
}

function SearchResourceItem({
  resource,
  onClick,
}: {
  resource: any;
  onClick: (profileId: string) => void;
}) {
  const { data: profile } = useGetProfile(resource.profileId);

  return (
    <button
      onClick={() => onClick(resource.profileId)}
      className="w-full text-left p-3 hover:bg-accent rounded-lg transition-colors"
    >
      <p className="font-medium text-sm">{CATEGORY_LABELS[resource.category]}</p>
      <p className="text-xs text-muted-foreground truncate">{resource.description}</p>
      <p className="text-xs text-muted-foreground mt-1">
        by {profile?.organizationName || 'Loading...'}
      </p>
    </button>
  );
}

function SearchNeedItem({
  need,
  onClick,
}: {
  need: any;
  onClick: (profileId: string) => void;
}) {
  const { data: profile } = useGetProfile(need.profileId);

  return (
    <button
      onClick={() => onClick(need.profileId)}
      className="w-full text-left p-3 hover:bg-accent rounded-lg transition-colors"
    >
      <p className="font-medium text-sm">{CATEGORY_LABELS[need.category]}</p>
      <p className="text-xs text-muted-foreground truncate">{need.description}</p>
      <p className="text-xs text-muted-foreground mt-1">
        by {profile?.organizationName || 'Loading...'}
      </p>
    </button>
  );
}
