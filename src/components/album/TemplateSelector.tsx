import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  ALBUM_TEMPLATES, 
  type AlbumTemplateConfig 
} from "@/types/album-templates";

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
  disabled?: boolean;
}

export function TemplateSelector({
  selectedTemplateId,
  onSelect,
  disabled = false,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Basic Templates */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Basic Templates</h4>
        <div className="grid grid-cols-2 gap-3">
          {ALBUM_TEMPLATES.filter(t => t.tier === "basic").map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={() => onSelect(template.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Premium Templates */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground">Premium Templates</h4>
          <Badge variant="secondary" className="text-xs gap-1">
            <Crown className="w-3 h-3" />
            Free during testing
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ALBUM_TEMPLATES.filter(t => t.tier === "premium").map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={() => onSelect(template.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: AlbumTemplateConfig;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function TemplateCard({ template, isSelected, onSelect, disabled }: TemplateCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? "border-accent bg-accent/5"
          : "border-border bg-background hover:border-accent/50"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-accent-foreground" />
        </motion.div>
      )}
      
      {/* Premium badge */}
      {template.tier === "premium" && (
        <Crown className="absolute top-2 right-2 w-4 h-4 text-warning" />
      )}

      {/* Template preview placeholder */}
      <div className="aspect-[3/4] rounded-lg bg-muted/50 mb-2 flex items-center justify-center">
        <span className="text-2xl font-bold text-muted-foreground/30">
          {template.name.charAt(0)}
        </span>
      </div>

      <h5 className="font-medium text-foreground text-sm">{template.name}</h5>
      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
        {template.description}
      </p>
    </motion.button>
  );
}