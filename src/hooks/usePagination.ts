'use client';

import { useState, useMemo } from 'react';
import { Problem } from '../types';

interface UsePaginationProps {
  problems: Problem[];
  problemsPerPage: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  currentProblems: Problem[];
  startIndex: number;
  nextPage: () => void;
  prevPage: () => void;
  setCurrentPage: (page: number) => void;
  resetToFirstPage: () => void;
}

export default function usePagination({ 
  problems, 
  problemsPerPage 
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);

  // 총 페이지 수 계산
  const totalPages = useMemo(() => {
    return Math.ceil(problems.length / problemsPerPage);
  }, [problems.length, problemsPerPage]);

  // 현재 페이지의 시작 인덱스
  const startIndex = useMemo(() => {
    return (currentPage - 1) * problemsPerPage;
  }, [currentPage, problemsPerPage]);

  // 현재 페이지의 문제들
  const currentProblems = useMemo(() => {
    return problems.slice(startIndex, startIndex + problemsPerPage);
  }, [problems, startIndex, problemsPerPage]);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    currentProblems,
    startIndex,
    nextPage,
    prevPage,
    setCurrentPage,
    resetToFirstPage
  };
}