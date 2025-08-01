// src/app/(app)/chat/page.tsx
'use client';

import {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Search, Users, Loader2} from 'lucide-react';
import {Chat} from '@/components/chat/Chat';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {Message, getChatId, sendMessage, onMessages} from '@/services/chat';
import {Unsubscribe} from 'firebase/firestore';
import {useToast} from '@/hooks/use-toast';
import {useNotifications} from '@/contexts/NotificationsContext';
import {ScrollArea} from '@/components/ui/scroll-area';
import {format} from 'date-fns';
import {cn} from '@/lib/utils';
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from '@/components/ui/sheet';

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
  const messageUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const [isContactListOpen, setIsContactListOpen] = useState(false);

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
        if (u.uid === currentUser.uid) return false;
        if (u.role === 'teacher' || u.role === 'admin') return true;
        if (u.role === 'student' && u.gen === studentGen) return true;
        return false;
      });
    }

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
    setIsContactListOpen(false); // Close drawer on selection
  }, [router, currentUser, markChatAsRead]);

  useEffect(() => {
    if (loading || !currentUser) return;
    
    const directMessageUserId = searchParams.get('dm');
    const groupChatId = searchParams.get('group');

    if (groupChatId) {
        const groupToSelect = groupChats.find(g => g.id === `group-${groupChatId}`);
        if (groupToSelect && (!selectedChat || selectedChat.id !== groupToSelect.id)) {
          setSelectedChat({...groupToSelect, type: 'group'});
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
        }
      } else if (otherUsers.length > 0) {
        const firstUser = otherUsers[0];
         handleSelectChat({
            id: firstUser.uid,
            name: firstUser.displayName,
            type: 'dm',
            avatar: firstUser.photoURL,
            dataAiHint: 'student portrait',
         })
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
      
      setMessages([]);
      markChatAsRead(chatId);
      
      const unsubscribe = onMessages(chatId, newMessages => {
        setMessages(newMessages);
      });
      messageUnsubscribeRef.current = unsubscribe;

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
  
  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    return format(date, 'HH:mm');
  };
  
  const chatList = useMemo(() => {
     const dms = otherUsers.map(user => ({
        id: user.uid,
        name: user.displayName,
        type: 'dm' as ChatEntityType,
        avatar: user.photoURL,
        dataAiHint: 'student portrait'
     }));
     const grps = groupChats.map(g => ({...g, type: 'group' as ChatEntityType, avatar: `https://placehold.co/100x100.png?text=${g.name.charAt(0)}`}));
     return [...grps, ...dms];
  }, [otherUsers, groupChats]);

  const ContactList = () => (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
        <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <SheetTitle>Contact list</SheetTitle>
        </SheetHeader>
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input placeholder="Search" className="bg-gray-100 dark:bg-gray-800 border-none pl-10 rounded-lg" />
          </div>
        </div>
        <ScrollArea className="flex-1">
            <div className="flex flex-col">
                {loading ? (
                    <div className="flex justify-center items-center p-4"> <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> </div>
                ) : (
                    <>
                    {groupChats.map(chatItem => (
                        <button
                            key={chatItem.id}
                            className={cn(
                                "w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3",
                                selectedChat?.id === chatItem.id && "bg-primary/10 dark:bg-primary/20"
                            )}
                            onClick={() => handleSelectChat({...chatItem, type: 'group'})}
                        >
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={`https://placehold.co/100x100.png?text=${chatItem.name.charAt(0)}`} alt={chatItem.name} data-ai-hint={chatItem.dataAiHint} />
                                <AvatarFallback>{chatItem.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <p className="font-semibold text-sm">{chatItem.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(new Date())}</p>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    Group Chat
                                </p>
                            </div>
                        </button>
                    ))}
                    {otherUsers.map(chatItem => (
                        <button
                            key={chatItem.uid}
                            className={cn(
                                "w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3",
                                selectedChat?.id === chatItem.uid && "bg-primary/10 dark:bg-primary/20"
                            )}
                            onClick={() => handleSelectChat({id: chatItem.uid, name: chatItem.displayName, type: 'dm', avatar: chatItem.photoURL, dataAiHint: 'student portrait'})}
                        >
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={chatItem.photoURL} alt={chatItem.displayName} data-ai-hint={'student portrait'} />
                                <AvatarFallback>{chatItem.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <p className="font-semibold text-sm">{chatItem.displayName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(new Date())}</p>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    Direct Message
                                </p>
                            </div>
                        </button>
                    ))}
                    </>
                )}
            </div>
        </ScrollArea>
    </div>
  );

  return (
    <div className="h-full w-full overflow-hidden">
        <Sheet open={isContactListOpen} onOpenChange={setIsContactListOpen}>
            <SheetContent side="left" className="p-0 w-[350px]">
                <ContactList />
            </SheetContent>
        </Sheet>
        
        {selectedChat ? (
          <Chat
            key={selectedChat.id}
            entity={selectedChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={currentUser}
            onToggleContacts={() => setIsContactListOpen(prev => !prev)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
            {loading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
                <div className="text-center text-gray-500">
                    <h2 className="text-2xl font-semibold">Campus Connect</h2>
                    <p>Select a chat to start messaging</p>
                    <Button onClick={() => setIsContactListOpen(true)} className="mt-4">
                        <Users className="mr-2 h-4 w-4" />
                        Open Contacts
                    </Button>
                </div>
            )}
          </div>
        )}
    </div>
  );
}
