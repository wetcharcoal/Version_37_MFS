import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { MembershipInfo, ProfileRole } from '../backend';
import { Building2 } from 'lucide-react';

interface OrganizationProfileChooserDialogProps {
  memberships: MembershipInfo[];
  onSelect: (profileId: string) => void;
  onClose: () => void;
}

const ROLE_LABELS: Record<ProfileRole, string> = {
  [ProfileRole.clubAdmin]: 'Club Admin',
  [ProfileRole.user]: 'User',
};

export default function OrganizationProfileChooserDialog({
  memberships,
  onSelect,
  onClose,
}: OrganizationProfileChooserDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Select Organization</span>
          </DialogTitle>
          <DialogDescription>
            You are a member of multiple organizations. Please select which organization profile you would like to view.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {memberships.map((membership) => (
              <button
                key={membership.profileId}
                onClick={() => onSelect(membership.profileId)}
                className="w-full p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{membership.organizationName}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {ROLE_LABELS[membership.role]}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
