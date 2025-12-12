import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  value: number; // Total seconds
  onChange: (seconds: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

const TimeInput: React.FC<TimeInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "--:--", 
  className = "",
  id,
  disabled = false
}) => {
  const [displayValue, setDisplayValue] = useState("--:--");
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert seconds to mm:ss format
  const secondsToTimeDisplay = (totalSeconds: number): string => {
    if (totalSeconds === 0) return "--:--";
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Convert mm:ss string to total seconds
  const timeDisplayToSeconds = (timeStr: string): number => {
    if (!timeStr || timeStr === "--:--") return 0;
    
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    
    return minutes * 60 + seconds;
  };

  // Handle input changes - simple 4 digit input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    let inputValue = e.target.value;
    
    // Remove any non-digit characters
    let digitsOnly = inputValue.replace(/\D/g, '');
    
    // Limit to 4 digits (mmss)
    if (digitsOnly.length > 4) {
      digitsOnly = digitsOnly.slice(0, 4);
    }
    
    // Format as mm:ss when we have digits
    let formattedValue = "--:--";
    
    if (digitsOnly.length === 0) {
      formattedValue = "--:--";
    } else if (digitsOnly.length === 1) {
      // Single digit: X-:-- (first digit goes to tens place of minutes)
      formattedValue = `${digitsOnly}-:--`;
    } else if (digitsOnly.length === 2) {
      // Two digits: XX:--
      formattedValue = `${digitsOnly}:--`;
    } else if (digitsOnly.length === 3) {
      // Three digits: XX:X-
      const minutes = digitsOnly.slice(0, 2);
      const seconds = digitsOnly.slice(2);
      formattedValue = `${minutes}:${seconds}-`;
    } else if (digitsOnly.length === 4) {
      // Four digits: XX:XX
      const minutes = digitsOnly.slice(0, 2);
      const seconds = digitsOnly.slice(2);
      formattedValue = `${minutes}:${seconds}`;
    }
    
    setDisplayValue(formattedValue);
    
    // Convert to seconds when we have at least 1 digit
    if (digitsOnly.length > 0) {
      // For partial input, use 0 for missing parts
      let minutes = 0;
      let seconds = 0;
      
      if (digitsOnly.length === 1) {
        minutes = parseInt(digitsOnly) * 10; // First digit is tens place of minutes
        seconds = 0;
      } else if (digitsOnly.length === 2) {
        minutes = parseInt(digitsOnly);
        seconds = 0;
      } else if (digitsOnly.length === 3) {
        minutes = parseInt(digitsOnly.slice(0, 2));
        seconds = parseInt(digitsOnly.slice(2)) * 10; // 10 seconds position
      } else if (digitsOnly.length === 4) {
        minutes = parseInt(digitsOnly.slice(0, 2));
        seconds = parseInt(digitsOnly.slice(2));
      }
      
      const totalSeconds = minutes * 60 + seconds;
      onChange(totalSeconds);
    }
    
    // Set timeout to reset typing flag after user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Handle keypresses for better UX
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
      return;
    }
    
    // Only allow digits
    if (!/^\d$/.test(e.key) && !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Update display when value changes externally
  useEffect(() => {
    // Don't update while user is actively typing
    if (isTyping) return;
    
    const newDisplayValue = secondsToTimeDisplay(value);
    // Only update if the current display is different
    if (displayValue !== newDisplayValue) {
      setDisplayValue(newDisplayValue);
    }
  }, [value, isTyping]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      value={displayValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={`font-mono text-center ${className}`}
      style={{ width: '80px' }}
    />
  );
};

export default TimeInput;
