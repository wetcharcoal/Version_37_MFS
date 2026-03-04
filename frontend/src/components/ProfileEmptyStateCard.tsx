import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Building2, Users } from 'lucide-react';

interface ProfileEmptyStateCardProps {
  onCreateGroup: () => void;
  onCreateMemberProfile: () => void;
}

export default function ProfileEmptyStateCard({
  onCreateGroup,
  onCreateMemberProfile,
}: ProfileEmptyStateCardProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to Your Profile</CardTitle>
          <CardDescription className="text-base">
            To get started, you can either create a new organization or join an existing one as a member.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Create Group</h3>
                  <p className="text-sm text-muted-foreground">
                    Register a new organization and become its administrator.
                  </p>
                </div>
                <Button
                  onClick={onCreateGroup}
                  className="w-full"
                  size="lg"
                >
                  Create Group
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Create Member Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Join an existing organization as a member.
                  </p>
                </div>
                <Button
                  onClick={onCreateMemberProfile}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  Join Organization
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
