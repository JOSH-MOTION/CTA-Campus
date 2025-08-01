// src/app/(app)/chat/page.tsx
'use client';

import {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Search, Send, User, Users, Loader2, Check, Verified, CheckCheck} from 'lucide-react';
import {Chat} from '@/components/chat/Chat';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {Message, getChatId, sendMessage, onMessages} from '@/services/chat';
import {Unsubscribe} from 'firebase/firestore';
import {useToast} from '@/hooks/use-toast';
import {Badge} from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationsContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isYesterday } from 'date-fns';

type ChatEntityType = 'dm' | 'group';
type ChatEntity = {id: string; name: string; type: ChatEntityType; avatar?: string; dataAiHint: string, lastMessage?: string, lastMessageTimestamp?: Date, unreadCount?: number};

export default function ChatPage() {
  const {user: currentUser, fetchAllUsers, userData, role} = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {toast} = useToast();
  const { addNotificationForUser } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  
  const [selectedChat, setSelectedChat] = useState<ChatEntity | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'dms' | 'groups'>('dms');
  const messageUnsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
        setLoading(true);
        const users = await fetchAllUsers();
        setAllUsers(users);
        setLoading(false);
    }
    loadUsers();
  }, [fetchAllUsers]);

  const otherUsers = useMemo(() => {
    if (!currentUser || !role) return [];

    if (role === 'student') {
      const studentGen = userData?.gen;
      return allUsers.filter(u => {
        if (u.uid === currentUser.uid) return false; // Exclude self
        if (u.role === 'teacher' || u.role === 'admin') return true; // Include all teachers/admins
        if (u.role === 'student' && u.gen === studentGen) return true; // Include students from the same gen
        return false;
      });
    }

    // For teachers and admins, show everyone else
    return allUsers.filter(u => u.uid !== currentUser.uid);
  }, [allUsers, currentUser, role, userData?.gen]);

  const groupChats = useMemo(() => {
    const groups: Omit<ChatEntity, 'type' | 'lastMessage' | 'lastMessageTimestamp' | 'unreadCount' >[] = [];
    if (role === 'teacher' || role === 'admin') {
      const allStudents = allUsers.filter(u => u.role === 'student');
      const allGens = new Set(allStudents.map(student => student.gen).filter(Boolean));
      allGens.forEach(gen => {
        groups.push({id: `group-${gen}`, name: `${gen} Hub`, dataAiHint: 'group students'});
      });
    } else if (role === 'student' && userData?.gen) {
      groups.push({
        id: `group-${userData.gen}`,
        name: `${userData.gen} Hub`,
        dataAiHint: 'group students',
      });
    }
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  }, [role, userData, allUsers]);

  const markChatAsRead = useCallback((chatId: string) => {
    localStorage.setItem(`lastSeen_${chatId}`, Date.now().toString());
  }, []);

  const handleSelectChat = useCallback((entity: ChatEntity) => {
    setSelectedChat(entity);
    const newPath = entity.type === 'group' ? `/chat?group=${entity.id.replace('group-', '')}` : `/chat?dm=${entity.id}`;
    router.push(newPath, {scroll: false});
    
    let chatId: string;
    if (entity.type === 'dm' && currentUser) {
        chatId = getChatId(currentUser.uid, entity.id);
    } else {
        chatId = entity.id;
    }
    markChatAsRead(chatId);

  }, [router, currentUser, markChatAsRead]);

  useEffect(() => {
    if (loading || !currentUser) return;
    
    const directMessageUserId = searchParams.get('dm');
    const groupChatId = searchParams.get('group');

    if (groupChatId) {
        const groupToSelect = groupChats.find(g => g.id === `group-${groupChatId}`);
        if (groupToSelect && (!selectedChat || selectedChat.id !== groupToSelect.id)) {
          setSelectedChat({...groupToSelect, type: 'group'});
          setActiveTab('groups');
        }
      } else if (directMessageUserId) {
        const userToDm = allUsers.find(u => u.uid === directMessageUserId);
        if (userToDm && (!selectedChat || selectedChat.id !== userToDm.uid)) {
            setSelectedChat({
              id: userToDm.uid,
              name: userToDm.displayName,
              type: 'dm',
              avatar: userToDm.photoURL,
              dataAiHint: 'user portrait',
            });
          setActiveTab('dms');
        }
      }
  }, [loading, allUsers, groupChats, currentUser, searchParams, selectedChat, handleSelectChat]);
  

  useEffect(() => {
      if (!selectedChat || !currentUser) return;

      if (messageUnsubscribeRef.current) {
        messageUnsubscribeRef.current();
      }

      let chatId: string;
      if (selectedChat.type === 'dm') {
        chatId = getChatId(currentUser.uid, selectedChat.id);
      } else {
        chatId = selectedChat.id;
      }
      
      setMessages([]); // Clear previous messages
      markChatAsRead(chatId);
      
      const unsubscribe = onMessages(chatId, newMessages => {
        setMessages(newMessages);
      });
      messageUnsubscribeRef.current = unsubscribe;

      if(selectedChat.type === 'group') {
        setActiveTab('groups')
      } else {
        setActiveTab('dms')
      }

      return () => {
        if (messageUnsubscribeRef.current) {
          messageUnsubscribeRef.current();
        }
      };
    }, [selectedChat, currentUser, markChatAsRead]);

    const handleSendMessage = async (text: string, replyTo?: Message) => {
        if (!selectedChat || !text.trim() || !currentUser) return;
    
        let chatId: string;
        let chatName: string;
    
        if (selectedChat.type === 'group') {
          chatId = selectedChat.id;
          chatName = selectedChat.name;
        } else {
          chatId = getChatId(currentUser.uid, selectedChat.id);
          chatName = `your DM with ${selectedChat.name}`
        }
    
        const messagePayload: any = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'User',
            text: text.trim(),
            read: false,
        };
    
        if (replyTo) {
            messagePayload.replyTo = {
                messageId: replyTo.id,
                text: replyTo.text,
                senderName: replyTo.senderName,
            };
        }
        
        await sendMessage(chatId, messagePayload);
    
        const mentionRegex = /@(\w+)/g;
        const mentions = text.match(mentionRegex);
    
        if (mentions) {
            const mentionedUsernames = mentions.map(m => m.substring(1).toLowerCase());
            const usersToNotify = allUsers.filter(u => 
                mentionedUsernames.includes(u.displayName.toLowerCase()) && u.uid !== currentUser.uid
            );
    
            for (const userToNotify of usersToNotify) {
                await addNotificationForUser(userToNotify.uid, {
                    title: `You were mentioned in ${chatName}`,
                    description: `${currentUser.displayName}: "${text.trim()}"`,
                    href: selectedChat.type === 'group' 
                        ? `/chat?group=${selectedChat.id.replace('group-', '')}` 
                        : `/chat?dm=${currentUser.uid}`
                });
            }
        }
      };
  
  const handleTabChange = (value: string) => {
      const newTab = value as 'dms' | 'groups';
      setActiveTab(newTab);
  }

  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yyyy');
  };
  
  const chatList: ChatEntity[] = useMemo(() => {
     const dms = otherUsers.map(user => ({
        id: user.uid,
        name: user.displayName,
        type: 'dm' as ChatEntityType,
        avatar: user.photoURL,
        dataAiHint: 'student portrait'
     }));
     const grps = groupChats.map(g => ({...g, type: 'group' as ChatEntityType}));
     return [...dms, ...grps];
  }, [otherUsers, groupChats]);

  return (
    <div className="grid h-screen grid-cols-1 md:grid-cols-3 xl:grid-cols-4 bg-[#0b141a]">
      <div className="flex flex-col border-r border-white/10 bg-[#111b21] md:col-span-1 xl:col-span-1">
        <header className="flex h-[60px] items-center justify-between bg-[#202c33] px-4">
            <h1 className="text-xl font-medium text-gray-200">Chats</h1>
        </header>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search or start new chat" className="bg-[#202c33] border-none text-gray-200 pl-12 rounded-lg focus:ring-0" />
          </div>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto">
            <ScrollArea className="h-full">
                <TabsContent value="dms" className="m-0">
                {loading ? (
                    <div className="flex justify-center items-center p-4"> <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> </div>
                ) : (
                    <div className="flex flex-col">
                    {otherUsers.map(user => {
                        return (
                             <button
                                key={user.uid}
                                className={`w-full text-left p-3 hover:bg-[#202c33] transition-colors flex items-center gap-4 ${selectedChat?.id === user.uid ? 'bg-[#202c33]' : ''}`}
                                onClick={() => handleSelectChat({id: user.uid, name: user.displayName, type: 'dm', avatar: user.photoURL, dataAiHint: 'student portrait'})}
                            >
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 border-t border-white/10 pt-3">
                                    <div className="flex justify-between">
                                        <p className="font-semibold text-gray-100">{user.displayName}</p>
                                        <p className="text-xs text-gray-400">{formatTimestamp(new Date())}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
                                        <div className="flex items-center gap-1">
                                           <CheckCheck className="h-4 w-4 text-sky-400" />
                                            <p className="truncate">This is the last message</p>
                                        </div>
                                        <Badge className="bg-[#25d366] text-white rounded-full h-5 w-5 p-0 flex items-center justify-center">2</Badge>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                    </div>
                )}
                </TabsContent>
                <TabsContent value="groups" className="m-0">
                {loading ? (
                    <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : (
                     <div className="flex flex-col">
                    {groupChats.map(group => {
                        return (
                             <button
                                key={group.id}
                                className={`w-full text-left p-3 hover:bg-[#202c33] transition-colors flex items-center gap-4 ${selectedChat?.id === group.id ? 'bg-[#202c33]' : ''}`}
                                onClick={() => handleSelectChat({...group, type: 'group'})}
                            >
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 border-t border-white/10 pt-3">
                                    <div className="flex justify-between">
                                        <p className="font-semibold text-gray-100">{group.name}</p>
                                        <p className="text-xs text-gray-400">{formatTimestamp(new Date())}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
                                       <div className="flex items-center gap-1">
                                            <CheckCheck className="h-4 w-4 text-sky-400" />
                                            <p className="truncate">This is the last message for the group</p>
                                        </div>
                                        <Badge className="bg-[#25d366] text-white rounded-full h-5 w-5 p-0 flex items-center justify-center">5</Badge>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                    </div>
                )}
                </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </div>

      <div className="flex flex-col md:col-span-2 xl:col-span-3 h-screen">
        {selectedChat ? (
          <Chat
            key={selectedChat.id}
            entity={selectedChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={currentUser}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#0b141a]">
            <div className="text-center text-gray-400">
                <h2 className="text-3xl text-gray-200">Campus Compass Chat</h2>
                <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
