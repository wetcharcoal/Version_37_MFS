import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import List "mo:base/List";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Registry "blob-storage/registry";
import BlobStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";




actor MontrealFoodSystem {
  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  let accessControlState = AccessControl.initState();
  let userApprovalState = UserApproval.initState(accessControlState);

  var profiles : OrderedMap.Map<Text, Profile> = textMap.empty();
  var needs : OrderedMap.Map<Text, Need> = textMap.empty();
  var resources : OrderedMap.Map<Text, ResourceHave> = textMap.empty();
  var categoryMatches : OrderedMap.Map<Text, CategoryMatch> = textMap.empty();
  var events : OrderedMap.Map<Text, Event> = textMap.empty();
  var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty();
  var displayNames : OrderedMap.Map<Principal, Text> = principalMap.empty();
  var profileMembers : OrderedMap.Map<Text, OrderedMap.Map<Principal, ProfileMember>> = textMap.empty();
  var joinRequests : OrderedMap.Map<Text, List.List<JoinRequest>> = textMap.empty();

  let registry = Registry.new();
  include BlobStorage(registry);

  type UserProfile = {
    profileId : Text;
  };

  type Profile = {
    id : Text;
    organizationName : Text;
    functions : [FunctionType];
    address : Text;
    phone : Text;
    email : Text;
    bio : ?Text;
    profilePicture : ?Text;
    needs : [Text];
    resources : [Text];
    owner : Principal;
  };

  type FunctionType = {
    #production;
    #processing;
    #distribution;
    #wasteManagement;
    #education;
    #equipmentSpace;
  };

  type Need = {
    id : Text;
    profileId : Text;
    description : Text;
    category : ResourceCategory;
    startDate : Int;
    endDate : Int;
    owner : Principal;
  };

  type ResourceHave = {
    id : Text;
    profileId : Text;
    description : Text;
    category : ResourceCategory;
    owner : Principal;
  };

  type ResourceCategory = {
    #foodDrink;
    #storageSpace;
    #kitchenSpace;
    #distributionSpace;
    #equipment;
    #publicity;
    #other;
  };

  type CategoryMatch = {
    category : ResourceCategory;
    needIds : [Text];
    resourceIds : [Text];
  };

  type Event = {
    id : Text;
    creatorProfileId : Text;
    location : Text;
    description : Text;
    time : Int;
    image : ?Text;
    needs : [Text];
    owner : Principal;
  };

  type ProfileRole = {
    #clubAdmin;
    #user;
  };

  type ProfileMember = {
    principal : Principal;
    role : ProfileRole;
    displayName : ?Text;
  };

  type JoinRequest = {
    principal : Principal;
    profileId : Text;
    status : JoinRequestStatus;
    displayName : ?Text;
  };

  type JoinRequestStatus = {
    #pending;
    #approved;
    #denied;
  };

  type MembershipInfo = {
    profileId : Text;
    role : ProfileRole;
    organizationName : Text;
  };

  func isClubAdmin(caller : Principal, profileId : Text) : Bool {
    switch (textMap.get(profileMembers, profileId)) {
      case (null) { false };
      case (?membersMap) {
        switch (principalMap.get(membersMap, caller)) {
          case (null) { false };
          case (?member) {
            switch (member.role) {
              case (#clubAdmin) { true };
              case (#user) { false };
            };
          };
        };
      };
    };
  };

  func isProfileMember(caller : Principal, profileId : Text) : Bool {
    switch (textMap.get(profileMembers, profileId)) {
      case (null) { false };
      case (?membersMap) {
        switch (principalMap.get(membersMap, caller)) {
          case (null) { false };
          case (?_member) { true };
        };
      };
    };
  };

  func removeIdsFromProfile(profileId : Text, needIdsToRemove : [Text], resourceIdsToRemove : [Text]) {
    switch (textMap.get(profiles, profileId)) {
      case (null) {};
      case (?profile) {
        let updatedNeeds = Array.filter<Text>(
          profile.needs,
          func(needId) = Array.indexOf(needId, needIdsToRemove, Text.equal) == null,
        );

        let updatedResources = Array.filter<Text>(
          profile.resources,
          func(resourceId) = Array.indexOf(resourceId, resourceIdsToRemove, Text.equal) == null,
        );

        let updatedProfile = { profile with needs = updatedNeeds; resources = updatedResources };
        profiles := textMap.put(profiles, profileId, updatedProfile);
      };
    };
  };

  func getProfileIdForCaller(caller : Principal) : ?Text {
    switch (principalMap.get(userProfiles, caller)) {
      case (?userProfile) {
        ?userProfile.profileId;
      };
      case (null) {
        for ((profileId, membersMap) in textMap.entries(profileMembers)) {
          switch (principalMap.get(membersMap, caller)) {
            case (?_member) {
              return ?profileId;
            };
            case (null) {};
          };
        };
        null;
      };
    };
  };

  func getProfileMembershipsStable(caller : Principal) : [MembershipInfo] {
    var memberships = List.nil<MembershipInfo>();

    for ((profileId, membersMap) in textMap.entries(profileMembers)) {
      switch (principalMap.get(membersMap, caller)) {
        case (?member) {
          switch (textMap.get(profiles, profileId)) {
            case (?profile) {
              memberships := List.push(
                {
                  profileId;
                  role = member.role;
                  organizationName = profile.organizationName;
                },
                memberships,
              );
            };
            case (null) {};
          };
        };
        case (null) {};
      };
    };

    List.toArray(memberships);
  };

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Initialization failed: caller is not admin");
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can access profiles");
    };

    switch (principalMap.get(userProfiles, caller)) {
      case (?userProfile) {
        ?userProfile;
      };
      case (null) {
        switch (getProfileIdForCaller(caller)) {
          case (?profileId) {
            ?{ profileId };
          };
          case (null) {
            null;
          };
        };
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public query func getDisplayName(principal : Principal) : async ?Text {
    principalMap.get(displayNames, principal);
  };

  public shared ({ caller }) func setDisplayName(displayName : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can set display names");
    };

    displayNames := principalMap.put(displayNames, caller, displayName);
  };

  // Stable, non-trapping query function for caller's group memberships
  // No authorization check - allows any caller to query their own memberships without trapping
  public query ({ caller }) func getGroupsByCaller() : async [MembershipInfo] {
    getProfileMembershipsStable(caller);
  };

  // Stable, non-trapping query function for specific user's group memberships
  // Authorization: caller must be the user themselves or an admin
  public query ({ caller }) func getGroupsByUser(user: Principal) : async [MembershipInfo] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      // Return empty array instead of trapping to maintain stability
      return [];
    };
    getProfileMembershipsStable(user);
  };

  public query ({ caller }) func getProfileMemberships() : async [MembershipInfo] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can access memberships");
    };

    var memberships = List.nil<MembershipInfo>();

    for ((profileId, membersMap) in textMap.entries(profileMembers)) {
      switch (principalMap.get(membersMap, caller)) {
        case (?member) {
          switch (textMap.get(profiles, profileId)) {
            case (?profile) {
              memberships := List.push(
                {
                  profileId;
                  role = member.role;
                  organizationName = profile.organizationName;
                },
                memberships,
              );
            };
            case (null) {};
          };
        };
        case (null) {};
      };
    };

    List.toArray(memberships);
  };

  public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can register file references");
    };
    Registry.add(registry, path, hash);
  };

  public query ({ caller }) func getFileReference(path : Text) : async Registry.FileReference {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can access file references");
    };
    Registry.get(registry, path);
  };

  public query ({ caller }) func listFileReferences() : async [Registry.FileReference] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can list file references");
    };
    Registry.list(registry);
  };

  public shared ({ caller }) func dropFileReference(path : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can drop file references");
    };
    Registry.remove(registry, path);
  };

  public shared ({ caller }) func registerProfile(
    id : Text,
    organizationName : Text,
    functions : [FunctionType],
    address : Text,
    phone : Text,
    email : Text,
    bio : ?Text,
    profilePicture : ?Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can register profiles");
    };

    switch (textMap.get(profiles, id)) {
      case (?_existingProfile) {
        Debug.trap("Profile ID already exists");
      };
      case (null) {
        let profile : Profile = {
          id;
          organizationName;
          functions;
          address;
          phone;
          email;
          bio;
          profilePicture;
          needs = [];
          resources = [];
          owner = caller;
        };
        profiles := textMap.put(profiles, id, profile);

        let profileMember = {
          principal = caller;
          role = #clubAdmin;
          displayName = principalMap.get(displayNames, caller);
        };

        let profileMemberMap = principalMap.put(principalMap.empty(), caller, profileMember);
        profileMembers := textMap.put(profileMembers, id, profileMemberMap);

        let userProfile : UserProfile = {
          profileId = id;
        };
        userProfiles := principalMap.put(userProfiles, caller, userProfile);
      };
    };
  };

  public shared ({ caller }) func adminCreateProfile(
    id : Text,
    organizationName : Text,
    functions : [FunctionType],
    address : Text,
    phone : Text,
    email : Text,
    bio : ?Text,
    profilePicture : ?Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can create profiles");
    };

    switch (textMap.get(profiles, id)) {
      case (?_existingProfile) {
        Debug.trap("Profile ID already exists");
      };
      case (null) {
        let profile : Profile = {
          id;
          organizationName;
          functions;
          address;
          phone;
          email;
          bio;
          profilePicture;
          needs = [];
          resources = [];
          owner = caller;
        };
        profiles := textMap.put(profiles, id, profile);

        profileMembers := textMap.put(profileMembers, id, principalMap.empty());
      };
    };
  };

  public shared ({ caller }) func adminAssignProfileMember(
    profileId : Text,
    principal : Principal,
    role : ProfileRole,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can assign profile members");
    };

    switch (textMap.get(profiles, profileId)) {
      case (null) Debug.trap("Profile not found");
      case (?_profile) {
        let newMember = {
          principal;
          role;
          displayName = principalMap.get(displayNames, principal);
        };

        switch (textMap.get(profileMembers, profileId)) {
          case (null) {
            let membersMap = principalMap.put(principalMap.empty(), principal, newMember);
            profileMembers := textMap.put(profileMembers, profileId, membersMap);
          };
          case (?membersMap) {
            let updatedMembersMap = principalMap.put(membersMap, principal, newMember);
            profileMembers := textMap.put(profileMembers, profileId, updatedMembersMap);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateProfile(
    id : Text,
    organizationName : Text,
    functions : [FunctionType],
    address : Text,
    phone : Text,
    email : Text,
    bio : ?Text,
    profilePicture : ?Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can update profiles");
    };

    switch (textMap.get(profiles, id)) {
      case (null) {
        Debug.trap("Profile not found");
      };
      case (?profile) {
        if (not AccessControl.isAdmin(accessControlState, caller) and not isClubAdmin(caller, id)) {
          Debug.trap("Unauthorized: Only admins or club admins can update this profile");
        };

        let updatedProfile = {
          profile with
          organizationName;
          functions;
          address;
          phone;
          email;
          bio;
          profilePicture;
        };
        profiles := textMap.put(profiles, id, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func deleteProfile(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can delete profiles");
    };

    switch (textMap.get(profiles, id)) {
      case (null) {
        Debug.trap("Profile not found");
      };
      case (?_profile) {
        deleteNeedsByProfileId(id);
        deleteResourcesByProfileId(id);

        profiles := textMap.delete(profiles, id);
        profileMembers := textMap.delete(profileMembers, id);

        removeOrphanedNeedResourceIds([id], []);
      };
    };
  };

  func deleteNeedsByProfileId(profileId : Text) {
    switch (textMap.get(profiles, profileId)) {
      case (null) {};
      case (?profile) {
        for (needId in profile.needs.vals()) {
          switch (textMap.get(needs, needId)) {
            case (null) {};
            case (?_need) {
              needs := textMap.delete(needs, needId);
            };
          };
        };
      };
    };
  };

  func deleteResourcesByProfileId(profileId : Text) {
    switch (textMap.get(profiles, profileId)) {
      case (null) {};
      case (?profile) {
        for (resourceId in profile.resources.vals()) {
          switch (textMap.get(resources, resourceId)) {
            case (null) {};
            case (?_resource) {
              resources := textMap.delete(resources, resourceId);
            };
          };
        };
      };
    };
  };

  func removeOrphanedNeedResourceIds(needIds : [Text], resourceIds : [Text]) {
    for ((profileId, _) in textMap.entries(profiles)) {
      removeIdsFromProfile(profileId, needIds, resourceIds);
    };
  };

  public shared ({ caller }) func resetBackendState() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can reset backend state");
    };

    profiles := textMap.empty();
    needs := textMap.empty();
    resources := textMap.empty();
    events := textMap.empty();
    categoryMatches := textMap.empty();
    profileMembers := textMap.empty();
    userProfiles := principalMap.empty();

    let mcgillProfile = {
      id = "mcgill_food_coalition";
      organizationName = "McGill Food Coalition";
      functions = [#education];
      address = "3907 Rue St. Hubert";
      phone = "4388744084";
      email = "mcgillfoodco@gmail.com";
      bio = null;
      profilePicture = null;
      needs = [];
      resources = [];
      owner = Principal.fromText("2vxsx-fae");
    };
    profiles := textMap.put(profiles, "mcgill_food_coalition", mcgillProfile);
  };

  public query func getProfile(id : Text) : async ?Profile {
    textMap.get(profiles, id);
  };

  public query func getNeed(id : Text) : async ?Need {
    textMap.get(needs, id);
  };

  public query func getResourceHave(id : Text) : async ?ResourceHave {
    textMap.get(resources, id);
  };

  public query func getCategoryMatches(category : ResourceCategory) : async ?CategoryMatch {
    textMap.get(categoryMatches, categoryToText(category));
  };

  public query func getAllNeeds() : async [Need] {
    let currentTime = Time.now();
    var validNeeds = List.nil<Need>();

    for ((_, need) in textMap.entries(needs)) {
      if (need.endDate > currentTime) {
        validNeeds := List.push(need, validNeeds);
      };
    };

    List.toArray(validNeeds);
  };

  public query func getAllResources() : async [ResourceHave] {
    var allResources = List.nil<ResourceHave>();

    for ((_, resource) in textMap.entries(resources)) {
      allResources := List.push(resource, allResources);
    };

    List.toArray(allResources);
  };

  public query func getAllProfiles() : async [Profile] {
    var allProfiles = List.nil<Profile>();

    for ((_, profile) in textMap.entries(profiles)) {
      allProfiles := List.push(profile, allProfiles);
    };

    List.toArray(allProfiles);
  };

  public query func searchProfiles(searchTerm : Text) : async [Profile] {
    var matchingProfiles = List.nil<Profile>();

    for ((_, profile) in textMap.entries(profiles)) {
      if (Text.contains(Text.toLowercase(profile.organizationName), #text(Text.toLowercase(searchTerm)))) {
        matchingProfiles := List.push(profile, matchingProfiles);
      };
    };

    List.toArray(matchingProfiles);
  };

  public query func searchResources(searchTerm : Text) : async [ResourceHave] {
    var matchingResources = List.nil<ResourceHave>();

    for ((_, resource) in textMap.entries(resources)) {
      if (Text.contains(Text.toLowercase(resource.description), #text(Text.toLowercase(searchTerm)))) {
        matchingResources := List.push(resource, matchingResources);
      };
    };

    List.toArray(matchingResources);
  };

  public query func searchNeeds(searchTerm : Text) : async [Need] {
    var matchingNeeds = List.nil<Need>();

    for ((_, need) in textMap.entries(needs)) {
      if (Text.contains(Text.toLowercase(need.description), #text(Text.toLowercase(searchTerm)))) {
        matchingNeeds := List.push(need, matchingNeeds);
      };
    };

    List.toArray(matchingNeeds);
  };

  public query ({ caller }) func adminGetAllNeeds() : async [Need] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can access all needs");
    };
    Iter.toArray(textMap.vals(needs));
  };

  public query ({ caller }) func adminGetAllResources() : async [ResourceHave] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can access all resources");
    };
    Iter.toArray(textMap.vals(resources));
  };

  public query ({ caller }) func adminGetAllEvents() : async [Event] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can access all events");
    };
    Iter.toArray(textMap.vals(events));
  };

  public query ({ caller }) func adminSearchNeeds(searchTerm : Text) : async [Need] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can search needs");
    };

    var matchingNeeds = List.nil<Need>();

    for ((id, need) in textMap.entries(needs)) {
      if (
        Text.contains(Text.toLowercase(need.description), #text(Text.toLowercase(searchTerm))) or
        Text.equal(id, searchTerm)
      ) {
        matchingNeeds := List.push(need, matchingNeeds);
      };
    };

    List.toArray(matchingNeeds);
  };

  public query ({ caller }) func adminSearchResources(searchTerm : Text) : async [ResourceHave] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can search resources");
    };

    var matchingResources = List.nil<ResourceHave>();

    for ((id, resource) in textMap.entries(resources)) {
      if (
        Text.contains(Text.toLowercase(resource.description), #text(Text.toLowercase(searchTerm))) or
        Text.equal(id, searchTerm)
      ) {
        matchingResources := List.push(resource, matchingResources);
      };
    };

    List.toArray(matchingResources);
  };

  public query ({ caller }) func adminSearchEvents(searchTerm : Text) : async [Event] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can search events");
    };

    var matchingEvents = List.nil<Event>();

    for ((id, event) in textMap.entries(events)) {
      if (
        Text.contains(Text.toLowercase(event.description), #text(Text.toLowercase(searchTerm))) or
        Text.equal(id, searchTerm)
      ) {
        matchingEvents := List.push(event, matchingEvents);
      };
    };

    List.toArray(matchingEvents);
  };

  public shared ({ caller }) func createNeed(
    id : Text,
    profileId : Text,
    description : Text,
    category : ResourceCategory,
    startDate : Int,
    endDate : Int,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can create needs");
    };

    switch (textMap.get(profiles, profileId)) {
      case (null) {
        Debug.trap("Profile not found");
      };
      case (?profile) {
        if (not isProfileMember(caller, profileId)) {
          Debug.trap("Unauthorized: Can only create needs for profiles you are attached to");
        };

        let need : Need = {
          id;
          profileId;
          description;
          category;
          startDate;
          endDate;
          owner = caller;
        };
        needs := textMap.put(needs, id, need);

        let updatedProfile = {
          profile with needs = Array.append(profile.needs, [id])
        };
        profiles := textMap.put(profiles, profileId, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func deleteNeed(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can delete needs");
    };

    switch (textMap.get(needs, id)) {
      case (null) {
        Debug.trap("Need not found");
      };
      case (?need) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          if (not isProfileMember(caller, need.profileId)) {
            Debug.trap("Unauthorized: Can only delete needs for profiles you are attached to");
          };
        };
        needs := textMap.delete(needs, id);

        removeIdsFromProfile(need.profileId, [id], []);
        removeOrphanedNeedResourceIds([id], []);
      };
    };
  };

  public shared ({ caller }) func createResource(
    id : Text,
    profileId : Text,
    description : Text,
    category : ResourceCategory,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can create resources");
    };

    switch (textMap.get(profiles, profileId)) {
      case (null) {
        Debug.trap("Profile not found");
      };
      case (?profile) {
        if (not isProfileMember(caller, profileId)) {
          Debug.trap("Unauthorized: Can only create resources for profiles you are attached to");
        };

        let resource : ResourceHave = {
          id;
          profileId;
          description;
          category;
          owner = caller;
        };
        resources := textMap.put(resources, id, resource);

        let updatedProfile = {
          profile with resources = Array.append(profile.resources, [id])
        };
        profiles := textMap.put(profiles, profileId, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func deleteResource(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can delete resources");
    };

    switch (textMap.get(resources, id)) {
      case (null) {
        Debug.trap("Resource not found");
      };
      case (?resource) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          if (not isProfileMember(caller, resource.profileId)) {
            Debug.trap("Unauthorized: Can only delete resources for profiles you are attached to");
          };
        };
        resources := textMap.delete(resources, id);

        removeIdsFromProfile(resource.profileId, [], [id]);
        removeOrphanedNeedResourceIds([], [id]);
      };
    };
  };

  public shared ({ caller }) func createEvent(
    id : Text,
    creatorProfileId : Text,
    location : Text,
    description : Text,
    time : Int,
    image : ?Text,
    needs : [Text],
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can create events");
    };

    switch (textMap.get(profiles, creatorProfileId)) {
      case (null) {
        Debug.trap("Profile not found");
      };
      case (?profile) {
        if (not isProfileMember(caller, creatorProfileId)) {
          Debug.trap("Unauthorized: Can only create events for profiles you are attached to");
        };

        let event : Event = {
          id;
          creatorProfileId;
          location;
          description;
          time;
          image;
          needs;
          owner = caller;
        };
        events := textMap.put(events, id, event);

        for (needId in needs.vals()) {
          let updatedProfile = {
            profile with needs = Array.append(profile.needs, [needId])
          };
          profiles := textMap.put(profiles, creatorProfileId, updatedProfile);
        };
      };
    };
  };

  public shared ({ caller }) func updateEvent(
    id : Text,
    location : Text,
    description : Text,
    time : Int,
    image : ?Text,
    needs : [Text],
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can update events");
    };

    switch (textMap.get(events, id)) {
      case (null) {
        Debug.trap("Event not found");
      };
      case (?event) {
        if (not isProfileMember(caller, event.creatorProfileId)) {
          Debug.trap("Unauthorized: Can only update events for profiles you are attached to");
        };

        let updatedEvent = {
          event with
          location;
          description;
          time;
          image;
          needs;
        };
        events := textMap.put(events, id, updatedEvent);
      };
    };
  };

  public shared ({ caller }) func deleteEvent(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can delete events");
    };

    switch (textMap.get(events, id)) {
      case (null) {
        Debug.trap("Event not found");
      };
      case (?event) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          if (not isProfileMember(caller, event.creatorProfileId)) {
            Debug.trap("Unauthorized: Can only delete events for profiles you are attached to");
          };
        };
        events := textMap.delete(events, id);
      };
    };
  };

  public query func getEvent(id : Text) : async ?Event {
    textMap.get(events, id);
  };

  public query func getAllEvents() : async [Event] {
    var allEvents = List.nil<Event>();

    for ((_, event) in textMap.entries(events)) {
      allEvents := List.push(event, allEvents);
    };

    List.toArray(allEvents);
  };

  public query ({ caller }) func getProfileMembers(profileId : Text) : async [ProfileMember] {
    switch (textMap.get(profiles, profileId)) {
      case (null) Debug.trap("Profile not found");
      case (?_profile) {
        if (not AccessControl.isAdmin(accessControlState, caller) and not isClubAdmin(caller, profileId)) {
          Debug.trap("Unauthorized: Only admins or club admins can view members");
        };

        switch (textMap.get(profileMembers, profileId)) {
          case (null) { [] };
          case (?membersMap) { Iter.toArray(principalMap.vals(membersMap)) };
        };
      };
    };
  };

  public shared ({ caller }) func addProfileMember(profileId : Text, principal : Principal, role : ProfileRole) : async () {
    switch (textMap.get(profiles, profileId)) {
      case (null) Debug.trap("Profile not found");
      case (?_profile) {
        if (not AccessControl.isAdmin(accessControlState, caller) and not isClubAdmin(caller, profileId)) {
          Debug.trap("Unauthorized: Only admins or club admins can add members");
        };

        let newMember = {
          principal;
          role;
          displayName = principalMap.get(displayNames, principal);
        };

        switch (textMap.get(profileMembers, profileId)) {
          case (null) {
            let membersMap = principalMap.put(principalMap.empty(), principal, newMember);
            profileMembers := textMap.put(profileMembers, profileId, membersMap);
          };
          case (?membersMap) {
            let updatedMembersMap = principalMap.put(membersMap, principal, newMember);
            profileMembers := textMap.put(profileMembers, profileId, updatedMembersMap);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeProfileMember(profileId : Text, principal : Principal) : async () {
    switch (textMap.get(profiles, profileId)) {
      case (null) Debug.trap("Profile not found");
      case (?_profile) {
        if (not AccessControl.isAdmin(accessControlState, caller) and not isClubAdmin(caller, profileId)) {
          Debug.trap("Unauthorized: Only admins or club admins can remove members");
        };

        switch (textMap.get(profileMembers, profileId)) {
          case (null) {
          };
          case (?membersMap) {
            let updatedMembersMap = principalMap.delete(membersMap, principal);
            profileMembers := textMap.put(profileMembers, profileId, updatedMembersMap);
          };
        };
      };
    };
  };

  func categoryToText(category : ResourceCategory) : Text {
    switch (category) {
      case (#foodDrink) { "foodDrink" };
      case (#storageSpace) { "storageSpace" };
      case (#kitchenSpace) { "kitchenSpace" };
      case (#distributionSpace) { "distributionSpace" };
      case (#equipment) { "equipment" };
      case (#publicity) { "publicity" };
      case (#other) { "other" };
    };
  };

  public shared ({ caller }) func cleanOrphanedRecords() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can perform maintenance");
    };

    var orphanedNeedIds = List.nil<Text>();
    var orphanedResourceIds = List.nil<Text>();

    for ((needId, need) in textMap.entries(needs)) {
      if (textMap.get(profiles, need.profileId) == null) {
        needs := textMap.delete(needs, needId);
        orphanedNeedIds := List.push(needId, orphanedNeedIds);
      };
    };

    for ((resourceId, resource) in textMap.entries(resources)) {
      if (textMap.get(profiles, resource.profileId) == null) {
        resources := textMap.delete(resources, resourceId);
        orphanedResourceIds := List.push(resourceId, orphanedResourceIds);
      };
    };

    removeOrphanedNeedResourceIds(
      List.toArray(orphanedNeedIds),
      List.toArray(orphanedResourceIds),
    );
  };

  public shared ({ caller }) func requestJoin(profileId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can request to join");
    };

    switch (textMap.get(profiles, profileId)) {
      case (null) Debug.trap("Profile not found");
      case (?_profile) {
        switch (textMap.get(joinRequests, profileId)) {
          case (null) {
            var joinRequestList = List.nil<JoinRequest>();
            let newRequest : JoinRequest = {
              principal = caller;
              profileId;
              status = #pending;
              displayName = principalMap.get(displayNames, caller);
            };
            joinRequestList := List.push(newRequest, joinRequestList);
            joinRequests := textMap.put(joinRequests, profileId, joinRequestList);
          };
          case (?existingRequests) {
            var hasPendingRequest = false;
            List.iterate<JoinRequest>(
              existingRequests,
              func(request) {
                if (request.principal == caller and request.status == #pending) {
                  hasPendingRequest := true;
                };
              },
            );

            if (hasPendingRequest) {
              Debug.trap("You already have a pending join request for this profile.");
            };

            let newRequest : JoinRequest = {
              principal = caller;
              profileId;
              status = #pending;
              displayName = principalMap.get(displayNames, caller);
            };

            var updatedList = List.nil<JoinRequest>();
            List.iterate<JoinRequest>(
              existingRequests,
              func(existingRequest) {
                updatedList := List.push(existingRequest, updatedList);
              },
            );

            updatedList := List.push(newRequest, updatedList);
            joinRequests := textMap.put(joinRequests, profileId, updatedList);
          };
        };
      };
    };
  };

  public query ({ caller }) func getPendingJoinRequestsForProfile(profileId : Text) : async [JoinRequest] {
    switch (textMap.get(profiles, profileId)) {
      case (null) Debug.trap("Profile not found");
      case (?_profile) {
        if (not AccessControl.isAdmin(accessControlState, caller) and not isClubAdmin(caller, profileId)) {
          Debug.trap("Unauthorized: Only admins or club admins can view join requests");
        };
        switch (textMap.get(joinRequests, profileId)) {
          case (null) { [] };
          case (?requestsList) {
            var pendingJoinRequests = List.nil<JoinRequest>();
            List.iterate<JoinRequest>(
              requestsList,
              func(request) {
                if (request.status == #pending) {
                  pendingJoinRequests := List.push(request, pendingJoinRequests);
                };
              },
            );
            List.toArray(pendingJoinRequests);
          };
        };
      };
    };
  };

  public query ({ caller }) func getJoinRequestStatus(_profileId : Text) : async JoinRequestStatus {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only users can check join request status");
    };

    var joinRequestStatus : ?JoinRequestStatus = null;

    for ((profileId, profilesList) in textMap.entries(joinRequests)) {
      List.iterate<JoinRequest>(
        profilesList,
        func(request) {
          if (request.principal == caller) {
            joinRequestStatus := ?request.status;
          };
        },
      );
    };

    switch (joinRequestStatus) {
      case (null) { #denied };
      case (?status) { status };
    };
  };

  public shared ({ caller }) func approveJoinRequest(profileId : Text, memberPrincipal : Principal, role : ProfileRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin) or isClubAdmin(caller, profileId))) {
      Debug.trap("Unauthorized: Only admins or club admins can approve join requests");
    };

    switch (textMap.get(joinRequests, profileId)) {
      case (null) {
      };
      case (?requests) {
        var updatedRequests = List.nil<JoinRequest>();

        List.iterate<JoinRequest>(
          requests,
          func(request) {
            if (request.principal == memberPrincipal) {
              let updatedRequest = {
                request with status = #approved
              };
              updatedRequests := List.push(updatedRequest, updatedRequests);
            } else {
              updatedRequests := List.push(request, updatedRequests);
            };
          },
        );

        joinRequests := textMap.put(joinRequests, profileId, updatedRequests);
        await addProfileMember(profileId, memberPrincipal, role);
      };
    };
  };

  public shared ({ caller }) func denyJoinRequest(profileId : Text, memberPrincipal : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin) or isClubAdmin(caller, profileId))) {
      Debug.trap("Unauthorized: Only admins or club admins can deny join requests");
    };

    switch (textMap.get(joinRequests, profileId)) {
      case (null) {
      };
      case (?requests) {
        var updatedRequests = List.nil<JoinRequest>();

        List.iterate<JoinRequest>(
          requests,
          func(request) {
            if (request.principal == memberPrincipal) {
              let updatedRequest = {
                request with status = #denied
              };
              updatedRequests := List.push(updatedRequest, updatedRequests);
            } else {
              updatedRequests := List.push(request, updatedRequests);
            };
          },
        );

        joinRequests := textMap.put(joinRequests, profileId, updatedRequests);
      };
    };
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      true;
    } else {
      UserApproval.isApproved(userApprovalState, caller);
    };
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(userApprovalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(userApprovalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(userApprovalState);
  };
};
