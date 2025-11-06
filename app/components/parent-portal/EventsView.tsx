'use client';

import { useState, useEffect } from 'react';
import {
  IconArrowLeft,
  IconCalendar,
  IconMapPin,
  IconCircleCheck,
  IconClock,
  IconLoader,
  IconAlertCircle,
} from '@tabler/icons-react';
import Link from 'next/link';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Box,
  Center,
  Loader,
  ActionIcon,
} from '@mantine/core';

interface EventInvitation {
  invitation_id: number;
  event_id: number;
  event_name: string;
  event_date: string;
  event_location: string;
  description: string;
  rsvp_status: 'pending' | 'accepted' | 'declined' | 'maybe';
  number_of_attendees: number;
  student_name?: string;
}

interface EventsData {
  events: EventInvitation[];
  count: number;
  pending_count: number;
  status_counts: {
    pending: number;
    accepted: number;
    declined: number;
    maybe: number;
  };
}

const statusConfig = {
  pending: {
    color: 'yellow',
    icon: IconClock,
  },
  accepted: {
    color: 'green',
    icon: IconCircleCheck,
  },
  declined: {
    color: 'red',
    icon: IconAlertCircle,
  },
  maybe: {
    color: 'blue',
    icon: IconClock,
  },
};

export default function EventsView() {
  const [data, setData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        let url = '/api/parent-portal/events?upcomingOnly=' + showUpcoming;
        if (filter) {
          url += `&rsvpStatus=${filter}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to load events');
        }

        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filter, showUpcoming]);

  const handleRsvp = async (invitationId: number, status: string) => {
    try {
      const response = await fetch('/api/parent-portal/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          rsvpStatus: status,
          numberOfAttendees: 1,
        }),
      });

      if (response.ok) {
        // Refresh data
        const { searchParams } = new URL(`${window.location.origin}/dummy?upcomingOnly=${showUpcoming}${filter ? `&rsvpStatus=${filter}` : ''}`);
        await fetch(`/api/parent-portal/events${searchParams.toString() ? '?' + searchParams.toString() : ''}`).then((res) =>
          res.json().then((result) => {
            setData(result.data);
          })
        );
      }
    } catch (err) {
      console.error('Error updating RSVP:', err);
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="blue" />
          <Text c="dimmed">Loading events...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Paper p="xl" shadow="sm" withBorder style={{ maxWidth: 450 }}>
          <Stack align="center" gap="md">
            <IconAlertCircle size={48} color="var(--mantine-color-red-6)" />
            <Title order={2} c="red">Error</Title>
            <Text c="red">{error}</Text>
            <Button component="a" href="/parent-portal" color="red">
              Back to Dashboard
            </Button>
          </Stack>
        </Paper>
      </Center>
    );
  }

  if (!data) return null;

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Paper shadow="xs" p="xl" mb="lg">
        <Container size="xl">
          <Group gap="md" mb="md">
            <ActionIcon
              component="a"
              href="/parent-portal"
              variant="subtle"
              size="lg"
            >
              <IconArrowLeft size={24} />
            </ActionIcon>
            <Box>
              <Title order={1}>Events</Title>
              <Text c="dimmed" mt={4}>{data.pending_count} pending RSVPs</Text>
            </Box>
          </Group>
        </Container>
      </Paper>

      <Container size="xl" py="xl">
        {/* Filters */}
        <Paper shadow="sm" p="lg" mb="xl">
          <Stack gap="lg">
            <Box>
              <Text fw={500} size="sm" mb="xs">
                Show Events
              </Text>
              <Group gap="xs">
                <Button
                  variant={showUpcoming ? 'filled' : 'default'}
                  onClick={() => setShowUpcoming(true)}
                >
                  Upcoming
                </Button>
                <Button
                  variant={!showUpcoming ? 'filled' : 'default'}
                  onClick={() => setShowUpcoming(false)}
                >
                  All Events
                </Button>
              </Group>
            </Box>

            <Box>
              <Text fw={500} size="sm" mb="xs">
                Filter by RSVP Status
              </Text>
              <Group gap="xs">
                <Button
                  variant={filter === null ? 'filled' : 'default'}
                  onClick={() => setFilter(null)}
                >
                  All ({data.count})
                </Button>
                {Object.entries(data.status_counts).map(([status, count]) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'filled' : 'default'}
                    onClick={() => setFilter(status)}
                    tt="capitalize"
                  >
                    {status} ({count})
                  </Button>
                ))}
              </Group>
            </Box>
          </Stack>
        </Paper>

        {/* Events List */}
        {data.events.length === 0 ? (
          <Paper shadow="sm" p="xl">
            <Stack align="center" gap="md">
              <IconCalendar size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="lg">
                {filter ? 'No events with this status' : 'No upcoming events'}
              </Text>
            </Stack>
          </Paper>
        ) : (
          <Stack gap="md">
            {data.events.map((event) => {
              const status = event.rsvp_status as keyof typeof statusConfig;
              const config = statusConfig[status];
              const StatusIcon = config.icon;
              const eventDate = new Date(event.event_date);
              const isToday =
                eventDate.toDateString() === new Date().toDateString();
              const isUpcoming = eventDate > new Date();

              return (
                <Paper
                  key={event.invitation_id}
                  shadow="sm"
                  p="xl"
                  withBorder
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: `var(--mantine-color-${config.color}-6)`,
                  }}
                >
                  <Group justify="space-between" align="start" wrap="nowrap">
                    <Stack gap="md" style={{ flex: 1 }}>
                      <Group gap="sm" wrap="wrap">
                        <Title order={3}>{event.event_name}</Title>
                        <Badge color={config.color} tt="capitalize">
                          {status}
                        </Badge>
                        {isToday && (
                          <Badge color="blue">Today</Badge>
                        )}
                      </Group>

                      {/* Location */}
                      {event.event_location && (
                        <Group gap="xs">
                          <IconMapPin size={16} />
                          <Text size="sm">{event.event_location}</Text>
                        </Group>
                      )}

                      {/* Description */}
                      {event.description && (
                        <Text size="sm" c="dimmed">
                          {event.description}
                        </Text>
                      )}

                      {/* Date & Time */}
                      <Group gap="xs">
                        <IconCalendar size={16} />
                        <Text size="sm">
                          {eventDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </Group>

                      {/* Student Name */}
                      {event.student_name && (
                        <Text size="xs" c="dimmed">
                          Student: {event.student_name}
                        </Text>
                      )}
                    </Stack>

                    {/* RSVP Buttons */}
                    {status === 'pending' && isUpcoming && (
                      <Stack gap="xs">
                        <Button
                          onClick={() => handleRsvp(event.invitation_id, 'accepted')}
                          color="green"
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRsvp(event.invitation_id, 'declined')}
                          color="red"
                        >
                          Decline
                        </Button>
                      </Stack>
                    )}
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
