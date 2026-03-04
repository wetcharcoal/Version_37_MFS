import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw, Building2 } from 'lucide-react';

interface ProfileLoadFallbackCardProps {
  onRetry: () => void;
  onChooseOrganization?: () => void;
  showChooseOrganization?: boolean;
  errorMessage?: string;
}

export default function ProfileLoadFallbackCard({
  onRetry,
  onChooseOrganization,
  showChooseOrganization = false,
  errorMessage,
}: ProfileLoadFallbackCardProps) {
  const defaultMessage = 'We were unable to load your organization profile. This may be a temporary issue.';
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-warning" />
            <CardTitle>Profile Could Not Be Loaded</CardTitle>
          </div>
          <CardDescription>
            {errorMessage || defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please try one of the following actions:
          </p>
          <div className="flex flex-col space-y-2">
            <Button onClick={onRetry} variant="default" className="w-full space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Retry Loading Profile</span>
            </Button>
            {showChooseOrganization && onChooseOrganization && (
              <Button onClick={onChooseOrganization} variant="outline" className="w-full space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Choose Organization</span>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            If this problem persists, please contact an administrator for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
