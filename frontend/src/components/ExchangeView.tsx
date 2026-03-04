import { useAllNeeds, useAllResources, useGetProfile } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Home } from 'lucide-react';
import { ResourceCategory, Need, ResourceHave } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface ExchangeViewProps {
  onViewProfile: (profileId: string) => void;
  onBack: () => void;
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

export default function ExchangeView({ onViewProfile, onBack }: ExchangeViewProps) {
  const { identity } = useInternetIdentity();
  const { data: needs } = useAllNeeds();
  const { data: resources } = useAllResources();

  const currentUserId = identity?.getPrincipal().toString();

  // Filter current user's needs and resources
  const myNeeds = needs?.filter(need => need.profileId === currentUserId) || [];
  const myResources = resources?.filter(resource => resource.profileId === currentUserId) || [];

  // Filter other users' needs and resources
  const otherNeeds = needs?.filter(need => need.profileId !== currentUserId) || [];
  const otherResources = resources?.filter(resource => resource.profileId !== currentUserId) || [];

  // Group needs and resources by category
  const needsByCategory = needs?.reduce((acc, need) => {
    if (!acc[need.category]) acc[need.category] = [];
    acc[need.category].push(need);
    return acc;
  }, {} as Record<ResourceCategory, Need[]>) || {};

  const resourcesByCategory = resources?.reduce((acc, resource) => {
    if (!acc[resource.category]) acc[resource.category] = [];
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<ResourceCategory, ResourceHave[]>) || {};

  // For "Your Matches" tab: find matches for current user
  const myNeedsByCategory = myNeeds.reduce((acc, need) => {
    if (!acc[need.category]) acc[need.category] = [];
    acc[need.category].push(need);
    return acc;
  }, {} as Record<ResourceCategory, Need[]>);

  const myResourcesByCategory = myResources.reduce((acc, resource) => {
    if (!acc[resource.category]) acc[resource.category] = [];
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<ResourceCategory, ResourceHave[]>);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back
        </Button>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Exchange Opportunities</CardTitle>
            <p className="text-muted-foreground">
              Discover matching needs and resources in the community
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="your-matches" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="your-matches">Your Matches</TabsTrigger>
                <TabsTrigger value="global-matches">Global Matches</TabsTrigger>
              </TabsList>

              <TabsContent value="your-matches" className="space-y-8 mt-6">
                {/* Section 1: Resources of other profiles that match my needs */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-primary">
                    Resources Available for Your Needs
                  </h3>
                  {(Object.entries(myNeedsByCategory) as [ResourceCategory, Need[]][]).map(([category, categoryNeeds]) => {
                    const matchingResources = otherResources.filter(r => r.category === category);
                    if (matchingResources.length === 0) return null;

                    return (
                      <Card key={category} className="border-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {CATEGORY_LABELS[category]}
                            </CardTitle>
                            <Badge variant="secondary">
                              {categoryNeeds.length} your needs · {matchingResources.length} available resources
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {categoryNeeds.map((need) => (
                              <div key={need.id} className="space-y-2">
                                <MyNeedWithMatches
                                  need={need}
                                  matchingResources={matchingResources}
                                  onViewProfile={onViewProfile}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {Object.keys(myNeedsByCategory).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      You haven't posted any needs yet
                    </p>
                  )}
                </div>

                {/* Section 2: My resources that match needs of other profiles */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-secondary">
                    Your Resources Matching Others' Needs
                  </h3>
                  {(Object.entries(myResourcesByCategory) as [ResourceCategory, ResourceHave[]][]).map(([category, categoryResources]) => {
                    const matchingNeeds = otherNeeds.filter(n => n.category === category);
                    if (matchingNeeds.length === 0) return null;

                    return (
                      <Card key={category} className="border-secondary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {CATEGORY_LABELS[category]}
                            </CardTitle>
                            <Badge variant="secondary">
                              {categoryResources.length} your resources · {matchingNeeds.length} matching needs
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {categoryResources.map((resource) => (
                              <div key={resource.id} className="space-y-2">
                                <MyResourceWithMatches
                                  resource={resource}
                                  matchingNeeds={matchingNeeds}
                                  onViewProfile={onViewProfile}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {Object.keys(myResourcesByCategory).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      You haven't posted any resources yet
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="global-matches" className="space-y-6 mt-6">
                {(Object.entries(needsByCategory) as [ResourceCategory, Need[]][]).map(([category, categoryNeeds]) => {
                  const matchingResources = resourcesByCategory[category] || [];
                  if (matchingResources.length === 0) return null;

                  return (
                    <Card key={category} className="border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {CATEGORY_LABELS[category]}
                          </CardTitle>
                          <Badge variant="secondary">
                            {categoryNeeds.length} needs · {matchingResources.length} resources
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {categoryNeeds.map((need) => (
                            <div key={need.id} className="space-y-2">
                              <NeedWithMatches
                                need={need}
                                matchingResources={matchingResources}
                                onViewProfile={onViewProfile}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {Object.keys(needsByCategory).length === 0 && (
                  <p className="text-center text-muted-foreground py-12">
                    No needs posted yet
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <button
        onClick={onBack}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
      >
        <Home className="w-6 h-6" />
      </button>
    </div>
  );
}

function MyNeedWithMatches({
  need,
  matchingResources,
  onViewProfile,
}: {
  need: Need;
  matchingResources: ResourceHave[];
  onViewProfile: (profileId: string) => void;
}) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-medium text-primary">Your Need</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{need.description}</p>
        </div>
      </div>

      <div className="pl-4 border-l-2 border-secondary space-y-2">
        <p className="text-sm font-medium text-secondary">Available Resources:</p>
        <ScrollArea className="max-h-32">
          <div className="space-y-2">
            {matchingResources.map((resource) => (
              <ResourceMatch
                key={resource.id}
                resource={resource}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function MyResourceWithMatches({
  resource,
  matchingNeeds,
  onViewProfile,
}: {
  resource: ResourceHave;
  matchingNeeds: Need[];
  onViewProfile: (profileId: string) => void;
}) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-medium text-secondary">Your Resource</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
        </div>
      </div>

      <div className="pl-4 border-l-2 border-primary space-y-2">
        <p className="text-sm font-medium text-primary">Matching Needs:</p>
        <ScrollArea className="max-h-32">
          <div className="space-y-2">
            {matchingNeeds.map((need) => (
              <NeedMatch key={need.id} need={need} onViewProfile={onViewProfile} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function NeedWithMatches({
  need,
  matchingResources,
  onViewProfile,
}: {
  need: Need;
  matchingResources: ResourceHave[];
  onViewProfile: (profileId: string) => void;
}) {
  const { data: needProfile } = useGetProfile(need.profileId);

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-medium text-primary">Need</p>
          <button
            onClick={() => onViewProfile(need.profileId)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {needProfile?.organizationName || 'Loading...'}
          </button>
          <p className="text-sm text-muted-foreground line-clamp-2">{need.description}</p>
        </div>
      </div>

      <div className="pl-4 border-l-2 border-secondary space-y-2">
        <p className="text-sm font-medium text-secondary">Matching Resources:</p>
        <ScrollArea className="max-h-32">
          <div className="space-y-2">
            {matchingResources.map((resource) => (
              <ResourceMatch
                key={resource.id}
                resource={resource}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function ResourceMatch({ resource, onViewProfile }: { resource: ResourceHave; onViewProfile: (profileId: string) => void }) {
  const { data: profile } = useGetProfile(resource.profileId);

  return (
    <button
      onClick={() => onViewProfile(resource.profileId)}
      className="w-full text-left p-2 bg-background rounded hover:bg-accent transition-colors"
    >
      <p className="text-sm font-medium">{profile?.organizationName || 'Loading...'}</p>
      <p className="text-xs text-muted-foreground line-clamp-1">{resource.description}</p>
    </button>
  );
}

function NeedMatch({ need, onViewProfile }: { need: Need; onViewProfile: (profileId: string) => void }) {
  const { data: profile } = useGetProfile(need.profileId);

  return (
    <button
      onClick={() => onViewProfile(need.profileId)}
      className="w-full text-left p-2 bg-background rounded hover:bg-accent transition-colors"
    >
      <p className="text-sm font-medium">{profile?.organizationName || 'Loading...'}</p>
      <p className="text-xs text-muted-foreground line-clamp-1">{need.description}</p>
    </button>
  );
}
