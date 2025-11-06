#!/usr/bin/env node

/**
 * Automated Tailwind to Mantine Migration Script
 *
 * This script performs automatic replacements for common patterns:
 * - Replaces Lucide icons with Tabler icons
 * - Replaces Tailwind className attributes with Mantine components
 * - Updates component imports
 */

const fs = require('fs');
const path = require('path');

// Icon mappings from Lucide to Tabler
const iconMappings = {
  'GraduationCap': 'IconSchool',
  'LogOut': 'IconLogout',
  'BookOpen': 'IconBook',
  'Users': 'IconUsers',
  'FileText': 'IconFileText',
  'Calendar': 'IconCalendar',
  'BarChart': 'IconChartBar',
  'Settings': 'IconSettings',
  'Bell': 'IconBell',
  'Home': 'IconHome',
  'Plus': 'IconPlus',
  'Edit': 'IconEdit',
  'Trash': 'IconTrash',
  'Eye': 'IconEye',
  'Search': 'IconSearch',
  'Download': 'IconDownload',
  'Upload': 'IconUpload',
  'ChevronRight': 'IconChevronRight',
  'ChevronLeft': 'IconChevronLeft',
  'Check': 'IconCheck',
  'X': 'IconX',
  'AlertCircle': 'IconAlertCircle',
  'Info': 'IconInfoCircle',
  'Mail': 'IconMail',
  'Phone': 'IconPhone',
  'MapPin': 'IconMapPin',
  'Clock': 'IconClock',
  'Award': 'IconAward',
  'Star': 'IconStar',
  'Heart': 'IconHeart',
  'MessageCircle': 'IconMessage',
  'Send': 'IconSend',
  'Share': 'IconShare',
  'Filter': 'IconFilter',
  'RefreshCw': 'IconRefresh',
  'Save': 'IconDeviceFloppy',
  'Copy': 'IconCopy',
  'Clipboard': 'IconClipboard',
  'Link': 'IconLink',
  'ExternalLink': 'IconExternalLink',
  'ArrowRight': 'IconArrowRight',
  'ArrowLeft': 'IconArrowLeft'
};

// Common Mantine imports to add
const mantineImports = `import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  SimpleGrid,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Alert,
  Loader,
  Center,
  Table,
  Badge,
  ActionIcon,
  Modal,
  Anchor
} from '@mantine/core';`;

function replaceIconImports(content) {
  // Remove lucide-react import
  content = content.replace(/import\s+{[^}]+}\s+from\s+['"]lucide-react['"];?\n?/g, '');

  // Find all used Lucide icons in the file
  const usedIcons = new Set();
  Object.keys(iconMappings).forEach(lucideIcon => {
    if (content.includes(lucideIcon)) {
      usedIcons.add(iconMappings[lucideIcon]);
    }
  });

  // Add Tabler imports if icons are used
  if (usedIcons.size > 0) {
    const tablerImport = `import {\n  ${Array.from(usedIcons).join(',\n  ')}\n} from '@tabler/icons-react';\n`;

    // Add after other imports
    const importRegex = /(import\s+.*from\s+['"].*['"];?\n)+/;
    content = content.replace(importRegex, (match) => {
      return match + tablerImport;
    });
  }

  // Replace icon usages in JSX
  Object.keys(iconMappings).forEach(lucideIcon => {
    const tablerIcon = iconMappings[lucideIcon];
    const regex = new RegExp(`<${lucideIcon}([^>]*)/>`, 'g');
    content = content.replace(regex, `<${tablerIcon}$1 />`);
  });

  return content;
}

function addMantineImports(content) {
  // Check if Mantine is already imported
  if (content.includes("from '@mantine/core'")) {
    return content;
  }

  // Add after other imports
  const importRegex = /(import\s+.*from\s+['"].*['"];?\n)+/;
  content = content.replace(importRegex, (match) => {
    return match + mantineImports + '\n';
  });

  return content;
}

function replaceCommonPatterns(content) {
  // Replace common Tailwind patterns with Mantine
  const replacements = [
    // Loading states
    {
      pattern: /<div className="min-h-screen flex items-center justify-center">\s*<div className="text-xl">(.*?)<\/div>\s*<\/div>/gs,
      replacement: '<Center h="100vh"><Loader size="lg" /></Center>'
    },
    // Headers with shadow
    {
      pattern: /<header className="bg-white shadow-sm">/g,
      replacement: '<Paper shadow="xs" p="md" mb="xl">'
    },
    // Close header
    {
      pattern: /<\/header>/g,
      replacement: '</Paper>'
    },
    // Simple buttons
    {
      pattern: /className="([^"]*\bbg-primary-600[^"]*\btext-white[^"]*)"/g,
      replacement: 'className="mantine-button"'
    },
    // Grid layouts
    {
      pattern: /className="grid grid-cols-1 md:grid-cols-(\d+) gap-(\d+)"/g,
      replacement: (match, cols, gap) => {
        return `<SimpleGrid cols={{ base: 1, md: ${cols} }} gap="${gap}">`;
      }
    }
  ];

  replacements.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  return content;
}

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already using Mantine substantially
    if (content.includes('@mantine/core') && content.includes('@tabler/icons-react')) {
      console.log(`  ✓ Already migrated`);
      return;
    }

    // Apply transformations
    content = addMantineImports(content);
    content = replaceIconImports(content);
    content = replaceCommonPatterns(content);

    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Migrated successfully`);
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  }
}

function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDirectory(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

// Main execution
const appDir = path.join(__dirname, '../app');
console.log('Starting Tailwind to Mantine migration...\n');

walkDirectory(appDir, processFile);

console.log('\n✓ Migration complete!');
console.log('\nManual steps required:');
console.log('1. Review all migrated files');
console.log('2. Replace remaining className attributes with Mantine props');
console.log('3. Test all pages for layout and functionality');
console.log('4. Run: npm run build');
