import {
  getLocalizedName,
  getLocalizedDescription,
  transformToLocalized,
  isValidBilingualRecord,
  getMissingTranslations,
  mergeBilingualUpdates,
} from '@/lib/i18n/bilingual-utils';

describe('Bilingual Utilities', () => {
  describe('getLocalizedName', () => {
    it('should return English name when language is en', () => {
      const record = {
        id: '1',
        name_en: 'Course in English',
        name_km: 'វគ្គសិក្សា',
      };

      const result = getLocalizedName(record, 'en');
      expect(result).toBe('Course in English');
    });

    it('should return Khmer name when language is km', () => {
      const record = {
        id: '1',
        name_en: 'Course in English',
        name_km: 'វគ្គសិក្សា',
      };

      const result = getLocalizedName(record, 'km');
      expect(result).toBe('វគ្គសិក្សា');
    });

    it('should fallback to available language when requested language is not found', () => {
      const record = {
        id: '1',
        name_en: 'Course in English',
        name_km: undefined,
      };

      const result = getLocalizedName(record, 'km');
      expect(result).toBe('Course in English');
    });

    it('should return empty string when no names are available', () => {
      const record = {
        id: '1',
        name_en: undefined,
        name_km: undefined,
      };

      const result = getLocalizedName(record, 'en');
      expect(result).toBe('');
    });

    it('should use fallback field when bilingual fields are missing', () => {
      const record = {
        id: '1',
        name: 'Default Name',
      };

      const result = getLocalizedName(record, 'en', 'name');
      expect(result).toBe('Default Name');
    });
  });

  describe('getLocalizedDescription', () => {
    it('should return English description when language is en', () => {
      const record = {
        id: '1',
        description_en: 'English description',
        description_km: 'ការពិពណ៌នា',
      };

      const result = getLocalizedDescription(record, 'en');
      expect(result).toBe('English description');
    });

    it('should return Khmer description when language is km', () => {
      const record = {
        id: '1',
        description_en: 'English description',
        description_km: 'ការពិពណ៌នា',
      };

      const result = getLocalizedDescription(record, 'km');
      expect(result).toBe('ការពិពណ៌នា');
    });

    it('should return empty string when no descriptions available', () => {
      const record = {
        id: '1',
        description_en: undefined,
        description_km: undefined,
      };

      const result = getLocalizedDescription(record, 'en');
      expect(result).toBe('');
    });
  });

  describe('transformToLocalized', () => {
    it('should transform records to localized format', () => {
      const records = [
        {
          id: '1',
          name_en: 'Mathematics',
          name_km: 'គណិតវិទ្យា',
          description_en: 'Math course',
          description_km: 'វគ្គគណិតវិទ្យា',
        },
      ];

      const result = transformToLocalized(records, 'en');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mathematics');
      expect(result[0].description).toBe('Math course');
      expect(result[0].name_en).toBeUndefined();
      expect(result[0].name_km).toBeUndefined();
    });

    it('should use Khmer translations by default', () => {
      const records = [
        {
          id: '1',
          name_en: 'Science',
          name_km: 'វិទ្យាសាស្ត្រ',
        },
      ];

      const result = transformToLocalized(records, 'km');

      expect(result[0].name).toBe('វិទ្យាសាស្ត្រ');
    });

    it('should handle empty records array', () => {
      const result = transformToLocalized([], 'en');
      expect(result).toEqual([]);
    });
  });

  describe('isValidBilingualRecord', () => {
    it('should return true when name is present in at least one language', () => {
      const record = {
        id: '1',
        name_en: 'Name',
      };

      expect(isValidBilingualRecord(record)).toBe(true);
    });

    it('should return false when name is missing in all languages', () => {
      const record = {
        id: '1',
        description_en: 'Description',
      };

      expect(isValidBilingualRecord(record)).toBe(false);
    });

    it('should allow missing descriptions (descriptions are optional)', () => {
      const record = {
        id: '1',
        name_km: 'ឈ្មោះ',
      };

      expect(isValidBilingualRecord(record)).toBe(true);
    });

    it('should validate both name and description when both present', () => {
      const record = {
        id: '1',
        name_en: 'Name',
        description_en: 'Description',
      };

      expect(isValidBilingualRecord(record)).toBe(true);
    });
  });

  describe('getMissingTranslations', () => {
    it('should identify missing English translation', () => {
      const record = {
        id: '1',
        name_km: 'ឈ្មោះ',
      };

      const missing = getMissingTranslations(record);
      expect(missing).toContain('en');
    });

    it('should identify missing Khmer translation', () => {
      const record = {
        id: '1',
        name_en: 'Name',
      };

      const missing = getMissingTranslations(record);
      expect(missing).toContain('km');
    });

    it('should return empty array when all translations present', () => {
      const record = {
        id: '1',
        name_en: 'Name',
        name_km: 'ឈ្មោះ',
      };

      const missing = getMissingTranslations(record);
      expect(missing).toHaveLength(0);
    });
  });

  describe('mergeBilingualUpdates', () => {
    it('should merge updates while preserving existing values', () => {
      const existing = {
        id: '1',
        name_en: 'Original English',
        name_km: 'ដើម Khmer',
        description_en: 'Original description',
        description_km: 'ការពិពណ៌នាដើម',
      };

      const updates = {
        name_en: 'Updated English',
      };

      const result = mergeBilingualUpdates(existing, updates);

      expect(result.name_en).toBe('Updated English');
      expect(result.name_km).toBe('ដើម Khmer');
      expect(result.description_en).toBe('Original description');
      expect(result.description_km).toBe('ការពិពណ៌នាដើម');
    });

    it('should only update provided fields', () => {
      const existing = {
        id: '1',
        name_en: 'English',
        name_km: 'ខ្មែរ',
        description_en: 'Desc',
        description_km: undefined,
      };

      const updates = {
        description_km: 'ការពិពណ៌នា',
      };

      const result = mergeBilingualUpdates(existing, updates);

      expect(result.description_km).toBe('ការពិពណ៌នា');
      expect(result.name_en).toBe('English');
    });
  });
});
