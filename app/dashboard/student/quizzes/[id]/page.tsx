'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Paper,
  Stack,
  Loader,
  Center,
  Alert,
  Progress,
  Box,
  Radio,
  Textarea,
  TextInput,
  SimpleGrid,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconClock,
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
} from '@tabler/icons-react';

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  points: number;
  order_position: number;
  options?: QuizOption[];
}

interface QuizOption {
  id: string;
  option_text: string;
  is_correct?: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  quiz_type: string;
  total_questions: number;
  time_limit_minutes?: number;
  show_score_immediately: boolean;
  shuffle_questions: boolean;
}

interface AttemptData {
  id: string;
  start_time: string;
}

export default function StudentQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);

        const quizRes = await fetch(`/api/quizzes/${quizId}`);
        if (!quizRes.ok) {
          setError('Quiz not found');
          return;
        }

        const quizData = await quizRes.json();
        setQuiz(quizData.data);

        const questionsRes = await fetch(
          `/api/quiz-questions?quizId=${quizId}`
        );
        if (questionsRes.ok) {
          const questionsData = await questionsRes.json();
          let qs = questionsData.data || [];

          if (quizData.data.shuffle_questions) {
            qs = qs.sort(() => Math.random() - 0.5);
          }

          for (const question of qs) {
            const optionsRes = await fetch(
              `/api/quiz-answer-options?questionId=${question.id}`
            );
            if (optionsRes.ok) {
              const optionsData = await optionsRes.json();
              question.options = optionsData.data || [];
            }
          }

          setQuestions(qs);
        }

        const userId = localStorage.getItem('userId');
        const attemptRes = await fetch('/api/quiz-attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId,
            studentId: userId,
          }),
        });

        if (attemptRes.ok) {
          const attemptData = await attemptRes.json();
          setAttemptId(attemptData.data.id);

          if (quizData.data.time_limit_minutes) {
            setTimeLeft(quizData.data.time_limit_minutes * 60);
          }
        }
      } catch (err) {
        setError('Failed to load quiz');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          handleSubmit();
          return 0;
        }
        return (prev || 0) - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    });
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    try {
      const formattedAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId:
          typeof answers[q.id] === 'string' ? answers[q.id] : null,
        answerText: Array.isArray(answers[q.id])
          ? (answers[q.id] as string[]).join('\n')
          : (answers[q.id] as string),
      }));

      const res = await fetch(`/api/quiz-attempts/${attemptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.data);
        setSubmitted(true);
      } else {
        setError('Failed to submit quiz');
      }
    } catch (err) {
      setError('Error submitting quiz');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <Center h="100vh">
        <Text>Quiz not found</Text>
      </Center>
    );
  }

  if (submitted && results) {
    return (
      <Container size="md" py="xl">
        <Paper shadow="lg" p="xl">
          <Stack align="center">
            <Center
              w={64}
              h={64}
              bg="green"
              style={{ borderRadius: '50%' }}
            >
              <IconCheck size={48} color="white" />
            </Center>
            <Title order={2}>Quiz Submitted</Title>
            <Title order={3}>{quiz.title}</Title>

            {quiz.show_score_immediately && (
              <SimpleGrid cols={2} spacing="lg" w="100%">
                <Paper p="lg" bg="blue.0">
                  <Text size="sm" c="dimmed">
                    Your Score
                  </Text>
                  <Text size="48px" fw={700}>
                    {results.percentage_score?.toFixed(1)}%
                  </Text>
                </Paper>
                <Paper p="lg" bg="blue.0">
                  <Text size="sm" c="dimmed">
                    Points
                  </Text>
                  <Text size="48px" fw={700}>
                    {results.total_score}/{results.total_score}
                  </Text>
                </Paper>
              </SimpleGrid>
            )}

            <Alert
              color={results.passed ? 'green' : 'red'}
              w="100%"
            >
              <Text size="lg" fw={600}>
                {results.passed ? 'Passed' : 'Not Passed'}
              </Text>
            </Alert>

            <Stack gap="xs" w="100%">
              <Group>
                <Text fw={600}>Time Spent:</Text>
                <Text>
                  {Math.floor((results.time_spent_seconds || 0) / 60)} minutes
                </Text>
              </Group>
              <Group>
                <Text fw={600}>Submitted:</Text>
                <Text>{new Date(results.updated_at).toLocaleString()}</Text>
              </Group>
            </Stack>

            <Button
              onClick={() => router.push('/dashboard/student')}
              fullWidth
              size="lg"
              mt="md"
            >
              Back to Dashboard
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const question = questions[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / questions.length) * 100);

  return (
    <Container size="lg" py="lg">
      <Stack>
        {/* Header */}
        <Group justify="space-between">
          <Title order={2}>{quiz.title}</Title>
          {timeLeft !== null && (
            <Group gap="xs">
              <IconClock size={20} />
              <Text size="lg" fw={700}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </Text>
            </Group>
          )}
        </Group>

        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        {/* Progress */}
        <Box>
          <Progress value={progress} size="sm" mb="xs" />
          <Text size="sm" c="dimmed">
            Question {currentQuestion + 1} of {questions.length}
          </Text>
        </Box>

        {/* Question */}
        <Paper shadow="md" p="xl">
          <Stack>
            <Group justify="space-between">
              <Title order={3}>{question.question_text}</Title>
              <Text size="sm" c="dimmed">
                Points: {question.points}
              </Text>
            </Group>

            {/* Multiple Choice / True False */}
            {(question.question_type === 'multiple_choice' ||
              question.question_type === 'true_false') && (
              <Radio.Group
                value={answers[question.id] as string}
                onChange={(value) => handleAnswerChange(question.id, value)}
              >
                <Stack>
                  {question.options?.map((option) => (
                    <Paper
                      key={option.id}
                      p="md"
                      withBorder
                      style={{ cursor: 'pointer' }}
                    >
                      <Radio
                        value={option.id}
                        label={option.option_text}
                      />
                    </Paper>
                  ))}
                </Stack>
              </Radio.Group>
            )}

            {/* Short Answer */}
            {question.question_type === 'short_answer' && (
              <TextInput
                placeholder="Enter your answer..."
                value={(answers[question.id] as string) || ''}
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                size="lg"
              />
            )}

            {/* Essay */}
            {question.question_type === 'essay' && (
              <Textarea
                placeholder="Enter your essay answer..."
                value={(answers[question.id] as string) || ''}
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                minRows={8}
                size="lg"
              />
            )}
          </Stack>
        </Paper>

        {/* Navigation */}
        <Group justify="space-between">
          <Button
            variant="default"
            leftSection={<IconChevronLeft size={16} />}
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          {currentQuestion === questions.length - 1 ? (
            <Button
              color="green"
              leftSection={<IconCheck size={16} />}
              onClick={handleSubmit}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              rightSection={<IconChevronRight size={16} />}
              onClick={() =>
                setCurrentQuestion(
                  Math.min(questions.length - 1, currentQuestion + 1)
                )
              }
            >
              Next
            </Button>
          )}
        </Group>

        {/* Question Navigator */}
        <Paper p="lg" bg="gray.0">
          <Text size="sm" fw={600} mb="sm">
            Question Navigator
          </Text>
          <SimpleGrid cols={10} spacing="xs">
            {questions.map((q, idx) => (
              <Button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                variant={idx === currentQuestion ? 'filled' : answers[q.id] ? 'light' : 'default'}
                color={idx === currentQuestion ? 'blue' : answers[q.id] ? 'green' : 'gray'}
                size="sm"
                style={{ aspectRatio: '1' }}
              >
                {idx + 1}
              </Button>
            ))}
          </SimpleGrid>
        </Paper>
      </Stack>
    </Container>
  );
}
