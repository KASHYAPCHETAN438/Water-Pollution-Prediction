
export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

export interface PredictionParams {
  temperature: string;
  dissolvedOxygen: string;
  ph: string;
  conductivity: string;
  bod: string;
  nitrate: string;
  fecalColiform: string;
  totalColiform: string;
}
