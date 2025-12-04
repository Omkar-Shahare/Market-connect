import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    size?: number;
    showCount?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 16, showCount = true }) => {
    // Ensure rating is between 0 and 5
    const clampedRating = Math.max(0, Math.min(5, Number(rating) || 0));

    const fullStars = Math.floor(clampedRating);
    const hasHalfStar = clampedRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="flex items-center gap-1" title={`Rating: ${clampedRating} out of 5`}>
            <div className="flex">
                {[...Array(fullStars)].map((_, i) => (
                    <Star
                        key={`full-${i}`}
                        size={size}
                        className="text-yellow-400 fill-yellow-400"
                    />
                ))}
                {hasHalfStar && (
                    <div className="relative">
                        <StarHalf
                            size={size}
                            className="text-yellow-400 fill-yellow-400"
                        />
                    </div>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star
                        key={`empty-${i}`}
                        size={size}
                        className="text-gray-300 fill-gray-100"
                    />
                ))}
            </div>
            {showCount && (
                <span className="text-sm font-medium text-gray-700 ml-1">
                    {clampedRating.toFixed(1)}
                </span>
            )}
        </div>
    );
};

export default StarRating;
