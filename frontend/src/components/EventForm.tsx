import { useState, useEffect } from 'react';
import { useCreateEvent, useUpdateEvent } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Calendar, MapPin, Clock, Upload, X } from 'lucide-react';
import { ResourceCategory, Event } from '../backend';
import { Checkbox } from './ui/checkbox';
import { useFileUpload } from '../blob-storage/FileStorage';

interface EventFormProps {
  profileId: string;
  event?: Event | null;
  onClose: () => void;
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

export default function EventForm({ profileId, event, onClose, onSuccess }: EventFormProps) {
  const isEditMode = !!event;
  
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [selectedNeeds, setSelectedNeeds] = useState<ResourceCategory[]>([]);

  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();
  const { uploadFile, isUploading } = useFileUpload();

  const isPending = isCreating || isUpdating;

  // Populate form when editing
  useEffect(() => {
    if (event) {
      setLocation(event.location);
      setDescription(event.description);
      
      const eventDate = new Date(Number(event.time) / 1000000);
      setDate(eventDate.toISOString().split('T')[0]);
      setTime(eventDate.toTimeString().slice(0, 5));
      
      if (event.image) {
        setUploadedImageUrl(event.image);
        setImagePreview(event.image);
      }
      
      // Note: event.needs are placeholder IDs, not actual categories
      setSelectedNeeds([]);
    }
  }, [event]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Clear uploaded URL when new file is selected
      setUploadedImageUrl('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl('');
  };

  const handleToggleNeed = (category: ResourceCategory) => {
    setSelectedNeeds((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !description || !date || !time) {
      alert('Please fill in all required fields');
      return;
    }

    let imageUrl = uploadedImageUrl;

    // Upload event image if a new file is selected
    if (imageFile && !uploadedImageUrl) {
      try {
        const path = `events/${Date.now()}-${imageFile.name}`;
        const result = await uploadFile(path, imageFile);
        imageUrl = result.url;
        setUploadedImageUrl(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload event image. Please try again.');
        return;
      }
    }

    try {
      const eventDateTime = new Date(`${date}T${time}`);

      // Convert selected needs to need IDs (for now using category names as placeholders)
      const needIds = selectedNeeds.map((category) => `need-${category}-${Date.now()}`);

      if (isEditMode && event) {
        updateEvent(
          {
            eventId: event.id,
            location,
            description,
            time: eventDateTime,
            image: imageUrl || undefined,
            needs: needIds,
          },
          {
            onSuccess: () => {
              onSuccess();
            },
          }
        );
      } else {
        createEvent(
          {
            creatorProfileId: profileId,
            location,
            description,
            time: eventDateTime,
            image: imageUrl || undefined,
            needs: needIds,
          },
          {
            onSuccess: () => {
              onSuccess();
            },
          }
        );
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the event details' : 'Fill in the details to create a new community event'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Location *</span>
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter event location"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event..."
              rows={4}
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Date *</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Time *</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Event Image (Optional)</Label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  id="eventImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="eventImage" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Needs Selection */}
          <div className="space-y-2">
            <Label>Event Needs (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select the types of resources or support needed for this event
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={selectedNeeds.includes(key as ResourceCategory)}
                    onCheckedChange={() => handleToggleNeed(key as ResourceCategory)}
                  />
                  <Label htmlFor={key} className="cursor-pointer font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending || isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending || isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isUploading ? 'Uploading...' : isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Event' : 'Create Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
