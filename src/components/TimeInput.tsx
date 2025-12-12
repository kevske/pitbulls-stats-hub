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

  // Handle input changes with left-to-right typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remove any non-digit characters and colons
    let digitsOnly = inputValue.replace(/\D/g, '');
    
    // Limit to 4 digits (mmss)
    if (digitsOnly.length > 4) {
      digitsOnly = digitsOnly.slice(0, 4);
    }
    
    // Format with left-to-right logic: 10min -> min -> 10sec -> sec
    let formattedValue = "--:--";
    
    if (digitsOnly.length === 1) {
      // Single digit: 1X:-- (10 minutes position)
      formattedValue = `${digitsOnly}X:--`;
    } else if (digitsOnly.length === 2) {
      // Two digits: XX:-- (complete minutes)
      formattedValue = `${digitsOnly}:--`;
    } else if (digitsOnly.length === 3) {
      // Three digits: XX:X-- (10 seconds position)
      const minutes = digitsOnly.slice(0, 2);
      const tenSeconds = digitsOnly[2];
      formattedValue = `${minutes}:${tenSeconds}X`;
    } else if (digitsOnly.length === 4) {
      // Four digits: XX:XX (complete time)
      const minutes = digitsOnly.slice(0, 2);
      const seconds = digitsOnly.slice(2);
      formattedValue = `${minutes}:${seconds}`;
    }
    
    setDisplayValue(formattedValue);
    
    // Only convert to seconds when we have complete input (4 digits only)
    if (digitsOnly.length === 4) {
      // Complete time entered
      const totalSeconds = timeDisplayToSeconds(formattedValue);
      onChange(totalSeconds);
    }
    // For partial input (1-3 digits), don't update the value yet
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
    const newDisplayValue = secondsToTimeDisplay(value);
    // Only update if the current display is a complete time or empty, not during active input
    if (!displayValue.includes('X') && displayValue !== newDisplayValue) {
      setDisplayValue(newDisplayValue);
    }
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
