import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react';
import { Service, ServiceItem, getServices, getServiceItems, createService, updateService, deleteService, createServiceItem, updateServiceItem, deleteServiceItem } from '../../services/contentService';

interface ServiceEditorProps {
  onClose: () => void;
}

const ServiceEditor: React.FC<ServiceEditorProps> = ({ onClose }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceItems, setServiceItems] = useState<Record<string, ServiceItem[]>>({});
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<ServiceItem> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const servicesData = await getServices();
      setServices(servicesData);

      const itemsData: Record<string, ServiceItem[]> = {};
      for (const service of servicesData) {
        itemsData[service.id] = await getServiceItems(service.id);
      }
      setServiceItems(itemsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erreur lors du chargement');
    }
  };

  const handleSaveService = async () => {
    if (!editingService || !editingService.title || !editingService.icon) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      if (editingService.id) {
        await updateService(editingService.id, editingService);
      } else {
        await createService({
          title: editingService.title,
          icon: editingService.icon,
          order_index: editingService.order_index || 0,
        });
      }
      await loadData();
      setEditingService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service et tous ses items ?')) return;

    setLoading(true);
    try {
      await deleteService(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem || !editingItem.label || !editingItem.price || !editingItem.service_id) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      if (editingItem.id) {
        await updateServiceItem(editingItem.id, editingItem);
      } else {
        await createServiceItem({
          service_id: editingItem.service_id,
          label: editingItem.label,
          price: editingItem.price,
          duration: editingItem.duration || '',
          order_index: editingItem.order_index || 0,
        });
      }
      await loadData();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;

    setLoading(true);
    try {
      await deleteServiceItem(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gérer les Prestations</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setEditingService({ title: '', icon: 'Eye', order_index: services.length })}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter une catégorie
            </button>
          </div>

          {editingService && (
            <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
              <h3 className="text-lg font-semibold mb-4">
                {editingService.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input
                    type="text"
                    value={editingService.title || ''}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icône *</label>
                  <select
                    value={editingService.icon || 'Eye'}
                    onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Eye">Eye</option>
                    <option value="Scissors">Scissors</option>
                    <option value="Heart">Heart</option>
                    <option value="Sparkles">Sparkles</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveService}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={20} />
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setEditingService(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {editingItem && (
            <div className="mb-6 p-6 bg-green-50 rounded-xl border-2 border-green-300">
              <h3 className="text-lg font-semibold mb-4">
                {editingItem.id ? 'Modifier le service' : 'Nouveau service'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
                  <input
                    type="text"
                    value={editingItem.label || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix *</label>
                  <input
                    type="text"
                    value={editingItem.price || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durée (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: 1h30, 45min, 2h"
                    value={editingItem.duration || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveItem}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={20} />
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {services.map((service) => (
              <div key={service.id} className="p-6 bg-white border-2 border-gray-300 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-xl text-gray-900">{service.title}</h4>
                    <p className="text-sm text-gray-500">Icône: {service.icon}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingService(service)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setEditingItem({ service_id: service.id, label: '', price: '', duration: '', order_index: serviceItems[service.id]?.length || 0 })}
                  className="mb-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  Ajouter un service
                </button>

                <div className="space-y-2">
                  {serviceItems[service.id]?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="ml-4 text-blue-600 font-bold">{item.price}</span>
                        {item.duration && (
                          <span className="ml-3 text-gray-500 text-sm">⏱️ {item.duration}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceEditor;
