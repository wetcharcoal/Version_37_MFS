import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

interface RuntimeErrorScreenProps {
  error: Error | null;
  onReset: () => void;
}

export default function RuntimeErrorScreen({ error, onReset }: RuntimeErrorScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/5 p-4">
      <Card className="max-w-lg w-full shadow-xl border-destructive/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription className="text-base">
            The application encountered an unexpected error and needs to reload.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message || 'Unknown error'}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button onClick={onReset} className="w-full" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Application
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              If the problem persists, please contact support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
