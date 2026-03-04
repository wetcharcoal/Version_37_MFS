import { useState } from 'react';
import { useAdminGetAllNeeds, useAdminGetAllResources, useAdminGetAllEvents, useAdminSearchNeeds, useAdminSearchResources, useAdminSearchEvents, useDeleteNeed, useDeleteResource, useDeleteEvent, useGetProfile, useAllProfiles, useAdminCreateProfile, useAdminAssignProfileMember, useGetProfileMembers } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Search, Trash2, AlertTriangle, Plus, Users } from 'lucide-react';
import { ResourceCategory, Need, ResourceHave, Event, FunctionType, ProfileRole } from '../backend';
import { formatDistanceToNow } from 'date-fns';

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
  [FunctionType.education]: 'Education',
  [FunctionType.equipmentSpace]: 'Equipment/Space',
};

interface AdminMaintenanceViewProps {
  onBack: () => void;
}

export default function AdminMaintenanceView({ onBack }: AdminMaintenanceViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'need' | 'resource' | 'event'; id: string; description: string } | null>(null);

  const { data: allNeeds, isLoading: needsLoading } = useAdminGetAllNeeds();
  const { data: allResources, isLoading: resourcesLoading } = useAdminGetAllResources();
  const { data: allEvents, isLoading: eventsLoading } = useAdminGetAllEvents();

  const { data: searchedNeeds } = useAdminSearchNeeds(searchTerm);
  const { data: searchedResources } = useAdminSearchResources(searchTerm);
  const { data: searchedEvents } = useAdminSearchEvents(searchTerm);

  const { mutate: deleteNeed, isPending: deletingNeed } = useDeleteNeed();
  const { mutate: deleteResource, isPending: deletingResource } = useDeleteResource();
  const { mutate: deleteEvent, isPending: deletingEvent } = useDeleteEvent();

  const displayedNeeds = searchTerm ? searchedNeeds : allNeeds;
  const displayedResources = searchTerm ? searchedResources : allResources;
  const displayedEvents = searchTerm ? searchedEvents : allEvents;

  const handleDelete = () => {
    if (!deleteTarget) return;

    switch (deleteTarget.type) {
      case 'need':
        deleteNeed(deleteTarget.id, {
          onSuccess: () => setDeleteTarget(null),
        });
        break;
      case 'resource':
        deleteResource(deleteTarget.id, {
          onSuccess: () => setDeleteTarget(null),
        });
        break;
      case 'event':
        deleteEvent(deleteTarget.id, {
          onSuccess: () => setDeleteTarget(null),
        });
        break;
    }
  };

  const isDeleting = deletingNeed || deletingResource || deletingEvent;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back to Home
          </Button>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage profiles, members, and moderate all content in the system
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>Admin Tools</CardTitle>
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by text or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profiles" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profiles">
                  Profiles
                </TabsTrigger>
                <TabsTrigger value="needs">
                  Needs {displayedNeeds && `(${displayedNeeds.length})`}
                </TabsTrigger>
                <TabsTrigger value="resources">
                  Resources {displayedResources && `(${displayedResources.length})`}
                </TabsTrigger>
                <TabsTrigger value="events">
                  Events {displayedEvents && `(${displayedEvents.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profiles" className="mt-4">
                <ProfileManagementTab />
              </TabsContent>

              <TabsContent value="needs" className="mt-4">
                <ScrollArea className="h-[calc(100vh-28rem)]">
                  <div className="space-y-3 pr-4">
                    {needsLoading ? (
                      <p className="text-center text-muted-foreground py-8">Loading needs...</p>
                    ) : displayedNeeds && displayedNeeds.length > 0 ? (
                      displayedNeeds.map((need) => (
                        <NeedCard
                          key={need.id}
                          need={need}
                          onDelete={(id, description) =>
                            setDeleteTarget({ type: 'need', id, description })
                          }
                        />
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {searchTerm ? 'No needs found matching your search' : 'No needs in the system'}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="resources" className="mt-4">
                <ScrollArea className="h-[calc(100vh-28rem)]">
                  <div className="space-y-3 pr-4">
                    {resourcesLoading ? (
                      <p className="text-center text-muted-foreground py-8">Loading resources...</p>
                    ) : displayedResources && displayedResources.length > 0 ? (
                      displayedResources.map((resource) => (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          onDelete={(id, description) =>
                            setDeleteTarget({ type: 'resource', id, description })
                          }
                        />
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {searchTerm ? 'No resources found matching your search' : 'No resources in the system'}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="events" className="mt-4">
                <ScrollArea className="h-[calc(100vh-28rem)]">
                  <div className="space-y-3 pr-4">
                    {eventsLoading ? (
                      <p className="text-center text-muted-foreground py-8">Loading events...</p>
                    ) : displayedEvents && displayedEvents.length > 0 ? (
                      displayedEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onDelete={(id, description) =>
                            setDeleteTarget({ type: 'event', id, description })
                          }
                        />
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {searchTerm ? 'No events found matching your search' : 'No events in the system'}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}

function ProfileManagementTab() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileSearchTerm, setProfileSearchTerm] = useState('');

  const { data: allProfiles, isLoading: profilesLoading } = useAllProfiles();

  const filteredProfiles = allProfiles?.filter(profile =>
    profile.organizationName.toLowerCase().includes(profileSearchTerm.toLowerCase()) ||
    profile.id.toLowerCase().includes(profileSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search profiles..."
            value={profileSearchTerm}
            onChange={(e) => setProfileSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="ml-4">
          <Plus className="w-4 h-4 mr-2" />
          Create Profile
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Create New Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateProfileForm onSuccess={() => setShowCreateForm(false)} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 pr-4">
                {profilesLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading profiles...</p>
                ) : filteredProfiles && filteredProfiles.length > 0 ? (
                  filteredProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfileId(profile.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedProfileId === profile.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium">{profile.organizationName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{profile.id}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {profileSearchTerm ? 'No profiles found' : 'No profiles in the system'}
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Member Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProfileId ? (
              <MemberManagementPanel profileId={selectedProfileId} />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Select a profile to manage members
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CreateProfileForm({ onSuccess }: { onSuccess: () => void }) {
  const [profileId, setProfileId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [selectedFunctions, setSelectedFunctions] = useState<FunctionType[]>([]);

  const { mutate: createProfile, isPending } = useAdminCreateProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileId || !organizationName || !address || !phone || !email || selectedFunctions.length === 0) {
      return;
    }

    createProfile(
      {
        id: profileId,
        organizationName,
        functions: selectedFunctions,
        address,
        phone,
        email,
        bio: bio || undefined,
      },
      {
        onSuccess: () => {
          setProfileId('');
          setOrganizationName('');
          setAddress('');
          setPhone('');
          setEmail('');
          setBio('');
          setSelectedFunctions([]);
          onSuccess();
        },
      }
    );
  };

  const toggleFunction = (func: FunctionType) => {
    setSelectedFunctions(prev =>
      prev.includes(func)
        ? prev.filter(f => f !== func)
        : [...prev, func]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="profileId">Profile ID *</Label>
          <Input
            id="profileId"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            placeholder="e.g., mcgill_food_coalition"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization Name *</Label>
          <Input
            id="organizationName"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="e.g., McGill Food Coalition"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., 3907 Rue St. Hubert"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., 4388744084"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., contact@organization.com"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Bio (optional)</Label>
          <Input
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief description..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Functions *</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(FUNCTION_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`function-${key}`}
                  checked={selectedFunctions.includes(key as FunctionType)}
                  onCheckedChange={() => toggleFunction(key as FunctionType)}
                />
                <label
                  htmlFor={`function-${key}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Profile'}
        </Button>
      </div>
    </form>
  );
}

