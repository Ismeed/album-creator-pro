import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Image, AlertCircle, X } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface PhotoUploaderProps {
  onPhotoSelected: (file: File, previewUrl: string) => void;
  previewUrl: string | null;
  onClear: () => void;
}

export function PhotoUploader({ onPhotoSelected, previewUrl, onClear }: PhotoUploaderProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"gallery" | "camera" | null>(null);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload a JPG or PNG image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Photo must be under 10MB.";
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    setCaptureMode(null);

    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        // Reset input so same file can be selected again
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onPhotoSelected(file, reader.result as string);
      };
      reader.onerror = () => {
        setFileError("Failed to read the image file. Please try again.");
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  }, [validateFile, onPhotoSelected]);

  const openGallery = useCallback(() => {
    setCaptureMode("gallery");
    galleryInputRef.current?.click();
  }, []);

  const openCamera = useCallback(() => {
    setCaptureMode("camera");
    cameraInputRef.current?.click();
  }, []);

  // If we have a preview, show it with option to clear
  if (previewUrl) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-[3/4] max-w-xs mx-auto rounded-2xl overflow-hidden shadow-card">
          <img 
            src={previewUrl} 
            alt="Selected photo" 
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-lg"
            aria-label="Remove photo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Photo selected. Tap X to choose a different one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload area placeholder */}
      <div 
        className={`aspect-[3/4] max-w-xs mx-auto rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-4 p-6 ${
          fileError 
            ? "border-destructive bg-destructive/5" 
            : "border-border"
        }`}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          fileError ? "bg-destructive/10" : "bg-muted"
        }`}>
          <Image className={`w-8 h-8 ${fileError ? "text-destructive" : "text-muted-foreground"}`} />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">
            Add Your Photo
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG or PNG, max 10MB
          </p>
        </div>
      </div>

      {fileError && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive text-center flex items-center justify-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {fileError}
        </motion.p>
      )}

      {/* Two separate buttons for gallery and camera */}
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button 
          type="button"
          variant="accent" 
          size="lg"
          onClick={openGallery}
          className="w-full"
        >
          <Upload className="w-5 h-5 mr-2" />
          Choose from Gallery
        </Button>
        
        <Button 
          type="button"
          variant="outline" 
          size="lg"
          onClick={openCamera}
          className="w-full"
        >
          <Camera className="w-5 h-5 mr-2" />
          Take Photo
        </Button>
      </div>

      {/* Hidden file inputs - SEPARATE for gallery and camera */}
      {/* Gallery input: NO capture attribute - opens file picker */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Choose photo from gallery"
      />
      
      {/* Camera input: WITH capture attribute - opens camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Take photo with camera"
      />
    </div>
  );
}
