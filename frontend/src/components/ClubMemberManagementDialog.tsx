import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useGetProfileMembers, useAddProfileMember, useRemoveProfileMember, useGetPendingJoinRequests, useApproveJoinRequest, useDenyJoinRequest } from '../hooks/useQueries';
import { ProfileRole } from '../backend';
import { Users, UserPlus, Trash2, UserCheck, UserX } from 'lucide-react';

interface ClubMemberManagementDialogProps {
  profileId: string;
  open: boolean;
  onClose: () => void;
}

const ROLE_LABELS: Record<ProfileRole, string> = {
  [ProfileRole.clubAdmin]: 'Club Admin',
  [ProfileRole.user]: 'User',
};

export default function ClubMemberManagementDialog({
  profileId,
  open,
  onClose,
}: ClubMemberManagementDialogProps) {
  const { data: members = [], isLoading } = useGetProfileMembers(profileId);
  const { data: joinRequests = [], isLoading: isLoadingRequests } = useGetPendingJoinRequests(profileId);
  const { mutate: addMember, isPending: isAdding } = useAddProfileMember();
  const { mutate: removeMember, isPending: isRemoving } = useRemoveProfileMember();
  const { mutate: approveRequest, isPending: isApproving } = useApproveJoinRequest();
  const { mutate: denyRequest, isPending: isDenying } = useDenyJoinRequest();

  const [newPrincipal, setNewPrincipal] = useState('');
  const [newRole, setNewRole] = useState<ProfileRole>(ProfileRole.user);

  const handleAddMember = () => {
    if (!newPrincipal.trim()) {
      return;
    }

    addMember(
      {
        profileId,
        principal: newPrincipal.trim(),
        role: newRole,
      },
      {
        onSuccess: () => {
          setNewPrincipal('');
          setNewRole(ProfileRole.user);
        },
      }
    );
  };

  const handleRemoveMember = (principal: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeMember({ profileId, principal });
    }
  };

  const handleChangeRole = (principal: string, role: ProfileRole) => {
    addMember({ profileId, principal, role });
  };

  const handleApproveRequest = (principal: string, role: ProfileRole) => {
    approveRequest({
      profileId,
      memberPrincipal: principal,
      role,
    });
  };

  const handleDenyRequest = (principal: string) => {
    if (window.confirm('Are you sure you want to deny this join request?')) {
      denyRequest({
        profileId,
        memberPrincipal: principal,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Manage Club Members</span>
          </DialogTitle>
          <DialogDescription>
            Add or remove members, manage roles, and review join requests
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Join Requests ({joinRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {/* Add Member Section */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Add New Member</span>
              </h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal ID</Label>
                  <Input
                    id="principal"
                    value={newPrincipal}
                    onChange={(e) => setNewPrincipal(e.target.value)}
                    placeholder="Enter principal ID..."
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newRole}
                    onValueChange={(value) => setNewRole(value as ProfileRole)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProfileRole.clubAdmin}>Club Admin</SelectItem>
                      <SelectItem value={ProfileRole.user}>User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!newPrincipal.trim() || isAdding}
                  className="w-full"
                >
                  {isAdding ? 'Adding...' : 'Add Member'}
                </Button>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-3">
              <h3 className="font-semibold">Current Members ({members.length})</h3>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No members yet
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.principal.toString()}
                        className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          {member.displayName && (
                            <p className="text-sm font-medium truncate">
                              {member.displayName}
                            </p>
                          )}
                          <p className="text-xs font-mono text-muted-foreground truncate">
                            {member.principal.toString()}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Select
                              value={member.role}
                              onValueChange={(value) =>
                                handleChangeRole(
                                  member.principal.toString(),
                                  value as ProfileRole
                                )
                              }
                              disabled={isAdding}
                            >
                              <SelectTrigger className="w-[140px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ProfileRole.clubAdmin}>
                                  Club Admin
                                </SelectItem>
                                <SelectItem value={ProfileRole.user}>User</SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge variant="secondary" className="text-xs">
                              {ROLE_LABELS[member.role]}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.principal.toString())}
                          disabled={isRemoving}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Pending Join Requests ({joinRequests.length})</h3>
              {isLoadingRequests ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading requests...
                </div>
              ) : joinRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending join requests
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {joinRequests.map((request) => (
                      <div
                        key={request.principal.toString()}
                        className="p-4 bg-card border border-border rounded-lg space-y-3"
                      >
                        <div className="space-y-1">
                          {request.displayName && (
                            <p className="text-sm font-medium">
                              {request.displayName}
                            </p>
                          )}
                          <p className="text-xs font-mono text-muted-foreground break-all">
                            {request.principal.toString()}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            Pending
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`role-${request.principal.toString()}`}>
                            Assign Role
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Select
                              defaultValue={ProfileRole.user}
                              onValueChange={(value) => {
                                handleApproveRequest(
                                  request.principal.toString(),
                                  value as ProfileRole
                                );
                              }}
                              disabled={isApproving || isDenying}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ProfileRole.user}>
                                  <div className="flex items-center space-x-2">
                                    <UserCheck className="w-4 h-4" />
                                    <span>Approve as User</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value={ProfileRole.clubAdmin}>
                                  <div className="flex items-center space-x-2">
                                    <UserCheck className="w-4 h-4" />
                                    <span>Approve as Club Admin</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDenyRequest(request.principal.toString())}
                              disabled={isApproving || isDenying}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
