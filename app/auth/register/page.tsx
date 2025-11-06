"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  Container,
  Paper,
  TextInput,
  Textarea,
  Select,
  Button,
  Title,
  Text,
  Group,
  Stack,
  Alert,
  Stepper,
  Center,
  Loader,
  SimpleGrid
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCheck } from '@tabler/icons-react';

interface RegistrationData {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  institutionId: string;
  idDocumentUrl: string;
  transcriptUrl: string;
  proofOfAddressUrl: string;
}

export default function RegisterPage() {
  const { t, language, changeLanguage, isLoaded } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phoneNumber: "",
    address: "",
    institutionId: "",
    idDocumentUrl: "",
    transcriptUrl: "",
    proofOfAddressUrl: "",
  });
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch("/api/institutions");
      if (!response.ok) throw new Error("Failed to fetch institutions");
      const data = await response.json();
      setInstitutions(data.data || []);
    } catch (err) {
      console.error("Error fetching institutions:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError(t('auth.register.fillRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('auth.register.invalidEmail'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.phoneNumber || !formData.address || !formData.institutionId) {
      setError(t('auth.register.fillRequired'));
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.idDocumentUrl || !formData.transcriptUrl) {
      setError(t('auth.register.documentsRequired'));
      return false;
    }
    return true;
  };

  const saveStep = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = { ...formData, currentStep: step + 1 };
      const url = registrationId ? "/api/registrations/" + registrationId : "/api/registrations";
      const method = registrationId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(t('messages.errorTryAgain'));
      const data = await response.json();

      if (!registrationId) {
        setRegistrationId(data.data.id);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;

    const saved = await saveStep();
    if (saved) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    try {
      setLoading(true);
      setError(null);

      const payload = { ...formData, status: "submitted" };

      const response = await fetch("/api/registrations/" + registrationId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(t('messages.errorTryAgain'));

      router.push("/auth/register/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while translations are loading
  if (!isLoaded) {
    return (
      <Center h="100vh" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #c7d2fe 100%)' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container
      size="md"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #c7d2fe 100%)',
        paddingTop: '2rem',
        paddingBottom: '2rem'
      }}
    >
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Title order={1}>{t('auth.register.title')}</Title>
            <Text c="dimmed">{t('auth.register.subtitle')}</Text>

            {/* Language Switcher */}
            <Group gap="xs">
              <Button
                variant={language === 'en' ? 'filled' : 'light'}
                size="xs"
                onClick={() => changeLanguage('en')}
              >
                EN
              </Button>
              <Button
                variant={language === 'km' ? 'filled' : 'light'}
                size="xs"
                onClick={() => changeLanguage('km')}
              >
                ខ្មែរ
              </Button>
            </Group>
          </Stack>

          <Button
            variant="light"
            onClick={() => router.push("/auth/register/status")}
          >
            {t('auth.register.checkStatus')}
          </Button>
        </Group>

        <Paper shadow="md" p="md" radius="md">
          <Stepper active={step} size="sm" iconSize={42}>
            <Stepper.Step label={t('auth.register.basicInfo')} />
            <Stepper.Step label={t('auth.register.contact')} />
            <Stepper.Step label={t('auth.register.documents')} />
          </Stepper>
        </Paper>

        {error && (
          <Alert color="red" title="Error" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        )}

        {step === 0 && (
          <Paper shadow="lg" p="xl" radius="md">
            <Stack gap="md">
              <Title order={2}>{t('auth.register.step1Title')}</Title>

              <TextInput
                label={t('auth.register.email')}
                placeholder="your@email.com"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                withAsterisk
              />

              <SimpleGrid cols={2}>
                <TextInput
                  placeholder={t('auth.register.firstNamePlaceholder')}
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <TextInput
                  placeholder={t('auth.register.lastNamePlaceholder')}
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </SimpleGrid>

              <TextInput
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
              />

              <Group justify="space-between" mt="md">
                <Button
                  variant="default"
                  onClick={() => router.push("/auth/login")}
                >
                  {t('auth.register.back')}
                </Button>
                <Button
                  onClick={handleNextStep}
                  loading={loading}
                >
                  {t('auth.register.next')}
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {step === 1 && (
          <Paper shadow="lg" p="xl" radius="md">
            <Stack gap="md">
              <Title order={2}>{t('auth.register.step2Title')}</Title>

              <TextInput
                type="tel"
                name="phoneNumber"
                placeholder={t('auth.register.phoneNumberPlaceholder')}
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />

              <Textarea
                name="address"
                placeholder={t('auth.register.addressPlaceholder')}
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                required
              />

              <Select
                name="institutionId"
                placeholder={t('auth.register.selectInstitution')}
                value={formData.institutionId}
                onChange={(value) => setFormData(prev => ({ ...prev, institutionId: value || '' }))}
                data={institutions.map(inst => ({
                  value: inst.id,
                  label: inst.name
                }))}
                required
              />

              <Group justify="space-between" mt="md">
                <Button
                  variant="default"
                  onClick={() => setStep(0)}
                >
                  {t('auth.register.previous')}
                </Button>
                <Button
                  onClick={handleNextStep}
                  loading={loading}
                >
                  {t('auth.register.next')}
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {step === 2 && (
          <Paper shadow="lg" p="xl" radius="md">
            <Stack gap="md">
              <Title order={2}>{t('auth.register.step3Title')}</Title>

              <TextInput
                name="idDocumentUrl"
                placeholder={t('auth.register.idDocumentPlaceholder')}
                value={formData.idDocumentUrl}
                onChange={handleInputChange}
                required
              />

              <TextInput
                name="transcriptUrl"
                placeholder={t('auth.register.transcriptPlaceholder')}
                value={formData.transcriptUrl}
                onChange={handleInputChange}
                required
              />

              <TextInput
                name="proofOfAddressUrl"
                placeholder={t('auth.register.proofOfAddressPlaceholder')}
                value={formData.proofOfAddressUrl}
                onChange={handleInputChange}
              />

              <Alert color="blue" title="Note">
                {t('auth.register.reviewNote')}
              </Alert>

              <Group justify="space-between" mt="md">
                <Button
                  variant="default"
                  onClick={() => setStep(1)}
                >
                  {t('auth.register.previous')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  color="green"
                  leftSection={<IconCheck size={16} />}
                >
                  {t('auth.register.submit')}
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
