
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} DreamSpace AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
