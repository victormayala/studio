
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ConfigurableAttribute } from '@/app/customizer/page';
import { cn } from '@/lib/utils';

interface VariantSelectorProps {
  attributes: ConfigurableAttribute[] | null;
  selectedOptions: Record<string, string>;
  onOptionSelect: (attributeName: string, optionValue: string) => void;
}

// Simple mapping for common color names to hex for swatch preview
const commonColorHexMap: Record<string, string> = {
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
  black: '#000000',
  white: '#FFFFFF',
  yellow: '#FFFF00',
  purple: '#800080',
  orange: '#FFA500',
  pink: '#FFC0CB',
  brown: '#A52A2A',
  gray: '#808080',
  grey: '#808080',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

export default function VariantSelector({ attributes, selectedOptions, onOptionSelect }: VariantSelectorProps) {
  if (!attributes || attributes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center">No options to select.</p>;
  }

  return (
    <div className="space-y-6">
      {attributes.map((attribute) => (
        <div key={attribute.name}>
          <Label className="text-base font-medium text-foreground mb-2 block">{attribute.name}</Label>
          <RadioGroup
            value={selectedOptions[attribute.name] || ''}
            onValueChange={(value) => onOptionSelect(attribute.name, value)}
            className="space-y-2"
          >
            {attribute.options.map((option) => {
              const isColorAttribute = attribute.name.toLowerCase().includes('color');
              const colorHex = commonColorHexMap[option.toLowerCase()];

              return (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${attribute.name}-${option}`} />
                  <Label
                    htmlFor={`${attribute.name}-${option}`}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer p-2 border rounded-md hover:bg-accent/50 transition-colors w-full",
                      selectedOptions[attribute.name] === option ? "bg-primary/10 border-primary" : "border-border"
                    )}
                  >
                    {isColorAttribute && colorHex && (
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-input"
                        style={{ backgroundColor: colorHex }}
                      />
                    )}
                    <span className="text-sm">{option}</span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
