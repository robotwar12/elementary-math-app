'use client';

import { useState } from 'react';

interface UseAppSettingsReturn {
  firstNumberDigits: number;
  secondNumberDigits: number;
  totalPagesCount: number;
  showSettingsPage: boolean;
  setFirstNumberDigits: (digits: number) => void;
  setSecondNumberDigits: (digits: number) => void;
  setTotalPagesCount: (count: number) => void;
  setShowSettingsPage: (show: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export default function useAppSettings(): UseAppSettingsReturn {
  const [firstNumberDigits, setFirstNumberDigits] = useState(2);
  const [secondNumberDigits, setSecondNumberDigits] = useState(2);
  const [totalPagesCount, setTotalPagesCount] = useState(3);
  const [showSettingsPage, setShowSettingsPage] = useState(false);

  const openSettings = () => {
    setShowSettingsPage(true);
  };

  const closeSettings = () => {
    setShowSettingsPage(false);
  };

  return {
    firstNumberDigits,
    secondNumberDigits,
    totalPagesCount,
    showSettingsPage,
    setFirstNumberDigits,
    setSecondNumberDigits,
    setTotalPagesCount,
    setShowSettingsPage,
    openSettings,
    closeSettings
  };
}