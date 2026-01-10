import React from 'react';

type SourceType = 'cloudinary' | 'local' | 'unknown';

interface SourceIndicatorProps {
    src: string;
    className?: string;
}

export default function SourceIndicator({ src, className = '' }: SourceIndicatorProps) {
    let type: SourceType = 'unknown';

    if (src.includes('cloudinary.com')) {
        type = 'cloudinary';
    } else if (src.startsWith('/') || src.includes('localhost')) {
        type = 'local';
    }

    const getColor = () => {
        switch (type) {
            case 'cloudinary': return 'bg-green-500'; // Green for Cloudinary
            case 'local': return 'bg-blue-500'; // Blue for Local
            default: return 'bg-gray-400';
        }
    };

    // Toggle this to true to see the source indicators
    const DEBUG_INDICATORS = false;

    if (!DEBUG_INDICATORS) return null;

    return (
        <div
            className={`absolute z-[99] w-4 h-4 rounded-full shadow-lg border-2 border-white ${getColor()} ${className}`}
            title={`Source: ${type} (${src})`}
            style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
            }}
        />
    );
}
