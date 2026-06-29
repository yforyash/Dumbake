import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Send, Paperclip, Download, FileText, Image as ImageIcon, Video, HelpCircle } from 'lucide-react';

export default function SupportChat() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const [complaint, setComplaint] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadComplaint();

    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [complaintId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadComplaint = async () => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to load complaint');
      const data = await response.ok ? await response.json() : null;
      if (data) {
        setComplaint(data);
        setMessages(data.messages || []);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        if (complaint && complaint.status !== data.status) {
          setComplaint(prev => ({ ...prev, status: data.status }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limitations based on extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    let limitBytes = 0;
    let limitLabel = '';

    if (ext === '.pptx') {
      limitBytes = 20 * 1024 * 1024;
      limitLabel = '20 MB';
    } else if (ext === '.pdf') {
      limitBytes = 10 * 1024 * 1024;
      limitLabel = '10 MB';
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      limitBytes = 5 * 1024 * 1024;
      limitLabel = '5 MB';
    } else if (ext === '.txt') {
      limitBytes = 2 * 1024 * 1024;
      limitLabel = '2 MB';
    } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
      limitBytes = 50 * 1024 * 1024;
      limitLabel = '50 MB';
    } else {
      setError('Unsupported file type. Allowed: PPTX, PDF, JPG, PNG, TXT, MP4, MOV, AVI, MKV');
      return;
    }

    if (file.size > limitBytes) {
      setError(`File size exceeds limit of ${limitLabel} for ${ext.toUpperCase()} files.`);
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    setUploading(true);
    setError('');

    try {
      let fileId = null;

      // 1. Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch('/api/userfiles/upload-raw', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'File upload failed');
        }

        const uploadData = await uploadRes.json();
        fileId = uploadData.fileId;
      }

      // 2. Send message
      const msgRes = await fetch(`/api/complaints/${complaintId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: text.trim() || (selectedFile ? `Shared an attachment: ${selectedFile.name}` : ''),
          fileId
        })
      });

      if (!msgRes.ok) throw new Error('Failed to send message');

      const newMsg = await msgRes.json();
      setMessages(prev => [...prev, newMsg]);
      setText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const renderFilePreview = (msg) => {
    if (!msg.file_id) return null;
    const isImage = ['image/jpeg', 'image/png'].includes(msg.file_type);
    const isVideo = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'].includes(msg.file_type);

    const downloadUrl = `/api/userfiles/download/${msg.file_id}`;

    if (isImage) {
      return (
        <div style={{ marginTop: '8px' }}>
          <img 
            src={downloadUrl} 
            alt={msg.file_name} 
            style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', display: 'block', objectFit: 'contain', cursor: 'pointer' }}
            onClick={() => window.open(downloadUrl, '_blank')}
          />
          <a href={downloadUrl} download style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '6px', color: 'inherit', textDecoration: 'underline' }}>
            <Download size={12} /> Download Image ({formatSize(msg.file_size)})
          </a>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div style={{ marginTop: '8px', maxWidth: '240px' }}>
          <video src={downloadUrl} controls style={{ width: '100%', borderRadius: '8px' }} />
          <a href={downloadUrl} download style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '6px', color: 'inherit', textDecoration: 'underline' }}>
            <Download size={12} /> Download Video ({formatSize(msg.file_size)})
          </a>
        </div>
      );
    }

    // PDF, PPTX, TXT, etc.
    return (
      <div style={{
        marginTop: '8px',
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: 'rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {msg.file_name?.endsWith('.pdf') ? <FileText size={20} /> : <FileText size={20} />}
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{msg.file_name}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{formatSize(msg.file_size)}</div>
          </div>
        </div>
        <a 
          href={downloadUrl} 
          download 
          style={{
            backgroundColor: 'var(--accent-color)',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Download size={14} />
        </a>
      </div>
    );
  };

  if (!complaint) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
        <p style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Loading support ticket details...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', paddingBottom: '1rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1.5px solid var(--border-color)',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => navigate('/order-history')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-color)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '850', fontFamily: 'var(--font-serif)', color: 'var(--accent-color)' }}>
              Ticket: {complaint.subject}
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Complaint ID: #{complaint.id} | Order Reference: #{complaint.order_id}
            </p>
          </div>
        </div>
        <span className={`status-pill status-${complaint.status.toLowerCase()}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
          {complaint.status}
        </span>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FFF2F3',
          color: '#D80027',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '0.8rem',
          fontWeight: '700',
          marginBottom: '10px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Messages History */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        borderRadius: '16px',
        backgroundColor: 'var(--primary-light)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '15px'
      }}>
        <div style={{ textAlign: 'center', margin: '10px 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
          🔒 Customer Support Conversation Log
        </div>

        {messages.map((msg) => {
          const isAdmin = (msg.sender_role || '').toLowerCase() === 'admin';
          const isMe = isAdmin ? (user.role === 'admin') : (user.role !== 'admin');

          return (
            <div 
              key={msg.id} 
              style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>
                {msg.sender_name} ({msg.sender_role})
              </span>
              <div style={{
                backgroundColor: isMe ? 'var(--accent-color)' : '#FFFFFF',
                color: isMe ? '#FFFFFF' : 'var(--text-color)',
                padding: '12px 16px',
                borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                boxShadow: 'var(--shadow-sm)',
                border: isMe ? 'none' : '1px solid var(--border-color)',
                lineHeight: '1.4',
                fontSize: '0.9rem'
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                {renderFilePreview(msg)}
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input Footer */}
      <form onSubmit={handleSendMessage} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {selectedFile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor: '#FAF6EE',
            border: '1px solid var(--primary-color)',
            fontSize: '0.8rem'
          }}>
            <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📎 {selectedFile.name} ({formatSize(selectedFile.size)})
            </span>
            <button 
              type="button" 
              onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              border: '1.5px solid var(--border-color)',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-color)',
              flexShrink: 0
            }}
            title="Attach file (PDF, PPT, Text, Image, Video)"
          >
            <Paperclip size={18} />
          </button>
          
          <input 
            type="text" 
            placeholder={uploading ? 'Uploading attachment...' : 'Type message here...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={uploading}
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '12px',
              border: '1.5px solid var(--border-color)',
              padding: '0 16px',
              fontSize: '0.9rem',
              backgroundColor: '#FFFFFF'
            }}
          />

          <button 
            type="submit" 
            disabled={uploading || (!text.trim() && !selectedFile)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-color)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Send size={18} />
          </button>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Supported files: Image (5MB) | Video (50MB) | PDF (10MB) | PPT (20MB) | TXT (2MB)
        </div>
      </form>
    </div>
  );
}
