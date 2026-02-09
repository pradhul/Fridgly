declare module 'react-native-fast-tflite' {
  export function loadTensorflowModel(
    modelPath: string | number
  ): Promise<{
    run: (inputs: unknown[]) => Promise<unknown[]>;
    runSync?: (inputs: unknown[]) => unknown[];
  }>;
}
