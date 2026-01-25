import { AbsoluteFill } from 'remotion';

export const HelloWorld: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 100,
        color: 'white',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      Hello Cleekzy 🎬
    </AbsoluteFill>
  );
};
