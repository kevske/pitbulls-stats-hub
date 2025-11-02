import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

const ImageUploader = ({ value, onChange }: ImageUploaderProps) => {
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved images from localStorage on component mount
  useEffect(() => {
    const savedImages = localStorage.getItem('uploadedImages');
    if (savedImages) {
      setImages(JSON.parse(savedImages));
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte laden Sie ein gültiges Bild hoch.');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Das Bild darf maximal 2MB groß sein.');
      return;
    }

    setIsUploading(true);

    // In a real app, you would upload the file to a server here
    // For this example, we'll use a data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      const updatedImages = [imageUrl, ...images];
      setImages(updatedImages);
      onChange(imageUrl);
      localStorage.setItem('uploadedImages', JSON.stringify(updatedImages));
      setIsUploading(false);
      toast.success('Bild erfolgreich hochgeladen');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    localStorage.setItem('uploadedImages', JSON.stringify(updatedImages));
    
    // If the removed image is the currently selected one, clear the selection
    if (images[index] === value) {
      onChange('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
        </Button>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />
        {value && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange('')}
            className="text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {value && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Aktuelles Bild:</p>
          <div className="relative w-32 h-32 border rounded-md overflow-hidden">
            <img 
              src={value} 
              alt="Current profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">Verfügbare Bilder:</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {images.map((img, index) => (
              <div 
                key={index} 
                className={`relative cursor-pointer rounded-md overflow-hidden border-2 ${
                  value === img ? 'border-primary' : 'border-transparent'
                }`}
                onClick={() => onChange(img)}
              >
                <img 
                  src={img} 
                  alt={`Upload ${index + 1}`} 
                  className="w-full h-20 object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => handleRemoveImage(index, e)}
                  className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