function MemberManagementPanel({ profileId }: { profileId: string }) {
  const [principalInput, setPrincipalInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProfileRole>(ProfileRole.user);

  const { identity } = useInternetIdentity();
  const { data: members, isLoading: membersLoading } = useGetProfileMembers(profileId);
  const { mutate: assignMember, isPending: assigning } = useAdminAssignProfileMember();

  const handleAssignMember = () => {
    if (!principalInput.trim()) return;

    assignMember(
      {
        profileId,
        principal: principalInput.trim(),
        role: selectedRole,
      },
      {
        onSuccess: () => {
          setPrincipalInput('');
          setSelectedRole(ProfileRole.user);
        },
      }
    );
  };

  const handleAssignSelf = () => {
    if (!identity) return;

    assignMember(
      {
        profileId,
        principal: identity.getPrincipal().toString(),
        role: selectedRole,
      },
      {
        onSuccess: () => {
          setSelectedRole(ProfileRole.user);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="principal">Principal ID</Label>
          <Input
            id="principal"
            value={principalInput}
            onChange={(e) => setPrincipalInput(e.target.value)}
            placeholder="Enter principal ID..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as ProfileRole)}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ProfileRole.user}>User</SelectItem>
              <SelectItem value={ProfileRole.clubAdmin}>Club Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAssignMember}
            disabled={!principalInput.trim() || assigning}
            className="flex-1"
          >
            {assigning ? 'Assigning...' : 'Assign Member'}
          </Button>
          <Button
            onClick={handleAssignSelf}
            disabled={assigning}
            variant="outline"
            className="flex-1"
          >
            Assign Myself
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Current Members</Label>
        <ScrollArea className="h-[300px] border rounded-lg p-4">
          {membersLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading members...</p>
          ) : members && members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.principal.toString()}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate">
                      {member.principal.toString()}
                    </p>
                  </div>
                  <Badge variant={member.role === ProfileRole.clubAdmin ? 'default' : 'secondary'}>
                    {member.role === ProfileRole.clubAdmin ? 'Club Admin' : 'User'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No members yet</p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function NeedCard({ need, onDelete }: { need: Need; onDelete: (id: string, description: string) => void }) {
  const { data: profile, isLoading: profileLoading } = useGetProfile(need.profileId);
  const endDate = new Date(Number(need.endDate) / 1000000);
  const isExpired = endDate < new Date();

  const profileName = profileLoading ? 'Loading...' : profile?.organizationName || 'Missing profile';
  const profileMissing = !profileLoading && !profile;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{CATEGORY_LABELS[need.category]}</Badge>
              {isExpired && <Badge variant="destructive">Expired</Badge>}
              {profileMissing && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Missing Profile
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium">{need.description}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Profile: {profileName}</p>
              <p>Profile ID: {need.profileId}</p>
              <p>Need ID: {need.id}</p>
              <p>Until: {formatDistanceToNow(endDate, { addSuffix: true })}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(need.id, `${CATEGORY_LABELS[need.category]} - ${need.description.substring(0, 50)}`)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceCard({ resource, onDelete }: { resource: ResourceHave; onDelete: (id: string, description: string) => void }) {
  const { data: profile, isLoading: profileLoading } = useGetProfile(resource.profileId);

  const profileName = profileLoading ? 'Loading...' : profile?.organizationName || 'Missing profile';
  const profileMissing = !profileLoading && !profile;

  return (
    <Card className="border-l-4 border-l-secondary">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{CATEGORY_LABELS[resource.category]}</Badge>
              {profileMissing && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Missing Profile
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium">{resource.description}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Profile: {profileName}</p>
              <p>Profile ID: {resource.profileId}</p>
              <p>Resource ID: {resource.id}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(resource.id, `${CATEGORY_LABELS[resource.category]} - ${resource.description.substring(0, 50)}`)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event, onDelete }: { event: Event; onDelete: (id: string, description: string) => void }) {
  const { data: profile, isLoading: profileLoading } = useGetProfile(event.creatorProfileId);
  const eventDate = new Date(Number(event.time) / 1000000);

  const profileName = profileLoading ? 'Loading...' : profile?.organizationName || 'Missing profile';
  const profileMissing = !profileLoading && !profile;

  return (
    <Card className="border-l-4 border-l-accent">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">Event</Badge>
              {profileMissing && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Missing Profile
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium">{event.description}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Location: {event.location}</p>
              <p>Profile: {profileName}</p>
              <p>Profile ID: {event.creatorProfileId}</p>
              <p>Event ID: {event.id}</p>
              <p>Date: {eventDate.toLocaleString()}</p>
              <p>Needs: {event.needs.length}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(event.id, `${event.description.substring(0, 50)} at ${event.location}`)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
