import React, { useState, useEffect } from 'react';
import { Save, X, Upload } from 'lucide-react';
import { AboutContent, getAboutContent, upsertAboutContent, uploadImage } from '../../services/contentService';

interface AboutEditorProps {
  onClose: () => void;
}

const AboutEditor: React.FC<AboutEditorProps> = ({ onClose }) => {
  const [content, setContent] = useState<Record<string, AboutContent>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await getAboutContent();
      const contentMap: Record<string, AboutContent> = {};
      data.forEach(item => {
        contentMap[item.section_key] = item;
      });
      setContent(contentMap);
    } catch (error) {
      console.error('Error loading about content:', error);
      alert('Erreur lors du chargement');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file, 'about');
      setContent({
        ...content,
        [sectionKey]: {
          ...content[sectionKey],
          image_url: url,
          section_key: sectionKey,
          title: content[sectionKey]?.title || '',
          content: content[sectionKey]?.content || '',
          order_index: content[sectionKey]?.order_index || 0,
        } as AboutContent
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(content)) {
        if (value) {
          await upsertAboutContent({
            section_key: key,
            title: value.title,
            content: value.content,
            image_url: value.image_url,
            order_index: value.order_index,
          });
        }
      }
      alert('Modifications sauvegardées avec succès !');
      await loadContent();
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const updateSection = (sectionKey: string, field: string, value: string) => {
    setContent({
      ...content,
      [sectionKey]: {
        ...content[sectionKey],
        [field]: value,
        section_key: sectionKey,
        title: content[sectionKey]?.title || '',
        content: content[sectionKey]?.content || '',
        image_url: content[sectionKey]?.image_url || '',
        order_index: content[sectionKey]?.order_index || 0,
      } as AboutContent
    });
  };

  const sections = [
    { key: 'main_title', label: 'Titre principal', type: 'text' },
    { key: 'main_subtitle', label: 'Sous-titre principal', type: 'text' },
    { key: 'welcome_title', label: 'Titre de bienvenue', type: 'text' },
    { key: 'intro_text', label: 'Texte d\'introduction', type: 'textarea' },
    { key: 'passion_text', label: 'Texte sur la passion', type: 'textarea' },
    { key: 'mission_text', label: 'Texte sur la mission', type: 'textarea' },
    { key: 'values_intro', label: 'Introduction des valeurs', type: 'textarea' },
    { key: 'quality_text', label: 'Texte qualité', type: 'textarea' },
    { key: 'wellbeing_text', label: 'Texte bien-être', type: 'textarea' },
    { key: 'trust_text', label: 'Texte confiance', type: 'textarea' },
    { key: 'satisfaction_text', label: 'Texte satisfaction', type: 'textarea' },
    { key: 'thank_you_text', label: 'Texte de remerciement', type: 'textarea' },
    { key: 'closing_text', label: 'Texte de clôture', type: 'textarea' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gérer la section À propos</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo professionnelle
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Upload size={20} />
                {uploading ? 'Téléchargement...' : 'Choisir une image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'main_image')}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {content.main_image?.image_url && (
                <img
                  src={content.main_image.image_url}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {section.label}
                </label>
                {section.type === 'text' ? (
                  <input
                    type="text"
                    value={content[section.key]?.title || ''}
                    onChange={(e) => updateSection(section.key, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={section.label}
                  />
                ) : (
                  <textarea
                    value={content[section.key]?.content || ''}
                    onChange={(e) => updateSection(section.key, 'content', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder={section.label}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={loading || uploading}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Sauvegarde en cours...' : 'Sauvegarder toutes les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutEditor;
