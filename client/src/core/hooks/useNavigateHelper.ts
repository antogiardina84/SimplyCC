// client/src/core/hooks/useNavigateHelper.ts

import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useNavigateHelper = () => {
  const navigate = useRouterNavigate();

  const navigateTo = useCallback((path: string, options?: { replace?: boolean }) => {
    navigate(path, options);
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  return {
    navigateTo,
    goBack,
    goForward
  };
};