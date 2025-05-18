import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Download,
  Image as ImageIcon,
  Type,
  Calendar,
  Clock,
  MapPin,
  Users,
  Palette,
  Layout,
  Share2,
  Plus,
  Minus,
  RotateCcw,
  Trash2,
  ChevronDown,
  X
} from 'lucide-react';
import Select from 'react-select';
import Draggable from 'react-draggable';
import { HexColorPicker } from 'react-colorful';
import * as htmlToImage from 'html-to-image';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { format } from 'date-fns';
import { Event } from '../types';

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'event' | 'shape';
  content: string;
  x: number;
  y: number;
  color?: string;
  fontSize?: number;
  width?: number;
  height?: number;
}

interface Template {
  id: string;
  name: string;
  preview: string;
  layout: 'classic' | 'modern' | 'minimal';
}

const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classic Weekly',
    preview: 'https://images.pexels.com/photos/7130469/pexels-photo-7130469.jpeg',
    layout: 'classic'
  },
  {
    id: 'modern',
    name: 'Modern List',
    preview: 'https://images.pexels.com/photos/7130555/pexels-photo-7130555.jpeg',
    layout: 'modern'
  },
  {
    id: 'minimal',
    name: 'Minimal Calendar',
    preview: 'https://images.pexels.com/photos/7130560/pexels-photo-7130560.jpeg',
    layout: 'minimal'
  }
];

