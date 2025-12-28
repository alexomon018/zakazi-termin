"use client";

import { cn } from "@salonko/ui/utils";
import { forwardRef, useId, useRef } from "react";
import type { ComponentProps } from "react";

// Predefined brand color options
const PRESET_COLORS = [
  "#292929", // Dark gray (default light)
  "#f97316", // Orange
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Green
  "#84cc16", // Lime
  "#eab308", // Yellow
] as const;

const DARK_PRESET_COLORS = [
  "#fafafa", // Light gray (default dark)
  "#fdba74", // Light Orange
  "#fca5a5", // Light Red
  "#f9a8d4", // Light Pink
  "#c4b5fd", // Light Purple
  "#93c5fd", // Light Blue
  "#67e8f9", // Light Cyan
  "#6ee7b7", // Light Green
  "#bef264", // Light Lime
  "#fde047", // Light Yellow
] as const;

type ColorPickerProps = Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  isDarkMode?: boolean;
};

const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, value, onChange, isDarkMode = false, id, ...props }, ref) => {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const generatedId = useId();
    const inputId = id || generatedId;

    const presetColors = isDarkMode ? DARK_PRESET_COLORS : PRESET_COLORS;
    const allPresets: readonly string[] = [...PRESET_COLORS, ...DARK_PRESET_COLORS];
    const isCustomColor = !allPresets.some((c) => c.toLowerCase() === value.toLowerCase());

    const handleColorSwatchClick = (color: string) => {
      onChange(color);
    };

    const handleCustomColorClick = () => {
      colorInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className={cn("space-y-3", className)}>
        {/* Color swatches */}
        <div className="flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSwatchClick(color)}
              className={cn(
                "h-8 w-8 rounded-md border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                value.toLowerCase() === color.toLowerCase()
                  ? "border-ring ring-2 ring-ring ring-offset-2"
                  : "border-transparent"
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
          {/* Custom color button with native picker */}
          <div className="relative">
            <button
              type="button"
              onClick={handleCustomColorClick}
              className={cn(
                "flex justify-center items-center w-8 h-8 rounded-md border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isCustomColor
                  ? "ring-2 ring-offset-2 border-ring ring-ring"
                  : "border-dashed border-muted-foreground"
              )}
              style={{ backgroundColor: isCustomColor ? value : "transparent" }}
              aria-label="Pick custom color"
            >
              {!isCustomColor && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                  aria-hidden="true"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              )}
            </button>
            <input
              ref={colorInputRef}
              type="color"
              value={value}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              tabIndex={-1}
            />
          </div>
        </div>

        {/* Hex input */}
        <div className="flex gap-2 items-center">
          <input
            ref={ref}
            id={inputId}
            type="text"
            value={value}
            onChange={handleInputChange}
            className={cn(
              "flex px-3 py-1 w-full h-9 font-mono text-sm bg-transparent rounded-md border shadow-sm transition-colors border-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            )}
            placeholder={isDarkMode ? "#fafafa" : "#292929"}
            {...props}
          />
        </div>
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export { ColorPicker, PRESET_COLORS, DARK_PRESET_COLORS };
