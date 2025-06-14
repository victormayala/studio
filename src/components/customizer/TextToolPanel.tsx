
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Bold, Italic, Underline, CaseUpper, CaseLower, Type, Palette, Settings2, Pilcrow, TextCursorInput, Pipette, AlignJustify } from 'lucide-react';
import { useUploads, type CanvasText } from '@/contexts/UploadContext';
import { googleFonts } from '@/lib/google-fonts';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const sanitizeHex = (hex: string): string => {
  let sanitized = hex.replace(/[^0-9a-fA-F]/g, '');
  if (sanitized.startsWith('#')) {
    sanitized = sanitized.substring(1);
  }
  if (sanitized.length > 6) {
    sanitized = sanitized.substring(0, 6);
  }
  if (sanitized.length === 3) {
    sanitized = sanitized.split('').map(char => char + char).join('');
  }
  return `#${sanitized.padEnd(6, '0').substring(0,6)}`;
};

interface TextToolPanelProps {
  activeViewId: string | null;
}

const DEFAULT_FONT_FAMILY = googleFonts.find(f => f.name === 'Arial')?.family || 'Arial, sans-serif';
const initialTextToolPanelDefaultStyle: CanvasText = {
  id: '', 
  viewId: '', 
  content: 'New Text',
  x: 50,
  y: 50,
  rotation: 0,
  scale: 1,
  zIndex: 0,
  isLocked: false,
  itemType: 'text', 
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: 24,
  textTransform: 'none',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  lineHeight: 1.2,
  letterSpacing: 0,
  isArchText: false,
  color: '#333333',
  outlineEnabled: false,
  outlineColor: '#000000',
  outlineWidth: 0,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
};


