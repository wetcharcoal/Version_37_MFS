import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { Profile, Need, ResourceHave, FunctionType, ResourceCategory, CategoryMatch, Event, UserRole, ProfileMember, ProfileRole, JoinRequest, JoinRequestStatus, MembershipInfo } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';

export function useProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Profile | null>({
    queryKey: ['loggedInProfile', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      
      try {
        // First try to get user profile
        const userProfile = await actor.getCallerUserProfile().catch(() => null);
        if (userProfile) {
          const profile = await actor.getProfile(userProfile.profileId);
          return profile;
        }
      } catch (error) {
        // If getCallerUserProfile fails, continue to membership resolution
        console.warn('Failed to get caller user profile:', error);
      }
      
      // If no user profile, check memberships using the stable non-trapping method
      try {
        const memberships = await actor.getGroupsByCaller();
        if (memberships.length === 0) return null;
        
        // Check localStorage for selected profile
        const selectedProfileId = localStorage.getItem('selectedProfileId');
        if (selectedProfileId && memberships.some(m => m.profileId === selectedProfileId)) {
          const profile = await actor.getProfile(selectedProfileId);
          return profile;
        }
        
        // If only one membership, use it
        if (memberships.length === 1) {
          const profile = await actor.getProfile(memberships[0].profileId);
          return profile;
        }
        
        // Multiple memberships but no selection - return null to trigger chooser
        return null;
      } catch (error) {
        console.error('Failed to get memberships:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
    retry: false,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<{ profileId: string } | null>({
    queryKey: ['currentUserProfile', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error: any) {
        // If authorization fails, return null instead of throwing
        if (error.message?.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetProfileMemberships() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<MembershipInfo[]>({
    queryKey: ['profileMemberships', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      try {
        // Use the stable non-trapping method
        return await actor.getGroupsByCaller();
      } catch (error: any) {
        console.error('Failed to get memberships:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetDisplayName(principal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['displayName', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      try {
        return await actor.getDisplayName(principal);
      } catch (error: any) {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetCallerDisplayName() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<string | null>({
    queryKey: ['callerDisplayName', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      try {
        return await actor.getDisplayName(identity.getPrincipal());
      } catch (error: any) {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSetDisplayName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error('Not authenticated');
      await actor.setDisplayName(displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerDisplayName'] });
      queryClient.invalidateQueries({ queryKey: ['displayName'] });
      queryClient.invalidateQueries({ queryKey: ['profileMembers'] });
      queryClient.invalidateQueries({ queryKey: ['joinRequests'] });
      toast.success('Display name updated successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to update display name';
      toast.error(message);
    },
  });
}

// Role and permission hooks
export function useCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      organizationName: string;
      functions: FunctionType[];
      address: string;
      phone: string;
      email: string;
      bio?: string;
      profilePicture?: string;
    }) => {
      if (!actor) throw new Error('Not authenticated');
      const profileId = `profile-${Date.now()}`;
      await actor.registerProfile(
        profileId,
        data.organizationName,
        data.functions,
        data.address,
        data.phone,
        data.email,
        data.bio || null,
        data.profilePicture || null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profileMemberships'] });
      toast.success('Profile registered successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to register profile';
      toast.error(message);
    },
  });
}

export function useAllNeeds() {
  const { actor, isFetching } = useActor();

  return useQuery<Need[]>({
    queryKey: ['needs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNeeds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllResources() {
  const { actor, isFetching } = useActor();

  return useQuery<ResourceHave[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllResources();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllProfiles() {
  const { actor, isFetching } = useActor();

  return useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllProfiles();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchProfiles(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Profile[]>({
    queryKey: ['searchProfiles', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      try {
        return await actor.searchProfiles(searchTerm);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0,
  });
}

export function useSearchResources(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ResourceHave[]>({
    queryKey: ['searchResources', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      return actor.searchResources(searchTerm);
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0,
  });
}

export function useSearchNeeds(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Need[]>({
    queryKey: ['searchNeeds', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      return actor.searchNeeds(searchTerm);
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0,
  });
}

export function useCreateNeed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId: string;
      description: string;
      category: ResourceCategory;
      startDate: Date;
      endDate: Date;
    }) => {
      if (!actor) throw new Error('Not authenticated');
      const needId = `need-${Date.now()}`;
      await actor.createNeed(
        needId,
        data.profileId,
        data.description,
        data.category,
        BigInt(data.startDate.getTime() * 1000000),
        BigInt(data.endDate.getTime() * 1000000)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs'] });
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['adminNeeds'] });
      toast.success('Need created successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to create need';
      toast.error(message);
    },
  });
}

export function useCreateResource() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId: string;
      description: string;
      category: ResourceCategory;
    }) => {
      if (!actor) throw new Error('Not authenticated');
      const resourceId = `resource-${Date.now()}`;
      await actor.createResource(
        resourceId,
        data.profileId,
        data.description,
        data.category
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['adminResources'] });
      toast.success('Resource created successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to create resource';
      toast.error(message);
    },
  });
}

export function useDeleteNeed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (needId: string) => {
      if (!actor) throw new Error('Not authenticated');
      await actor.deleteNeed(needId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs'] });
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['adminNeeds'] });
      toast.success('Need deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to delete need';
      toast.error(message);
    },
  });
}

export function useDeleteResource() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      if (!actor) throw new Error('Not authenticated');
      await actor.deleteResource(resourceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['adminResources'] });
      toast.success('Resource deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to delete resource';
      toast.error(message);
    },
  });
}

export function useGetProfile(profileId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Profile | null>({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      if (!actor || !profileId) return null;
      return actor.getProfile(profileId);
    },
    enabled: !!actor && !isFetching && !!profileId,
  });
}

export function useGetNeed(needId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Need | null>({
    queryKey: ['need', needId],
    queryFn: async () => {
      if (!actor || !needId) return null;
      return actor.getNeed(needId);
    },
    enabled: !!actor && !isFetching && !!needId,
  });
}

export function useCategoryMatches(category: ResourceCategory | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CategoryMatch | null>({
    queryKey: ['categoryMatches', category],
    queryFn: async () => {
      if (!actor || !category) return null;
      return actor.getCategoryMatches(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

// Event hooks
export function useAllEvents() {
  const { actor, isFetching } = useActor();

  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetEvent(eventId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Event | null>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!actor || !eventId) return null;
      return actor.getEvent(eventId);
    },
    enabled: !!actor && !isFetching && !!eventId,
  });
}

export function useCreateEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      creatorProfileId: string;
      location: string;
      description: string;
      time: Date;
      image?: string;
      needs: string[];
    }) => {
      if (!actor) throw new Error('Not authenticated');
      const eventId = `event-${Date.now()}`;
      await actor.createEvent(
        eventId,
        data.creatorProfileId,
        data.location,
        data.description,
        BigInt(data.time.getTime() * 1000000),
        data.image || null,
        data.needs
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['needs'] });
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      toast.success('Event created successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to create event';
      toast.error(message);
    },
  });
}

export function useUpdateEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      eventId: string;
      location: string;
      description: string;
      time: Date;
      image?: string;
      needs: string[];
    }) => {
      if (!actor) throw new Error('Not authenticated');
      await actor.updateEvent(
        data.eventId,
        data.location,
        data.description,
        BigInt(data.time.getTime() * 1000000),
        data.image || null,
        data.needs
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['needs'] });
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      toast.success('Event updated successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to update event';
      toast.error(message);
    },
  });
}

