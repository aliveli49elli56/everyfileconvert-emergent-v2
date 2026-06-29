/**
 * lib/engine/index.ts
 * Engine exports - all conversion engines, processing engines, and auto-generation engines
 */

// Core Engines
export { aliasEngine, resolveAlias, getFormatFamily, areFormatsEquivalent, normalizeExtension } from './alias-engine';
export { familyEngine, getFormatFamilyDefinition, getFamilyCapabilities, areSameFormatFamily } from './family-engine';
export { mimeEngine, getMimeType, getExtensionFromMime, normalizeMimeType, detectMimeFromSignature, isImageMime, isVideoMime, isAudioMime } from './mime-engine';
export { signatureEngine, detectFileSignature, verifyFileSignature, getFileSignature, signatureReliability } from './signature-engine';
export { pipelineEngine, executePipeline, getPipelineStages } from './pipeline-engine';
export { validationEngine, validateFile, quickValidateFile, thoroughValidateFile, validateConversion, VALIDATION_ERRORS } from './validation-engine';
export { providerFallbackEngine, selectProvider, getProviderConfig, isProviderAvailable, getFallbackChain } from './provider-fallback-engine';
export type { ProviderType, ProviderFallbackConfig, ConversionRequest, ProviderSelectionResult } from './provider-fallback-engine';

// Auto-Generation Engines (Phase 3)
export { dynamicToolEngine, getTool, getAllTools, getToolsByType, getToolsByCategory, searchTools, getPopularTools } from './dynamic-tool-engine';
export type { DynamicTool, DynamicToolCapabilities, DynamicToolMetadata, DynamicRelatedTool, ToolGenerationOptions } from './dynamic-tool-engine';

export { categoryEngine, getCategory, getCategoryFromMime, getCategoryMetadata, getAllCategories } from './category-engine';
export type { CategoryMetadata } from './category-engine';

export { navigationEngine, getMainNavigation, getPopularNavigation, getBreadcrumbs } from './navigation-engine';
export type { NavItem, NavSection, BreadcrumbItem, NavigationContext } from './navigation-engine';

export { searchEngine, search, quickSearch, getSuggestions } from './search-engine';
export type { SearchDocument, SearchOptions, SearchResult } from './search-engine';

export { registryValidator, validateRegistries, isValidExtension, isValidSlug } from './registry-validator';
export type { ValidationSeverity, ValidationIssue, ValidationResult } from './registry-validator';

export { routeNormalizationEngine, normalizeRoute, getCanonicalRoute, generateConverterRoute, generateViewerRoute } from './route-normalization-engine';
export type { NormalizedRoute } from './route-normalization-engine';

// Page Data Generator (Phase 3.5)
export {
  getConversionPageData,
  getSingleFormatPageData,
  getViewerPageData,
  getRelatedToolsData,
  getAllConversionSlugs,
  getAllViewerSlugs,
  getNavigationCategories,
  getPopularToolsData,
} from './dynamic-tool-page-data';
export type { ToolPageData, RelatedToolData } from './dynamic-tool-page-data';

// Types
export type { FileSignature, SignaturePattern } from './signature-engine';
export type { PipelineStage, PipelineContext, PipelineResult, PipelineConfig } from './pipeline-engine';
export type { ValidationResult as ValidationResultType, ValidationError, ValidationWarning, ValidationInfo, ValidationOptions } from './validation-engine';
export type { FormatFamilyDefinition, FormatFamilyCapabilities } from './family-engine';

