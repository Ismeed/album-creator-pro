import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { BACKGROUND_COLOR_OPTIONS, type BackgroundColor } from "@/hooks/useImageProcessing";

interface BackgroundColorPickerProps {
  value: BackgroundColor;
  onChange: (color: BackgroundColor) => void;
  className?: string;
}

export function BackgroundColorPicker({
  value,
  onChange,
  className,
}: BackgroundColorPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-foreground">Background Color</p>
      <div className="flex gap-3">
        {BACKGROUND_COLOR_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative w-10 h-10 rounded-full border-2 transition-all",
              value === option.value
                ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
                : "border-border hover:border-muted-foreground"
            )}
            style={{ backgroundColor: option.hex }}
            aria-label={option.label}
            title={option.label}
          >
            {value === option.value && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check
                  className={cn(
                    "w-5 h-5",
                    option.value === "white" || option.value === "gray"
                      ? "text-foreground"
                      : "text-white"
                  )}
                />
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Your photo background will be replaced with this color
      </p>
    </div>
  );
}
