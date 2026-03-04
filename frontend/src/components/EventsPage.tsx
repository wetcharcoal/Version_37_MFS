import { useState } from 'react';
import { useAllEvents, useProfile, useDeleteEvent, useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, MapPin, Clock, Plus, ArrowLeft, Trash2, Edit } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import EventForm from './EventForm';
import { Event } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useFileUrl } from '../blob-storage/FileStorage';

interface EventsPageProps {
  onViewProfile: (profileId: string) => void;
  onBack: () => void;
}

export default function EventsPage({ onViewProfile, onBack }: EventsPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { data: events = [], isLoading } = useAllEvents();
  const { data: profile } = useProfile();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();

  const currentUserPrincipal = identity?.getPrincipal().toString();

  // Filter events by selected date
  const filteredEvents = selectedDate
    ? events.filter((event) => {
        const eventDate = new Date(Number(event.time) / 1000000);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : events;

  // Get dates that have events for calendar highlighting
  const eventDates = events.map((event) => new Date(Number(event.time) / 1000000));

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(eventId);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const canManageEvent = (event: Event) => {
    // General Admin can manage any event
    if (isAdmin) return true;
    // Club members can manage events for their club profile
    if (profile && event.creatorProfileId === profile.id) return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground">Browse and create community events</p>
          </div>
        </div>
        <Button onClick={() => { setEditingEvent(null); setShowEventForm(true); }} className="space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <span>Calendar</span>
            </h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasEvent: eventDates,
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                },
              }}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              {selectedDate ? (
                <p>
                  Showing events for <strong>{format(selectedDate, 'MMMM d, yyyy')}</strong>
                </p>
              ) : (
                <p>Select a date to view events</p>
              )}
            </div>
          </div>
        </div>

        {/* Events List Section */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedDate
                    ? `No events scheduled for ${format(selectedDate, 'MMMM d, yyyy')}`
                    : 'No events available'}
                </p>
                <Button onClick={() => { setEditingEvent(null); setShowEventForm(true); }}>Create an Event</Button>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  canManage={canManageEvent(event)}
                  onDelete={() => handleDeleteEvent(event.id)}
                  onEdit={() => handleEditEvent(event)}
                  onViewProfile={onViewProfile}
                  isDeleting={isDeleting}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {showEventForm && profile && (
        <EventForm
          profileId={profile.id}
          event={editingEvent}
          onClose={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}

function EventCard({
  event,
  canManage,
  onDelete,
  onEdit,
  onViewProfile,
  isDeleting,
}: {
  event: Event;
  canManage: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onViewProfile: (profileId: string) => void;
  isDeleting: boolean;
}) {
  // Get event image URL from blob storage if it's a path
  const shouldFetchUrl = event.image && !event.image.startsWith('http');
  const { data: eventImageUrl } = useFileUrl(shouldFetchUrl && event.image ? event.image : '');

  const displayImage = event.image?.startsWith('http') ? event.image : eventImageUrl;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        {displayImage && (
          <div className="md:w-48 h-48 md:h-auto flex-shrink-0">
            <img
              src={displayImage}
              alt={event.description}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(Number(event.time) / 1000000), 'PPp')}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-foreground mb-4">{event.description}</p>
          {event.needs.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                Event Needs:
              </p>
              <div className="flex flex-wrap gap-2">
                {event.needs.map((needId) => (
                  <span
                    key={needId}
                    className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                  >
                    {needId}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProfile(event.creatorProfileId)}
          >
            View Organizer Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
