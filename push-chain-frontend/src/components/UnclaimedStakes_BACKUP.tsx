// DIAGNOSTIC VERSION - For testing blank screen issue
import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';

const UnclaimedStakes: FC = () => {
  const navigate = useNavigate();
  

  return (
    <div style={{ 
      padding: '2rem', 
      background: '#000', 
      color: '#DA76EC', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <button 
        onClick={() => navigate('/')} 
        style={{
          background: '#DA76EC',
          color: '#000',
          padding: '1rem 2rem',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          marginBottom: '2rem'
        }}
      >
        ← Back to Home
      </button>
      
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        💰 Unclaimed Stakes (Test Mode)
      </h1>
      
      <div style={{ 
        background: 'rgba(218, 118, 236, 0.1)', 
        padding: '2rem', 
        borderRadius: '12px',
        border: '2px solid #DA76EC'
      }}>
        <h2>✅ Component is Rendering!</h2>
        <p style={{ marginTop: '1rem', lineHeight: '1.8' }}>
          If you can see this message, the component is working and the route is correct.
        </p>
        <p style={{ marginTop: '1rem', lineHeight: '1.8' }}>
          The blank screen was likely caused by a hook initialization issue.
        </p>
        
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <h3>Next Steps:</h3>
          <ol style={{ marginLeft: '1.5rem', marginTop: '1rem', lineHeight: '2' }}>
            <li>Check browser console for any errors</li>
            <li>Verify Push Chain wallet is connected</li>
            <li>Check backend is running on correct URL</li>
            <li>Restore the full component once this works</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default UnclaimedStakes;

