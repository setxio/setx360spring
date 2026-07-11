import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Loader2,
  Clock,
  MapPin
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  addWeeks, 
  subWeeks, 
  parseISO, 
  isToday,
  getHours,
  getMinutes
} from 'date-fns';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import './CalendarView.css';

type ViewMode = 'monthly' | 'weekly' | 'business_week' | 'daily';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  type: string; // 'event', 'appointment', etc
}

export const CalendarView: React.FC<{ user: any; scope: string }> = ({ user, scope }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events for the current date range
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Compute range to fetch
        let startDate, endDate;
        if (viewMode === 'monthly') {
          startDate = startOfWeek(startOfMonth(currentDate));
          endDate = endOfWeek(endOfMonth(currentDate));
        } else if (viewMode === 'weekly' || viewMode === 'business_week') {
          startDate = startOfWeek(currentDate);
          endDate = endOfWeek(currentDate);
        } else {
          startDate = currentDate;
          endDate = addDays(currentDate, 1);
        }

        // We fetch from events
        // Later we can parallelize fetching from appointments/posts here
        const { data: rawEvents, error } = await supabase
          .from('events')
          .select('*')
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());

        if (error) throw error;
        
        const mappedEvents = (rawEvents || []).map(e => ({
          id: e.id,
          title: e.title || e.name || 'Untitled Event',
          start_time: e.start_time,
          end_time: e.end_time || e.start_time, // fallback if no end time
          location: e.location || e.address || '',
          type: 'event'
        }));

        setEvents(mappedEvents);
      } catch (err) {
        console.error('Error fetching calendar events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [currentDate, viewMode, scope]);


  // Navigation Handlers
  const next = () => {
    if (viewMode === 'monthly') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'weekly' || viewMode === 'business_week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (viewMode === 'monthly') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'weekly' || viewMode === 'business_week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  
  const subDays = (date: Date, amount: number) => addDays(date, -amount);

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatHeader = () => {
    if (viewMode === 'monthly') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewMode === 'daily') {
      return format(currentDate, 'EEEE, MMM do, yyyy');
    } else {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      if (isSameMonth(start, end)) {
        return `${format(start, 'MMM do')} - ${format(end, 'do, yyyy')}`;
      } else {
        return `${format(start, 'MMM do')} - ${format(end, 'MMM do, yyyy')}`;
      }
    }
  };

  // --- Rendering Monthly View ---
  const renderMonthlyGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find events for this day
        const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), cloneDay));

        days.push(
          <div
            key={day.toString()}
            className={`calendar-month-day ${!isSameMonth(day, monthStart) ? 'outside-month' : ''} ${isToday(day) ? 'is-today' : ''}`}
            onClick={() => {
              setCurrentDate(cloneDay);
              setViewMode('daily');
            }}
          >
            <span className="calendar-day-number">{formattedDate}</span>
            {dayEvents.map(e => (
              <div key={e.id} className="calendar-event-pill" title={e.title}>
                {format(parseISO(e.start_time), 'h:mma')} {e.title}
              </div>
            ))}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <React.Fragment key={day.toString()}>
          {days}
        </React.Fragment>
      );
      days = [];
    }

    return (
      <div className="calendar-month-view">
        <div className="calendar-month-header-row">
          {dayHeaders.map(dh => (
            <div key={dh} className="calendar-month-header-cell">{dh}</div>
          ))}
        </div>
        <div className="calendar-month-grid">
          {rows}
        </div>
      </div>
    );
  };

  // --- Rendering Timeline Views (Weekly, Business, Daily) ---
  const renderTimelineGrid = () => {
    let start, end;
    if (viewMode === 'daily') {
      start = currentDate;
      end = currentDate;
    } else if (viewMode === 'business_week') {
      start = addDays(startOfWeek(currentDate), 1); // Monday
      end = addDays(startOfWeek(currentDate), 5); // Friday
    } else {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    }

    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="calendar-timeline-view">
        <div className="calendar-timeline-header">
          {days.map(d => (
            <div key={d.toString()} className="calendar-timeline-header-day">
              <span className="timeline-day-name">{format(d, 'EEE')}</span>
              <span className={`timeline-day-num ${isToday(d) ? 'is-today' : ''}`}>{format(d, 'd')}</span>
            </div>
          ))}
        </div>
        
        <div className="calendar-timeline-body-scroll">
          <div className="calendar-time-axis">
            {hours.map(h => (
              <div key={h} className="calendar-time-label">
                {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
              </div>
            ))}
          </div>

          <div className="calendar-timeline-grid">
            {days.map(d => {
              const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), d));
              return (
                <div key={d.toString()} className="calendar-timeline-day-col">
                  {dayEvents.map(e => {
                    const parsedStart = parseISO(e.start_time);
                    const parsedEnd = parseISO(e.end_time);
                    
                    // Calculate positions based on 60px per hour grid
                    const startMinutes = getHours(parsedStart) * 60 + getMinutes(parsedStart);
                    const endMinutes = getHours(parsedEnd) * 60 + getMinutes(parsedEnd);
                    let duration = endMinutes - startMinutes;
                    if (duration < 30) duration = 30; // Min visual height

                    const top = startMinutes;
                    
                    return (
                      <div 
                        key={e.id} 
                        className="calendar-timeline-event"
                        style={{ top: `${top}px`, height: `${duration}px` }}
                      >
                        <div className="calendar-timeline-event-title">{e.title}</div>
                        <div className="calendar-timeline-event-time">
                          {format(parsedStart, 'h:mm a')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-header-left">
          <div className="calendar-nav-controls">
            <button className="calendar-today-btn" onClick={goToToday}>Today</button>
            <button className="calendar-nav-btn" onClick={prev}><ChevronLeft size={20} /></button>
            <button className="calendar-nav-btn" onClick={next}><ChevronRight size={20} /></button>
          </div>
          <h2 className="calendar-title">{formatHeader()}</h2>
        </div>
        
        <div className="calendar-header-right">
          <div className="calendar-view-tabs">
            <button 
              className={`calendar-view-tab ${viewMode === 'monthly' ? 'active' : ''}`}
              onClick={() => setViewMode('monthly')}
            >
              Month
            </button>
            <button 
              className={`calendar-view-tab ${viewMode === 'weekly' ? 'active' : ''}`}
              onClick={() => setViewMode('weekly')}
            >
              Week
            </button>
            <button 
              className={`calendar-view-tab ${viewMode === 'business_week' ? 'active' : ''}`}
              onClick={() => setViewMode('business_week')}
            >
              Work Week
            </button>
            <button 
              className={`calendar-view-tab ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="calendar-body">
        {isLoading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', zIndex: 50 }}>
            <Loader2 size={32} className="animate-spin" />
          </div>
        )}
        
        {viewMode === 'monthly' ? renderMonthlyGrid() : renderTimelineGrid()}
      </div>
    </div>
  );
};
