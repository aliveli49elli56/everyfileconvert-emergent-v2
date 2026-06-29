/**
 * lib/registry/tool-registry.ts
 * Tool definitions registry
 */

import type { LucideIcon } from "lucide-react";
import type { ProcessingEngine } from '../types/formats';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type ToolCategory = "image" | "video" | "audio" | "pdf";

export interface SliderControl {
  type: "slider";
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  formatValue?: (v: number) => string;
}

export interface SelectControl {
  type: "select";
  id: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}

export interface ToggleControl {
  type: "toggle";
  id: string;
  label: string;
  defaultValue: boolean;
}

export interface AnglesControl {
  type: "angles";
  id: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}

export interface TimeRangeControl {
  type: "time-range";
  id: string;
}

export interface TextControl {
  type: "text";
  id: string;
  label: string;
  placeholder: string;
  inputType?: string;
}

export interface PageRangeControl {
  type: "page-range";
  id: string;
  label: string;
}

export type ControlDef =
  | SliderControl
  | SelectControl
  | ToggleControl
  | AnglesControl
  | TimeRangeControl
  | TextControl
  | PageRangeControl;

export interface ToolDefinition {
  id: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  category: ToolCategory;
  parentPath: string;
  parentLabel: string;
  accept: string;
  acceptLabel: string;
  engine: ProcessingEngine;
  gradient: string;
  accentColor: string;
  icon: LucideIcon;
  controls: ControlDef[];
  multiFile?: boolean;
  premiumOnly?: boolean;
}

// Registry is imported from the existing file to avoid duplication
// This file re-exports for the new architecture
import {
  TOOL_REGISTRY as _TOOL_REGISTRY,
  getToolById as _getToolById,
  getToolsByCategory as _getToolsByCategory,
  getAllToolIds as _getAllToolIds,
  ENGINE_LABELS,
} from '../tools/registry';

export const TOOL_REGISTRY = _TOOL_REGISTRY;
export const ENGINE_LABELS_EXPORT = ENGINE_LABELS;

// ---------------------------------------------------------------------------
// REGISTRY CLASS
// ---------------------------------------------------------------------------

class ToolRegistryClass {
  private toolMap: Map<string, ToolDefinition>;

  constructor() {
    this.toolMap = new Map(TOOL_REGISTRY.map(t => [t.id, t]));
  }

  get(id: string): ToolDefinition | undefined {
    return this.toolMap.get(id);
  }

  getAll(): ToolDefinition[] {
    return [...TOOL_REGISTRY];
  }

  getByCategory(category: ToolCategory): ToolDefinition[] {
    return TOOL_REGISTRY.filter(t => t.category === category);
  }

  getAllIds(): string[] {
    return TOOL_REGISTRY.map(t => t.id);
  }

  has(id: string): boolean {
    return this.toolMap.has(id);
  }
}

export const toolRegistry = new ToolRegistryClass();

// Re-export helper functions for compatibility
export const getToolById = _getToolById;
export const getToolsByCategory = _getToolsByCategory;
export const getAllToolIds = _getAllToolIds;
