import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Image, Users, Calendar, Check } from "lucide-react";

const CreateAlbumPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expectedParticipants: "",
    deadline: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Create album and redirect
      navigate("/dashboard");
    }
  };

  const canProceed = step === 1 
    ? formData.title.length > 0 
    : true;

  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="mobile-container flex items-center h-16">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors -ml-2 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-foreground ml-2">Create Album</h1>
        </div>
      </header>

      {/* Progress */}
      <div className="mobile-container py-4">
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Step {step} of 2
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mobile-container pb-8">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Album Details
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Give your album a name and description
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Album Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Class of 2025 - Engineering"
                value={formData.title}
                onChange={handleChange}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Add a note for participants..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Collection Settings
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure how you'll collect photos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedParticipants">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Expected Participants
                </span>
              </Label>
              <Input
                id="expectedParticipants"
                name="expectedParticipants"
                type="number"
                placeholder="e.g., 50"
                value={formData.expectedParticipants}
                onChange={handleChange}
                className="h-12"
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                How many people do you expect to submit photos?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Submission Deadline
                </span>
              </Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                When should participants submit by?
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-3">
              <h3 className="font-medium text-foreground text-sm">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium text-foreground">{formData.title}</span>
                </div>
                {formData.expectedParticipants && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected</span>
                    <span className="font-medium text-foreground">{formData.expectedParticipants} people</span>
                  </div>
                )}
                {formData.deadline && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium text-foreground">
                      {new Date(formData.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Button 
            type="submit" 
            variant="accent" 
            size="lg" 
            className="w-full"
            disabled={!canProceed}
          >
            {step === 2 ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Create Album
              </>
            ) : (
              "Continue"
            )}
          </Button>

          {step > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
        </div>
      </form>
    </main>
  );
};

export default CreateAlbumPage;
