import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Paperclip, Smile, Phone, Video, Search, Image, Mic, ChevronRight, 
  UserPlus, X, Info, MoreHorizontal, Check, CheckCheck, ThumbsUp, Heart, 
  Clock, Filter, ArrowDown, Trash2, Edit, Reply, Forward, Archive, Pin, 
  Download, ExternalLink, MessageSquare, Users, File, Play, ChevronDown,
  Menu, Bell
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';
import { format, isToday, isYesterday } from 'date-fns';

interface Reaction {
  emoji: string;
  userId: string;
  username: string;
}

interface Attachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  url: string;
  name: string;
  size: string;
  mimeType?: string;
  thumbnail?: string;
  duration?: number; // For audio/video
  dimensions?: { width: number; height: number }; // For images/videos
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  avatar: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  edited: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  attachments?: Attachment[];
  reactions?: Reaction[];
  deleted: boolean;
  pinned: boolean;
  forwarded: boolean;
  forwardedFrom?: string;
  metadata?: {
    [key: string]: any;
  };
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  participants: Participant[];
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
    status: Message['status'];
  };
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  typing?: boolean;
  role?: 'admin' | 'member';
  isCurrentUser?: boolean;
}

const ChatArea: React.FC = () => {
  // State for messages and conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  
  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'pinned'>('all');
  
  // Mock user data
  const mockUser = { id: '1', username: 'User', email: 'user@example.com', avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=user' };
  const { isDark } = useTheme(); // Using isDark instead of theme/darkMode
  const socketRef = useRef<Socket>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const hasNewMessages = useRef<boolean>(false);

  // Initialize socket connection and fetch conversations
  useEffect(() => {
    if (!mockUser) return;
    
    // Connect to socket server
    socketRef.current = io('http://localhost:3000', {
      query: { userId: mockUser.id },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
      fetchConversations();
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Listen for new messages
    socketRef.current.on('newMessage', (message: Message) => {
      console.log('New message received:', message);
      
      // Update messages if in the active conversation
      if (activeConversation?.id === message.conversationId) {
        setMessages(prev => {
          // Check if we already have a temporary version of this message
          const tempIndex = prev.findIndex(m => m.id === message.id);
          
          if (tempIndex >= 0) {
            // Replace temp message with the real one
            const newMessages = [...prev];
            newMessages[tempIndex] = message;
            return newMessages;
          } else {
            // Add as a new message
            return [...prev, message];
          }
        });
        
        // Mark as read if this conversation is active
        socketRef.current?.emit('markAsRead', { 
          conversationId: message.conversationId, 
          userId: mockUser.id 
        });
      }
      
      // Update conversation list with latest message
      setConversations(prev => prev.map(conv => {
        if (conv.id === message.conversationId) {
          // Increment unread count if not in active conversation
          const unreadCount = activeConversation?.id === conv.id ? 0 : (conv.unreadCount + 1);
          
          return {
            ...conv,
            lastMessage: {
              content: message.content,
              timestamp: message.timestamp,
              senderId: message.senderId,
              status: message.status
            },
            unreadCount
          };
        }
        return conv;
      }));
    });
    
    // Listen for message updates
    socketRef.current.on('messageUpdate', (updatedMessage: Message) => {
      console.log('Message updated:', updatedMessage);
      
      // Update message in the current conversation
      setMessages(prev => prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      ));
      
      // Update in conversation list if it's the last message
      setConversations(prev => prev.map(conv => {
        if (conv.id === updatedMessage.conversationId && 
            conv.lastMessage && 
            conv.lastMessage.timestamp === updatedMessage.timestamp) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              content: updatedMessage.content
            }
          };
        }
        return conv;
      }));
    });
    
    // Listen for deleted messages
    socketRef.current.on('messageDeleted', ({ messageId, conversationId }: { messageId: string, conversationId: string }) => {
      console.log('Message deleted:', messageId);
      
      // Update in current conversation
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, deleted: true, content: 'This message was deleted' } : msg
      ));
      
      // Update in conversation list if it's the last message
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId && 
            conv.lastMessage && 
            messageId === conv.lastMessage.timestamp) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              content: 'This message was deleted'
            }
          };
        }
        return conv;
      }));
    });
    
    // Listen for conversation updates
    socketRef.current.on('conversationUpdate', (updatedConversation: Conversation) => {
      console.log('Conversation updated:', updatedConversation);
      
      setConversations(prev => prev.map(conv => 
        conv.id === updatedConversation.id ? updatedConversation : conv
      ));
      
      // Update active conversation if it's the one that was updated
      if (activeConversation?.id === updatedConversation.id) {
        setActiveConversation(updatedConversation);
      }
    });
    
    // Listen for typing status updates
    socketRef.current.on('typingStatus', ({ conversationId, userId, isTyping }: { conversationId: string, userId: string, isTyping: boolean }) => {
      // Don't show typing indicator for current user
      if (userId === mockUser.id) return;
      
      // Update typing status for the conversation
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          const updatedParticipants = conv.participants.map(p => 
            p.id === userId ? { ...p, typing: isTyping } : p
          );
          
          return { ...conv, participants: updatedParticipants };
        }
        return conv;
      }));
    });
    
    // Listen for message reactions
    socketRef.current.on('messageReaction', ({ messageId, reaction, conversationId }: { messageId: string, reaction: Reaction, conversationId: string }) => {
      console.log('Message reaction:', messageId, reaction);
      
      // Update in current conversation
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          // Remove existing reaction from this user if any
          const filteredReactions = (msg.reactions || []).filter(r => r.userId !== reaction.userId);
          
          // Add the new reaction if it's not an empty string (which means remove)
          const newReactions = reaction.emoji ? [...filteredReactions, reaction] : filteredReactions;
          
          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));
    });
    
    // Listen for read receipts
    socketRef.current.on('messageRead', ({ conversationId, userId }: { conversationId: string, userId: string }) => {
      console.log('Messages read by:', userId, 'in conversation:', conversationId);
      
      // Update message status to 'read' for all messages sent by current user
      if (activeConversation?.id === conversationId) {
        setMessages(prev => prev.map(msg => {
          if (msg.senderId === mockUser.id && (msg.status === 'sent' || msg.status === 'delivered')) {
            return { ...msg, status: 'read' };
          }
          return msg;
        }));
      }
      
      // Update unread count in conversation list
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ));
    });

    // Clean up on unmount
    return () => {
      socketRef.current?.off('newMessage');
      socketRef.current?.off('messageUpdate');
      socketRef.current?.off('messageDeleted');
      socketRef.current?.off('conversationUpdate');
      socketRef.current?.off('typingStatus');
      socketRef.current?.off('messageReaction');
      socketRef.current?.off('messageRead');
      socketRef.current?.disconnect();
    };
  }, [activeConversation]);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        // Set the first conversation as active if none is selected
        if (data.length > 0 && !activeConversation) {
          setActiveConversation(data[0]);
          fetchMessages(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId: string, limit = 20, before?: string) => {
    if (!conversationId) return;
    
    try {
      setLoadingMessages(true);
      
      let url = `http://localhost:3000/api/conversations/${conversationId}/messages?limit=${limit}`;
      if (before) url += `&before=${before}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (before) {
          // Prepend older messages
          setMessages(prev => [...data, ...prev]);
        } else {
          // Replace with new messages
          setMessages(data);
          // Mark conversation as read
          markConversationAsRead(conversationId);
        }
        
        setHasMoreMessages(data.length === limit);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = () => {
    if (!activeConversation || loadingMore || !hasMoreMessages) return;
    
    setLoadingMore(true);
    const oldestMessage = messages[0];
    
    if (oldestMessage) {
      fetchMessages(activeConversation.id, 20, oldestMessage.id)
        .finally(() => setLoadingMore(false));
    } else {
      setLoadingMore(false);
    }
  };

  // Mark conversation as read
  const markConversationAsRead = (conversationId: string) => {
    if (!mockUser || !socketRef.current) return;
    
    socketRef.current.emit('markAsRead', { conversationId, userId: mockUser.id });
    
    // Update local state
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !mockUser || !activeConversation) return;
    
    // Clear any editing or replying state
    setEditingMessage(null);
    
    // Create a temporary message with sending status
    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      conversationId: activeConversation.id,
      senderId: mockUser.id,
      senderName: mockUser.username,
      content: newMessage,
      timestamp: new Date().toISOString(),
      avatar: mockUser.avatar,
      status: 'sending',
      edited: false,
      deleted: false,
      pinned: false,
      forwarded: false
    };
    
    // If replying to a message, include reference
    if (replyingTo) {
      newMsg.replyTo = {
        id: replyingTo.id,
        content: replyingTo.content,
        senderName: replyingTo.senderName
      };
      setReplyingTo(null);
    }
  
    // Add to local messages immediately for UI responsiveness
    setMessages(prev => [...prev, newMsg]);
    
    // Send to server
    socketRef.current?.emit('sendMessage', {
      id: tempId,
      conversationId: activeConversation.id,
      content: newMessage,
      replyToId: replyingTo?.id,
      senderId: mockUser.id,
      senderName: mockUser.username,
      avatar: mockUser.avatar,
      timestamp: newMsg.timestamp
    });
    
    // Update typing status
    socketRef.current?.emit('typingStatus', {
      conversationId: activeConversation.id,
      userId: mockUser.id,
      isTyping: false
    });
    
    // Simulate message sent after a short delay (for demo purposes)
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'sent' } : msg
      ));
      
      // Simulate delivered after another delay
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'delivered' } : msg
        ));
      }, 1000);
    }, 1500);
    
    // Clear input
    setNewMessage('');
  };
  
  // Edit an existing message
  const handleEditMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !editingMessage || !mockUser) return;
    
    // Update locally first
    setMessages(prev => 
      prev.map(msg => 
        msg.id === editingMessage.id 
          ? { ...msg, content: newMessage, edited: true } 
          : msg
      )
    );
    
    // Send to server
    socketRef.current?.emit('editMessage', {
      messageId: editingMessage.id,
      content: newMessage
    });
    
    // Reset state
    setNewMessage('');
    setEditingMessage(null);
  };
  
  // Delete a message
  const handleDeleteMessage = (messageId: string) => {
    if (!mockUser) return;
    
    // Update locally first
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, deleted: true, content: 'This message was deleted' } 
          : msg
      )
    );
    
    // Send to server
    socketRef.current?.emit('deleteMessage', { messageId });
    
    // Close any open menus
    setShowMessageOptions(null);
  };
  
  // Add reaction to a message
  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!mockUser) return;
    
    socketRef.current?.emit('addReaction', {
      messageId,
      emoji,
      userId: mockUser.id,
      username: mockUser.username
    });
    
    // Close reaction picker
    setShowReactionPicker(null);
  };
  
  // Remove reaction from a message
  const handleRemoveReaction = (messageId: string, emoji: string) => {
    if (!mockUser) return;
    
    socketRef.current?.emit('removeReaction', {
      messageId,
      emoji,
      userId: mockUser.id
    });
  };
  
  // Check if current user sent the message
  const isCurrentUser = (senderId: string) => {
    return mockUser?.id === senderId;
  };
  
  // Start typing indicator
  const handleTypingStart = () => {
    if (!mockUser || !activeConversation || !socketRef.current) return;
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Emit typing start event
    socketRef.current.emit('typingStatus', {
      conversationId: activeConversation.id,
      userId: mockUser.id,
      isTyping: true
    });
    
    // Set timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };
  
  // Stop typing indicator
  const handleTypingStop = () => {
    if (!mockUser || !activeConversation || !socketRef.current) return;
    
    socketRef.current.emit('typingStatus', {
      conversationId: activeConversation.id,
      userId: mockUser.id,
      isTyping: false
    });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Mock data for UI enhancement (will be replaced with real data from API)
  useEffect(() => {
    // Generate mock conversations if none exist yet
    if (conversations.length === 0) {
      const mockConversations: Conversation[] = [
        {
          id: '1',
          type: 'direct',
          name: 'Tristan',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          participants: [
            {
              id: '101',
              name: 'Tristan',
              avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
              status: 'online',
              role: 'member'
            },
            {
              id: mockUser?.id || 'current-user',
              name: mockUser?.username || 'You',
              avatar: mockUser?.avatar || 'https://ui-avatars.com/api/?name=You&background=6d28d9&color=fff',
              status: 'online',
              isCurrentUser: true,
              role: 'member'
            }
          ],
          lastMessage: {
            content: 'Hey, how are you doing?',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
            senderId: '101',
            status: 'read'
          },
          unreadCount: 0,
          pinned: false,
          muted: false,
          archived: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
        },
        {
          id: '2',
          type: 'direct',
          name: 'Shreya',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          participants: [
            {
              id: '102',
              name: 'Shreya',
              avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
              status: 'online',
              role: 'member'
            },
            {
              id: mockUser?.id || 'current-user',
              name: mockUser?.username || 'You',
              avatar: mockUser?.avatar || 'https://ui-avatars.com/api/?name=You&background=6d28d9&color=fff',
              status: 'online',
              isCurrentUser: true,
              role: 'member'
            }
          ],
          lastMessage: {
            content: 'Can you send me the report?',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            senderId: mockUser?.id || 'current-user',
            status: 'delivered'
          },
          unreadCount: 0,
          pinned: true,
          muted: false,
          archived: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: '3',
          type: 'group',
          name: 'Team Alpha',
          avatar: 'https://ui-avatars.com/api/?name=Team+Alpha&background=6d28d9&color=fff',
          participants: [
            {
              id: '101',
              name: 'Tristan',
              avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
              status: 'online',
              role: 'admin'
            },
            {
              id: '102',
              name: 'Shreya',
              avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
              status: 'online',
              role: 'member'
            },
            {
              id: '103',
              name: 'RS',
              avatar: 'https://randomuser.me/api/portraits/men/81.jpg',
              status: 'away',
              lastSeen: '2h ago',
              role: 'member'
            },
            {
              id: mockUser?.id || 'current-user',
              name: mockUser?.username || 'You',
              avatar: mockUser?.avatar || 'https://ui-avatars.com/api/?name=You&background=6d28d9&color=fff',
              status: 'online',
              isCurrentUser: true,
              role: 'member'
            }
          ],
          lastMessage: {
            content: 'Meeting at 3pm today',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            senderId: '101',
            status: 'read'
          },
          unreadCount: 3,
          pinned: false,
          muted: true,
          archived: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        }
      ];
      
      setConversations(mockConversations);
      setActiveConversation(mockConversations[0]);
      
      // Generate mock messages for the first conversation
      const mockMessages: Message[] = [
        {
          id: '1001',
          conversationId: '1',
          senderId: '101',
          senderName: 'Alex Johnson',
          content: 'Hey, how are you doing?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false
        },
        {
          id: '1002',
          conversationId: '1',
          senderId: mockUser?.id || 'current-user',
          senderName: mockUser?.username || 'You',
          content: 'I\'m good, thanks! Just working on the project.',
          timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), // 55 minutes ago
          avatar: mockUser?.avatar || 'https://ui-avatars.com/api/?name=You&background=6d28d9&color=fff',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false
        },
        {
          id: '1003',
          conversationId: '1',
          senderId: '101',
          senderName: 'Alex Johnson',
          content: 'How\'s the progress on the new feature?',
          timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), // 50 minutes ago
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false
        },
        {
          id: '1004',
          conversationId: '1',
          senderId: mockUser?.id || 'current-user',
          senderName: mockUser?.username || 'You',
          content: 'It\'s going well! I\'ve completed about 70% of it.',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
          avatar: mockUser?.avatar || 'https://ui-avatars.com/api/?name=You&background=6d28d9&color=fff',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false
        },
        {
          id: '1005',
          conversationId: '1',
          senderId: '101',
          senderName: 'Alex Johnson',
          content: 'Great! Let me know if you need any help.',
          timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(), // 40 minutes ago
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false,
          attachments: [
            {
              id: 'a1',
              type: 'file',
              url: '#',
              name: 'project_specs.pdf',
              size: '2.4 MB'
            }
          ]
        },
        {
          id: '1006',
          conversationId: '1',
          senderId: mockUser?.id || 'current-user',
          senderName: mockUser?.username || 'You',
          content: 'Thanks! I might need your input on the UI design.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          avatar: mockUser?.avatar || 'https://ui-avatars.com/api/?name=You&background=6d28d9&color=fff',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false
        },
        {
          id: '1007',
          conversationId: '1',
          senderId: '101',
          senderName: 'Alex Johnson',
          content: 'Sure, I\'m available this afternoon if you want to discuss it.',
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 minutes ago
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false
        },
        {
          id: '1008',
          conversationId: '1',
          senderId: mockUser?.id || 'current-user',
          senderName: mockUser?.username || 'You',
          content: 'Perfect! Let\'s meet at 3pm.',
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 minutes ago
          avatar: mockUser?.avatar || 'https://ui-avatars.com/api/?name=You&background=6d28d9&color=fff',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false
        },
        {
          id: '1009',
          conversationId: '1',
          senderId: '101',
          senderName: 'Alex Johnson',
          content: 'Sounds good. I\'ll prepare some mockups.',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false
        },
        {
          id: '1010',
          conversationId: '1',
          senderId: '101',
          senderName: 'Alex Johnson',
          content: 'Here\'s a preview of what I\'m thinking:',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          status: 'read',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false,
          attachments: [
            {
              id: 'a2',
              type: 'image',
              url: 'https://via.placeholder.com/800x600/6d28d9/FFFFFF?text=UI+Mockup',
              name: 'ui_mockup.png',
              size: '1.2 MB'
            }
          ]
        },
        {
          id: '1011',
          conversationId: '1',
          senderId: mockUser?.id || 'current-user',
          senderName: mockUser?.username || 'You',
          content: 'That looks great! I like the layout.',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          avatar: mockUser?.avatar || 'https://ui-avatars.com/api/?name=You&background=6d28d9&color=fff',
          status: 'delivered',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false,
          reactions: [
            {
              emoji: '👍',
              userId: mockUser?.id || 'current-user',
              username: mockUser?.username || 'You'
            },
            {
              emoji: '🎉',
              userId: '101',
              username: 'Alex Johnson'
            }
          ]
        }
      ];
      
      setMessages(mockMessages);
    }
  }, [mockUser, conversations.length]);

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };
  
  // Handle attachment menu
  const handleAttachClick = () => {
    setShowAttachMenu(!showAttachMenu);
    setShowEmojiPicker(false);
  };

  // Handle emoji picker
  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowAttachMenu(false);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !activeConversation || !mockUser) return;
    
    // Process each file
    Array.from(files).forEach(file => {
      // Create a unique ID for this attachment
      const attachmentId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Determine file type
      let type: 'image' | 'file' | 'audio' | 'video' = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('video/')) type = 'video';
      
      // Format file size
      const size = formatFileSize(file.size);
      
      // Create temporary URL for preview
      const url = URL.createObjectURL(file);
      
      // Create attachment object
      const attachment: Attachment = {
        id: attachmentId,
        type,
        url,
        name: file.name,
        size,
        mimeType: file.type
      };
      
      // Create a temporary message with the attachment
      const tempId = `temp-${Date.now()}`;
      const newMsg: Message = {
        id: tempId,
        conversationId: activeConversation.id,
        senderId: mockUser.id,
        senderName: mockUser.username,
        content: '',
        timestamp: new Date().toISOString(),
        avatar: mockUser.avatar,
        status: 'sending',
        edited: false,
        deleted: false,
        pinned: false,
        forwarded: false,
        attachments: [attachment]
      };
      
      // Add to local messages immediately
      setMessages(prev => [...prev, newMsg]);
      
      // In a real app, you would upload the file to a server here
      // For demo purposes, we'll simulate a successful upload after a delay
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, status: 'sent' } 
              : msg
          )
        );
      }, 1500);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setShowAttachMenu(false);
  };

  // Handle voice recording
  const handleMicClick = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setRecordingDuration(0);
      
      // Update duration every second
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // In a real app, you would start the actual audio recording here
    } else {
      // Stop recording
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // In a real app, you would stop the recording and send the audio file
      // For demo purposes, we'll simulate sending an audio message
      if (recordingDuration > 1 && activeConversation && mockUser) {
        const tempId = `temp-${Date.now()}`;
        const newMsg: Message = {
          id: tempId,
          conversationId: activeConversation.id,
          senderId: mockUser.id,
          senderName: mockUser.username,
          content: '',
          timestamp: new Date().toISOString(),
          avatar: mockUser.avatar,
          status: 'sending',
          edited: false,
          deleted: false,
          pinned: false,
          forwarded: false,
          attachments: [{
            id: `audio-${tempId}`,
            type: 'audio',
            url: '#',
            name: `Voice message (${formatDuration(recordingDuration)})`,
            size: '64 KB',
            duration: recordingDuration
          }]
        };
        
        setMessages(prev => [...prev, newMsg]);
        
        // Simulate successful sending
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, status: 'sent' } 
                : msg
            )
          );
        }, 1500);
      }
      
      setRecordingDuration(0);
      setRecordingStartTime(null);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };
  
  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };
  
  // Group messages by date and consecutive sender
  const groupedMessages = useMemo(() => {
    if (!messages.length) return [];
    
    const groups: Message[][] = [];
    let currentGroup: Message[] = [messages[0]];
    
    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const prevMessage = messages[i - 1];
      
      // Check if messages are from the same sender and within 5 minutes of each other
      const sameDay = format(new Date(currentMessage.timestamp), 'yyyy-MM-dd') === 
                      format(new Date(prevMessage.timestamp), 'yyyy-MM-dd');
      const sameUser = currentMessage.senderId === prevMessage.senderId;
      const timeGap = Math.abs(new Date(currentMessage.timestamp).getTime() - 
                     new Date(prevMessage.timestamp).getTime()) <= 5 * 60 * 1000;
      
      if (sameDay && sameUser && timeGap) {
        currentGroup.push(currentMessage);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [currentMessage];
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }, [messages]);
  
  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    hasNewMessages.current = false;
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };
  
  // Get message status icon
  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <div className="h-3 w-3 text-red-500">!</div>;
      default:
        return null;
    }
  };
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => 
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.participants.some(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="flex-1 flex h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Conversations sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} h-full bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border transition-all duration-300 ease-in-out overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary mb-4">Messages</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-dark-text-primary text-sm"
            />
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-muted" />
          </div>
          
          {/* Filter options */}
          <div className="flex mt-3 space-x-2">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${filterType === 'all' 
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' 
                : 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text-secondary'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${filterType === 'unread' 
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' 
                : 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text-secondary'}`}
            >
              Unread
            </button>
            <button 
              onClick={() => setFilterType('pinned')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${filterType === 'pinned' 
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' 
                : 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text-secondary'}`}
            >
              Pinned
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 dark:text-dark-text-muted mb-2" />
              <p className="text-gray-500 dark:text-dark-text-secondary text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                Start a new chat
              </button>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div 
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${activeConversation?.id === conversation.id 
                  ? 'bg-purple-50 dark:bg-purple-900/10' 
                  : 'hover:bg-gray-50 dark:hover:bg-dark-bg/70'
                } ${conversation.pinned ? 'border-l-2 border-purple-500 dark:border-purple-400' : ''}`}
              >
                <div className="relative">
                  <img 
                    src={conversation.avatar} 
                    alt={conversation.name} 
                    className={`w-12 h-12 rounded-full object-cover ${conversation.type === 'group' ? 'bg-purple-100 dark:bg-purple-900/20' : ''}`} 
                  />
                  {conversation.type === 'direct' && (
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(
                      conversation.participants.find(p => !p.isCurrentUser)?.status || 'offline'
                    )} border-2 border-white dark:border-dark-card rounded-full`}></div>
                  )}
                  {conversation.type === 'group' && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-white dark:bg-dark-card rounded-full flex items-center justify-center">
                      <Users size={10} className="text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-gray-900 dark:text-dark-text-primary truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                      {conversation.lastMessage ? formatTimestamp(conversation.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary truncate">
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.senderId === mockUser.id ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </>
                      ) : 'No messages yet'}
                    </p>
                    
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      {conversation.muted && (
                        <div className="text-gray-400 dark:text-dark-text-muted">
                          <Bell size={12} />
                        </div>
                      )}
                      
                      {conversation.unreadCount > 0 && (
                        <div className="bg-purple-600 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="mr-4 text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {activeConversation && (
              <div className="flex items-center">
                <div className="relative">
                  <img 
                    src={activeConversation.avatar} 
                    alt={activeConversation.name} 
                    className={`w-10 h-10 rounded-full object-cover ${activeConversation.type === 'group' ? 'bg-purple-100 dark:bg-purple-900/20' : ''}`} 
                  />
                  {activeConversation.type === 'direct' && (
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(
                      activeConversation.participants.find(p => !p.isCurrentUser)?.status || 'offline'
                    )} border-2 border-white dark:border-dark-card rounded-full`}></div>
                  )}
                  {activeConversation.type === 'group' && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-white dark:bg-dark-card rounded-full flex items-center justify-center">
                      <Users size={10} className="text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">{activeConversation.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                    {activeConversation.type === 'direct' ? (
                      activeConversation.participants.find(p => !p.isCurrentUser)?.status === 'online' 
                        ? 'Active now' 
                        : `Last seen ${formatTimestamp(activeConversation.participants.find(p => !p.isCurrentUser)?.lastSeen || '')}`
                    ) : (
                      `${activeConversation.participants.length} members`
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary">
              <Phone className="h-5 w-5" />
            </button>
            <button className="text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary">
              <Video className="h-5 w-5" />
            </button>
            <button className="text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary">
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>
                
        
        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-dark-bg"
        >
          {/* New messages notification */}
          {hasNewMessages.current && (
            <div className="sticky top-2 flex justify-center">
              <button 
                onClick={scrollToBottom}
                className="bg-purple-600 text-white text-xs rounded-full px-3 py-1 flex items-center shadow-md hover:bg-purple-700 transition-colors"
              >
                New messages <ChevronDown size={14} className="ml-1" />
              </button>
            </div>
          )}
          
          {/* Loading indicator */}
          {loadingMore && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          )}
          
          {/* Load more button */}
          {messages.length > 0 && hasMoreMessages && (
            <div className="flex justify-center mb-4">
              <button 
                onClick={() => loadMoreMessages()}
                className="text-purple-600 text-sm hover:text-purple-800 transition-colors"
              >
                Load earlier messages
              </button>
            </div>
          )}
          
          {/* Date separator */}
          {messages.length > 0 && (
            <div className="flex justify-center mb-4">
              <div className="bg-gray-200 dark:bg-dark-card text-gray-500 dark:text-dark-text-secondary text-xs rounded-full px-3 py-1">
                {format(new Date(messages[0].timestamp), 'MMMM d, yyyy')}
              </div>
            </div>
          )}
          
          {/* Message groups */}
          {groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              {/* Date separator if needed */}
              {groupIndex > 0 && (
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-200 dark:bg-dark-card text-gray-500 dark:text-dark-text-secondary text-xs rounded-full px-3 py-1">
                    {format(new Date(group[0].timestamp), 'MMMM d, yyyy')}
                  </div>
                </div>
              )}
              
              {/* Messages in group */}
              {group.map((message, index) => {
                const isCurrentUserMsg = message.senderId === mockUser.id;
                const showAvatar = index === 0 || group[index - 1].senderId !== message.senderId;
                const isLastInGroup = index === group.length - 1 || group[index + 1].senderId !== message.senderId;
                
                return (
                  <div 
                    key={message.id} 
                    ref={index === group.length - 1 && groupIndex === groupedMessages.length - 1 ? lastMessageRef : null}
                    className={`flex mb-1 ${isCurrentUserMsg ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-4' : ''}`}
                  >
                    {!isCurrentUserMsg && showAvatar && (
                      <div className="flex-shrink-0 mr-2">
                        <img 
                          src={activeConversation?.participants.find(p => p.id === message.senderId)?.avatar || ''} 
                          alt="Avatar" 
                          className="h-8 w-8 rounded-full mt-1" 
                        />
                      </div>
                    )}
                    {!isCurrentUserMsg && !showAvatar && <div className="w-10 flex-shrink-0"></div>}
                    
                    <div className="relative group max-w-[70%]">
                      {/* Message bubble */}
                      <div 
                        className={`relative rounded-lg px-4 py-2 ${isCurrentUserMsg 
                          ? message.status === 'error' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' 
                            : 'bg-purple-600 text-white' 
                          : 'bg-white dark:bg-dark-card text-gray-800 dark:text-dark-text-primary'}`}
                      >
                        {/* Sender name for group chats */}
                        {activeConversation?.type === 'group' && !isCurrentUserMsg && showAvatar && (
                          <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                            {activeConversation.participants.find(p => p.id === message.senderId)?.name}
                          </div>
                        )}
                        
                        {/* Message content */}
                        {message.edited ? (
                          <div className="italic text-sm">
                            {message.content}
                            <span className="text-xs ml-1 opacity-70">(edited)</span>
                          </div>
                        ) : (
                          <div>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Display attachments if any */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment, idx) => (
                                  attachment.type === 'image' ? (
                                    <img 
                                      key={idx} 
                                      src={attachment.url} 
                                      alt="Attachment" 
                                      className="max-w-full rounded-lg max-h-60 object-cover" 
                                    />
                                  ) : attachment.type === 'file' ? (
                                    <div key={idx} className="flex items-center p-2 bg-gray-100 dark:bg-dark-bg/50 rounded-lg">
                                      <File className="h-4 w-4 mr-2 text-gray-500 dark:text-dark-text-muted" />
                                      <span className="text-sm text-gray-700 dark:text-dark-text-secondary">{attachment.name}</span>
                                      <span className="ml-auto text-xs text-gray-500 dark:text-dark-text-muted">{attachment.size}</span>
                                    </div>
                                  ) : attachment.type === 'audio' && (
                                    <div key={idx} className="flex items-center p-2 bg-gray-100 dark:bg-dark-bg/50 rounded-lg">
                                      <Mic className="h-4 w-4 mr-2 text-gray-500 dark:text-dark-text-muted" />
                                      <span className="text-sm text-gray-700 dark:text-dark-text-secondary">Voice message</span>
                                      <span className="ml-auto text-xs text-gray-500 dark:text-dark-text-muted">{attachment.duration}s</span>
                                      <button className="ml-2 text-purple-600">
                                        <Play size={16} />
                                      </button>
                                    </div>
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Message timestamp */}
                        <div className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className={`text-xs ${isCurrentUserMsg ? 'text-purple-200' : 'text-gray-400 dark:text-dark-text-muted'}`}>
                            {format(new Date(message.timestamp), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Message status for current user's messages */}
                      {isCurrentUserMsg && (
                        <div className="flex items-center justify-end mt-1 text-xs text-gray-500 dark:text-dark-text-muted">
                          {message.status === 'sending' && <Clock size={12} className="mr-1" />}
                          {message.status === 'sent' && <Check size={12} className="mr-1" />}
                          {message.status === 'delivered' && <CheckCheck size={12} className="mr-1" />}
                          {message.status === 'read' && <CheckCheck size={12} className="text-blue-500 mr-1" />}
                          {message.status === 'failed' && <span className="text-red-500 mr-1">Failed</span>}
                        </div>
                      )}
                      
                      {/* Message reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex mt-1 ml-2">
                          {message.reactions.map((reaction, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-center bg-white dark:bg-dark-card rounded-full px-2 py-1 text-xs shadow-sm mr-1"
                            >
                              <span className="mr-1">{reaction.emoji}</span>
                              <span className="text-gray-600 dark:text-dark-text-secondary">{reaction.username}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {isCurrentUserMsg && showAvatar && (
                      <div className="flex-shrink-0 ml-2">
                        <img 
                          src={mockUser?.avatar || 'https://ui-avatars.com/api/?name=You&background=6d28d9&color=fff'} 
                          alt="Your avatar" 
                          className="h-8 w-8 rounded-full mt-1" 
                        />
                      </div>
                    )}
                    {isCurrentUserMsg && !showAvatar && <div className="w-10 flex-shrink-0"></div>}
                  </div>
                );
              })}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message input area */}
        <form onSubmit={handleSendMessage} className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border p-4">
          {/* Attachment menu */}
          {showAttachMenu && (
            <div className="absolute bottom-20 left-4 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border p-2 flex space-x-2 animate-fade-in-up">
              <button 
                type="button" 
                onClick={handleFileUpload}
                className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
              >
                <Paperclip className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </button>
              <button 
                type="button" 
                onClick={handleFileUpload}
                className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
              >
                <Image className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={() => setShowAttachMenu(false)}
              />
            </div>
          )}
          
          {/* Emoji picker (simplified) */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border p-3 animate-fade-in-up">
              <div className="grid grid-cols-6 gap-2">
                {['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🙏', '😎', '🤔', '😢', '😮'].map((emoji) => (
                  <button 
                    key={emoji} 
                    type="button" 
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                      messageInputRef.current?.focus();
                    }}
                    className="text-2xl hover:bg-gray-100 dark:hover:bg-dark-bg p-1 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2 relative">
            <button 
              type="button" 
              onClick={handleAttachClick}
              className={`p-2 rounded-full transition-colors ${showAttachMenu 
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-500 dark:text-dark-text-secondary'}`}
              aria-label="Attach files"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            
            <div className="relative flex-1">
              <input
                type="text"
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isRecording ? "Recording audio..." : "Type a message..."}
                disabled={isRecording}
                className="w-full p-3 pr-10 border border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {isRecording && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                  <span className="text-sm text-red-500">Recording...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                type="button" 
                onClick={handleMicClick}
                className={`p-2 rounded-full transition-colors ${isRecording 
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-500 dark:text-dark-text-secondary'}`}
                aria-label={isRecording ? "Stop recording" : "Record audio"}
              >
                <Mic className="h-5 w-5" />
              </button>
              
              <button 
                type="button" 
                onClick={handleEmojiClick}
                className={`p-2 rounded-full transition-colors ${showEmojiPicker 
                  ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-500 dark:text-dark-text-secondary'}`}
                aria-label="Add emoji"
              >
                <Smile className="h-5 w-5" />
              </button>
              
              <button
                type="submit"
                disabled={!newMessage.trim() && !isRecording}
                className={`p-3 rounded-full transition-all z-10 ${!newMessage.trim() && !isRecording 
                  ? 'bg-purple-400 dark:bg-purple-700' 
                  : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700'} shadow-sm`}
                aria-label="Send message"
              >
                <Send className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;