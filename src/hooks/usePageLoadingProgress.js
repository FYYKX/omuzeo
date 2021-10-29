import { useState } from 'react';

export function usePageLoadingProgress() {
  const [isPageLoading, setIsPageLoading] = useState(true);

  return {
    isPageLoading,
    setIsPageLoading,
  };
}
