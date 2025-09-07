// src/app/(app)/chat/page.tsx
'use client';

import {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Search, Users, Loader2, MessageSquare} from 'lucide-react';
import {Chat} from '@/components/chat/Chat';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {Message, getChatId, sendMessage, onMessages} from '@/services/chat';
import {Unsubscribe} from 'firebase/firestore';
import {useToast} from '@/hooks/use-toast';
import {useNotifications} from '@/contexts/NotificationsContext';
import {ScrollArea} from '@/components/ui/scroll-area';
import {cn} from '@/lib/utils';
import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet';

type ChatEntityType = 'dm' | 'group';
type ChatEntity = {id: string; name: string; type: ChatEntityType; avatar?: string; dataAiHint: string};

export default function ChatPage() {
  const {user: currentUser, fetchAllUsers} = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {toast} = useToast();
  const {clearNotificationsForChat} = useNotifications();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<ChatEntity | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messageUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const [isContactListOpen, setIsContactListOpen] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const users = await fetchAllUsers();
      setAllUsers(users);
      setLoading(false);
    };
    loadUsers();
  }, [fetchAllUsers]);

  const otherUsers = useMemo(
    () =>
      allUsers.filter(
        u =>
          u.uid !== currentUser?.uid &&
          (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [allUsers, currentUser, searchTerm]
  );

  // This logic should be adapted for your group chat implementation
  const groupChats = useMemo(() => {
    // Placeholder for group chat logic
    return [{id: 'general', name: 'General Chat', type: 'group' as 'group', dataAiHint: 'group chat'}];
  }, []);

  const handleSelectChat = useCallback(
    (entity: ChatEntity) => {
      const newPath =
        entity.type === 'group' ? `/chat?group=${entity.id}` : `/chat?dm=${entity.id}`;
      router.push(newPath, {scroll: false});
      setIsContactListOpen(false); // Close drawer on selection
      if (currentUser) {
        let chatId = entity.type === 'dm' ? getChatId(currentUser.uid, entity.id) : entity.id;
        clearNotificationsForChat(chatId);
      }
    },
    [router, currentUser, clearNotificationsForChat]
  );

  useEffect(() => {
    if (!currentUser || loading) return;

    const directMessageUserId = searchParams.get('dm');
    const groupChatId = searchParams.get('group');

    let targetEntity: ChatEntity | null = null;
    if (directMessageUserId) {
      const userToDm = allUsers.find(u => u.uid === directMessageUserId);
      if (userToDm) {
        targetEntity = {
          id: userToDm.uid,
          name: userToDm.displayName,
          type: 'dm',
          avatar: userToDm.photoURL,
          dataAiHint: 'user portrait',
        };
      }
    } else if (groupChatId) {
      const groupToSelect = groupChats.find(g => g.id === groupChatId);
      if (groupToSelect) {
        targetEntity = {
          id: groupToSelect.id,
          name: groupToSelect.name,
          type: 'group',
          dataAiHint: 'group chat icon',
        };
      }
    }
    setSelectedChat(targetEntity);
  }, [searchParams, allUsers, currentUser, loading, groupChats]);

  useEffect(() => {
    if (messageUnsubscribeRef.current) {
      messageUnsubscribeRef.current();
    }

    if (selectedChat && currentUser) {
      const chatId =
        selectedChat.type === 'dm' ? getChatId(currentUser.uid, selectedChat.id) : selectedChat.id;
      messageUnsubscribeRef.current = onMessages(chatId, newMessages => {
        setMessages(newMessages);
      });
    }

    return () => {
      if (messageUnsubscribeRef.current) {
        messageUnsubscribeRef.current();
      }
    };
  }, [selectedChat, currentUser]);

  const handleSendMessage = async (text: string, replyTo?: Message) => {
    if (!selectedChat || !text.trim() || !currentUser) return;

    let chatId: string;
    let recipientId: string | null = null;

    if (selectedChat.type === 'group') {
      chatId = selectedChat.id;
    } else {
      chatId = getChatId(currentUser.uid, selectedChat.id);
      recipientId = selectedChat.id;
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
  };

  const ContactList = () => (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <h2 className="text-xl font-semibold">Chats</h2>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              {groupChats.map(chat => (
                <Button
                  key={chat.id}
                  variant={selectedChat?.id === chat.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3"
                  onClick={() => handleSelectChat(chat)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{chat.name}</span>
                </Button>
              ))}
              {otherUsers.map(user => (
                <Button
                  key={user.uid}
                  variant={selectedChat?.id === user.uid ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3"
                  onClick={() =>
                    handleSelectChat({
                      id: user.uid,
                      name: user.displayName,
                      type: 'dm',
                      avatar: user.photoURL,
                      dataAiHint: 'student portrait',
                    })
                  }
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span>{user.displayName}</span>
                    <span className="text-xs text-muted-foreground">{user.gen || user.role}</span>
                  </div>
                </Button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="h-full w-full flex overflow-hidden">
      {/* Mobile Drawer */}
      <Sheet open={isContactListOpen} onOpenChange={setIsContactListOpen}>
        <SheetContent side="left" className="p-0">
          <ContactList />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-80 lg:w-96 border-r">
        <ContactList />
      </div>
      
      {/* Chat View */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <Chat
            key={selectedChat.id}
            entity={selectedChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={currentUser}
            onToggleContacts={() => setIsContactListOpen(prev => !prev)}
            allUsers={allUsers}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
               <MessageSquare className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Select a chat to start messaging</h2>
              <p className="mt-1">Your conversations will appear here.</p>
              <Button onClick={() => setIsContactListOpen(true)} className="mt-4 md:hidden">
                <Users className="mr-2 h-4 w-4" />
                Open Contacts
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}