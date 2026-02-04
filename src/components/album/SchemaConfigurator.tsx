import { useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings2, 
  GripVertical,
  Info,
  Plus,
  Trash2
} from "lucide-react";
import {
  type FieldSchema,
  type StoredSchemaConfig,
  type FieldId,
  type AlbumCategory,
  getSchemaForCategory,
  createDefaultSchemaConfig,
} from "@/types/field-schemas";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SchemaConfiguratorProps {
  category: AlbumCategory;
  config: StoredSchemaConfig;
  onChange: (config: StoredSchemaConfig) => void;
  departments?: string[];
  onDepartmentsChange?: (departments: string[]) => void;
}

export function SchemaConfigurator({
  category,
  config,
  onChange,
  departments = [],
  onDepartmentsChange,
}: SchemaConfiguratorProps) {
  const baseSchema = getSchemaForCategory(category);
  const [newDepartment, setNewDepartment] = useState("");
  
  const isFaculty = category === "faculty";
  const isCustom = category === "other";
  
  // Get core required fields that cannot be toggled
  const coreFields: FieldId[] = ["full_name", "email"];
  
  const handleLabelChange = (fieldId: FieldId, newLabel: string) => {
    const updatedFields = config.fields.map(f =>
      f.id === fieldId ? { ...f, label: newLabel } : f
    );
    onChange({ ...config, fields: updatedFields });
  };
  
  const handleRequiredToggle = (fieldId: FieldId, required: boolean) => {
    // Don't allow toggling core fields
    if (coreFields.includes(fieldId)) return;
    
    const updatedFields = config.fields.map(f =>
      f.id === fieldId ? { ...f, required } : f
    );
    onChange({ ...config, fields: updatedFields });
  };
  
  const handleAddDepartment = () => {
    if (!newDepartment.trim() || !onDepartmentsChange) return;
    if (departments.includes(newDepartment.trim())) return;
    
    onDepartmentsChange([...departments, newDepartment.trim()]);
    setNewDepartment("");
  };
  
  const handleRemoveDepartment = (dept: string) => {
    if (!onDepartmentsChange) return;
    onDepartmentsChange(departments.filter(d => d !== dept));
  };

  return (
    <div className="space-y-6">
      {/* Schema info */}
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Settings2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Schema {config.schemaType}: {baseSchema.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {baseSchema.description}
            </p>
          </div>
        </div>
      </div>

      {/* Faculty: Department list */}
      {isFaculty && onDepartmentsChange && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <span>Departments in this Faculty</span>
            <Badge variant="secondary" className="text-xs">Required for Faculty</Badge>
          </Label>
          <p className="text-xs text-muted-foreground">
            Define the departments under this faculty. Participants will select from this list.
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add a department..."
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDepartment())}
              className="h-10"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDepartment}
              disabled={!newDepartment.trim()}
              className="shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {departments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {departments.map((dept) => (
                <Badge
                  key={dept}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {dept}
                  <button
                    type="button"
                    onClick={() => handleRemoveDepartment(dept)}
                    className="p-0.5 hover:bg-muted rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Field configuration */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <span>Participant Form Fields</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[200px] text-xs">
                  Customize field labels and toggle optional fields.
                  Core fields (name, email) cannot be removed.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        
        <div className="space-y-2">
          {config.fields.map((field, index) => {
            const isCore = coreFields.includes(field.id);
            const baseField = baseSchema.fields.find(f => f.id === field.id);
            
            return (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  field.required 
                    ? "bg-background border-border" 
                    : "bg-muted/30 border-transparent"
                }`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <Input
                    value={field.label}
                    onChange={(e) => handleLabelChange(field.id, e.target.value)}
                    className="h-8 text-sm"
                    placeholder={baseField?.label || "Field label"}
                  />
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {isCore ? (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {field.required ? "Required" : "Optional"}
                      </span>
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => handleRequiredToggle(field.id, checked)}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Custom schema note */}
      {isCustom && (
        <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
          <p className="text-xs text-warning-foreground">
            <strong>Note:</strong> Custom schema supports basic text fields only. 
            Complex field types and nested logic are not available in the MVP.
          </p>
        </div>
      )}
    </div>
  );
}