export function useDeleteEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!actor) throw new Error('Not authenticated');
      await actor.deleteEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      toast.success('Event deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to delete event';
      toast.error(message);
    },
  });
}

// Member management hooks
export function useGetProfileMembers(profileId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ProfileMember[]>({
    queryKey: ['profileMembers', profileId],
    queryFn: async () => {
      if (!actor || !profileId) return [];
      try {
        return await actor.getProfileMembers(profileId);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!profileId,
  });
}

export function useAddProfileMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId: string;
      principal: string;
      role: ProfileRole;
    }) => {
      if (!actor) throw new Error('Not authenticated');
      const principal = Principal.fromText(data.principal);
      await actor.addProfileMember(data.profileId, principal, data.role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profileMembers', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['joinRequests', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profileMemberships'] });
      toast.success('Member added successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to add member';
      toast.error(message);
    },
  });
}

export function useRemoveProfileMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId: string;
      principal: string;
    }) => {
      if (!actor) throw new Error('Not authenticated');
      const principal = Principal.fromText(data.principal);
      await actor.removeProfileMember(data.profileId, principal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profileMembers', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profileMemberships'] });
      toast.success('Member removed successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to remove member';
      toast.error(message);
    },
  });
}

export function useDeleteProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      if (!actor) throw new Error('Not authenticated');
      await actor.deleteProfile(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['needs'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['profileMemberships'] });
      toast.success('Profile deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to delete profile';
      toast.error(message);
    },
  });
}

