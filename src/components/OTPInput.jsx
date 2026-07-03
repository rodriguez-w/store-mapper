import React, { useRef, useEffect } from 'react';
import './OTPInput.css';

/**
 * OTPInput Component
 * Separate input boxes for each OTP digit with auto-fill on paste
 */
export default function OTPInput({ value, onChange, length = 6 }) {
  const inputsRef = useRef([]);

  const handleChange = (index, digit) => {
    // Only allow digits
    if (!/^[0-9]?$/.test(digit)) return;

    const newValue = value.split('');
    newValue[index] = digit;
    onChange(newValue.join(''));

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    const { key } = e;

    // Handle backspace
    if (key === 'Backspace') {
      e.preventDefault();
      const newValue = value.split('');
      newValue[index] = '';
      onChange(newValue.join(''));

      // Move to previous input on backspace
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
      return;
    }

    // Handle left arrow
    if (key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    // Handle right arrow
    if (key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, length);

    if (digits.length > 0) {
      onChange(digits.padEnd(length, ''));
      
      // Focus on the next empty input or the last input
      const nextIndex = Math.min(digits.length, length - 1);
      setTimeout(() => inputsRef.current[nextIndex]?.focus(), 0);
    }
  };

  return (
    <div className="otp-input-container">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength="1"
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="otp-digit-input"
          placeholder="•"
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
}
