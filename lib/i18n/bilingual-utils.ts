/**
 * Bilingual Utilities for Database Operations
 * Handles retrieval of localized content based on user language preference
 */

import { Language } from './i18n';

export interface BilingualField {
  en: string;
  km: string;
}

export interface BilingualRecord {
  id: string;
  name_en?: string;
  name_km?: string;
  description_en?: string;
  description_km?: string;
  [key: string]: any;
}

/**
 * Get the localized name from a bilingual record
 * @param record - Database record with bilingual fields
 * @param language - Target language (en or km)
 * @param fallbackField - Fallback field name if bilingual fields not found
 * @returns Localized name or fallback value
 */
export function getLocalizedName(
  record: BilingualRecord,
  language: Language = 'km',
  fallbackField: string = 'name'
): string {
  if (language === 'en' && record.name_en) {
    return record.name_en;
  }
  if (language === 'km' && record.name_km) {
    return record.name_km;
  }
  // Fallback to available language
  if (record.name_km) {
    return record.name_km;
  }
  if (record.name_en) {
    return record.name_en;
  }
  // Fallback to original name field
  return record[fallbackField] || '';
}

/**
 * Get the localized description from a bilingual record
 * @param record - Database record with bilingual fields
 * @param language - Target language (en or km)
 * @returns Localized description or empty string
 */
export function getLocalizedDescription(
  record: BilingualRecord,
  language: Language = 'km'
): string {
  if (language === 'en' && record.description_en) {
    return record.description_en;
  }
  if (language === 'km' && record.description_km) {
    return record.description_km;
  }
  // Fallback to available language
  if (record.description_km) {
    return record.description_km;
  }
  if (record.description_en) {
    return record.description_en;
  }
  return record.description || '';
}

/**
 * Transform database records to include only localized fields
 * Removes bilingual fields and keeps only the selected language
 * @param records - Array of database records
 * @param language - Target language
 * @returns Transformed records with localized content
 */
export function transformToLocalized(
  records: BilingualRecord[],
  language: Language = 'km'
): Array<{
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}> {
  return records.map((record) => ({
    ...record,
    name: getLocalizedName(record, language),
    description: getLocalizedDescription(record, language),
    // Remove bilingual fields to reduce payload
    name_en: undefined,
    name_km: undefined,
    description_en: undefined,
    description_km: undefined,
  }));
}

/**
 * Create a bilingual object from English and Khmer strings
 * @param en - English content
 * @param km - Khmer content
 * @returns Bilingual field object
 */
export function createBilingualField(en: string, km: string): BilingualField {
  return { en, km };
}

/**
 * Build SQL query to select localized name based on language preference
 * Useful for building efficient database queries
 * @param language - Target language
 * @param tableAlias - Table alias (e.g., 'c' for courses table)
 * @returns SQL CASE statement string
 */
export function buildLocalizedNameQuery(
  language: Language = 'km',
  tableAlias: string = ''
): string {
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (language === 'en') {
    return `CASE WHEN ${prefix}name_en IS NOT NULL THEN ${prefix}name_en ELSE ${prefix}name_km END as name`;
  }

  return `CASE WHEN ${prefix}name_km IS NOT NULL THEN ${prefix}name_km ELSE ${prefix}name_en END as name`;
}

/**
 * Extract bilingual fields from form submission
 * Converts flat form data to structured bilingual format
 * @param formData - Form submission data
 * @returns Object with bilingual field mappings
 */
export function extractBilingualFromForm(
  formData: Record<string, any>
): {
  name_en?: string;
  name_km?: string;
  description_en?: string;
  description_km?: string;
} {
  return {
    name_en: formData.name_en || formData.name,
    name_km: formData.name_km || formData.name,
    description_en: formData.description_en || formData.description,
    description_km: formData.description_km || formData.description,
  };
}

/**
 * Validate bilingual fields have at least one language filled
 * @param record - Record with bilingual fields
 * @returns True if at least one language field is filled
 */
export function isValidBilingualRecord(
  record: Partial<BilingualRecord>
): boolean {
  const hasName = !!(record.name_en || record.name_km);
  const hasDescription = !record.description_en && !record.description_km
    ? true // description is optional
    : !!(record.description_en || record.description_km);

  return hasName && hasDescription;
}

/**
 * Get missing translations for a record
 * Identifies which language fields need to be filled
 * @param record - Record with bilingual fields
 * @returns Array of missing language codes
 */
export function getMissingTranslations(
  record: Partial<BilingualRecord>
): Language[] {
  const missing: Language[] = [];

  if (!record.name_en) missing.push('en');
  if (!record.name_km) missing.push('km');

  return missing;
}

/**
 * Merge partial bilingual updates into existing record
 * Preserves existing values for empty fields
 * @param existing - Existing record
 * @param updates - Partial updates
 * @returns Merged record
 */
export function mergeBilingualUpdates(
  existing: BilingualRecord,
  updates: Partial<BilingualRecord>
): BilingualRecord {
  return {
    ...existing,
    name_en: updates.name_en || existing.name_en,
    name_km: updates.name_km || existing.name_km,
    description_en: updates.description_en || existing.description_en,
    description_km: updates.description_km || existing.description_km,
  };
}
