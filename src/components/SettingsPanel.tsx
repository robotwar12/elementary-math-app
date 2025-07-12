'use client';

import { SettingsPanelProps } from '../types';

export default function SettingsPanel({
  showSettings,
  firstNumberDigits,
  secondNumberDigits,
  totalPagesCount,
  onFirstNumberDigitsChange,
  onSecondNumberDigitsChange,
  onTotalPagesCountChange,
  onToggleSettings
}: SettingsPanelProps) {
  if (!showSettings) return null;

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1rem'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.2rem' }}>
        <i className="ri-settings-3-line" style={{ marginRight: '0.5rem', color: '#4f46e5' }}></i>
        문제 설정
      </h3>

      {/* 페이지 수 설정 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
          <i className="ri-file-list-3-line" style={{ marginRight: '0.5rem', color: '#4f46e5' }}></i>
          총 페이지 수
        </label>
        <select
          value={totalPagesCount}
          onChange={(e) => onTotalPagesCountChange(parseInt(e.target.value))}
          style={{
            width: '200px',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value={1}>1페이지 (6문제)</option>
          <option value={2}>2페이지 (12문제)</option>
          <option value={3}>3페이지 (18문제)</option>
          <option value={4}>4페이지 (24문제)</option>
          <option value={5}>5페이지 (30문제)</option>
          <option value={6}>6페이지 (36문제)</option>
          <option value={7}>7페이지 (42문제)</option>
          <option value={8}>8페이지 (48문제)</option>
          <option value={9}>9페이지 (54문제)</option>
          <option value={10}>10페이지 (60문제)</option>
        </select>
      </div>

      <h4 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.1rem' }}>
        <i className="ri-number-1" style={{ marginRight: '0.5rem', color: '#4f46e5' }}></i>
        숫자 자릿수 설정
      </h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
            첫 번째 숫자 (위)
          </label>
          <select
            value={firstNumberDigits}
            onChange={(e) => onFirstNumberDigitsChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value={1}>1자리 (1~9)</option>
            <option value={2}>2자리 (10~99)</option>
            <option value={3}>3자리 (100~999)</option>
            <option value={4}>4자리 (1000~9999)</option>
            <option value={5}>5자리 (10000~99999)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
            두 번째 숫자 (아래)
          </label>
          <select
            value={secondNumberDigits}
            onChange={(e) => onSecondNumberDigitsChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value={1}>1자리 (1~9)</option>
            <option value={2}>2자리 (10~99)</option>
            <option value={3}>3자리 (100~999)</option>
            <option value={4}>4자리 (1000~9999)</option>
            <option value={5}>5자리 (10000~99999)</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '8px', fontSize: '0.9rem', color: '#1e40af' }}>
        <i className="ri-information-line" style={{ marginRight: '0.5rem' }}></i>
        설정을 변경하면 새로운 문제가 자동으로 생성됩니다.
      </div>
    </div>
  );
}