export default function TextToolPanel({ activeViewId }: TextToolPanelProps) {
  const {
    addCanvasText,
    selectedCanvasTextId,
    canvasTexts,
    updateCanvasText,
    startInteractiveOperation,
    endInteractiveOperation
  } = useUploads();
  const { toast } = useToast();
  
  const selectedText = canvasTexts.find(t => t.id === selectedCanvasTextId && t.viewId === activeViewId);

  const [textValue, setTextValue] = useState(initialTextToolPanelDefaultStyle.content);
  const [currentStyle, setCurrentStyle] = useState<CanvasText>({...initialTextToolPanelDefaultStyle, viewId: activeViewId || ''});
  const [localTextColorHex, setLocalTextColorHex] = useState(initialTextToolPanelDefaultStyle.color);
  const [localOutlineColorHex, setLocalOutlineColorHex] = useState(initialTextToolPanelDefaultStyle.outlineColor);
  const [localShadowColorHex, setLocalShadowColorHex] = useState(initialTextToolPanelDefaultStyle.shadowColor);


  useEffect(() => {
    if (selectedText) {
      const newStyleCandidate = { ...initialTextToolPanelDefaultStyle, ...selectedText };
      setCurrentStyle(newStyleCandidate);
      setTextValue(selectedText.content);
      setLocalTextColorHex(selectedText.color);
      setLocalOutlineColorHex(selectedText.outlineColor);
      setLocalShadowColorHex(selectedText.shadowColor);
    } else {
      // Reset panel to defaults if no text is selected or activeViewId changes
      const resetStyle = { ...initialTextToolPanelDefaultStyle, viewId: activeViewId || '' };
      setCurrentStyle(resetStyle);
      setTextValue(initialTextToolPanelDefaultStyle.content);
      setLocalTextColorHex(resetStyle.color);
      setLocalOutlineColorHex(resetStyle.outlineColor);
      setLocalShadowColorHex(resetStyle.shadowColor);
    }
  }, [selectedText, activeViewId]);


  const handleStyleChange = useCallback(<K extends keyof CanvasText>(property: K, value: CanvasText[K]) => {
    setCurrentStyle(prev => {
      const newState = { ...prev, [property]: value };
      if (selectedCanvasTextId && selectedText) {
        updateCanvasText(selectedCanvasTextId, { [property]: value });
      }
      return newState;
    });
  }, [selectedCanvasTextId, updateCanvasText, selectedText]);

  const handleBulkStyleChange = useCallback((updates: Partial<CanvasText>) => {
    setCurrentStyle(prev => {
      const newState = { ...prev, ...updates };
      if (selectedCanvasTextId && selectedText) {
        updateCanvasText(selectedCanvasTextId, updates);
      }
      return newState;
    });
  }, [selectedCanvasTextId, updateCanvasText, selectedText]);


  const handleAddText = () => {
    if (!activeViewId) {
      toast({ title: "No Active View", description: "Please select a product view first.", variant: "info" });
      return;
    }
    const contentToAdd = textValue.trim() || "New Text"; // Uses the current textValue
    const styleForNewText: Partial<CanvasText> = {
      ...currentStyle, // currentStyle should have the typed content if no item is selected
      content: contentToAdd, // Explicitly set contentToAdd here
    };
    addCanvasText(contentToAdd, activeViewId, styleForNewText);
    
    // If no item was selected before adding, reset the input field and currentStyle.content for the next new text
    if (!selectedText) { 
        setTextValue(initialTextToolPanelDefaultStyle.content); 
        setCurrentStyle(prev => ({...prev, content: initialTextToolPanelDefaultStyle.content}));
    }
  };

  const handleContentChange = (newContent: string) => {
    setTextValue(newContent);
    if (selectedCanvasTextId && selectedText) {
       handleStyleChange('content', newContent);
    } else {
        // If no item is selected, update currentStyle.content so new items get this text
        setCurrentStyle(prev => ({...prev, content: newContent}));
    }
  };

  const toggleGroupValue = useMemo(() => {
    return [
      currentStyle.fontWeight === 'bold' ? 'bold' : undefined,
      currentStyle.fontStyle === 'italic' ? 'italic' : undefined,
      currentStyle.textDecoration === 'underline' ? 'underline' : undefined,
    ].filter(Boolean) as string[];
  }, [currentStyle.fontWeight, currentStyle.fontStyle, currentStyle.textDecoration]);


  const renderControls = () => (
    <div className="space-y-6 py-2">

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Pilcrow className="mr-2 h-4 w-4 text-secondary" />Font</h3>
        <div>
          <Label htmlFor="fontFamilySelect" className="text-xs mb-1 block">Font Family</Label>
          <Select
            value={currentStyle.fontFamily} 
            onValueChange={(value) => handleStyleChange('fontFamily', value)}
          >
            <SelectTrigger id="fontFamilySelect" className="h-9">
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
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
             <div>
             <Label className="text-xs mb-1 block">Style</Label>
             <ToggleGroup
                type="multiple"
                variant="outline"
                className="w-full grid grid-cols-3 gap-px"
                value={toggleGroupValue}
                onValueChange={(styles) => {
                    handleBulkStyleChange({
                        fontWeight: styles.includes('bold') ? 'bold' : 'normal',
                        fontStyle: styles.includes('italic') ? 'italic' : 'normal',
                        textDecoration: styles.includes('underline') ? 'underline' : 'none',
                    });
                }}
             >
                <ToggleGroupItem value="bold" aria-label="Toggle bold" className="h-9 w-full px-1 rounded-l-md rounded-r-none border-r-0"><Bold size={18}/></ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Toggle italic" className="h-9 w-full px-1 rounded-none border-r-0"><Italic size={18} /></ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Toggle underline" className="h-9 w-full px-1 rounded-r-md rounded-l-none"><Underline size={18}/></ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <Label htmlFor="textTransform" className="text-xs mb-1 block">Case</Label>
            <Select
              value={currentStyle.textTransform} 
              onValueChange={(value: 'none' | 'uppercase' | 'lowercase') => handleStyleChange('textTransform', value)}
            >
              <SelectTrigger id="textTransform" className="h-9"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Normal</SelectItem>
                <SelectItem value="uppercase"><CaseUpper className="inline h-4 w-4 mr-1"/>Uppercase</SelectItem>
                <SelectItem value="lowercase"><CaseLower className="inline h-4 w-4 mr-1"/>Lowercase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
            <div className="flex justify-between items-center">
                <Label htmlFor="fontSizeInput" className="text-xs">Font Size (px)</Label>
                <Input
                id="fontSizeInput"
                type="number"
                min={8} max={128} step={1}
                value={currentStyle.fontSize} 
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleStyleChange('fontSize', Math.max(8, Math.min(val, 128)));
                }}
                className="h-8 w-20 text-xs"
                />
            </div>
            <Slider
                id="fontSizeSlider"
                min={8} max={128} step={1}
                value={[currentStyle.fontSize]} 
                onValueChange={([value]) => handleStyleChange('fontSize', value)}
                onPointerDownCapture={startInteractiveOperation}
                onPointerUpCapture={endInteractiveOperation}
                className="mt-6" 
            />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center"><TextCursorInput className="mr-2 h-4 w-4 text-secondary" />Spacing</h3>
        <div className="mt-6 mb-6">
          <div className="flex justify-between items-center">
            <Label htmlFor="lineHeightInput" className="text-xs">Line Height</Label>
            <Input
              id="lineHeightInput"
              type="number"
              min={0.5} max={3} step={0.1}
              value={currentStyle.lineHeight} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleStyleChange('lineHeight', Math.max(0.5, Math.min(val, 3)));
              }}
              className="h-8 w-20 text-xs"
            />
          </div>
          <Slider
            id="lineHeightSlider"
            min={0.5} max={3} step={0.1}
            value={[currentStyle.lineHeight]} 
            onValueChange={([value]) => handleStyleChange('lineHeight', value)}
            onPointerDownCapture={startInteractiveOperation}
            onPointerUpCapture={endInteractiveOperation}
            className="mt-6"
          />
        </div>
        <div className="mt-6 mb-6">
          <div className="flex justify-between items-center">
            <Label htmlFor="letterSpacingInput" className="text-xs">Letter Spacing (px)</Label>
            <Input
              id="letterSpacingInput"
              type="number"
              min={-5} max={20} step={0.5}
              value={currentStyle.letterSpacing} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleStyleChange('letterSpacing', Math.max(-5, Math.min(val, 20)));
              }}
              className="h-8 w-20 text-xs"
            />
          </div>
          <Slider
            id="letterSpacingSlider"
            min={-5} max={20} step={0.5}
            value={[currentStyle.letterSpacing]} 
            onValueChange={([value]) => handleStyleChange('letterSpacing', value)}
            onPointerDownCapture={startInteractiveOperation}
            onPointerUpCapture={endInteractiveOperation}
            className="mt-6"
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Pipette className="mr-2 h-4 w-4 text-secondary" />Color</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="textColorSwatch" className="text-xs shrink-0">Fill Color</Label>
          <Input
            type="color"
            id="textColorSwatch"
            className="h-8 w-10 p-0.5 border-none rounded-md"
            value={localTextColorHex}
            onPointerDownCapture={startInteractiveOperation}
            onPointerUpCapture={endInteractiveOperation}
            onChange={(e) => {
                setLocalTextColorHex(e.target.value);
                handleStyleChange('color', e.target.value);
            }}
          />
          <Input
            id="textColorHex"
            className="h-8 text-xs flex-grow max-w-[100px]"
            value={localTextColorHex}
            onChange={(e) => setLocalTextColorHex(e.target.value)}
            onBlur={(e) => {
                const finalColor = sanitizeHex(e.target.value);
                setLocalTextColorHex(finalColor);
                handleStyleChange('color', finalColor);
            }}
            maxLength={7}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-2">
          Effects
        </h3>

        <div className="space-y-3 pt-2">
            <h4 className="text-xs font-medium text-foreground">Text Outline</h4>
            <div className="pt-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Label htmlFor="outlineColorSwatch" className="text-xs shrink-0">Outline Color</Label>
                <Input
                    type="color"
                    id="outlineColorSwatch"
                    className="h-8 w-10 p-0.5 border-none rounded-md"
                    value={localOutlineColorHex}
                    onPointerDownCapture={startInteractiveOperation}
                    onPointerUpCapture={endInteractiveOperation}
                    onChange={(e) => {
                        setLocalOutlineColorHex(e.target.value);
                        handleStyleChange('outlineColor', e.target.value);
                    }}
                    disabled={currentStyle.outlineWidth === 0 && !selectedText} 
                />
                <Input
                    id="outlineColorHex"
                    className="h-8 text-xs flex-grow max-w-[100px]"
                    value={localOutlineColorHex}
                    onChange={(e) => setLocalOutlineColorHex(e.target.value)}
                    onBlur={(e) => {
                        const finalColor = sanitizeHex(e.target.value);
                        setLocalOutlineColorHex(finalColor);
                        handleStyleChange('outlineColor', finalColor);
                    }}
                    maxLength={7}
                    disabled={currentStyle.outlineWidth === 0 && !selectedText} 
                />
              </div>
              <div className="mt-6 mb-6">
                <div className="flex justify-between items-center">
                  <Label htmlFor="outlineWidthInput" className="text-xs">Outline Width (px)</Label>
                  <Input
                    id="outlineWidthInput"
                    type="number"
                    min={0} max={10} step={0.5}
                    value={currentStyle.outlineWidth} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) handleStyleChange('outlineWidth', Math.max(0, Math.min(val, 10)));
                    }}
                    className="h-8 w-20 text-xs"
                  />
                </div>
                <Slider
                    id="outlineWidthSlider"
                    min={0} max={10} step={0.5}
                    value={[currentStyle.outlineWidth]} 
                    onValueChange={([value]) => handleStyleChange('outlineWidth', value)}
                    onPointerDownCapture={startInteractiveOperation}
                    onPointerUpCapture={endInteractiveOperation}
                    className="mt-6"
                />
              </div>
            </div>
        </div>

        <Separator className="my-3" />

        <div className="space-y-3 pt-2">
           <h4 className="text-xs font-medium text-foreground">Text Shadow</h4>
            <div className={cn("pt-2 space-y-3")}>
              <div className="flex items-center space-x-2">
                <Label htmlFor="shadowColorSwatch" className="text-xs shrink-0">Shadow Color</Label>
                <Input
                    type="color"
                    id="shadowColorSwatch"
                    className="h-8 w-10 p-0.5 border-none rounded-md"
                    value={localShadowColorHex}
                    onPointerDownCapture={startInteractiveOperation}
                    onPointerUpCapture={endInteractiveOperation}
                    onChange={(e) => {
                        setLocalShadowColorHex(e.target.value);
                        handleStyleChange('shadowColor', e.target.value);
                    }}
                     disabled={currentStyle.shadowOffsetX === 0 && currentStyle.shadowOffsetY === 0 && currentStyle.shadowBlur === 0 && !selectedText}
                />
                <Input
                    id="shadowColorHex"
                    className="h-8 text-xs flex-grow max-w-[100px]"
                    value={localShadowColorHex}
                    onChange={(e) => setLocalShadowColorHex(e.target.value)}
                    onBlur={(e) => {
                        const finalColor = sanitizeHex(e.target.value);
                        setLocalShadowColorHex(finalColor);
                        handleStyleChange('shadowColor', finalColor);
                    }}
                    maxLength={7}
                    disabled={currentStyle.shadowOffsetX === 0 && currentStyle.shadowOffsetY === 0 && currentStyle.shadowBlur === 0 && !selectedText}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="mt-6 mb-6">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="shadowOffsetXInput" className="text-xs">Shadow Offset X (px)</Label>
                        <Input
                            id="shadowOffsetXInput"
                            type="number"
                            min={-20} max={20} step={1}
                            value={currentStyle.shadowOffsetX} 
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) handleStyleChange('shadowOffsetX', Math.max(-20, Math.min(val, 20)));
                            }}
                            className="h-8 w-20 text-xs"
                        />
                    </div>
                    <Slider
                        id="shadowOffsetXSlider"
                        min={-20} max={20} step={1}
                        value={[currentStyle.shadowOffsetX]} 
                        onValueChange={([value]) => handleStyleChange('shadowOffsetX', value)}
                        onPointerDownCapture={startInteractiveOperation}
                        onPointerUpCapture={endInteractiveOperation}
                        className="mt-6"
                    />
                </div>
                <div className="mt-6 mb-6">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="shadowOffsetYInput" className="text-xs">Shadow Offset Y (px)</Label>
                        <Input
                            id="shadowOffsetYInput"
                            type="number"
                            min={-20} max={20} step={1}
                            value={currentStyle.shadowOffsetY} 
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) handleStyleChange('shadowOffsetY', Math.max(-20, Math.min(val, 20)));
                            }}
                            className="h-8 w-20 text-xs"
                        />
                    </div>
                    <Slider
                        id="shadowOffsetYSlider"
                        min={-20} max={20} step={1}
                        value={[currentStyle.shadowOffsetY]} 
                        onValueChange={([value]) => handleStyleChange('shadowOffsetY', value)}
                        onPointerDownCapture={startInteractiveOperation}
                        onPointerUpCapture={endInteractiveOperation}
                        className="mt-6"
                    />
                </div>
              </div>
              <div className="mt-6 mb-6">
                <div className="flex justify-between items-center">
                    <Label htmlFor="shadowBlurInput" className="text-xs">Shadow Blur (px)</Label>
                    <Input
                        id="shadowBlurInput"
                        type="number"
                        min={0} max={30} step={1}
                        value={currentStyle.shadowBlur} 
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) handleStyleChange('shadowBlur', Math.max(0, Math.min(val, 30)));
                        }}
                        className="h-8 w-20 text-xs"
                    />
                </div>
                <Slider
                    id="shadowBlurSlider"
                    min={0} max={30} step={1}
                    value={[currentStyle.shadowBlur]} 
                    onValueChange={([value]) => handleStyleChange('shadowBlur', value)}
                    onPointerDownCapture={startInteractiveOperation}
                    onPointerUpCapture={endInteractiveOperation}
                    className="mt-6"
                />
              </div>
            </div>
        </div>

        <Separator className="my-3" />
        <div className="flex items-center space-x-2 pt-1">
          <Switch
            id="archTextSwitch"
            className="scale-[0.8] origin-left"
            checked={currentStyle.isArchText} 
            onCheckedChange={(checked) => handleStyleChange('isArchText', checked)}
          />
          <Label htmlFor="archTextSwitch" className="text-xs">Arch Text <span className="text-muted-foreground/80 text-[10px]">(Visual Only)</span></Label>
        </div>
      </section>
    </div>
  );

  return (
    <div className="p-4 space-y-4"> 
      <div>
        <Label htmlFor="textInput" className="text-sm font-medium">Text Content</Label>
        <Textarea
          id="textInput"
          value={textValue}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Enter text here..."
          rows={3}
          className="bg-background mt-1 text-base"
        />
      </div>

      {selectedText ? (
        renderControls()
      ) : (
        <>
          <Button onClick={handleAddText} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
            <Type className="mr-2 h-4 w-4" />
            Add Text to Canvas
          </Button>
          {renderControls()}
        </>
      )}
      {selectedText && (
         <Button onClick={handleAddText} variant="outline" className="w-full mt-auto">
            <Type className="mr-2 h-4 w-4" />
            Add as New Text
        </Button>
      )}
    </div>
  );
}


    