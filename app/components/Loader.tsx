
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-400"></div>
        <p className="mt-4 text-lg text-gray-300 font-semibold">Generating Knowledge Graph...</p>
        <p className="text-sm text-gray-500">This may take a moment.</p>
    </div>
  );
};
