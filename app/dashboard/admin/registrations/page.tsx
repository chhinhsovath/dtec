"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Title,
  Group,
  Button,
  Stack,
  Paper,
  Text,
  Grid,
  Center,
  Loader,
  Badge,
  Textarea,
  Alert,
  Anchor,
  Divider,
} from '@mantine/core';

interface Registration {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  institution_name?: string;
  status: string;
  submitted_at?: string;
  current_step: number;
  id_document_url?: string;
  transcript_url?: string;
  proof_of_address_url?: string;
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, [filterStatus]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/registrations?status=${filterStatus}`);
      if (!response.ok) throw new Error("Failed to fetch registrations");
      const data = await response.json();
      setRegistrations(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      const response = await fetch(`/api/registrations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!response.ok) throw new Error("Failed to approve registration");

      setRegistrations(registrations.filter((r) => r.id !== id));
      setSelectedRegistration(null);
      alert("Registration approved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve registration");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setProcessingId(id);
      const response = await fetch(`/api/registrations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          rejection_reason: rejectionReason,
        }),
      });

      if (!response.ok) throw new Error("Failed to reject registration");

      setRegistrations(registrations.filter((r) => r.id !== id));
      setSelectedRegistration(null);
      setRejectionReason("");
      alert("Registration rejected!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject registration");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "completed":
        return "blue";
      default:
        return "gray";
    }
  };

  const getStepLabel = (step: number) => {
    const steps = {
      1: "Basic Info",
      2: "Contact Info",
      3: "Documents",
    };
    return steps[step as keyof typeof steps] || "Unknown";
  };

  return (
    <Stack gap={0} style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <div>
            <Title order={1} size="h1">Student Registration Management</Title>
            <Text c="gray.6" mt="xs">Review and approve student registration applications</Text>
          </div>

          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}

          <Group gap="xs">
            {["pending", "approved", "rejected", "completed"].map((status) => (
              <Button
                key={status}
                onClick={() => setFilterStatus(status)}
                variant={filterStatus === status ? "filled" : "default"}
                color="blue"
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </Group>

          {loading ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Loader size="lg" />
                <Text c="gray.6">Loading registrations...</Text>
              </Stack>
            </Center>
          ) : registrations.length === 0 ? (
            <Paper shadow="sm" p="xl" radius="md">
              <Center>
                <Text c="gray.6">No {filterStatus} registrations to display</Text>
              </Center>
            </Paper>
          ) : (
            <Grid>
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <Paper shadow="sm" radius="md">
                  <Stack gap={0}>
                    {registrations.map((registration) => (
                      <Paper
                        key={registration.id}
                        p="md"
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--mantine-color-gray-2)',
                          backgroundColor: selectedRegistration?.id === registration.id ? 'var(--mantine-color-blue-0)' : 'white'
                        }}
                        onClick={() => setSelectedRegistration(registration)}
                      >
                        <Group justify="space-between" align="flex-start">
                          <Stack gap="xs" flex={1}>
                            <Text fw={600}>
                              {registration.first_name} {registration.last_name}
                            </Text>
                            <Text size="sm" c="gray.6">{registration.email}</Text>
                            {registration.institution_name && (
                              <Text size="sm" c="gray.6">
                                📍 {registration.institution_name}
                              </Text>
                            )}
                            <Group gap="xs" mt="xs">
                              <Badge size="sm" color="gray" variant="light">
                                Step {registration.current_step}/3: {getStepLabel(registration.current_step)}
                              </Badge>
                              {registration.submitted_at && (
                                <Badge size="sm" color="blue" variant="light">
                                  Submitted {new Date(registration.submitted_at).toLocaleDateString()}
                                </Badge>
                              )}
                            </Group>
                          </Stack>
                          <Badge color={getStatusColor(registration.status)} variant="light">
                            {registration.status}
                          </Badge>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </Grid.Col>

              {selectedRegistration && (
                <Grid.Col span={{ base: 12, lg: 4 }}>
                  <Paper shadow="sm" p="lg" radius="md" pos="sticky" top={16}>
                    <Title order={2} size="h3" mb="lg">Application Details</Title>

                    <Stack gap="md">
                      <div>
                        <Text size="sm" c="gray.6">Full Name</Text>
                        <Text fw={600}>
                          {selectedRegistration.first_name} {selectedRegistration.last_name}
                        </Text>
                      </div>

                      <div>
                        <Text size="sm" c="gray.6">Email</Text>
                        <Text fw={600}>{selectedRegistration.email}</Text>
                      </div>

                      <div>
                        <Text size="sm" c="gray.6">Phone</Text>
                        <Text fw={600}>{selectedRegistration.phone_number || "N/A"}</Text>
                      </div>

                      <div>
                        <Text size="sm" c="gray.6">Institution</Text>
                        <Text fw={600}>{selectedRegistration.institution_name || "N/A"}</Text>
                      </div>

                      <div>
                        <Text size="sm" c="gray.6">Status</Text>
                        <Badge color={getStatusColor(selectedRegistration.status)} variant="light" mt="xs">
                          {selectedRegistration.status}
                        </Badge>
                      </div>

                      <Divider />

                      <div>
                        <Text size="sm" c="gray.6" mb="sm">Documents</Text>
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text size="sm" c="gray.6">ID Document:</Text>
                            {selectedRegistration.id_document_url ? (
                              <Anchor href={selectedRegistration.id_document_url} target="_blank" size="sm">
                                View
                              </Anchor>
                            ) : (
                              <Text size="sm" c="gray.5">Not uploaded</Text>
                            )}
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm" c="gray.6">Transcript:</Text>
                            {selectedRegistration.transcript_url ? (
                              <Anchor href={selectedRegistration.transcript_url} target="_blank" size="sm">
                                View
                              </Anchor>
                            ) : (
                              <Text size="sm" c="gray.5">Not uploaded</Text>
                            )}
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm" c="gray.6">Proof of Address:</Text>
                            {selectedRegistration.proof_of_address_url ? (
                              <Anchor href={selectedRegistration.proof_of_address_url} target="_blank" size="sm">
                                View
                              </Anchor>
                            ) : (
                              <Text size="sm" c="gray.5">Not uploaded</Text>
                            )}
                          </Group>
                        </Stack>
                      </div>

                      {selectedRegistration.status === "pending" && (
                        <>
                          <Divider />
                          <div>
                            <Text size="sm" fw={600} mb="sm">
                              Rejection Reason (if rejecting)
                            </Text>
                            <Textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Enter reason for rejection (if applicable)"
                              rows={3}
                            />
                          </div>

                          <Group gap="sm">
                            <Button
                              onClick={() => handleApprove(selectedRegistration.id)}
                              disabled={processingId === selectedRegistration.id}
                              color="green"
                              flex={1}
                            >
                              {processingId === selectedRegistration.id ? "Processing..." : "Approve"}
                            </Button>
                            <Button
                              onClick={() => handleReject(selectedRegistration.id)}
                              disabled={processingId === selectedRegistration.id}
                              color="red"
                              flex={1}
                            >
                              {processingId === selectedRegistration.id ? "Processing..." : "Reject"}
                            </Button>
                          </Group>
                        </>
                      )}
                    </Stack>
                  </Paper>
                </Grid.Col>
              )}
            </Grid>
          )}
        </Stack>
      </Container>
    </Stack>
  );
}
