import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Camera, 
  Upload, 
  User, 
  Mail, 
  Check, 
  Image as ImageIcon,
  X,
  Loader2 
} from "lucide-react";

// This would come from URL params in real implementation
const albumInfo = {
  title: "Class of 2025 - Computer Science",
  organizerName: "Dr. Smith",
  description: "Please upload your graduation photo for the yearbook!",
};

const ParticipantSubmitPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "details" | "success">("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setStep("details");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setStep("success");
  };

  const canSubmit = formData.fullName.length > 0 && formData.email.length > 0;

  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6">
        <div className="mobile-container text-center">
          <span className="text-accent font-bold text-lg">OLEX</span>
          <h1 className="text-xl font-bold mt-2">{albumInfo.title}</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">
            Organized by {albumInfo.organizerName}
          </p>
        </div>
      </header>

      <div className="mobile-container py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Upload Photo */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">
                  Upload Your Photo
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {albumInfo.description}
                </p>
              </div>

              {/* Upload area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] max-w-xs mx-auto rounded-2xl border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 p-6"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    Tap to upload photo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG up to 10MB
                  </p>
                </div>
                <Button variant="accent" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Photo
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Step 2: Enter Details */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo preview */}
                <div className="relative aspect-[3/4] max-w-[200px] mx-auto rounded-xl overflow-hidden shadow-card">
                  {selectedImage && (
                    <img 
                      src={selectedImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setStep("upload");
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground">
                    Your Details
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your information for the album
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="pl-11 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-11 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student/Employee ID</Label>
                    <Input
                      id="studentId"
                      name="studentId"
                      placeholder="Optional"
                      value={formData.studentId}
                      onChange={handleChange}
                      className="h-12"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="accent" 
                  size="lg" 
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Submit Photo
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-success-foreground" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Photo Submitted!
              </h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Thank you for your submission. You'll receive a confirmation email shortly.
              </p>

              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <div className="aspect-[3/4] max-w-[150px] mx-auto rounded-xl overflow-hidden shadow-card">
                    <img 
                      src={selectedImage} 
                      alt="Submitted photo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    {formData.fullName}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default ParticipantSubmitPage;
