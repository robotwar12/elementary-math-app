import React from 'react';
import { Problem } from '../types';

interface ProblemDisplayProps {
  problem: Problem;
  number: number;
}

/**
 * 문제 표시 컴포넌트
 * 문제 번호와 세로셈 형태의 수식을 표시합니다.
 */
export default function ProblemDisplay({ problem, number }: ProblemDisplayProps) {
  return (
    <>
      {/* 문제 번호 */}
      <div style={{ 
        position: 'absolute', 
        top: '-10px', 
        left: '-10px', 
        width: '30px', 
        height: '30px', 
        backgroundColor: '#4f46e5', 
        color: 'white', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '14px', 
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 10
      }}>
        {number}
      </div>

      {/* 세로셈 표시 */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        marginBottom: '1rem' 
      }}>
        <div style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          fontFamily: 'monospace',
          minWidth: '120px',
          position: 'relative'
        }}>
          {/* 첫 번째 숫자 - 오른쪽 정렬 */}
          <div style={{ 
            textAlign: 'right', 
            marginBottom: '0.5rem',
            lineHeight: '1.2'
          }}>
            {problem.num1}
          </div>
          
          {/* 두 번째 숫자와 연산자 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '0.5rem',
            lineHeight: '1.2'
          }}>
            <span style={{ 
              color: '#4f46e5', 
              marginRight: '1rem',
              minWidth: '20px',
              textAlign: 'left'
            }}>
              {problem.operator}
            </span>
            <span style={{ 
              flex: 1, 
              textAlign: 'right' 
            }}>
              {problem.num2}
            </span>
          </div>
          
          {/* 구분선 */}
          <div style={{ 
            borderBottom: '3px solid #374151', 
            width: '100%', 
            marginBottom: '0.5rem' 
          }}></div>
        </div>
      </div>
    </>
  );
}