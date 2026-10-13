import React, { useState } from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
import FileUpload from './components/FileUpload';
import FileDashboard from './components/FileDashboard';
import CustomFileBrowser from './components/CustomFileBrowser';  // Change this
import '@aws-amplify/ui-react/styles.css';
import './App.css';

Amplify.configure({
  ...awsconfig,
  
  Storage: {
    S3: {
      bucket: 'billing-output-amh',
      region: 'eu-west-2',
      identityPoolId: awsconfig.aws_cognito_identity_pool_id  // Use Cognito
    }
  }
});

function App({ signOut, user }) {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="App">
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Billing Processor App</h1>
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
            Processing Dashboard
          </button>
          {/*
          <button 
            onClick={() => setActiveTab('browse')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'browse' ? styles.activeNavButton : {})
            }}
          >
            📤 Upload Files
          </button>
          */}
        </nav>
      </header>
      
      <main style={styles.main}>
        {activeTab === 'upload' && <FileUpload />}
        {activeTab === 'dashboard' && <FileDashboard user={user} />}
        {/* NEW COMPONENT RENDER - ADDED HERE */}
        {activeTab === 'browse' && <CustomFileBrowser />}
      </main>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#122143',
    color: 'white',
    padding: '14px 0 0 0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px 14px 24px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '0.3px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '14px',
  },
  signOutButton: {
    backgroundColor: '#4FC3F7',
    color: 'white',
    border: 'none',
    padding: '9px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.3px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #dee2e6'
  },
  navButton: {
    padding: '16px 32px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6c757d',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: 500,
    letterSpacing: '0.2px',
    borderBottom: '3px solid transparent',
    transition: 'color 0.2s, border-color 0.2s'
  },
  activeNavButton: {
    color: '#122143',
    borderBottom: '3px solid #122143',
    fontWeight: 'bold'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  }
};

export default withAuthenticator(App);