export interface FaceResult {
  status: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  action?: string;
  reason?: string;
}

export class FaceApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status?: number);
}

export class FaceCameraClient {
  challengeId: string | null;
  running: boolean;
  constructor(options: {
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement;
    onUpdate?: (update: { phase: string; action?: string; reason?: string }) => void;
    fetchFn?: typeof fetch;
  });
  start(input: { authSessionId: string; purpose: 'LOGIN' | 'ENROLL'; token?: string }): Promise<FaceResult>;
  readStatus(signal?: AbortSignal): Promise<FaceResult>;
  stop(): void;
}
