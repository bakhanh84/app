'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CarProfile } from '@/lib/maintenance';
import { getCarImageUrl } from '@/lib/car-images';
import { createSpeechRecognizer, speakText, stopSpeaking, isSpeechRecognitionSupported } from '@/lib/speech';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarProfile | null;
  theme: 'pro' | 'friendly';
  customApiKey?: string;
  onSendMessage: (text: string) => Promise<string>;
}

export function VoiceCallModal({
  isOpen,
  onClose,
  car,
  theme,
  onSendMessage,
}: VoiceCallModalProps) {
  const [callStatus, setCallStatus] = useState<'connecting' | 'listening' | 'thinking' | 'speaking' | 'muted'>('connecting');
  const [transcript, setTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const recognizerRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isMountedRef = useRef(true);

  const brand = car?.brand || 'SparkGo';
  const model = car?.model || 'Ô tô';
  const year = car?.year || 2024;
  const carImage = getCarImageUrl(car?.brand || '', car?.model || '', car?.year || 2024);
  const personaName = theme === 'pro' ? 'Thầy Hùng (Chuyên Gia Xe)' : 'Minh (Bạn Thân)';

  // Start voice recognition loop
  const startListening = () => {
    if (!isSpeechRecognitionSupported() || isMicMuted) return;

    try {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }

      const recognizer = createSpeechRecognizer(
        (text, isFinal) => {
          if (!isMountedRef.current) return;
          setTranscript(text);

          if (isFinal && text.trim().length > 2) {
            handleUserSpokeFinalText(text.trim());
          }
        },
        (error) => {
          console.warn('Speech Recog Error:', error);
          if (callStatus === 'listening' && !isMicMuted && isMountedRef.current) {
            setTimeout(() => {
              if (isMountedRef.current && isListeningRef.current) startListening();
            }, 1000);
          }
        },
        () => {
          if (isListeningRef.current && callStatus === 'listening' && !isMicMuted && isMountedRef.current) {
            setTimeout(() => {
              if (isMountedRef.current && isListeningRef.current) startListening();
            }, 500);
          }
        }
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
        isListeningRef.current = true;
        setCallStatus('listening');
      }
    } catch (e) {
      console.error('Failed to start speech recognizer:', e);
    }
  };

  const handleUserSpokeFinalText = async (text: string) => {
    isListeningRef.current = false;
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch {}
    }

    setCallStatus('thinking');

    try {
      const response = await onSendMessage(text);
      setAiResponseText(response);

      if (!isMountedRef.current) return;

      if (isSpeakerMuted) {
        setCallStatus('listening');
        setTimeout(() => startListening(), 500);
      } else {
        setCallStatus('speaking');
        speakText(
          response,
          () => {
            if (!isMountedRef.current) return;
            setCallStatus('listening');
            startListening();
          },
          () => {
            if (!isMountedRef.current) return;
            setCallStatus('listening');
            startListening();
          }
        );
      }
    } catch (err) {
      console.error('Voice send error:', err);
      if (isMountedRef.current) {
        setCallStatus('listening');
        startListening();
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (isOpen) {
      setCallStatus('connecting');
      setTranscript('');
      setAiResponseText('');

      const timer = setTimeout(() => {
        setCallStatus('listening');
        const welcome = theme === 'pro'
          ? `Chào bạn! Tôi là Thầy Hùng đang ở đây sẵn sàng tư vấn cho chiếc ${brand} ${model} của bạn. Bạn cần hỗ trợ kỹ thuật gì nào?`
          : `Minh đây nè! Rất vui được gặp lại bạn và chiếc ${brand} ${model}. Có thắc mắc gì cần Minh giải đáp không?`;
        
        setAiResponseText(welcome);
        setCallStatus('speaking');

        speakText(
          welcome,
          () => {
            if (isMountedRef.current) {
              setCallStatus('listening');
              startListening();
            }
          },
          () => {
            if (isMountedRef.current) {
              setCallStatus('listening');
              startListening();
            }
          }
        );
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      stopSpeaking();
      isListeningRef.current = false;
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
    }

    return () => {
      isMountedRef.current = false;
      stopSpeaking();
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
    };
  }, [isOpen]);

  const toggleMic = () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      setCallStatus('listening');
      startListening();
    } else {
      setIsMicMuted(true);
      setCallStatus('muted');
      isListeningRef.current = false;
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
    }
  };

  const toggleSpeaker = () => {
    if (isSpeakerMuted) {
      setIsSpeakerMuted(false);
    } else {
      setIsSpeakerMuted(true);
      stopSpeaking();
    }
  };

  const handleEndCall = () => {
    stopSpeaking();
    isListeningRef.current = false;
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch {}
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 5, 8, 0.95)',
      backdropFilter: 'blur(16px)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 16px',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Bar: Car Spec & Title */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.3)', color: '#FFD700', fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}>
          🔴 CUỘC GỌI GIỌNG NÓI THỜI GIAN THỰC
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff 0%, #FFD700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {personaName}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginTop: 4 }}>
          Tư vấn kỹ thuật xe {brand} {model} ({year})
        </p>
      </div>

      {/* Center: Car Artwork Avatar & Waveforms */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 420 }}>
        <div style={{
          position: 'relative',
          width: 180,
          height: 180,
          borderRadius: '50%',
          padding: 8,
          background: callStatus === 'speaking'
            ? 'linear-gradient(135deg, #FFD700, #F59E0B)'
            : callStatus === 'listening'
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : 'rgba(255, 255, 255, 0.1)',
          boxShadow: callStatus === 'speaking'
            ? '0 0 40px rgba(255, 215, 0, 0.4)'
            : callStatus === 'listening'
              ? '0 0 40px rgba(16, 185, 129, 0.4)'
              : '0 0 20px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.5s ease',
          marginBottom: 30
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '3px solid #000' }}>
            <img src={carImage} alt={model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Animated Waveform Status */}
        <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          {callStatus === 'connecting' && (
            <span style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Đang kết nối cuộc gọi...</span>
          )}
          {callStatus === 'thinking' && (
            <span style={{ color: '#F59E0B', fontSize: '0.95rem', fontWeight: 600 }}>⚡ Đang suy nghĩ trả lời...</span>
          )}
          {callStatus === 'muted' && (
            <span style={{ color: '#EF4444', fontSize: '0.95rem', fontWeight: 600 }}>🔴 Đã tạm dừng Micro</span>
          )}
          {callStatus === 'listening' && (
            <>
              <div className="wave-bar" style={{ width: 4, height: 24, background: '#10B981', borderRadius: 2, animation: 'wave 1s infinite ease-in-out' }} />
              <div className="wave-bar" style={{ width: 4, height: 36, background: '#10B981', borderRadius: 2, animation: 'wave 1.2s infinite ease-in-out 0.2s' }} />
              <div className="wave-bar" style={{ width: 4, height: 16, background: '#10B981', borderRadius: 2, animation: 'wave 0.8s infinite ease-in-out 0.4s' }} />
              <span style={{ color: '#10B981', fontSize: '0.95rem', fontWeight: 700, marginLeft: 8 }}>Đang lắng nghe anh nói...</span>
            </>
          )}
          {callStatus === 'speaking' && (
            <>
              <div className="wave-bar" style={{ width: 4, height: 32, background: '#FFD700', borderRadius: 2, animation: 'wave 0.9s infinite ease-in-out' }} />
              <div className="wave-bar" style={{ width: 4, height: 44, background: '#FFD700', borderRadius: 2, animation: 'wave 1.1s infinite ease-in-out 0.15s' }} />
              <div className="wave-bar" style={{ width: 4, height: 24, background: '#FFD700', borderRadius: 2, animation: 'wave 0.7s infinite ease-in-out 0.3s' }} />
              <span style={{ color: '#FFD700', fontSize: '0.95rem', fontWeight: 700, marginLeft: 8 }}>AI đang phát biểu...</span>
            </>
          )}
        </div>

        {/* Live Transcript Display Box */}
        <div style={{
          width: '100%',
          minHeight: 80,
          maxHeight: 120,
          overflowY: 'auto',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          padding: 14,
          fontSize: '0.88rem',
          lineHeight: 1.5,
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center'
        }}>
          {transcript && (
            <div style={{ color: '#10B981', marginBottom: 4 }}>
              <strong>Bạn:</strong> {transcript}
            </div>
          )}
          {aiResponseText && (
            <div style={{ color: '#FFD700' }}>
              <strong>AI:</strong> {aiResponseText.slice(0, 160)}...
            </div>
          )}
          {!transcript && !aiResponseText && (
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              Hãy đặt câu hỏi bằng giọng nói (ví dụ: &quot;Kiểm tra lốp xe BMW 3 Series bao nhiêu kg?&quot;)
            </span>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
        {/* Mute Mic Button */}
        <button
          onClick={toggleMic}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            background: isMicMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          title={isMicMuted ? 'Bật Mic' : 'Tắt Mic'}
        >
          {isMicMuted ? '🎙️❌' : '🎙️'}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            border: 'none',
            background: '#EF4444',
            color: '#fff',
            fontSize: 28,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)',
            transition: 'all 0.2s ease'
          }}
          title="Tắt cuộc gọi"
        >
          📞
        </button>

        {/* Mute Speaker Button */}
        <button
          onClick={toggleSpeaker}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            background: isSpeakerMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          title={isSpeakerMuted ? 'Bật Loa' : 'Tắt Loa'}
        >
          {isSpeakerMuted ? '🔊❌' : '🔊'}
        </button>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
}