// Database maintenance hook
export function useCleanOrphanedRecords() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Not authenticated');
      await actor.cleanOrphanedRecords();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Database cleanup completed successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to clean orphaned records';
      toast.error(message);
    },
  });
}

// Admin moderation hooks
export function useAdminGetAllNeeds() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<Need[]>({
    queryKey: ['adminNeeds'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.adminGetAllNeeds();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && isAdmin === true,
  });
}

export function useAdminGetAllResources() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<ResourceHave[]>({
    queryKey: ['adminResources'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.adminGetAllResources();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && isAdmin === true,
  });
}

export function useAdminGetAllEvents() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<Event[]>({
    queryKey: ['adminEvents'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.adminGetAllEvents();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && isAdmin === true,
  });
}

export function useAdminSearchNeeds(searchTerm: string) {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<Need[]>({
    queryKey: ['adminSearchNeeds', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      try {
        return await actor.adminSearchNeeds(searchTerm);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0 && isAdmin === true,
  });
}

export function useAdminSearchResources(searchTerm: string) {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<ResourceHave[]>({
    queryKey: ['adminSearchResources', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      try {
        return await actor.adminSearchResources(searchTerm);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0 && isAdmin === true,
  });
}

export function useAdminSearchEvents(searchTerm: string) {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<Event[]>({
    queryKey: ['adminSearchEvents', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      try {
        return await actor.adminSearchEvents(searchTerm);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0 && isAdmin === true,
  });
}

// Admin profile creation hook
export function useAdminCreateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      organizationName: string;
      functions: FunctionType[];
      address: string;
      phone: string;
      email: string;
      bio?: string;
      profilePicture?: string;
    }) => {
      if (!actor) throw new Error('Not authenticated');
      await actor.adminCreateProfile(
        data.id,
        data.organizationName,
        data.functions,
        data.address,
        data.phone,
        data.email,
        data.bio || null,
        data.profilePicture || null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile created successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to create profile';
      toast.error(message);
    },
  });
}

// Admin assign profile member hook
export function useAdminAssignProfileMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId: string;
      principal: string;
      role: ProfileRole;
    }) => {
      if (!actor) throw new Error('Not authenticated');
      const principal = Principal.fromText(data.principal);
      await actor.adminAssignProfileMember(data.profileId, principal, data.role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profileMembers', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profileMemberships'] });
      toast.success('Member assigned successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to assign member';
      toast.error(message);
    },
  });
}

// Join request hooks
export function useRequestJoin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      if (!actor) throw new Error('Not authenticated');
      await actor.requestJoin(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinRequestStatus'] });
      toast.success('Join request submitted successfully!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to submit join request';
      toast.error(message);
    },
  });
}

export function useGetJoinRequestStatus() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<JoinRequestStatus | null>({
    queryKey: ['joinRequestStatus'],
    queryFn: async () => {
      if (!actor || !identity) return null;
      try {
        return await actor.getJoinRequestStatus('');
      } catch (error: any) {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetPendingJoinRequests(profileId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<JoinRequest[]>({
    queryKey: ['joinRequests', profileId],
    queryFn: async () => {
      if (!actor || !profileId) return [];
      try {
        return await actor.getPendingJoinRequestsForProfile(profileId);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!profileId,
  });
}

export function useApproveJoinRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId: string;
      memberPrincipal: string;
      role: ProfileRole;
    }) => {
      if (!actor) throw new Error('Not authenticated');
      const principal = Principal.fromText(data.memberPrincipal);
      await actor.approveJoinRequest(data.profileId, principal, data.role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['profileMembers', variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['loggedInProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profileMemberships'] });
      toast.success('Join request approved!');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to approve join request';
      toast.error(message);
    },
  });
}

export function useDenyJoinRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId: string;
      memberPrincipal: string;
    }) => {
      if (!actor) throw new Error('Not authenticated');
      const principal = Principal.fromText(data.memberPrincipal);
      await actor.denyJoinRequest(data.profileId, principal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['joinRequests', variables.profileId] });
      toast.success('Join request denied');
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to deny join request';
      toast.error(message);
    },
  });
}