const Social: React.FC = () => {
  const { profile } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [color, setColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch user's events
  React.useEffect(() => {
    const fetchEvents = async () => {
      if (!profile) return;

      try {
        const { data } = await supabase
          .from('events')
          .select(`
            *,
            creator:profilesv2(*)
          `)
          .eq('creator_id', profile.id)
          .order('event_date', { ascending: true });
        
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [profile]);

  const addElement = (type: CanvasElement['type'], content: string = '') => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type,
      content,
      x: 50,
      y: 50,
      color: color,
      fontSize: fontSize
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const handleDrag = (id: string, e: any, data: { x: number; y: number }) => {
    updateElement(id, { x: data.x, y: data.y });
  };

  const exportImage = useCallback(async () => {
    if (canvasRef.current === null) return;

    try {
      const dataUrl = await htmlToImage.toPng(canvasRef.current, {
        quality: 1.0,
        backgroundColor: '#ffffff',
        fontEmbedCSS: false
      });
      
      const link = document.createElement('a');
      link.download = `social-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting image:', err);
    }
  }, [canvasRef]);

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.Name || user.Email?.split('@')[0] || 'Unknown User';
  };

  const renderTemplate = (layout: Template['layout']) => {
    const selectedEventObjects = events.filter(e => selectedEvents.includes(e.id));
    if (selectedEventObjects.length === 0) return null;

    switch (layout) {
      case 'classic':
        return (
          <div className="p-8 bg-white text-gray-900 font-serif">
            <h1 className="text-4xl font-bold mb-6">Upcoming Events</h1>
            <div className="space-y-8">
              {selectedEventObjects.map(event => (
                <div key={event.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <h2 className="text-2xl font-semibold mb-4">{event.title}</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Calendar className="mr-3" />
                        <span>{format(new Date(event.event_date), 'MMMM d, yyyy')}</span>
                      </div>
                      {event.start_time && (
                        <div className="flex items-center">
                          <Clock className="mr-3" />
                          <span>{event.start_time} - {event.end_time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="mr-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <div className="border-l pl-6">
                        <p className="text-gray-600">{event.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'modern':
        return (
          <div className="p-8 bg-gradient-to-br from-primary-600 to-primary-900 text-white">
            <div className="max-w-2xl mx-auto space-y-12">
              {selectedEventObjects.map((event, index) => (
                <div key={event.id} className={index > 0 ? 'pt-12 border-t border-white/20' : ''}>
                  <h2 className="text-4xl font-bold mb-6">{event.title}</h2>
                  <div className="space-y-4">
                    <div className="flex items-center text-xl">
                      <Calendar className="mr-4" size={24} />
                      <span>{format(new Date(event.event_date), 'EEEE, MMMM d')}</span>
                    </div>
                    {event.start_time && (
                      <div className="flex items-center text-xl">
                        <Clock className="mr-4" size={24} />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center text-xl">
                        <MapPin className="mr-4" size={24} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.description && (
                      <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                        <p className="text-lg">{event.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'minimal':
        return (
          <div className="p-8 bg-gray-100">
            <div className="max-w-2xl mx-auto space-y-8">
              {selectedEventObjects.map(event => (
                <div key={event.id} className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                    <div className="mt-2 text-gray-500">
                      {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.start_time && (
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <Clock className="mx-auto mb-2" />
                        <div className="font-medium">{event.start_time} - {event.end_time}</div>
                      </div>
                    )}
                    {event.location && (
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <MapPin className="mx-auto mb-2" />
                        <div className="font-medium">{event.location}</div>
                      </div>
                    )}
                  </div>
                  
                  {event.description && (
                    <div className="mt-6 text-center text-gray-600">
                      <p>{event.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const eventOptions = events.map(event => ({
    value: event.id,
    label: `${event.title} (${format(new Date(event.event_date), 'MMM d, yyyy')})`
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tools Panel */}
          <div className="w-full lg:w-64 space-y-6">
            {/* Template Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">Templates</h2>
              <div className="space-y-4">
                {TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    className={`
                      w-full aspect-video rounded-lg overflow-hidden relative
                      ${selectedTemplate === template.id ? 'ring-2 ring-primary-500' : ''}
                    `}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <span className="text-white font-medium">{template.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Event Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">Events</h2>
              <Select
                isMulti
                options={eventOptions}
                value={eventOptions.filter(option => selectedEvents.includes(option.value))}
                onChange={(selected) => {
                  setSelectedEvents((selected || []).map(option => option.value));
                }}
                placeholder="Select events..."
                className="text-sm"
              />
              {selectedEvents.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedEvents.map(eventId => {
                    const event = events.find(e => e.id === eventId);
                    if (!event) return null;
                    return (
                      <div
                        key={eventId}
                        className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center gap-2"
                      >
                        <span className="truncate max-w-[150px]">{event.title}</span>
                        <button
                          onClick={() => setSelectedEvents(prev => prev.filter(id => id !== eventId))}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">Customize</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Font Size
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFontSize(prev => Math.max(8, prev - 2))}
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="text-sm">{fontSize}px</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFontSize(prev => Math.min(72, prev + 2))}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Color
                  </label>
                  <div className="relative">
                    <button
                      className="w-full h-8 rounded border border-gray-200"
                      style={{ backgroundColor: color }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    />
                    {showColorPicker && (
                      <div className="absolute z-10 mt-2">
                        <HexColorPicker color={color} onChange={setColor} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <Button
                variant="primary"
                fullWidth
                icon={<Download size={18} />}
                onClick={exportImage}
                disabled={!selectedTemplate || selectedEvents.length === 0}
              >
                Export Image
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div 
                ref={canvasRef}
                className="w-full aspect-[4/5] relative overflow-hidden"
                style={{ minHeight: '600px' }}
              >
                {selectedTemplate && selectedEvents.length > 0 && renderTemplate(
                  TEMPLATES.find(t => t.id === selectedTemplate)?.layout || 'classic'
                )}
                {elements.map((element) => (
                  <Draggable
                    key={element.id}
                    defaultPosition={{ x: element.x, y: element.y }}
                    onDrag={(e, data) => handleDrag(element.id, e, data)}
                    bounds="parent"
                  >
                    <div
                      className={`absolute cursor-move ${
                        selectedElement === element.id ? 'ring-2 ring-primary-500' : ''
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      {element.type === 'text' && (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          className="min-w-[100px] outline-none"
                          style={{
                            color: element.color,
                            fontSize: `${element.fontSize}px`
                          }}
                          onBlur={(e) => updateElement(element.id, { content: e.currentTarget.textContent || '' })}
                        >
                          {element.content}
                        </div>
                      )}

                      {selectedElement === element.id && (
                        <button
                          className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md border border-gray-200 text-gray-500 hover:text-error-600"
                          onClick={() => deleteElement(element.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </Draggable>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Social;