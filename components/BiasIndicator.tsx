import { PoliticalBias } from '@/lib/types';
import { getBiasLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BiasIndicatorProps {
    bias: PoliticalBias;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function BiasIndicator({
    bias,
    showLabel = true,
    size = 'md',
    className
}: BiasIndicatorProps) {
    const getBiasColorClass = (bias: PoliticalBias) => {
        switch (bias) {
            case 'pan-green':
                return 'bg-pan-green-500 text-white';
            case 'center':
                return 'bg-gray-500 text-white';
            case 'pan-blue':
                return 'bg-pan-blue-500 text-white';
        }
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    return (
        <span
            className={cn(
                'bias-badge',
                getBiasColorClass(bias),
                sizeClasses[size],
                className
            )}
            title={`政治傾向：${getBiasLabel(bias)}`}
        >
            {showLabel && getBiasLabel(bias)}
        </span>
    );
}
