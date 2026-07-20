import { useState } from 'react';
import { toast } from 'sonner';
import { Send, X } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'greeting', role: 'assistant', content: 'Hi! Ask me anything about your P&L data.' },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);

  const handleSend = async () => {
    const content = input.trim();
    if (!content) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content }]);
    setInput('');
    setIsSending(true);

    try {
      const result = await aiService.sendChatMessage(content, conversationId);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: result.response }]);
      setConversationId(result.conversation_id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-[420px] bg-card border-l shadow-xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <span className="font-display font-semibold">FinSight AI</span>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === 'user'
                ? 'ml-auto max-w-[80%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap'
                : 'mr-auto max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap'
            }
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="p-4 border-t flex gap-2">
        <Input
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSend()}
        />
        <Button size="icon" aria-label="Send" onClick={handleSend} disabled={isSending || !input.trim()}>
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
