
"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="space-y-4">
      {attributes.map((attribute) => {
        const isColorAttribute = attribute.name.toLowerCase().includes('color');
        
        return (
          <div key={attribute.name}>
            <Label htmlFor={`select-${attribute.name.toLowerCase()}`} className="text-base font-medium text-foreground mb-2 block">
              {attribute.name}
            </Label>
            <Select
              value={selectedOptions[attribute.name] || ''}
              onValueChange={(value) => onOptionSelect(attribute.name, value)}
            >
              <SelectTrigger id={`select-${attribute.name.toLowerCase()}`} className="w-full">
                <SelectValue placeholder={`Select ${attribute.name}`} />
              </SelectTrigger>
              <SelectContent>
                {attribute.options.map((option) => {
                  const colorHex = commonColorHexMap[option.toLowerCase()];
                  return (
                    <SelectItem key={option} value={option}>
                      <div className="flex items-center gap-2">
                        {isColorAttribute && colorHex && (
                          <span
                            className="inline-block h-4 w-4 rounded-full border border-input mr-2"
                            style={{ backgroundColor: colorHex }}
                          />
                        )}
                        <span>{option}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}

