import React, { useState } from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
import FileUpload from './components/FileUpload';
import FileDashboard from './components/FileDashboard';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

// Configure Amplify with AWS services
Amplify.configure(awsconfig);

function App({ signOut, user }) {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="App">
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>💳 Billing Processor</h1>
          <div style={styles.userInfo}>
            <span>Welcome, {user.username}</span>
            <button onClick={signOut} style={styles.signOutButton}>
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <nav style={styles.nav}>
          <button 
            onClick={() => setActiveTab('upload')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'upload' ? styles.activeNavButton : {})
            }}
          >
            📁 Upload File
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'dashboard' ? styles.activeNavButton : {})
            }}
          >
            📊 Processing Dashboard
          </button>
        </nav>
      </header>
      
      <main style={styles.main}>
        {activeTab === 'upload' && <FileUpload />}
        {activeTab === 'dashboard' && <FileDashboard user={user} />}
      </main>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#122143',
    color: 'white',
    padding: '10px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  signOutButton: {
    backgroundColor: '#4FC3F7',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #dee2e6'
  },
  navButton: {
    padding: '15px 30px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6c757d',
    cursor: 'pointer',
    fontSize: '16px',
    borderBottom: '3px solid transparent'
  },
  activeNavButton: {
    color: '#122143',
    borderBottom: '3px solid #122143',
    fontWeight: 'bold'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  }
};

export default withAuthenticator(App);