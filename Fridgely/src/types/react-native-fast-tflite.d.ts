declare module 'react-native-fast-tflite' {
  export function loadTensorflowModel(
    source: string | number | { url: string }
  ): Promise<{
    run: (inputs: unknown[]) => Promise<unknown[]>;
    runSync?: (inputs: unknown[]) => unknown[];
  }>;
}
