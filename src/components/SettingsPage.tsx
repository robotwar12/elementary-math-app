'use client';

import { useState } from 'react';
import SettingsPanel from './SettingsPanel';

interface SettingsPageProps {
  firstNumberDigits: number;
  secondNumberDigits: number;
  totalPagesCount: number;
  palmRejection: boolean;
  onFirstNumberDigitsChange: (value: number) => void;
  onSecondNumberDigitsChange: (value: number) => void;
  onTotalPagesCountChange: (value: number) => void;
  onPalmRejectionChange: (enabled: boolean) => void;
  onGoBack: () => void;
}

export default function SettingsPage({
  firstNumberDigits,
  secondNumberDigits,
  totalPagesCount,
  palmRejection,
  onFirstNumberDigitsChange,
  onSecondNumberDigitsChange,
  onTotalPagesCountChange,
  onPalmRejectionChange,
  onGoBack
}: SettingsPageProps) {
  return (
    <div className="container">
      <div className="settings-page">
        {/* 헤더 */}
        <div className="header" style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <h1>
                <i className="ri-settings-line icon"></i>
                설정
              </h1>
              <p>문제 생성 조건을 설정해보세요</p>
            </div>
            <button
              onClick={onGoBack}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="ri-arrow-left-line"></i>
              돌아가기
            </button>
          </div>
        </div>

        {/* 설정 패널 */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <SettingsPanel
            showSettings={true}
            firstNumberDigits={firstNumberDigits}
            secondNumberDigits={secondNumberDigits}
            totalPagesCount={totalPagesCount}
            palmRejection={palmRejection}
            onFirstNumberDigitsChange={onFirstNumberDigitsChange}
            onSecondNumberDigitsChange={onSecondNumberDigitsChange}
            onTotalPagesCountChange={onTotalPagesCountChange}
            onPalmRejectionChange={onPalmRejectionChange}
            onToggleSettings={() => {}} // 빈 함수 (사용하지 않음)
          />
        </div>

        {/* 설명 섹션 */}
        <div style={{ 
          marginTop: '2rem',
          backgroundColor: '#f8fafc',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ 
            fontSize: '1.2rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            <i className="ri-information-line" style={{ marginRight: '0.5rem', color: '#4f46e5' }}></i>
            설정 안내
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#4f46e5', 
                borderRadius: '50%',
                marginTop: '0.5rem',
                flexShrink: 0
              }}></div>
              <div>
                <strong>첫 번째 숫자 자릿수:</strong> 덧셈의 첫 번째 숫자 자릿수를 설정합니다 (1~5자리)
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#4f46e5', 
                borderRadius: '50%',
                marginTop: '0.5rem',
                flexShrink: 0
              }}></div>
              <div>
                <strong>두 번째 숫자 자릿수:</strong> 덧셈의 두 번째 숫자 자릿수를 설정합니다 (1~5자리)
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#4f46e5', 
                borderRadius: '50%',
                marginTop: '0.5rem',
                flexShrink: 0
              }}></div>
              <div>
                <strong>총 페이지 수:</strong> 문제집의 전체 페이지 수를 설정합니다 (각 페이지당 6문제)
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            border: '1px solid #bfdbfe'
          }}>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="ri-lightbulb-line"></i>
              <strong>팁:</strong> 설정 변경 후 자동으로 새로운 문제가 생성됩니다
            </div>
          </div>
        </div>

        {/* 완료 버튼 */}
        <div style={{ 
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <button
            onClick={onGoBack}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <i className="ri-check-line"></i>
            설정 완료
          </button>
        </div>
      </div>
    </div>
  );
}
