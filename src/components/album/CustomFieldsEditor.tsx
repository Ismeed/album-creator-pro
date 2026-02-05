import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type CustomField,
  MAX_CUSTOM_FIELDS,
  MAX_CUSTOM_FIELD_LABEL_LENGTH,
} from "@/types/album-templates";

interface CustomFieldsEditorProps {
  customFields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  disabled?: boolean;
}

export function CustomFieldsEditor({
  customFields,
  onChange,
  disabled = false,
}: CustomFieldsEditorProps) {
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const canAddField = customFields.length < MAX_CUSTOM_FIELDS && !disabled;

  const handleAddField = () => {
    if (!newFieldLabel.trim() || !canAddField) return;

    const newField: CustomField = {
      id: `custom_${Date.now()}`,
      label: newFieldLabel.trim().slice(0, MAX_CUSTOM_FIELD_LABEL_LENGTH),
    };

    onChange([...customFields, newField]);
    setNewFieldLabel("");
  };

  const handleRemoveField = (fieldId: string) => {
    onChange(customFields.filter((f) => f.id !== fieldId));
  };

  const handleUpdateLabel = (fieldId: string, newLabel: string) => {
    onChange(
      customFields.map((f) =>
        f.id === fieldId
          ? { ...f, label: newLabel.slice(0, MAX_CUSTOM_FIELD_LABEL_LENGTH) }
          : f
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          Custom Fields ({customFields.length}/{MAX_CUSTOM_FIELDS})
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[200px] text-xs">
                Add up to {MAX_CUSTOM_FIELDS} custom text fields. These will appear
                on the submission form and album layout.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <AnimatePresence mode="popLayout">
        {customFields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex-1">
              <Input
                value={field.label}
                onChange={(e) => handleUpdateLabel(field.id, e.target.value)}
                placeholder={`Custom Field ${index + 1}`}
                disabled={disabled}
                maxLength={MAX_CUSTOM_FIELD_LABEL_LENGTH}
                className="h-10"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveField(field.id)}
              disabled={disabled}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {canAddField && (
        <div className="flex items-center gap-2">
          <Input
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddField();
              }
            }}
            placeholder="Enter field label..."
            maxLength={MAX_CUSTOM_FIELD_LABEL_LENGTH}
            className="h-10"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddField}
            disabled={!newFieldLabel.trim()}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {customFields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Optional: Add custom text fields for additional participant info.
        </p>
      )}
    </div>
  );
}