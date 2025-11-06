import km from './km';

export function useTranslation() {
  // Currently only supporting Khmer, but this can be extended for multi-language support
  const t = km;
  
  return { t };
}

export default useTranslation;
