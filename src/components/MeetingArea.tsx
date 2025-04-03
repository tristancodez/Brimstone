import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, CalendarIcon, Clock, Users, Video, Link, MapPin, UserPlus, Search, Filter, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, isAfter } from 'date-fns';
import { io, Socket } from 'socket.io-client';

interface Meeting {
  id: string;
  title: string;
  date: string;
  description: string;
  attendees: string[];
  status?: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  meetingType?: 'virtual' | 'in-person';
  meetingLink?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface NewMeeting {
  title: string;
  date: string;
  description: string;
  attendees: string;
  location: string;
  meetingType: 'virtual' | 'in-person';
  meetingLink: string;
  priority: 'low' | 'medium' | 'high';
}

const MeetingsArea: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showNewMeetingForm, setShowNewMeetingForm] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [newMeeting, setNewMeeting] = useState<NewMeeting>({
    title: '',
    date: '',
    description: '',
    attendees: '',
    location: '',
    meetingType: 'virtual',
    meetingLink: '',
    priority: 'medium'
  });

  // Filtering and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | 'today' | 'tomorrow' | 'thisWeek' | 'upcoming'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'createdAt'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const attendeesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMeetings();

    // Connect to socket for real-time meeting updates
    const socket: Socket = io('http://localhost:3000');
    
    // Listen for new meetings
    socket.on('newMeeting', (meeting: Meeting) => {
      setMeetings(prev => [...prev, meeting]);
    });
    
    // Listen for updated meetings
    socket.on('updateMeeting', (updatedMeeting: Meeting) => {
      setMeetings(prev => prev.map(meeting => 
        meeting.id === updatedMeeting.id ? updatedMeeting : meeting
      ));
    });
    
    // Listen for deleted meetings
    socket.on('deleteMeeting', (meetingId: string) => {
      setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchMeetings = async () => {
    try {
      // Simulating API call
      const mockMeetings: Meeting[] = [
        {
          id: '1',
          title: 'Weekly Team Meeting',
          date: '2023-06-15T10:00:00',
          description: 'Discuss project progress and upcoming tasks',
          attendees: ['john@example.com', 'jane@example.com', 'bob@example.com'],
          status: 'scheduled',
          location: 'Conference Room A',
          meetingType: 'in-person',
          priority: 'medium',
          createdAt: '2023-06-10T08:30:00'
        },
        {
          id: '2',
          title: 'Client Presentation',
          date: '2023-06-16T14:00:00',
          description: 'Present the new features to the client',
          attendees: ['john@example.com', 'alice@example.com', 'client@example.com'],
          status: 'scheduled',
          location: 'Virtual',
          meetingType: 'virtual',
          meetingLink: 'https://meet.example.com/abc123',
          priority: 'high',
          createdAt: '2023-06-11T15:20:00'
        },
        {
          id: '3',
          title: 'Project Planning',
          date: '2023-06-14T09:00:00',
          description: 'Plan the next phase of the project',
          attendees: ['john@example.com', 'jane@example.com', 'manager@example.com'],
          status: 'completed',
          location: 'Conference Room B',
          meetingType: 'in-person',
          priority: 'low',
          createdAt: '2023-06-09T11:45:00'
        }
      ];

      setMeetings(mockMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Simulating API call
      const newMeetingData: Meeting = {
        id: editingMeetingId || Date.now().toString(),
        title: newMeeting.title,
        date: newMeeting.date,
        description: newMeeting.description,
        attendees: newMeeting.attendees.split(',').map(email => email.trim()),
        status: 'scheduled',
        location: newMeeting.location,
        meetingType: newMeeting.meetingType,
        meetingLink: newMeeting.meetingLink,
        priority: newMeeting.priority,
        createdAt: editingMeetingId ? 
          meetings.find(m => m.id === editingMeetingId)?.createdAt || new Date().toISOString() : 
          new Date().toISOString()
      };
      
      if (editingMeetingId) {
        // Update existing meeting
        setMeetings(prevMeetings => 
          prevMeetings.map(meeting => 
            meeting.id === editingMeetingId ? newMeetingData : meeting
          )
        );
      } else {
        // Add new meeting
        setMeetings(prevMeetings => [...prevMeetings, newMeetingData]);
      }
      
      // Reset form
      setNewMeeting({
        title: '',
        date: '',
        description: '',
        attendees: '',
        location: '',
        meetingType: 'virtual',
        meetingLink: '',
        priority: 'medium'
      });
      setShowNewMeetingForm(false);
      setEditingMeetingId(null);
    } catch (error) {
      console.error('Error saving meeting:', error);
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      // Simulating API call
      setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setNewMeeting({
      title: meeting.title,
      date: meeting.date,
      description: meeting.description,
      attendees: meeting.attendees.join(', '),
      location: meeting.location || '',
      meetingType: meeting.meetingType || 'virtual',
      meetingLink: meeting.meetingLink || '',
      priority: meeting.priority || 'medium'
    });
    setShowNewMeetingForm(true);
  };

  const toggleSort = (field: 'date' | 'priority' | 'createdAt') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'bg-green-100 dark:bg-green-900/20';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'cancelled': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatMeetingDate = (date: string) => {
    const dateObject = new Date(date);
    if (isToday(dateObject)) return 'Today';
    if (isTomorrow(dateObject)) return 'Tomorrow';
    return format(dateObject, 'EEE, MMM d, yyyy');
  };

  // Filter and sort meetings
  const filteredAndSortedMeetings = meetings
    .filter(meeting => {
      // Filter by timeframe
      if (filterTimeframe === 'today' && !isToday(new Date(meeting.date))) return false;
      if (filterTimeframe === 'tomorrow' && !isTomorrow(new Date(meeting.date))) return false;
      if (filterTimeframe === 'thisWeek' && !isThisWeek(new Date(meeting.date))) return false;
      if (filterTimeframe === 'upcoming' && !isAfter(new Date(meeting.date), new Date())) return false;
      
      // Filter by status
      if (filterStatus !== 'all' && meeting.status !== filterStatus) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          meeting.title.toLowerCase().includes(query) ||
          meeting.description.toLowerCase().includes(query) ||
          (meeting.location && meeting.location.toLowerCase().includes(query)) ||
          meeting.attendees.some(attendee => attendee.toLowerCase().includes(query))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected field
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortBy === 'priority') {
        const priorityMap = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityMap[a.priority || 'medium'];
        const priorityB = priorityMap[b.priority || 'medium'];
        return sortDirection === 'asc' ? priorityA - priorityB : priorityB - priorityA;
      }
      
      if (sortBy === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      return 0;
    });

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold dark:text-dark-text-primary">Meetings</h2>
            <div className="ml-4 flex items-center text-sm">
              <span className="text-gray-500 dark:text-dark-text-secondary mr-2">
                {filteredAndSortedMeetings.filter(m => m.status !== 'completed').length} upcoming
              </span>
              <span className="text-gray-400 dark:text-dark-text-muted">
                {filteredAndSortedMeetings.filter(m => m.status === 'completed').length} completed
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowNewMeetingForm(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
          >
            <Plus size={20} />
            <span>New Meeting</span>
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-muted h-5 w-5" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg bg-gray-100 dark:bg-dark-bg border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 dark:text-dark-text-primary"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${showFilters 
                ? 'border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10' 
                : 'border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg/50'}`}
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-10 p-4 animate-fade-in">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Time Period</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'today', label: 'Today' },
                      { id: 'tomorrow', label: 'Tomorrow' },
                      { id: 'thisWeek', label: 'This Week' },
                      { id: 'upcoming', label: 'Upcoming' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFilterTimeframe(option.id as any)}
                        className={`px-3 py-1 rounded-full text-xs ${filterTimeframe === option.id 
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' 
                          : 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text-secondary'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'scheduled', label: 'Scheduled' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'cancelled', label: 'Cancelled' }
                    ].map((status) => (
                      <button
                        key={status.id}
                        onClick={() => setFilterStatus(status.id as any)}
                        className={`px-3 py-1 rounded-full text-xs ${filterStatus === status.id 
                          ? status.id === 'all' 
                            ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : getStatusColor(status.id)
                          : 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text-secondary'}`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Sort By</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'date', label: 'Meeting Date', icon: CalendarIcon },
                      { id: 'priority', label: 'Priority', icon: AlertCircle },
                      { id: 'createdAt', label: 'Created Date', icon: Clock }
                    ].map((sortOption) => (
                      <button
                        key={sortOption.id}
                        onClick={() => toggleSort(sortOption.id as any)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-md ${sortBy === sortOption.id 
                          ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400' 
                          : 'hover:bg-gray-50 dark:hover:bg-dark-bg/50 text-gray-700 dark:text-dark-text-secondary'}`}
                      >
                        <div className="flex items-center">
                          <sortOption.icon size={16} className="mr-2" />
                          <span>{sortOption.label}</span>
                        </div>
                        {sortBy === sortOption.id && (
                          sortDirection === 'asc' 
                            ? <ArrowUp size={16} /> 
                            : <ArrowDown size={16} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 ml-auto">
            <button 
              onClick={() => toggleSort('date')}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg/50 text-gray-700 dark:text-dark-text-secondary"
            >
              <CalendarIcon size={18} />
              <span className="hidden sm:inline">Date</span>
              {sortBy === 'date' && (
                sortDirection === 'asc' 
                  ? <ArrowUp size={16} /> 
                  : <ArrowDown size={16} />
              )}
            </button>
            
            <button 
              onClick={() => toggleSort('priority')}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg/50 text-gray-700 dark:text-dark-text-secondary"
            >
              <AlertCircle size={18} />
              <span className="hidden sm:inline">Priority</span>
              {sortBy === 'priority' && (
                sortDirection === 'asc' 
                  ? <ArrowUp size={16} /> 
                  : <ArrowDown size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {showNewMeetingForm && (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 mb-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 dark:text-dark-text-primary flex items-center">
              {editingMeetingId !== null ? 'Edit Meeting' : 'Schedule New Meeting'}
              <button 
                onClick={() => {
                  setShowNewMeetingForm(false);
                  setEditingMeetingId(null);
                  setNewMeeting({
                    title: '',
                    date: '',
                    description: '',
                    attendees: '',
                    location: '',
                    meetingType: 'virtual',
                    meetingLink: '',
                    priority: 'medium'
                  });
                }}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-secondary"
              >
                <X size={20} />
              </button>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Title</label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Priority</label>
                  <div className="mt-1 flex space-x-2">
                    {['low', 'medium', 'high'].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setNewMeeting(prev => ({ ...prev, priority: priority as any }))}
                        className={`flex-1 py-2 rounded-md border ${newMeeting.priority === priority 
                          ? getPriorityBgColor(priority) + ' border-transparent ' + getPriorityColor(priority) + ' font-medium'
                          : 'border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg/50'}`}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-muted h-5 w-5" />
                    <input
                      type="text"
                      value={newMeeting.location}
                      onChange={(e) => setNewMeeting(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter location"
                      className="mt-1 pl-10 block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Meeting Type</label>
                  <div className="mt-1 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setNewMeeting(prev => ({ ...prev, meetingType: 'virtual' }))}
                      className={`flex-1 py-2 rounded-md border flex items-center justify-center ${newMeeting.meetingType === 'virtual' 
                        ? 'bg-blue-100 dark:bg-blue-900/20 border-transparent text-blue-600 dark:text-blue-400 font-medium'
                        : 'border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg/50'}`}
                    >
                      <Video size={18} className="mr-2" />
                      <span>Virtual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMeeting(prev => ({ ...prev, meetingType: 'in-person' }))}
                      className={`flex-1 py-2 rounded-md border flex items-center justify-center ${newMeeting.meetingType === 'in-person' 
                        ? 'bg-green-100 dark:bg-green-900/20 border-transparent text-green-600 dark:text-green-400 font-medium'
                        : 'border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg/50'}`}
                    >
                      <Users size={18} className="mr-2" />
                      <span>In-Person</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {newMeeting.meetingType === 'virtual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Meeting Link</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-muted h-5 w-5" />
                    <input
                      type="text"
                      value={newMeeting.meetingLink}
                      onChange={(e) => setNewMeeting(prev => ({ ...prev, meetingLink: e.target.value }))}
                      placeholder="https://meet.example.com/..."
                      className="mt-1 pl-10 block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Description</label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Attendees</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-muted h-5 w-5" />
                  <input
                    type="text"
                    ref={attendeesInputRef}
                    value={newMeeting.attendees}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, attendees: e.target.value }))}
                    className="mt-1 pl-10 block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                    placeholder="john@example.com, jane@example.com"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-dark-text-muted">Comma-separated email addresses</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewMeetingForm(false);
                    setEditingMeetingId(null);
                    setNewMeeting({
                      title: '',
                      date: '',
                      description: '',
                      attendees: '',
                      location: '',
                      meetingType: 'virtual',
                      meetingLink: '',
                      priority: 'medium'
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                >
                  {editingMeetingId !== null ? 'Update Meeting' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredAndSortedMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-full mb-4">
              <CalendarIcon size={40} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 dark:text-dark-text-primary mb-2">
              {searchQuery ? 'No matching meetings found' : 'No meetings scheduled'}
            </h3>
            <p className="text-gray-500 dark:text-dark-text-secondary max-w-md">
              {searchQuery 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by scheduling your first meeting using the "New Meeting" button.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedMeetings.map((meeting) => (
              <div 
                key={meeting.id} 
                className={`bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 transition-all duration-200 hover:shadow-md ${meeting.status === 'cancelled' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold dark:text-dark-text-primary">{meeting.title}</h3>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleEditMeeting(meeting)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg/70"
                      aria-label="Edit meeting"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => deleteMeeting(meeting.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:text-dark-text-muted dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg/70"
                      aria-label="Delete meeting"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center mt-3 gap-2">
                  {meeting.status && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(meeting.status)}`}>
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </span>
                  )}
                  
                  {meeting.priority && (
                    <span className={`flex items-center text-xs px-2 py-1 rounded-full ${getPriorityBgColor(meeting.priority)} ${getPriorityColor(meeting.priority)}`}>
                      <AlertCircle size={12} className="mr-1" />
                      {meeting.priority.charAt(0).toUpperCase() + meeting.priority.slice(1)}
                    </span>
                  )}
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-gray-600 dark:text-dark-text-secondary">
                    <CalendarIcon size={18} className="mr-2" />
                    <span className="text-sm">{formatMeetingDate(meeting.date)}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-dark-text-secondary">
                    <Clock size={18} className="mr-2" />
                    <span className="text-sm">{format(new Date(meeting.date), 'h:mm a')}</span>
                  </div>
                  
                  {meeting.location && (
                    <div className="flex items-center text-gray-600 dark:text-dark-text-secondary">
                      <MapPin size={18} className="mr-2" />
                      <span className="text-sm">{meeting.location}</span>
                      {meeting.meetingType === 'virtual' && meeting.meetingLink && (
                        <a 
                          href={meeting.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-purple-600 dark:text-purple-400 hover:underline text-sm"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <Users size={18} className="mr-2 mt-1 text-gray-600 dark:text-dark-text-secondary" />
                    <div className="flex flex-wrap gap-1">
                      {meeting.attendees.map((attendee, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 text-xs px-2 py-1 rounded-full"
                        >
                          {attendee}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {meeting.description && (
                    <p className="text-gray-600 dark:text-dark-text-secondary text-sm mt-2">{meeting.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsArea;