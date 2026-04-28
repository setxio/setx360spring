import React, { useState } from 'react';
import { Database, FileJson, Loader2, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { importBusinessBatch } from '../lib/admin';
import './AdminDataImport.css';

export const AdminDataImport: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (!Array.isArray(content)) throw new Error('Invalid format: Expected a JSON array.');

        setIsImporting(true);
        setResult(null);
        setProgress({ current: 0, total: content.length });

        const count = await importBusinessBatch(content, 'Jefferson'); // Default to Jefferson for now
        
        setResult({ success: true, count });
      } catch (err: any) {
        setResult({ success: false, error: err.message });
      } finally {
        setIsImporting(false);
        setProgress(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="admin-import-tool glass">
      <div className="tool-header">
        <div className="tool-icon">
          <Database size={24} color="var(--admin-gold)" />
        </div>
        <div className="tool-title">
          <h3>Regional Data Porter</h3>
          <p>Import SETXIO3 JSON partitions into the platform.</p>
        </div>
      </div>

      <div className="import-zone">
        {!isImporting && !result && (
          <div className="upload-placeholder">
            <Upload size={48} className="upload-icon" />
            <h4>Select a partition file</h4>
            <p>e.g. jefferson_batch_1.json</p>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileUpload} 
              id="batch-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="batch-upload" className="select-file-btn">
              <FileJson size={18} /> Browse Files
            </label>
          </div>
        )}

        {isImporting && (
          <div className="import-status">
            <Loader2 size={48} className="animate-spin text-primary" />
            <h4>Ingesting Records...</h4>
            {progress && (
              <div className="progress-bar-wrap">
                <div className="progress-bar" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                <span>{progress.current} / {progress.total} processed</span>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={`import-result ${result.success ? 'success' : 'error'}`}>
            {result.success ? (
              <>
                <CheckCircle size={48} />
                <h4>Import Complete!</h4>
                <p>Successfully ingested {result.count} business records into the marketplace.</p>
                <button className="reset-btn" onClick={() => setResult(null)}>Import Another</button>
              </>
            ) : (
              <>
                <AlertTriangle size={48} />
                <h4>Import Failed</h4>
                <p>{result.error}</p>
                <button className="reset-btn" onClick={() => setResult(null)}>Try Again</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="tool-footer">
        <AlertTriangle size={14} className="warning-icon" />
        <span>Warning: Importing massive datasets may take several minutes and impact database performance.</span>
      </div>
    </div>
  );
};
