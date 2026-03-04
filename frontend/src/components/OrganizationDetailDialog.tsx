import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Profile, Need, ResourceHave, ResourceCategory, FunctionType } from '../backend';
import { MapPin, Phone, Mail, Package, FileText } from 'lucide-react';

interface OrganizationDetailDialogProps {
  profile: Profile | null;
  needs: Need[];
  resources: ResourceHave[];
  open: boolean;
  onClose: () => void;
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

export default function OrganizationDetailDialog({
  profile,
  needs,
  resources,
  open,
  onClose,
}: OrganizationDetailDialogProps) {
  if (!profile) return null;

  const organizationNeeds = needs.filter(need => need.profileId === profile.id);
  const organizationResources = resources.filter(resource => resource.profileId === profile.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{profile.organizationName}</DialogTitle>
          <DialogDescription>
            {profile.functions.map(f => FUNCTION_LABELS[f]).join(' • ')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Bio Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Bio</h3>
              <p className="text-sm">
                {profile.bio || 'No bio provided'}
              </p>
            </div>

            <Separator />

            {/* Address Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </h3>
              <p className="text-sm">{profile.address}</p>
            </div>

            <Separator />

            {/* Contact Info Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Resources Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Resources ({organizationResources.length})
              </h3>
              {organizationResources.length > 0 ? (
                <div className="space-y-2">
                  {organizationResources.map((resource) => (
                    <div key={resource.id} className="p-3 bg-secondary/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[resource.category]}
                        </Badge>
                      </div>
                      <p className="text-sm">{resource.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No resources listed</p>
              )}
            </div>

            <Separator />

            {/* Needs Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Needs ({organizationNeeds.length})
              </h3>
              {organizationNeeds.length > 0 ? (
                <div className="space-y-2">
                  {organizationNeeds.map((need) => (
                    <div key={need.id} className="p-3 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[need.category]}
                        </Badge>
                      </div>
                      <p className="text-sm">{need.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No needs listed</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
