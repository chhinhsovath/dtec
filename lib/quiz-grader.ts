/**
 * Quiz Auto-Grader
 * Handles automatic scoring for different question types
 */

export interface QuestionAnswer {
  questionId: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  selectedOptionId?: string;
  answerText?: string;
  maxPoints: number;
}

export interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface GradingResult {
  pointsEarned: number;
  isCorrect: boolean;
  feedback: string;
  requiresManualReview: boolean;
}

/**
 * Grade a multiple choice question
 */
export function gradeMultipleChoice(
  selectedOptionId: string,
  options: QuestionOption[],
  maxPoints: number
): GradingResult {
  const selectedOption = options.find((o) => o.id === selectedOptionId);

  if (!selectedOption) {
    return {
      pointsEarned: 0,
      isCorrect: false,
      feedback: 'No answer selected',
      requiresManualReview: false,
    };
  }

  return {
    pointsEarned: selectedOption.isCorrect ? maxPoints : 0,
    isCorrect: selectedOption.isCorrect,
    feedback: selectedOption.feedback || (selectedOption.isCorrect ? 'Correct' : 'Incorrect'),
    requiresManualReview: false,
  };
}

/**
 * Grade a true/false question
 */
export function gradeTrueFalse(
  selectedOptionId: string,
  options: QuestionOption[],
  maxPoints: number
): GradingResult {
  return gradeMultipleChoice(selectedOptionId, options, maxPoints);
}

/**
 * Grade short answer question (exact match only)
 */
export function gradeShortAnswer(
  studentAnswer: string,
  correctAnswers: string[],
  maxPoints: number
): GradingResult {
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return {
      pointsEarned: 0,
      isCorrect: false,
      feedback: 'Answer is blank',
      requiresManualReview: false,
    };
  }

  // Case-insensitive, trim whitespace
  const normalizedStudentAnswer = studentAnswer.trim().toLowerCase();
  const isCorrect = correctAnswers.some(
    (answer) => answer.toLowerCase().trim() === normalizedStudentAnswer
  );

  return {
    pointsEarned: isCorrect ? maxPoints : 0,
    isCorrect,
    feedback: isCorrect ? 'Correct answer' : 'Please check your answer',
    requiresManualReview: false,
  };
}

/**
 * Grade essay question (always requires manual review)
 */
export function gradeEssay(studentAnswer: string, maxPoints: number): GradingResult {
  const hasAnswer = studentAnswer && studentAnswer.trim().length > 0;

  return {
    pointsEarned: 0,
    isCorrect: false,
    feedback: hasAnswer ? 'Submitted for grading' : 'No answer provided',
    requiresManualReview: true,
  };
}

/**
 * Calculate overall quiz statistics
 */
export interface QuizStatistics {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  questionsAnswered: number;
  questionsUnanswered: number;
  totalQuestions: number;
  timeSpentSeconds: number;
}

export function calculateQuizStats(
  answers: Array<{
    questionId: string;
    pointsEarned: number;
    maxPoints: number;
    answered: boolean;
  }>,
  passingPercentage: number,
  timeSpentSeconds: number
): QuizStatistics {
  const totalScore = answers.reduce((sum, a) => sum + a.pointsEarned, 0);
  const maxScore = answers.reduce((sum, a) => sum + a.maxPoints, 0);
  const questionsAnswered = answers.filter((a) => a.answered).length;
  const questionsUnanswered = answers.length - questionsAnswered;
  const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    totalScore,
    maxScore,
    percentageScore,
    passed: percentageScore >= passingPercentage,
    questionsAnswered,
    questionsUnanswered,
    totalQuestions: answers.length,
    timeSpentSeconds,
  };
}

/**
 * Partial credit grading with keyword matching (for short answers)
 * More sophisticated than exact match
 */
export function gradeShortAnswerWithKeywords(
  studentAnswer: string,
  keywordGroups: string[][],
  maxPoints: number,
  requiredKeywords: number = 1
): GradingResult {
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return {
      pointsEarned: 0,
      isCorrect: false,
      feedback: 'Answer is blank',
      requiresManualReview: false,
    };
  }

  const normalizedAnswer = studentAnswer.toLowerCase();
  let matchedGroups = 0;

  // Check each keyword group
  for (const group of keywordGroups) {
    const hasKeywordFromGroup = group.some((keyword) =>
      normalizedAnswer.includes(keyword.toLowerCase())
    );
    if (hasKeywordFromGroup) {
      matchedGroups++;
    }
  }

  const meetsRequirement = matchedGroups >= requiredKeywords;
  const pointsEarned = meetsRequirement ? maxPoints : Math.floor((matchedGroups / keywordGroups.length) * maxPoints);

  return {
    pointsEarned,
    isCorrect: meetsRequirement,
    feedback: meetsRequirement
      ? 'Good answer'
      : `Partial credit: ${matchedGroups}/${keywordGroups.length} key points identified`,
    requiresManualReview: false,
  };
}

export default {
  gradeMultipleChoice,
  gradeTrueFalse,
  gradeShortAnswer,
  gradeEssay,
  gradeShortAnswerWithKeywords,
  calculateQuizStats,
};
