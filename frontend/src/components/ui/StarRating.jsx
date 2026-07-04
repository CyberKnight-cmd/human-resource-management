import React from 'react';

export default function StarRating({ rating = 4, maxStars = 5 }) {
  return (
    <div className="flex items-center gap-1 text-primary">
      {Array.from({ length: maxStars }).map((_, index) => {
        const isFilled = index < rating;
        return (
          <span 
            key={index} 
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: `"FILL" ${isFilled ? 1 : 0}` }}
          >
            star
          </span>
        );
      })}
    </div>
  );
}
