import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, Star, Eye, EyeOff } from 'lucide-react';
import { Review, getReviews, createReview, updateReview, deleteReview } from '../../services/contentService';

interface ReviewEditorProps {
  onClose: () => void;
}

const ReviewEditor: React.FC<ReviewEditorProps> = ({ onClose }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Partial<Review> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const data = await getReviews(false);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      alert('Erreur lors du chargement');
    }
  };

  const handleSave = async () => {
    if (!editingReview || !editingReview.client_name || !editingReview.comment || !editingReview.rating) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      if (editingReview.id) {
        await updateReview(editingReview.id, editingReview);
      } else {
        await createReview({
          client_name: editingReview.client_name,
          rating: editingReview.rating,
          comment: editingReview.comment,
          service_type: editingReview.service_type || '',
          is_published: editingReview.is_published || false,
          order_index: editingReview.order_index || 0,
        });
      }
      await loadReviews();
      setEditingReview(null);
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;

    setLoading(true);
    try {
      await deleteReview(id);
      await loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublished = async (review: Review) => {
    setLoading(true);
    try {
      await updateReview(review.id, { is_published: !review.is_published });
      await loadReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gérer les Avis</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <button
            onClick={() => setEditingReview({ client_name: '', rating: 5, comment: '', service_type: '', is_published: false, order_index: reviews.length })}
            className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Ajouter un avis
          </button>

          {editingReview && (
            <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
              <h3 className="text-lg font-semibold mb-4">
                {editingReview.id ? 'Modifier l\'avis' : 'Nouvel avis'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du client *</label>
                  <input
                    type="text"
                    value={editingReview.client_name || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, client_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditingReview({ ...editingReview, rating: star })}
                        className="p-1"
                      >
                        <Star
                          size={28}
                          className={star <= (editingReview.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire *</label>
                  <textarea
                    value={editingReview.comment || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de service</label>
                  <input
                    type="text"
                    placeholder="Ex: Extensions de cils, Épilation..."
                    value={editingReview.service_type || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, service_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={editingReview.is_published || false}
                    onChange={(e) => setEditingReview({ ...editingReview, is_published: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                    Publier l'avis
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={20} />
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setEditingReview(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg text-gray-900">{review.client_name}</h4>
                      {review.is_published && (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Publié
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                    </div>
                    {review.service_type && (
                      <p className="text-sm text-gray-600 mb-2">Service: {review.service_type}</p>
                    )}
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingReview(review)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleTogglePublished(review)}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {review.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewEditor;
