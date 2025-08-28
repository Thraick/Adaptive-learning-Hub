
import { useState, useEffect, useCallback } from 'react';

// Polyfill for cross-browser compatibility
// Fix: Cast window to any to access vendor-prefixed speech recognition APIs
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
    }

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices.filter(v => v.lang.startsWith('en')));
            }
        };

        // Voices load asynchronously
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Initial call

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognition || isListening) return;
        setTranscript('');
        recognition.start();
        setIsListening(true);
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (!recognition || !isListening) return;
        recognition.stop();
        setIsListening(false);
    }, [recognition, isListening]);
    
    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event) => {
            const currentTranscript = event.results[0][0].transcript;
            setTranscript(currentTranscript);
            // NOTE: Removed stopListening() here to let the browser decide when speech ends.
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        return () => {
            recognition.abort();
        };
    }, [recognition, stopListening]);


    const speak = (text: string, voiceURI?: string | null) => {
        if (!window.speechSynthesis) return;
        
        // Cancel any previous speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        if (voiceURI) {
            const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }
        
        utterance.lang = 'en-US'; // Fallback language
        window.speechSynthesis.speak(utterance);
    };

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        speak,
        voices,
        hasSpeechSupport: !!recognition && !!window.speechSynthesis,
    };
};
