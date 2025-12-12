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
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Handle input changes with right-to-left typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remove any non-digit characters
    let digitsOnly = inputValue.replace(/\D/g, '');
    
    // Limit to 4 digits (mmss)
    if (digitsOnly.length > 4) {
      digitsOnly = digitsOnly.slice(-4);
    }
    
    // Format with right-to-left logic
    let formattedValue = "--:--";
    
    if (digitsOnly.length === 1) {
      // Single digit: --:0X
      formattedValue = `--:0${digitsOnly}`;
    } else if (digitsOnly.length === 2) {
      // Two digits: --:XX
      formattedValue = `--:${digitsOnly}`;
    } else if (digitsOnly.length === 3) {
      // Three digits: 0X:XX
      const minutes = digitsOnly[0];
      const seconds = digitsOnly.slice(1);
      formattedValue = `0${minutes}:${seconds}`;
    } else if (digitsOnly.length === 4) {
      // Four digits: XX:XX
      const minutes = digitsOnly.slice(0, 2);
      const seconds = digitsOnly.slice(2);
      formattedValue = `${minutes}:${seconds}`;
    }
    
    setDisplayValue(formattedValue);
    
    // Convert to seconds and call onChange
    const totalSeconds = timeDisplayToSeconds(formattedValue);
    onChange(totalSeconds);
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
    setDisplayValue(secondsToTimeDisplay(value));
  }, [value]);

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
