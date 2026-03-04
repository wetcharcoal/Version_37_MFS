import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useIsCallerAdmin, useGetCallerUserRole, useInitializeAccessControl } from '../hooks/useQueries';
import { UserRole } from '../backend';

export default function AdminBootstrapPanel() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();
  const { mutate: initializeAdmin, isPending } = useInitializeAccessControl();

  const isLoading = adminLoading || roleLoading;

  // Only show if user is not admin and role is guest (meaning access control might not be initialized)
  const shouldShowBootstrap = !isLoading && !isAdmin && userRole === UserRole.guest;

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Checking admin status...</p>
        </CardContent>
      </Card>
    );
  }

  if (isAdmin) {
    return (
      <Alert className="border-green-500/20 bg-green-500/5">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-400">
          You are a general admin with full system access.
        </AlertDescription>
      </Alert>
    );
  }

  if (!shouldShowBootstrap) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          First-Time Admin Setup
        </CardTitle>
        <CardDescription>
          This appears to be a new deployment. Click below to become the general admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> The first person to initialize access control becomes the permanent general admin.
            This action can only be performed once.
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => initializeAdmin()}
          disabled={isPending}
          className="w-full"
          size="lg"
        >
          {isPending ? 'Initializing...' : 'Become General Admin'}
        </Button>
      </CardContent>
    </Card>
  );
}
