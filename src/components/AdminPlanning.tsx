import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, Mail, Trash2, Plus, X, CreditCard as Edit } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Booking } from '../types/booking';
import BookingEditModal from './BookingEditModal';

interface AdminPlanningProps {
  onClose: () => void;
}

const AdminPlanning: React.FC<AdminPlanningProps> = ({ onClose }) => {
  const { bookings, deleteBooking, updateBooking, addBooking } = useBooking();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Générer les 7 jours de la semaine
  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lundi
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const weekDays = getWeekDays();

  const getBookingsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.date === dateStr);
  };

  const handleDeleteBooking = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      deleteBooking(id);
    }
  };

  const handleStatusChange = (id: string, status: 'confirmed' | 'pending' | 'cancelled') => {
    updateBooking(id, { status });
  };

  const nextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const prevWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const handleSaveBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    if (editingBooking) {
      updateBooking(editingBooking.id, bookingData);
    } else {
      addBooking({
        service: bookingData.service,
        date: bookingData.date,
        time: bookingData.time,
        clientName: bookingData.clientName,
        clientFirstName: bookingData.clientFirstName,
        clientPhone: bookingData.clientPhone,
        clientEmail: bookingData.clientEmail
      });
    }
    setEditingBooking(null);
    setShowAddModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[env(safe-area-inset-top)]">
      <div className="bg-white w-full sm:max-w-7xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
        {/* En-tête sticky */}
  <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 border-b border-harmonie-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-harmonie-100 text-harmonie-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-harmonie-800">
              Planning des rendez-vous
            </h3>
          </div>
          <button
            aria-label="Fermer"
            onClick={onClose}
            className="p-2 text-harmonie-400 hover:text-harmonie-600 hover:bg-harmonie-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation semaine */}
        <div className="bg-harmonie-50 border-b border-harmonie-100 p-2 sm:p-4">
          <div className="grid grid-cols-3 items-center gap-2">
            <button
              aria-label="Semaine précédente"
              onClick={prevWeek}
              className="px-2 sm:px-4 py-1 sm:py-2 bg-white border border-harmonie-200 rounded-lg hover:bg-harmonie-50 transition-colors text-xs sm:text-sm"
            >
              ← <span className="hidden sm:inline">Semaine précédente</span>
            </button>
            <h4 className="text-center font-semibold text-harmonie-800 text-xs sm:text-base truncate">
              Semaine du {format(weekDays[0], 'd MMMM', { locale: fr })} au {format(weekDays[6], 'd MMMM yyyy', { locale: fr })}
            </h4>
            <button
              aria-label="Semaine suivante"
              onClick={nextWeek}
              className="justify-self-end px-2 sm:px-4 py-1 sm:py-2 bg-white border border-harmonie-200 rounded-lg hover:bg-harmonie-50 transition-colors text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Semaine suivante</span> →
            </button>
          </div>
          {/* Bouton ajout plein écran en mobile */}
          <div className="mt-1 sm:hidden">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-harmonie-600 text-white rounded-lg hover:bg-harmonie-700 transition-colors shadow-md text-sm"
            >
              <Plus size={16} />
              Nouveau rendez-vous
            </button>
          </div>
          {/* Bouton ajout sur desktop */}
          <div className="hidden sm:flex mt-2 justify-start">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-harmonie-600 text-white rounded-lg hover:bg-harmonie-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus size={16} />
              Nouveau rendez-vous
            </button>
          </div>
        </div>

  <div className="flex flex-col sm:flex-row h-[calc(92vh-170px)] sm:h-[calc(90vh-200px)]">
          {/* Vue calendrier */}
          <div className="flex-1 overflow-y-auto">
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] scroll-smooth">
              <div className="grid grid-flow-col auto-cols-[minmax(160px,160px)] sm:grid-flow-row sm:grid-cols-7 gap-px bg-harmonie-200 snap-x snap-mandatory">
              {weekDays.map((day, index) => {
                const dayBookings = getBookingsForDay(day);
                const isToday = isSameDay(day, new Date());
                const dateStr = format(day, 'yyyy-MM-dd');
                
                return (
                  <div
                    key={index}
                    className={`bg-white min-h-[160px] p-2 cursor-pointer hover:bg-harmonie-50 transition-colors snap-start ${
                      selectedDate === dateStr ? 'bg-harmonie-100' : ''
                    }`}
                    onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                  >
                    <div className={`text-center mb-1 ${isToday ? 'font-bold text-harmonie-600' : 'text-harmonie-700'}`}>
                      <div className="text-xs">{format(day, 'EEE', { locale: fr })}</div>
                      <div className={`text-lg ${isToday ? 'bg-harmonie-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {dayBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className={`text-xs p-2 rounded border-l-2 ${
                            booking.status === 'confirmed' ? 'border-green-500 bg-green-50' :
                            booking.status === 'pending' ? 'border-yellow-500 bg-yellow-50' :
                            'border-red-500 bg-red-50'
                          }`}
                        >
                          <div className="font-medium">{booking.time}</div>
                          <div className="truncate">{booking.clientFirstName} {booking.clientName}</div>
                          <div className="truncate text-harmonie-600">{booking.service}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* Détails du jour sélectionné */}
          {selectedDate && (
            <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-harmonie-200 bg-harmonie-50 overflow-y-auto">
              <div className="p-4 border-b border-harmonie-200 bg-white">
                <h5 className="font-semibold text-harmonie-800">
                  {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
                </h5>
              </div>
              
              <div className="p-4 space-y-4">
                {bookings
                  .filter(booking => booking.date === selectedDate)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((booking) => (
                    <div key={booking.id} className="bg-white rounded-lg p-3 shadow-sm border border-harmonie-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-harmonie-600" />
                          <span className="font-medium text-harmonie-800">{booking.time}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingBooking(booking)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-harmonie-600" />
                          <span>{booking.clientFirstName} {booking.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-harmonie-600" />
                          <span>{booking.clientPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-harmonie-600" />
                          <span className="truncate">{booking.clientEmail}</span>
                        </div>
                        <div className="text-harmonie-700 font-medium">
                          {booking.service}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                          <select
                            aria-label="Modifier le statut du rendez-vous"
                            value={booking.status}
                            onChange={(e) => handleStatusChange(booking.id, e.target.value as 'confirmed' | 'pending' | 'cancelled')}
                            className="text-xs border border-harmonie-200 rounded px-2 py-1"
                          >
                            <option value="confirmed">Confirmé</option>
                            <option value="pending">En attente</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {bookings.filter(booking => booking.date === selectedDate).length === 0 && (
                  <div className="text-center text-harmonie-500 py-8">
                    Aucun rendez-vous ce jour
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Statistiques en bas */}
        <div className="border-t border-harmonie-200 p-3 sm:p-4 bg-harmonie-50">
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="font-bold text-harmonie-800">{bookings.filter(b => b.status === 'confirmed').length}</div>
              <div className="text-harmonie-600">Confirmés</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-harmonie-800">{bookings.filter(b => b.status === 'pending').length}</div>
              <div className="text-harmonie-600">En attente</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-harmonie-800">{bookings.length}</div>
              <div className="text-harmonie-600">Total</div>
            </div>
          </div>
        </div>
      </div>

      {(showAddModal || editingBooking) && (
        <BookingEditModal
          booking={editingBooking || undefined}
          selectedDate={selectedDate || undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingBooking(null);
          }}
          onSave={handleSaveBooking}
        />
      )}
    </div>
  );
};

export default AdminPlanning;