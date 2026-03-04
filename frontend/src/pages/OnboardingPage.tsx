import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building2, Users } from 'lucide-react';
import RegistrationPage from './RegistrationPage';
import MemberJoinPage from './MemberJoinPage';

type OnboardingView = 'choice' | 'organization' | 'member';

export default function OnboardingPage() {
  const [view, setView] = useState<OnboardingView>('choice');

  if (view === 'organization') {
    return <RegistrationPage onBack={() => setView('choice')} />;
  }

  if (view === 'member') {
    return <MemberJoinPage onBack={() => setView('choice')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to Montreal Food System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our community to connect with local food organizations, share resources, and build a sustainable food system together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-xl hover:shadow-2xl transition-shadow cursor-pointer group" onClick={() => setView('organization')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-center">I represent an organization</CardTitle>
              <CardDescription className="text-center text-base">
                Register your organization to share resources, post needs, and connect with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full h-12 text-base font-semibold" size="lg">
                Register Organization
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-shadow cursor-pointer group" onClick={() => setView('member')}>
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-center">I am a member</CardTitle>
              <CardDescription className="text-center text-base">
                Request to join an existing organization and collaborate with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full h-12 text-base font-semibold" size="lg" variant="secondary">
                Join Organization
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
