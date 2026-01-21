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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    const imagePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          return reject({ fileName: file.name, message: 'Kein gültiges Bild.' });
        }
        if (file.size > 2 * 1024 * 1024) {
          return reject({ fileName: file.name, message: 'Darf maximal 2MB groß sein.' });
        }

        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject({ fileName: file.name, message: 'Fehler beim Lesen der Datei.' });
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.allSettled(imagePromises);

    const newImages: string[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        newImages.push(result.value);
      } else {
        toast.error(`Fehler bei ${result.reason.fileName}: ${result.reason.message}`);
      }
    });

    if (newImages.length > 0) {
      const updatedImages = [...newImages, ...images];
      setImages(updatedImages);
      localStorage.setItem('uploadedImages', JSON.stringify(updatedImages));
      onChange(newImages[0]); // Select the first new image
      toast.success(`${newImages.length} von ${files.length} Bild(ern) erfolgreich hochgeladen.`);
    }

    setIsUploading(false);
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
          multiple
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
