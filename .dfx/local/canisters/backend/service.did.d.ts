import type { Principal } from '@icp-sdk/core/principal';
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';

export type ApprovalStatus = { 'pending' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface CategoryMatch {
  'resourceIds' : Array<string>,
  'needIds' : Array<string>,
  'category' : ResourceCategory,
}
export interface Event {
  'id' : string,
  'owner' : Principal,
  'time' : bigint,
  'description' : string,
  'needs' : Array<string>,
  'image' : [] | [string],
  'creatorProfileId' : string,
  'location' : string,
}
export interface FileReference { 'hash' : string, 'path' : string }
export type FunctionType = { 'production' : null } |
  { 'education' : null } |
  { 'equipmentSpace' : null } |
  { 'wasteManagement' : null } |
  { 'processing' : null } |
  { 'distribution' : null };
export interface JoinRequest {
  'status' : JoinRequestStatus,
  'principal' : Principal,
  'displayName' : [] | [string],
  'profileId' : string,
}
export type JoinRequestStatus = { 'pending' : null } |
  { 'denied' : null } |
  { 'approved' : null };
export interface MembershipInfo {
  'organizationName' : string,
  'role' : ProfileRole,
  'profileId' : string,
}
export interface Need {
  'id' : string,
  'endDate' : bigint,
  'owner' : Principal,
  'profileId' : string,
  'description' : string,
  'category' : ResourceCategory,
  'startDate' : bigint,
}
export interface Profile {
  'id' : string,
  'bio' : [] | [string],
  'organizationName' : string,
  'owner' : Principal,
  'resources' : Array<string>,
  'email' : string,
  'needs' : Array<string>,
  'address' : string,
  'functions' : Array<FunctionType>,
  'phone' : string,
  'profilePicture' : [] | [string],
}
export interface ProfileMember {
  'principal' : Principal,
  'displayName' : [] | [string],
  'role' : ProfileRole,
}
export type ProfileRole = { 'user' : null } |
  { 'clubAdmin' : null };
export type ResourceCategory = { 'storageSpace' : null } |
  { 'other' : null } |
  { 'equipment' : null } |
  { 'publicity' : null } |
  { 'foodDrink' : null } |
  { 'distributionSpace' : null } |
  { 'kitchenSpace' : null };
export interface ResourceHave {
  'id' : string,
  'owner' : Principal,
  'profileId' : string,
  'description' : string,
  'category' : ResourceCategory,
}
export interface UserApprovalInfo {
  'status' : ApprovalStatus,
  'principal' : Principal,
}
export interface UserProfile { 'profileId' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  'addProfileMember' : ActorMethod<[string, Principal, ProfileRole], undefined>,
  'adminAssignProfileMember' : ActorMethod<
    [string, Principal, ProfileRole],
    undefined
  >,
  'adminCreateProfile' : ActorMethod<
    [
      string,
      string,
      Array<FunctionType>,
      string,
      string,
      string,
      [] | [string],
      [] | [string],
    ],
    undefined
  >,
  'adminGetAllEvents' : ActorMethod<[], Array<Event>>,
  'adminGetAllNeeds' : ActorMethod<[], Array<Need>>,
  'adminGetAllResources' : ActorMethod<[], Array<ResourceHave>>,
  'adminSearchEvents' : ActorMethod<[string], Array<Event>>,
  'adminSearchNeeds' : ActorMethod<[string], Array<Need>>,
  'adminSearchResources' : ActorMethod<[string], Array<ResourceHave>>,
  'approveJoinRequest' : ActorMethod<
    [string, Principal, ProfileRole],
    undefined
  >,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'cleanOrphanedRecords' : ActorMethod<[], undefined>,
  'createEvent' : ActorMethod<
    [string, string, string, string, bigint, [] | [string], Array<string>],
    undefined
  >,
  'createNeed' : ActorMethod<
    [string, string, string, ResourceCategory, bigint, bigint],
    undefined
  >,
  'createResource' : ActorMethod<
    [string, string, string, ResourceCategory],
    undefined
  >,
  'deleteEvent' : ActorMethod<[string], undefined>,
  'deleteFileReference' : ActorMethod<[string], undefined>,
  'deleteNeed' : ActorMethod<[string], undefined>,
  'deleteProfile' : ActorMethod<[string], undefined>,
  'deleteResource' : ActorMethod<[string], undefined>,
  'denyJoinRequest' : ActorMethod<[string, Principal], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'getAllEvents' : ActorMethod<[], Array<Event>>,
  'getAllNeeds' : ActorMethod<[], Array<Need>>,
  'getAllProfiles' : ActorMethod<[], Array<Profile>>,
  'getAllResources' : ActorMethod<[], Array<ResourceHave>>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getCategoryMatches' : ActorMethod<[ResourceCategory], [] | [CategoryMatch]>,
  'getDisplayName' : ActorMethod<[Principal], [] | [string]>,
  'getEvent' : ActorMethod<[string], [] | [Event]>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getGroupsByCaller' : ActorMethod<[], Array<MembershipInfo>>,
  'getGroupsByUser' : ActorMethod<[Principal], Array<MembershipInfo>>,
  'getJoinRequestStatus' : ActorMethod<[string], JoinRequestStatus>,
  'getNeed' : ActorMethod<[string], [] | [Need]>,
  'getPendingJoinRequestsForProfile' : ActorMethod<
    [string],
    Array<JoinRequest>
  >,
  'getProfile' : ActorMethod<[string], [] | [Profile]>,
  'getProfileMembers' : ActorMethod<[string], Array<ProfileMember>>,
  'getProfileMemberships' : ActorMethod<[], Array<MembershipInfo>>,
  'getResourceHave' : ActorMethod<[string], [] | [ResourceHave]>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'initializeAccessControl' : ActorMethod<[], undefined>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'isCallerApproved' : ActorMethod<[], boolean>,
  'listApprovals' : ActorMethod<[], Array<UserApprovalInfo>>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'registerProfile' : ActorMethod<
    [
      string,
      string,
      Array<FunctionType>,
      string,
      string,
      string,
      [] | [string],
      [] | [string],
    ],
    undefined
  >,
  'removeProfileMember' : ActorMethod<[string, Principal], undefined>,
  'requestApproval' : ActorMethod<[], undefined>,
  'requestJoin' : ActorMethod<[string], undefined>,
  'resetBackendState' : ActorMethod<[], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'searchNeeds' : ActorMethod<[string], Array<Need>>,
  'searchProfiles' : ActorMethod<[string], Array<Profile>>,
  'searchResources' : ActorMethod<[string], Array<ResourceHave>>,
  'setApproval' : ActorMethod<[Principal, ApprovalStatus], undefined>,
  'setDisplayName' : ActorMethod<[string], undefined>,
  'storeFileReference' : ActorMethod<[string, string], undefined>,
  'updateEvent' : ActorMethod<
    [string, string, string, bigint, [] | [string], Array<string>],
    undefined
  >,
  'updateProfile' : ActorMethod<
    [
      string,
      string,
      Array<FunctionType>,
      string,
      string,
      string,
      [] | [string],
      [] | [string],
    ],
    undefined
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
