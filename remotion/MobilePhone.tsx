import React from 'react';

interface MobilePhoneProps {
  children: React.ReactNode;
  scale?: number;
}

export const MobilePhone: React.FC<MobilePhoneProps> = ({ children, scale = 1 }) => {
  return (
    <div
      style={{
        width: 375,
        height: 812,
        background: '#000',
        borderRadius: 40,
        padding: 20,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 10px #1a1a1a, 0 0 0 12px #333',
        position: 'relative',
        transform: `scale(${scale})`,
        overflow: 'hidden',
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 150,
          height: 30,
          background: '#000',
          borderRadius: '0 0 20px 20px',
          zIndex: 100,
        }}
      />

      {/* Screen */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0B0F1A',
          borderRadius: 30,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
};
