import { useState } from 'react';
import { useRegisterProfile } from '../hooks/useQueries';
import { FunctionType } from '../backend';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useFileUpload } from '../blob-storage/FileStorage';
import { Upload, X, ArrowLeft } from 'lucide-react';

const FUNCTION_OPTIONS = [
  { value: FunctionType.production, label: 'Production' },
  { value: FunctionType.processing, label: 'Processing' },
  { value: FunctionType.distribution, label: 'Distribution' },
  { value: FunctionType.wasteManagement, label: 'Waste Management' },
  { value: FunctionType.education, label: 'Education/Information' },
  { value: FunctionType.equipmentSpace, label: 'Equipment/Space' },
];

interface RegistrationPageProps {
  onBack?: () => void;
}

export default function RegistrationPage({ onBack }: RegistrationPageProps) {
  const [organizationName, setOrganizationName] = useState('');
  const [functions, setFunctions] = useState<FunctionType[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  const { mutate: registerProfile, isPending } = useRegisterProfile();
  const { uploadFile, isUploading } = useFileUpload();

  const handleFunctionToggle = (func: FunctionType) => {
    setFunctions((prev) =>
      prev.includes(func) ? prev.filter((f) => f !== func) : [...prev, func]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview('');
    setUploadedImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = uploadedImageUrl;

    // Upload profile picture if selected
    if (profilePictureFile && !uploadedImageUrl) {
      try {
        const path = `profiles/${Date.now()}-${profilePictureFile.name}`;
        const result = await uploadFile(path, profilePictureFile);
        imageUrl = result.url;
        setUploadedImageUrl(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload profile picture. Please try again.');
        return;
      }
    }

    registerProfile({
      organizationName,
      functions,
      address,
      phone,
      email,
      bio: bio || undefined,
      profilePicture: imageUrl || undefined,
    });
  };

  const isFormValid =
    organizationName.trim() &&
    functions.length > 0 &&
    address.trim() &&
    phone.trim() &&
    email.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <Card className="shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Register Your Organization
            </CardTitle>
            <CardDescription className="text-center text-base">
              Join the Montreal food system community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter your organization name"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Functions * (Select all that apply)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FUNCTION_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={functions.includes(option.value)}
                        onCheckedChange={() => handleFunctionToggle(option.value)}
                      />
                      <Label
                        htmlFor={option.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address in Montreal"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(514) 555-0123"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your organization..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profilePicture">Profile Picture (Optional)</Label>
                {!profilePicturePreview ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="profilePicture" className="cursor-pointer">
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
                      src={profilePicturePreview}
                      alt="Profile preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-border"
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

              <Button
                type="submit"
                disabled={!isFormValid || isPending || isUploading}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {isPending || isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {isUploading ? 'Uploading...' : 'Registering...'}
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
