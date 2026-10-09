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

      {/* Art-directed template preview */}
      <div className={`aspect-[3/4] rounded-lg mb-2 overflow-hidden flex items-end p-3 ${
        template.id === "elevate" ? "bg-[#f5f0e8] border border-[#d9c9aa]" :
        template.id === "momentum" ? "bg-[#171512]" :
        template.id === "signature" ? "bg-[#e8e5df] border-l-4 border-[#22211f]" :
        "bg-muted/50"
      }`}>
        <div className={template.id === "momentum" ? "text-[#c7a76b]" : "text-foreground/70"}>
          <div className="mb-1 h-px w-8 bg-current opacity-60" />
          <span className="font-serif text-lg">{template.name}</span>
          <div className="mt-1 text-[8px] uppercase tracking-[0.2em] opacity-60">Premium edition</div>
        </div>
      </div>

      <h5 className="font-medium text-foreground text-sm">{template.name}</h5>
      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
        {template.description}
      </p>
    </motion.button>
  );
}
