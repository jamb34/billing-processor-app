import React from 'react';
import { downloadData } from 'aws-amplify/storage';

const FileDownload = ({ file, downloading, setDownloading, user }) => {
  
  const downloadFile = async (s3Key, fileName, fileId, fileStatus, approvalStatus) => {
    if (fileStatus === 'PROCESSED' && approvalStatus !== 'APPROVED') {
      alert('This file must be approved before downloading.');
      return;
    }

    try {
      setDownloading(prev => ({ ...prev, [fileId]: true }));
      
      console.log(`Downloading file from S3: ${s3Key}`);
      
      const result = await downloadData({
        key: s3Key
      }).result;
      
      const url = URL.createObjectURL(result.body);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`Successfully downloaded: ${fileName}`);
      
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setDownloading(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const downloadAllOutputs = async () => {
    if (!file.outputFiles || file.outputFiles.length === 0) {
      alert('No output files available for download');
      return;
    }

    if (file.status === 'PROCESSED' && file.approvalStatus !== 'APPROVED') {
      alert('This file must be approved before downloading outputs.');
      return;
    }

    try {
      setDownloading(prev => ({ ...prev, [file.id]: true }));
      
      for (const outputFile of file.outputFiles) {
        await downloadFile(
          outputFile.s3Key, 
          outputFile.fileName, 
          file.id, 
          file.status, 
          file.approvalStatus
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error('Batch download error:', error);
    } finally {
      setDownloading(prev => ({ ...prev, [file.id]: false }));
    }
  };

  const canDownload = () => {
    if (file.status !== 'PROCESSED') return false;
    return file.approvalStatus === 'APPROVED';
  };

  if (!file.outputFiles || file.outputFiles.length === 0) {
    return (
      <div style={styles.noOutputs}>
        No output files available for download
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h5>📁 Generated Outputs:</h5>
      <div style={styles.outputFiles}>
        {file.outputFiles.map((output, index) => (
          <div key={index} style={styles.outputFile}>
            <span style={styles.outputType}>{output.type}:</span>
            <span style={styles.outputName}>{output.fileName}</span>
            <button 
              onClick={() => downloadFile(
                output.s3Key, 
                output.fileName, 
                file.id, 
                file.status, 
                file.approvalStatus
              )}
              disabled={downloading[file.id] || !canDownload()}
              style={{
                ...styles.downloadButton,
                ...(!canDownload() ? styles.disabledButton : {})
              }}
              title={!canDownload() ? 'File must be approved to download' : 'Download this file'}
            >
              {downloading[file.id] ? '⏳' : '📥'}
            </button>
          </div>
        ))}
      </div>
      
      <button 
        onClick={downloadAllOutputs}
        disabled={downloading[file.id] || !canDownload()}
        style={{
          ...styles.downloadAllButton,
          ...(!canDownload() ? styles.disabledButton : {})
        }}
        title={!canDownload() ? 'File must be approved to download all outputs' : 'Download all output files'}
      >
        {downloading[file.id] ? 'Downloading...' : '📦 Download All Outputs'}
      </button>

      {canDownload() && (
        <div style={styles.downloadReady}>
          ✅ Ready for download
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  noOutputs: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic'
  },
  outputFiles: {
    margin: '10px 0'
  },
  outputFile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px',
    margin: '4px 0',
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '4px'
  },
  outputType: {
    fontWeight: 'bold',
    fontSize: '12px',
    color: '#122143',
    minWidth: '120px'
  },
  outputName: {
    flex: 1,
    margin: '0 10px',
    fontSize: '12px',
    wordBreak: 'break-all'
  },
  downloadButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: '1px solid #007bff',
    color: '#007bff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    minWidth: '40px'
  },
  downloadAllButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.6,
    borderColor: '#6c757d'
  },
  downloadReady: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    color: '#155724',
    fontSize: '13px',
    textAlign: 'center'
  }
};

export default FileDownload;