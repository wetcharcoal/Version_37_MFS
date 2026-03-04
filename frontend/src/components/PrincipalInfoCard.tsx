import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Copy, Check, Info } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

export default function PrincipalInfoCard() {
  const { identity } = useInternetIdentity();
  const [copied, setCopied] = useState(false);

  const principal = identity?.getPrincipal().toString() || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopied(true);
      toast.success('Principal ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!identity) {
    return null;
  }

  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="w-5 h-5 text-blue-600" />
          Your Principal ID
        </CardTitle>
        <CardDescription>
          This is your unique identifier on the Internet Computer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Note:</strong> Internet Identity does not provide email addresses to applications.
            Admin permissions must be granted using your Principal ID, not your email.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-muted rounded-lg text-xs font-mono break-all">
              {principal}
            </code>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this Principal ID with an admin to receive permissions
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
