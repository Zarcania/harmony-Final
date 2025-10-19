import React, { useState } from 'react';
import { Save, X, Image, Type, Palette } from 'lucide-react';

interface AdminEditOverlayProps {
  element: 'text' | 'image' | 'color';
  currentValue: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

const AdminEditOverlay: React.FC<AdminEditOverlayProps> = ({
  element,
  currentValue,
  onSave,
  onCancel,
  position
}) => {
  const [value, setValue] = useState(currentValue);

  const handleSave = () => {
    onSave(value);
  };

  const getIcon = () => {
    switch (element) {
      case 'text': return <Type size={16} />;
      case 'image': return <Image size={16} />;
      case 'color': return <Palette size={16} />;
    }
  };

  const getTitle = () => {
    switch (element) {
      case 'text': return 'Modifier le texte';
      case 'image': return 'Modifier l\'image';
      case 'color': return 'Modifier la couleur';
    }
  };

  return (
    <div 
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-harmonie-200 p-4 min-w-80"
      style={{ 
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y, window.innerHeight - 200)
      }}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-harmonie-700">
          {getIcon()}
          <span className="font-medium">{getTitle()}</span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-harmonie-400 hover:text-harmonie-600 rounded"
        >
          <X size={16} />
        </button>
      </div>

      {/* Champ d'édition */}
      <div className="mb-4">
        {element === 'text' ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Entrez votre texte..."
          />
        ) : element === 'image' ? (
          <input
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-3 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
            placeholder="URL de l'image..."
          />
        ) : (
          <input
            type="color"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full h-12 border border-harmonie-200 rounded-lg focus:ring-2 focus:ring-harmonie-500 focus:border-transparent"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-harmonie-600 text-white py-2 px-4 rounded-lg hover:bg-harmonie-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Save size={16} />
          Sauvegarder
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-harmonie-200 text-harmonie-600 rounded-lg hover:bg-harmonie-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default AdminEditOverlay;