export const idlFactory = ({ IDL }) => {
  const ProfileRole = IDL.Variant({
    'user' : IDL.Null,
    'clubAdmin' : IDL.Null,
  });
  const FunctionType = IDL.Variant({
    'production' : IDL.Null,
    'education' : IDL.Null,
    'equipmentSpace' : IDL.Null,
    'wasteManagement' : IDL.Null,
    'processing' : IDL.Null,
    'distribution' : IDL.Null,
  });
  const Event = IDL.Record({
    'id' : IDL.Text,
    'owner' : IDL.Principal,
    'time' : IDL.Int,
    'description' : IDL.Text,
    'needs' : IDL.Vec(IDL.Text),
    'image' : IDL.Opt(IDL.Text),
    'creatorProfileId' : IDL.Text,
    'location' : IDL.Text,
  });
  const ResourceCategory = IDL.Variant({
    'storageSpace' : IDL.Null,
    'other' : IDL.Null,
    'equipment' : IDL.Null,
    'publicity' : IDL.Null,
    'foodDrink' : IDL.Null,
    'distributionSpace' : IDL.Null,
    'kitchenSpace' : IDL.Null,
  });
  const Need = IDL.Record({
    'id' : IDL.Text,
    'endDate' : IDL.Int,
    'owner' : IDL.Principal,
    'profileId' : IDL.Text,
    'description' : IDL.Text,
    'category' : ResourceCategory,
    'startDate' : IDL.Int,
  });
  const ResourceHave = IDL.Record({
    'id' : IDL.Text,
    'owner' : IDL.Principal,
    'profileId' : IDL.Text,
    'description' : IDL.Text,
    'category' : ResourceCategory,
  });
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const Profile = IDL.Record({
    'id' : IDL.Text,
    'bio' : IDL.Opt(IDL.Text),
    'organizationName' : IDL.Text,
    'owner' : IDL.Principal,
    'resources' : IDL.Vec(IDL.Text),
    'email' : IDL.Text,
    'needs' : IDL.Vec(IDL.Text),
    'address' : IDL.Text,
    'functions' : IDL.Vec(FunctionType),
    'phone' : IDL.Text,
    'profilePicture' : IDL.Opt(IDL.Text),
  });
  const UserProfile = IDL.Record({ 'profileId' : IDL.Text });
  const CategoryMatch = IDL.Record({
    'resourceIds' : IDL.Vec(IDL.Text),
    'needIds' : IDL.Vec(IDL.Text),
    'category' : ResourceCategory,
  });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  const MembershipInfo = IDL.Record({
    'organizationName' : IDL.Text,
    'role' : ProfileRole,
    'profileId' : IDL.Text,
  });
  const JoinRequestStatus = IDL.Variant({
    'pending' : IDL.Null,
    'denied' : IDL.Null,
    'approved' : IDL.Null,
  });
  const JoinRequest = IDL.Record({
    'status' : JoinRequestStatus,
    'principal' : IDL.Principal,
    'displayName' : IDL.Opt(IDL.Text),
    'profileId' : IDL.Text,
  });
  const ProfileMember = IDL.Record({
    'principal' : IDL.Principal,
    'displayName' : IDL.Opt(IDL.Text),
    'role' : ProfileRole,
  });
  const ApprovalStatus = IDL.Variant({
    'pending' : IDL.Null,
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
  });
  const UserApprovalInfo = IDL.Record({
    'status' : ApprovalStatus,
    'principal' : IDL.Principal,
  });
  return IDL.Service({
    'addProfileMember' : IDL.Func(
        [IDL.Text, IDL.Principal, ProfileRole],
        [],
        [],
      ),
    'adminAssignProfileMember' : IDL.Func(
        [IDL.Text, IDL.Principal, ProfileRole],
        [],
        [],
      ),
    'adminCreateProfile' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Vec(FunctionType),
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
        ],
        [],
        [],
      ),
    'adminGetAllEvents' : IDL.Func([], [IDL.Vec(Event)], ['query']),
    'adminGetAllNeeds' : IDL.Func([], [IDL.Vec(Need)], ['query']),
    'adminGetAllResources' : IDL.Func([], [IDL.Vec(ResourceHave)], ['query']),
    'adminSearchEvents' : IDL.Func([IDL.Text], [IDL.Vec(Event)], ['query']),
    'adminSearchNeeds' : IDL.Func([IDL.Text], [IDL.Vec(Need)], ['query']),
    'adminSearchResources' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(ResourceHave)],
        ['query'],
      ),
    'approveJoinRequest' : IDL.Func(
        [IDL.Text, IDL.Principal, ProfileRole],
        [],
        [],
      ),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'cleanOrphanedRecords' : IDL.Func([], [], []),
    'createEvent' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Int,
          IDL.Opt(IDL.Text),
          IDL.Vec(IDL.Text),
        ],
        [],
        [],
      ),
    'createNeed' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, ResourceCategory, IDL.Int, IDL.Int],
        [],
        [],
      ),
    'createResource' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, ResourceCategory],
        [],
        [],
      ),
    'deleteEvent' : IDL.Func([IDL.Text], [], []),
    'deleteFileReference' : IDL.Func([IDL.Text], [], ['oneway']),
    'deleteNeed' : IDL.Func([IDL.Text], [], []),
    'deleteProfile' : IDL.Func([IDL.Text], [], []),
    'deleteResource' : IDL.Func([IDL.Text], [], []),
    'denyJoinRequest' : IDL.Func([IDL.Text, IDL.Principal], [], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'getAllEvents' : IDL.Func([], [IDL.Vec(Event)], ['query']),
    'getAllNeeds' : IDL.Func([], [IDL.Vec(Need)], ['query']),
    'getAllProfiles' : IDL.Func([], [IDL.Vec(Profile)], ['query']),
    'getAllResources' : IDL.Func([], [IDL.Vec(ResourceHave)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getCategoryMatches' : IDL.Func(
        [ResourceCategory],
        [IDL.Opt(CategoryMatch)],
        ['query'],
      ),
    'getDisplayName' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Text)],
        ['query'],
      ),
    'getEvent' : IDL.Func([IDL.Text], [IDL.Opt(Event)], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getGroupsByCaller' : IDL.Func([], [IDL.Vec(MembershipInfo)], ['query']),
    'getGroupsByUser' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(MembershipInfo)],
        ['query'],
      ),
    'getJoinRequestStatus' : IDL.Func(
        [IDL.Text],
        [JoinRequestStatus],
        ['query'],
      ),
    'getNeed' : IDL.Func([IDL.Text], [IDL.Opt(Need)], ['query']),
    'getPendingJoinRequestsForProfile' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(JoinRequest)],
        ['query'],
      ),
    'getProfile' : IDL.Func([IDL.Text], [IDL.Opt(Profile)], ['query']),
    'getProfileMembers' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(ProfileMember)],
        ['query'],
      ),
    'getProfileMemberships' : IDL.Func(
        [],
        [IDL.Vec(MembershipInfo)],
        ['query'],
      ),
    'getResourceHave' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(ResourceHave)],
        ['query'],
      ),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'initializeAccessControl' : IDL.Func([], [], []),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'isCallerApproved' : IDL.Func([], [IDL.Bool], ['query']),
    'listApprovals' : IDL.Func([], [IDL.Vec(UserApprovalInfo)], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'registerProfile' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Vec(FunctionType),
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
        ],
        [],
        [],
      ),
    'removeProfileMember' : IDL.Func([IDL.Text, IDL.Principal], [], []),
    'requestApproval' : IDL.Func([], [], []),
    'requestJoin' : IDL.Func([IDL.Text], [], []),
    'resetBackendState' : IDL.Func([], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'searchNeeds' : IDL.Func([IDL.Text], [IDL.Vec(Need)], ['query']),
    'searchProfiles' : IDL.Func([IDL.Text], [IDL.Vec(Profile)], ['query']),
    'searchResources' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(ResourceHave)],
        ['query'],
      ),
    'setApproval' : IDL.Func([IDL.Principal, ApprovalStatus], [], []),
    'setDisplayName' : IDL.Func([IDL.Text], [], []),
    'storeFileReference' : IDL.Func([IDL.Text, IDL.Text], [], ['oneway']),
    'updateEvent' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Int,
          IDL.Opt(IDL.Text),
          IDL.Vec(IDL.Text),
        ],
        [],
        [],
      ),
    'updateProfile' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Vec(FunctionType),
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
        ],
        [],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
