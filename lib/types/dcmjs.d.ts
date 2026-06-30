/**
 * lib/types/dcmjs.d.ts
 * Minimal ambient declaration for dcmjs (no @types package on npm).
 */
declare module 'dcmjs' {
  const dcmjs: {
    data: {
      DicomMessage: {
        readFile(buffer: ArrayBuffer): DicomDataSet;
        write(dataset: DicomDataSet, metaInfo?: Record<string, unknown>): ArrayBuffer;
      };
      DicomMetaDictionary: {
        naturalizeDataset(dataset: Record<string, unknown>): Record<string, unknown>;
        denaturalizeDataset(dataset: Record<string, unknown>): Record<string, unknown>;
        denaturalizeDataset(dataset: Record<string, unknown>): Record<string, unknown>;
        uid(): string;
      };
    };
    utilities: Record<string, unknown>;
    adapters: Record<string, unknown>;
  };

  export interface DicomDataSet {
    dict: Record<string, unknown>;
    meta: Record<string, unknown>;
  }

  export default dcmjs;
}
