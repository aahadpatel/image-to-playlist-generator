declare module "tesseract.js" {
  export interface LoggerMessage {
    jobId: string;
    status: string;
    progress: number;
  }

  export interface Worker {
    loadLanguage(lang: string): Promise<void>;
    initialize(lang: string): Promise<void>;
    terminate(): Promise<void>;
    recognize(file: File): Promise<{
      data: {
        text: string;
      };
    }>;
  }

  export function createWorker(options?: {
    logger?: (m: LoggerMessage) => void;
  }): Promise<Worker>;
}
