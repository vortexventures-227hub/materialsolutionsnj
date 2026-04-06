'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  isLoading = false,
  placeholder = 'Ask David anything...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return;

    const messageToSend = value.trim();
    setValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSubmit(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow newline with Shift+Enter
        return;
      }
      // Send on Enter
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 items-end px-4 py-3 bg-bg-secondary border-t border-bg-tertiary">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
        className={cn(
          'flex-1 bg-bg-primary text-text-primary placeholder-text-secondary rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all',
          'max-h-[100px] scrollbar-thin scrollbar-thumb-bg-tertiary scrollbar-track-transparent',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      />

      <button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200',
          value.trim() && !isLoading
            ? 'bg-accent-primary text-bg-primary hover:shadow-lg hover:shadow-accent-primary/50 active:scale-95'
            : 'bg-bg-tertiary text-text-secondary cursor-not-allowed opacity-50'
        )}
        aria-label="Send message"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}
