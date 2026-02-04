
export interface QuizQuestion {
  law: number;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
}

export interface ConversionState {
  isProcessing: boolean;
  error: string | null;
  result: QuizQuestion[] | null;
  fileName: string | null;
}
