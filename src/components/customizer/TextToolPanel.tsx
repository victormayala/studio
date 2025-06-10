
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Bold, Italic, Underline, CaseUpper, CaseLower, Type, Palette, Settings, PaletteIcon, ShadowIcon, BaselineIcon, PilcrowIcon, TextQuote, ColumnsIcon, RowsIcon, CornerDownLeftIcon } from 'lucide-react';
import { useUploads, type CanvasText } from '@/contexts/UploadContext';
import { googleFonts, type GoogleFont } from '@/lib/google-fonts';
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper to validate and sanitize hex color
const sanitizeHex = (hex: string): string => {
  let sanitized = hex.replace(/[^0-9a-fA-F]/g, '');
  if (sanitized.length > 6) {
    sanitized = sanitized.substring(0, 6);
  }
  if (sanitized.length === 3) {
    sanitized = sanitized.split('').map(char => char + char).join('');
  }
  return `#${sanitized.padEnd(6, '0').substring(0,6)}`;
};


export default function TextToolPanel() {
  const { addCanvasText, selectedCanvasTextId, canvasTexts, updateCanvasText } = useUploads();
  const [textValue, setTextValue] = useState('');

  const selectedText = canvasTexts.find(t => t.id === selectedCanvasTextId);

  // Local state for controls, synced with selectedText
  const [currentStyle, setCurrentStyle] = useState<Partial<CanvasText>>({});

  useEffect(() => {
    if (selectedText) {
      setCurrentStyle({
        fontFamily: selectedText.fontFamily,
        fontSize: selectedText.fontSize,
        textTransform: selectedText.textTransform,
        fontWeight: selectedText.fontWeight,
        fontStyle: selectedText.fontStyle,
        textDecoration: selectedText.textDecoration,
        lineHeight: selectedText.lineHeight,
        letterSpacing: selectedText.letterSpacing,
        isArchText: selectedText.isArchText,
        color: selectedText.color,
        outlineEnabled: selectedText.outlineEnabled,
        outlineColor: selectedText.outlineColor,
        outlineWidth: selectedText.outlineWidth,
        shadowEnabled: selectedText.shadowEnabled,
        shadowColor: selectedText.shadowColor,
        shadowOffsetX: selectedText.shadowOffsetX,
        shadowOffsetY: selectedText.shadowOffsetY,
        shadowBlur: selectedText.shadowBlur,
        content: selectedText.content,
      });
      setTextValue(selectedText.content); // Also update the main textarea if a text is selected
    } else {
      // Reset or set to defaults if no text is selected
      setCurrentStyle({});
      // setTextValue(''); // Optionally clear the add text area too
    }
  }, [selectedText]);

  const handleStyleChange = useCallback(<K extends keyof CanvasText>(property: K, value: CanvasText[K]) => {
    if (selectedCanvasTextId) {
      updateCanvasText(selectedCanvasTextId, { [property]: value });
    }
    setCurrentStyle(prev => ({ ...prev, [property]: value }));
  }, [selectedCanvasTextId, updateCanvasText]);
  
  const handleBulkStyleChange = useCallback((updates: Partial<CanvasText>) => {
    if (selectedCanvasTextId) {
      updateCanvasText(selectedCanvasTextId, updates);
    }
    setCurrentStyle(prev => ({ ...prev, ...updates }));
  }, [selectedCanvasTextId, updateCanvasText]);


  const handleAddText = () => {
    if (textValue.trim()) {
      addCanvasText(textValue.trim());
      //setTextValue(''); // Clear textarea after adding, or not, based on preference
    }
  };
  
  const handleContentChange = (newContent: string) => {
    setTextValue(newContent); // Update local textValue for the "Add Text" area
    if (selectedCanvasTextId && selectedText) {
       handleStyleChange('content', newContent); // Update content of selected text
    }
  };

  const renderControls = () => (
    <ScrollArea className="flex-grow pr-2">
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['font-settings', 'color-settings']} className="w-full">
        {/* Font Settings */}
        <AccordionItem value="font-settings">
          <AccordionTrigger className="font-medium">
            <PilcrowIcon className="mr-2 h-4 w-4" /> Font Settings
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div>
              <Label htmlFor="fontFamilySelect" className="text-xs">Font Family</Label>
              <Select
                value={currentStyle.fontFamily || 'Arial, sans-serif'}
                onValueChange={(value) => handleStyleChange('fontFamily', value)}
              >
                <SelectTrigger id="fontFamilySelect">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {googleFonts.map((font) => (
                    <SelectItem key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="textTransform" className="text-xs">Case</Label>
                <Select
                  value={currentStyle.textTransform || 'none'}
                  onValueChange={(value: 'none' | 'uppercase' | 'lowercase') => handleStyleChange('textTransform', value)}
                >
                  <SelectTrigger id="textTransform"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Normal</SelectItem>
                    <SelectItem value="uppercase"><CaseUpper className="inline h-4 w-4 mr-1"/>Uppercase</SelectItem>
                    <SelectItem value="lowercase"><CaseLower className="inline h-4 w-4 mr-1"/>Lowercase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                 <Label className="text-xs mb-1 block">Style</Label>
                 <ToggleGroup 
                    type="multiple" 
                    variant="outline" 
                    className="w-full grid grid-cols-3"
                    value={
                        [
                         currentStyle.fontWeight === 'bold' ? 'bold' : undefined,
                         currentStyle.fontStyle === 'italic' ? 'italic' : undefined,
                         currentStyle.textDecoration === 'underline' ? 'underline' : undefined,
                        ].filter(Boolean) as string[]
                    }
                    onValueChange={(styles) => {
                        handleBulkStyleChange({
                            fontWeight: styles.includes('bold') ? 'bold' : 'normal',
                            fontStyle: styles.includes('italic') ? 'italic' : 'normal',
                            textDecoration: styles.includes('underline') ? 'underline' : 'none',
                        });
                    }}
                 >
                    <ToggleGroupItem value="bold" aria-label="Toggle bold" className="h-9 w-full px-2"><Bold /></ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Toggle italic" className="h-9 w-full px-2"><Italic /></ToggleGroupItem>
                    <ToggleGroupItem value="underline" aria-label="Toggle underline" className="h-9 w-full px-2"><Underline /></ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            
            <div>
              <Label htmlFor="fontSizeSlider" className="text-xs">Size: {currentStyle.fontSize?.toFixed(0) || 24}px</Label>
              <Slider
                id="fontSizeSlider"
                min={8} max={128} step={1}
                defaultValue={[24]}
                value={[currentStyle.fontSize || 24]}
                onValueChange={([value]) => handleStyleChange('fontSize', value)}
              />
            </div>
            <div>
              <Label htmlFor="lineHeightSlider" className="text-xs">Line Height: {(currentStyle.lineHeight || 1.2).toFixed(1)}</Label>
              <Slider
                id="lineHeightSlider"
                min={0.5} max={3} step={0.1}
                defaultValue={[1.2]}
                value={[currentStyle.lineHeight || 1.2]}
                onValueChange={([value]) => handleStyleChange('lineHeight', value)}
              />
            </div>
            <div>
              <Label htmlFor="letterSpacingSlider" className="text-xs">Letter Spacing: {currentStyle.letterSpacing?.toFixed(1) || 0}px</Label>
              <Slider
                id="letterSpacingSlider"
                min={-5} max={20} step={0.5}
                defaultValue={[0]}
                value={[currentStyle.letterSpacing || 0]}
                onValueChange={([value]) => handleStyleChange('letterSpacing', value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="archTextSwitch"
                checked={currentStyle.isArchText || false}
                onCheckedChange={(checked) => handleStyleChange('isArchText', checked)}
              />
              <Label htmlFor="archTextSwitch" className="text-xs">Arch Text (Visual Only)</Label>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Color Settings */}
        <AccordionItem value="color-settings">
          <AccordionTrigger className="font-medium">
            <PaletteIcon className="mr-2 h-4 w-4" /> Color Settings
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="textColorSwatch" className="text-xs">Text</Label>
              <Input
                type="color"
                id="textColorSwatch"
                className="h-8 w-10 p-1"
                value={currentStyle.color || '#333333'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
              />
              <Input
                id="textColorHex"
                className="h-8 text-xs"
                value={currentStyle.color || '#333333'}
                onChange={(e) => handleStyleChange('color', sanitizeHex(e.target.value))}
                onBlur={(e) => handleStyleChange('color', sanitizeHex(e.target.value))}
                maxLength={7}
              />
            </div>

            {/* Text Outline */}
            <Accordion type="single" collapsible className="w-full text-xs border-t pt-2">
              <AccordionItem value="text-outline" className="border-b-0">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center w-full">
                    <BaselineIcon className="mr-2 h-4 w-4" />
                    Text Outline
                    <Switch
                        id="outlineEnabledSwitch"
                        className="ml-auto scale-75"
                        checked={currentStyle.outlineEnabled || false}
                        onCheckedChange={(checked) => handleStyleChange('outlineEnabled', checked)}
                        onClick={(e) => e.stopPropagation()} // Prevent accordion toggle
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-1 pb-2">
                  {currentStyle.outlineEnabled && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="outlineColorSwatch" className="text-xs">Color</Label>
                        <Input type="color" id="outlineColorSwatch" className="h-8 w-10 p-1" value={currentStyle.outlineColor || '#000000'} onChange={(e) => handleStyleChange('outlineColor', e.target.value)}/>
                        <Input id="outlineColorHex" className="h-8 text-xs" value={currentStyle.outlineColor || '#000000'} 
                               onChange={(e) => handleStyleChange('outlineColor', sanitizeHex(e.target.value))}
                               onBlur={(e) => handleStyleChange('outlineColor', sanitizeHex(e.target.value))}
                               maxLength={7}/>
                      </div>
                      <div>
                        <Label htmlFor="outlineWidthSlider" className="text-xs">Width: {currentStyle.outlineWidth?.toFixed(1) || 0}px</Label>
                        <Slider id="outlineWidthSlider" min={0} max={10} step={0.5} defaultValue={[1]} value={[currentStyle.outlineWidth || 0]} onValueChange={([value]) => handleStyleChange('outlineWidth', value)}/>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Text Shadow */}
             <Accordion type="single" collapsible className="w-full text-xs border-t pt-2">
              <AccordionItem value="text-shadow" className="border-b-0">
                <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center w-full">
                        <ShadowIcon className="mr-2 h-4 w-4" />
                        Text Shadow
                        <Switch
                            id="shadowEnabledSwitch"
                            className="ml-auto scale-75"
                            checked={currentStyle.shadowEnabled || false}
                            onCheckedChange={(checked) => handleStyleChange('shadowEnabled', checked)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-1 pb-2">
                  {currentStyle.shadowEnabled && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="shadowColorSwatch" className="text-xs">Color</Label>
                        <Input type="color" id="shadowColorSwatch" className="h-8 w-10 p-1" value={currentStyle.shadowColor || '#000000'} onChange={(e) => handleStyleChange('shadowColor', e.target.value)}/>
                        <Input id="shadowColorHex" className="h-8 text-xs" value={currentStyle.shadowColor || '#000000'} 
                               onChange={(e) => handleStyleChange('shadowColor', sanitizeHex(e.target.value))}
                               onBlur={(e) => handleStyleChange('shadowColor', sanitizeHex(e.target.value))}
                               maxLength={7}/>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="shadowOffsetXSlider" className="text-xs">Offset X: {currentStyle.shadowOffsetX?.toFixed(0) || 0}px</Label>
                            <Slider id="shadowOffsetXSlider" min={-20} max={20} step={1} defaultValue={[2]} value={[currentStyle.shadowOffsetX || 0]} onValueChange={([value]) => handleStyleChange('shadowOffsetX', value)}/>
                        </div>
                        <div>
                            <Label htmlFor="shadowOffsetYSlider" className="text-xs">Offset Y: {currentStyle.shadowOffsetY?.toFixed(0) || 0}px</Label>
                            <Slider id="shadowOffsetYSlider" min={-20} max={20} step={1} defaultValue={[2]} value={[currentStyle.shadowOffsetY || 0]} onValueChange={([value]) => handleStyleChange('shadowOffsetY', value)}/>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="shadowBlurSlider" className="text-xs">Blur: {currentStyle.shadowBlur?.toFixed(0) || 0}px</Label>
                        <Slider id="shadowBlurSlider" min={0} max={30} step={1} defaultValue={[2]} value={[currentStyle.shadowBlur || 0]} onValueChange={([value]) => handleStyleChange('shadowBlur', value)}/>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
    </ScrollArea>
  );

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div>
        <Label htmlFor="textInput" className="text-sm font-medium">Text Content</Label>
        <Textarea
          id="textInput"
          value={textValue}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Enter text here..."
          rows={3}
          className="bg-background mt-1"
        />
      </div>
      {!selectedCanvasTextId && (
        <Button onClick={handleAddText} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Type className="mr-2 h-4 w-4" />
          Add Text to Canvas
        </Button>
      )}
      
      {selectedCanvasTextId ? renderControls() : (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-md bg-muted/20 mt-4">
            <Type className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Add text using the area above.</p>
            <p className="text-xs text-muted-foreground mt-1">Or select an existing text item on the canvas to edit its properties here.</p>
        </div>
      )}
    </div>
  );
}
