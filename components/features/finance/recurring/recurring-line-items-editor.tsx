"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecurringLineItemTemplate } from "@/types";

type RecurringLineItemsEditorProps = {
  value: RecurringLineItemTemplate[];
  onChange: (items: RecurringLineItemTemplate[]) => void;
  currency?: string;
};

function emptyLine(): RecurringLineItemTemplate {
  return {
    description: "",
    notes: null,
    quantity: 1,
    unit_price: 0,
    tax_rate: 0,
    hsn_sac_code: null,
  };
}

export function RecurringLineItemsEditor({
  value,
  onChange,
  currency = "USD",
}: RecurringLineItemsEditorProps) {
  function updateItem(index: number, patch: Partial<RecurringLineItemTemplate>) {
    onChange(
      value.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const subtotal = value.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      {value.map((item, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border border-border/60 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="grid flex-1 gap-3">
              <div>
                <Label htmlFor={`line-desc-${index}`}>Description</Label>
                <Input
                  id={`line-desc-${index}`}
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, { description: e.target.value })
                  }
                  placeholder="Monthly retainer"
                />
              </div>
              <div>
                <Label htmlFor={`line-notes-${index}`}>Notes (optional)</Label>
                <Input
                  id={`line-notes-${index}`}
                  value={item.notes ?? ""}
                  onChange={(e) =>
                    updateItem(index, {
                      notes: e.target.value || null,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`line-qty-${index}`}>Qty</Label>
                  <Input
                    id={`line-qty-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`line-rate-${index}`}>Rate</Label>
                  <Input
                    id={`line-rate-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(index, {
                        unit_price: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`line-tax-${index}`}>Tax %</Label>
                  <Input
                    id={`line-tax-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.tax_rate}
                    onChange={(e) =>
                      updateItem(index, {
                        tax_rate: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
              onClick={() => removeItem(index)}
              disabled={value.length <= 1}
              aria-label="Remove line item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onChange([...value, emptyLine()])}
        >
          <Plus className="h-4 w-4" />
          Add line
        </Button>
        <p className="text-sm text-muted-foreground">
          Subtotal:{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
          }).format(subtotal)}
        </p>
      </div>
    </div>
  );
}
