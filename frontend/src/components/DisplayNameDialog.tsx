import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useGetCallerDisplayName, useSetDisplayName } from '../hooks/useQueries';
import { User } from 'lucide-react';

interface DisplayNameDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function DisplayNameDialog({ open, onClose }: DisplayNameDialogProps) {
  const { data: currentDisplayName, isLoading } = useGetCallerDisplayName();
  const { mutate: setDisplayName, isPending } = useSetDisplayName();
  const [displayName, setDisplayNameInput] = useState('');

  useEffect(() => {
    if (currentDisplayName) {
      setDisplayNameInput(currentDisplayName);
    }
  }, [currentDisplayName]);

  const handleSave = () => {
    if (!displayName.trim()) {
      return;
    }

    setDisplayName(displayName.trim(), {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Set Display Name</span>
          </DialogTitle>
          <DialogDescription>
            Set a display name that will be shown to other users and administrators when viewing member lists.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Enter your display name..."
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This name will be visible to admins and other members of your organizations.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!displayName.trim() || isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
