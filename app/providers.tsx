'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={{
        fontFamily: 'Hanuman, sans-serif',
        fontFamilyMonospace: 'Monaco, Courier New',
        headings: { fontFamily: 'Hanuman, sans-serif' },
        primaryColor: 'cyan',
        colors: {
          cyan: [
            '#f0f9ff',
            '#e0f2fe',
            '#bae6fd',
            '#7dd3fc',
            '#38bdf8',
            '#0ea5e9',
            '#0284c7',
            '#0369a1',
            '#075985',
            '#0c4a6e',
          ],
        },
      }}
    >
      <Notifications />
      {children}
    </MantineProvider>
  );
}
