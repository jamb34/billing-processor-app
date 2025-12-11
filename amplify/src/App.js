import React from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
import FileUpload from './components/FileUpload';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

// Configure Amplify with AWS services
Amplify.configure(awsconfig);

function App({ signOut, user }) {
  return (
    <div className="App">
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>📊 Billing Processor</h1>
          <div style={styles.userInfo}>
            <span>Welcome, {user.username}</span>
            <button onClick={signOut} style={styles.signOutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main style={styles.main}>
        <FileUpload />
      </main>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#232f3e',
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
    backgroundColor: '#ff9900',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  }
};

export default withAuthenticator(App);