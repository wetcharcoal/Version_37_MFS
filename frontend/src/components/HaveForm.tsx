import { useState } from 'react';
import { useCreateResource, useProfile } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft } from 'lucide-react';
import { ResourceCategory } from '../backend';

interface HaveFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const categoryLabels: Record<ResourceCategory, string> = {
  [ResourceCategory.foodDrink]: 'Food/Drink',
  [ResourceCategory.storageSpace]: 'Storage Space',
  [ResourceCategory.kitchenSpace]: 'Kitchen Space',
  [ResourceCategory.distributionSpace]: 'Distribution Space',
  [ResourceCategory.equipment]: 'Equipment',
  [ResourceCategory.publicity]: 'Publicity',
  [ResourceCategory.other]: 'Other',
};

export default function HaveForm({ onBack, onSuccess }: HaveFormProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory | ''>('');

  const { data: profile } = useProfile();
  const { mutate: createResource, isPending } = useCreateResource();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !category || !profile) {
      alert('Please fill in all fields');
      return;
    }

    createResource(
      {
        profileId: profile.id,
        description,
        category: category as ResourceCategory,
      },
      {
        onSuccess,
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Post a Resource</h1>
          <p className="text-muted-foreground">Share what resources you can offer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as ResourceCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you can offer..."
            rows={4}
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Post Resource'}
          </Button>
        </div>
      </form>
    </div>
  );
}
