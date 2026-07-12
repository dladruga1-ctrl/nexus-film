export interface Scene {
  scene: number;
  description: string;
  dialogue: string;
}

export interface Screenplay {
  title: string;
  scenes: Scene[];
}

export interface FilmRequestBody {
  idea: string;
}

export interface ApiErrorResponse {
  error: string;
}
