import { useMemo } from 'react';

export default function DataMiniMap({ data, onSectionClick }) {
  // Group data into "blocks" to visualize in the minimap
  const blocks = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const blockSize = Math.ceil(data.length / 50); // 50 visual segments
    const segments = [];
    
    for (let i = 0; i < data.length; i += blockSize) {
      const chunk = data.slice(i, i + blockSize);
      const counts = chunk.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, { added: 0, removed: 0, modified: 0 });
      
      // Determine dominant type for color
      let dominant = 'matched';
      if (counts.added > counts.removed && counts.added > counts.modified) dominant = 'added';
      else if (counts.removed > counts.added && counts.removed > counts.modified) dominant = 'removed';
      else if (counts.modified > 0) dominant = 'modified';
      
      segments.push({
        type: dominant,
        index: i,
        intensity: Math.max(counts.added, counts.removed, counts.modified) / blockSize
      });
    }
    return segments;
  }, [data]);

  const getColor = (type) => {
    switch (type) {
      case 'added': return 'bg-green-500';
      case 'removed': return 'bg-red-500';
      case 'modified': return 'bg-amber-500';
      default: return 'bg-[rgb(var(--bg-500))]';
    }
  };

  return (
    <div className="w-4 h-full bg-[rgb(var(--bg-800))] rounded-full overflow-hidden flex flex-col border border-[var(--border-color)] shadow-inner">
      {blocks.map((block, i) => (
        <div 
          key={i}
          className={`flex-1 w-full ${getColor(block.type)} opacity-60 hover:opacity-100 transition-opacity cursor-pointer`}
          title={`Section starting at row ${block.index}`}
          onClick={() => onSectionClick && onSectionClick(block.index)}
        />
      ))}
    </div>
  );
}
