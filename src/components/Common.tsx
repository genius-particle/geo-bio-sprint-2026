import React from 'react';

// --- Reusable Loading Spinner ---

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    text, 
    className = '', 
    size = 'md' 
}) => {
  const sizeClasses = {
      sm: 'w-5 h-5 border-2',
      md: 'w-10 h-10 border-4',
      lg: 'w-16 h-16 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
        <div className={`${sizeClasses[size]} border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3`}></div>
        {text && <p className="text-slate-400 text-sm font-medium">{text}</p>}
    </div>
  );
};

// --- Reusable Empty State ---

interface EmptyStateProps {
    icon: React.ReactNode;
    message: string;
    subMessage?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    message,
    subMessage,
    action,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center h-full text-slate-400 animate-fade-in p-8 text-center ${className}`}>
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                {/* Clone icon to enforce size if needed, or rely on passed icon size */}
                <div className="opacity-80 scale-125">{icon}</div>
            </div>
            <h3 className="text-lg font-bold text-slate-500 mb-2">{message}</h3>
            {subMessage && <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">{subMessage}</p>}
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
};