import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'ru': ru,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Mock data for demo purposes (will be replaced by Supabase data)
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  clientName: string;
  clientPhone: string;
  carInfo: string;
  reason?: string;
}

const getTelegramInitData = (): string | undefined => {
  try {
    return (window as any).Telegram?.WebApp?.initData as string | undefined;
  } catch {
    return undefined;
  }
};

const AdminCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Fetch events from API
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const initData = getTelegramInitData();
      const headers: Record<string, string> = {};
      if (initData) {
        headers['x-telegram-init-data'] = initData;
      }
      const response = await fetch('/api/admin/bookings', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      
      // Convert ISO strings to Date objects
      const parsedEvents = data.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));

      setEvents(parsedEvents);
    } catch (error) {
      console.error('Error loading calendar:', error);
      // alert('Ошибка загрузки календаря');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Auto-switch view for mobile
    const handleResize = () => {
        if (window.innerWidth < 768) {
            setView(Views.AGENDA);
        } else {
            setView(Views.WEEK);
        }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update status handler
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
        const initData = getTelegramInitData();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (initData) {
          headers['x-telegram-init-data'] = initData;
        }
        const response = await fetch(`/api/admin/bookings/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            // Optimistic update or refetch
            setEvents(prev => prev.map(ev => 
                ev.id === id ? { ...ev, status: newStatus as any } : ev
            ));
            setSelectedEvent(null); // Close modal
        } else {
            alert('Не удалось обновить статус');
        }
    } catch (e) {
        console.error(e);
        alert('Ошибка соединения');
    }
  };

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const onSelectEvent = (event: CalendarEvent) => {
      setSelectedEvent(event);
  };

  const onNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#E0F2FE'; // default light blue
    let borderColor = '#0284C7';
    
    switch (event.status) {
      case 'confirmed':
        backgroundColor = '#D1FAE5'; // light green
        borderColor = '#059669';
        break;
      case 'pending':
        backgroundColor = '#FEF3C7'; // light yellow/orange
        borderColor = '#D97706';
        break;
      case 'cancelled':
        backgroundColor = '#FEE2E2'; // light red
        borderColor = '#DC2626';
        break;
      case 'completed':
        backgroundColor = '#F3F4F6'; // light gray
        borderColor = '#4B5563';
        break;
    }
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 1,
        color: '#1F2937', // Dark gray/black for text
        border: '1px solid ' + borderColor,
        borderLeft: '4px solid ' + borderColor,
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 500,
      },
    };
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const title = window.prompt('Новая запись (Введите Имя и Машину):');
    if (title) {
        // TODO: Call API to create booking
      const newEvent: CalendarEvent = {
        id: events.length + 1,
        title,
        start,
        end,
        status: 'pending',
        clientName: 'Новый Клиент',
        clientPhone: '',
        carInfo: '',
      };
      setEvents([...events, newEvent]);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const action = window.confirm(
      `Запись: ${event.title}\n\nСтатус: ${event.status}\nКлиент: ${event.clientName} (${event.clientPhone})\n\nНажмите OK, чтобы подтвердить запись, или Отмена, чтобы закрыть окно.`
    );
    
    if (action && event.status === 'pending') {
        // TODO: Call API to update status
        const updatedEvents = events.map(e => 
            e.id === event.id ? { ...e, status: 'confirmed' as const } : e
        );
        setEvents(updatedEvents);
    }
  };

  return (
    <div className="h-screen bg-white text-black flex flex-col">
      <style>{`
        .rbc-calendar, .rbc-calendar * { color: #000 !important; }
        .rbc-calendar, .rbc-calendar * { box-sizing: border-box; }
        .rbc-event, .rbc-show-more { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rbc-event-content, .rbc-event-label { overflow: hidden; text-overflow: ellipsis; }
        .rbc-row-segment { max-width: 100%; }
        .rbc-month-view .rbc-header { flex: 0 0 14.2857% !important; min-width: 0 !important; }
        .rbc-month-view .rbc-row-bg .rbc-day-bg { flex: 0 0 14.2857% !important; width: 14.2857% !important; }
        .rbc-time-view .rbc-time-content .rbc-time-column { flex: 1 0 0 !important; min-width: 0 !important; }
        .rbc-time-view .rbc-time-gutter { flex: 0 0 60px !important; }
        .rbc-time-view .rbc-time-content { overflow: hidden; }
        .rbc-date-cell { white-space: nowrap; }
        .rbc-header { white-space: nowrap; }
        .rbc-day-slot .rbc-events-container { overflow: hidden; }
        .rbc-month-view,
        .rbc-time-view,
        .rbc-time-slot,
        .rbc-time-content,
        .rbc-day-bg,
        .rbc-event,
        .rbc-header,
        .rbc-row,
        .rbc-row-segment,
        .rbc-date-cell,
        .rbc-time-gutter,
        .rbc-time-header,
        .rbc-time-header-content {
          border-color: #000 !important;
        }
        .rbc-agenda-view table {
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        .rbc-agenda-view .rbc-agenda-table th,
        .rbc-agenda-view .rbc-agenda-table td {
          border: 1px solid #000 !important;
          padding: 6px 8px;
          vertical-align: middle;
        }
        .rbc-agenda-view .rbc-agenda-date-cell {
          width: 20%;
        }
        .rbc-agenda-view .rbc-agenda-time-cell {
          width: 20%;
        }
        .rbc-agenda-view .rbc-agenda-event-cell {
          width: 60%;
        }
        .rbc-month-view,
        .rbc-time-view,
        .rbc-time-content,
        .rbc-day-bg,
        .rbc-time-gutter,
        .rbc-time-header,
        .rbc-time-header-content {
          background: #fff !important;
        }
      `}</style>
      {/* Header */}
      <div className="bg-white text-black p-4 flex justify-between items-center border-b border-black z-10">
        <div className="flex items-center space-x-4">
             <h1 className="text-xl font-bold">АКПП-Центр | Календарь</h1>
             <span className="text-sm px-3 py-1.5 rounded-full border border-black bg-gray-100">
               Панель администратора
             </span>
        </div>
        <div className="flex items-center space-x-3">
             <button 
               onClick={fetchEvents}
               className="p-2 hover:bg-gray-200 rounded-full transition-colors border border-black"
               title="Обновить"
             >
                🔄
             </button>
             <a 
               href="/?platform=max&start=chat&from=admin" 
               className="text-sm px-3 py-1.5 border border-black rounded-full hover:bg-gray-200 transition-colors text-black"
             >
               В чат
             </a>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-4 overflow-hidden">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={onNavigate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={onSelectEvent}
          selectable
          onSelectSlot={handleSelectSlot}
          messages={{
            next: "Вперед",
            previous: "Назад",
            today: "Сегодня",
            month: "Месяц",
            week: "Неделя",
            day: "День",
            agenda: "Список",
            date: "Дата",
            time: "Время",
            event: "Событие",
            noEventsInRange: "Нет событий в этом диапазоне",
          }}
          formats={{
            timeGutterFormat: (date, culture, localizer) => 
              localizer!.format(date, 'HH:mm', culture),
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              `${localizer!.format(start, 'HH:mm', culture)} - ${localizer!.format(end, 'HH:mm', culture)}`,
          }}
        />
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-start bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{selectedEvent.title}</h3>
                        <p className="text-sm text-gray-500">
                            {format(selectedEvent.start, 'd MMMM yyyy, HH:mm', { locale: ru })}
                        </p>
                    </div>
                    <button 
                        onClick={() => setSelectedEvent(null)}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Клиент</label>
                            <p className="text-gray-900 font-medium">{selectedEvent.clientName}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Телефон</label>
                            <a href={`tel:${selectedEvent.clientPhone}`} className="text-blue-600 font-medium hover:underline">
                                {selectedEvent.clientPhone}
                            </a>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Автомобиль</label>
                        <p className="text-gray-900">{selectedEvent.carInfo}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded text-sm">
                        <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Причина обращения</label>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedEvent.reason}</p>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold block mb-2">Статус заявки</label>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleStatusUpdate(selectedEvent.id, 'confirmed')}
                                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                                    selectedEvent.status === 'confirmed' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                            >
                                ✅ Подтвердить
                            </button>
                            <button
                                onClick={() => handleStatusUpdate(selectedEvent.id, 'cancelled')}
                                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                                    selectedEvent.status === 'cancelled' 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                            >
                                ❌ Отменить
                            </button>
                        </div>
                         {selectedEvent.status === 'pending' && (
                             <p className="text-xs text-center text-orange-600 mt-2">⚠️ Заявка ожидает подтверждения</p>
                         )}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end">
                     <button
                        onClick={() => handleStatusUpdate(selectedEvent.id, 'completed')}
                        className="text-gray-500 hover:text-gray-700 text-sm underline"
                     >
                        Пометить как выполнено
                     </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;
