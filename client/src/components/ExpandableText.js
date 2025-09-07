import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ExpandableText = ({ 
  text, 
  maxLength = 300, 
  className = "text-xs text-slate-300 leading-relaxed",
  showMoreText = "more",
  showLessText = "less"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > maxLength;
  const displayText = isExpanded || !shouldTruncate ? text : text.substring(0, maxLength);

  return (
    <div className={className}>
      <span>{displayText}</span>
      {shouldTruncate && (
        <>
          {!isExpanded && <span>...</span>}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-1 text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-1 text-xs font-medium"
          >
            {isExpanded ? (
              <>
                {showLessText}
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                {showMoreText}
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default ExpandableText;
