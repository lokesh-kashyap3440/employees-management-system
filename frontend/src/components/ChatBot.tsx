import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Bot, Briefcase, Building2 } from 'lucide-react';
import { chatbotApi } from '../services/api';
import type { Employee } from '../types/employee';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  results?: Employee[];
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your Employee Assistant. Ask me anything about the team, like 'Who earns more than 60000?' or 'Who is in Engineering?'",
      sender: 'bot',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbotApi.query(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'bot',
        results: response.results,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I'm having trouble processing that right now.",
          sender: 'bot',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white w-[90vw] h-[70vh] md:w-[400px] md:h-[600px] rounded-[2.5rem] shadow-2xl border border-blue-50 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black tracking-tight">Team Assistant</h3>
                  <p className="text-xs text-blue-100 font-bold uppercase">Online & Ready</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] flex gap-3 ${
                      m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 shadow-sm'
                      }`}
                    >
                      {m.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="space-y-3">
                      <div
                        className={`p-4 rounded-2xl text-sm font-medium ${
                          m.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-none'
                        }`}
                      >
                        {m.text}
                      </div>

                      {m.results && m.results.length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          {m.results.map((emp) => (
                            <div
                              key={emp._id}
                              className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50 flex flex-col gap-1"
                            >
                              <p className="font-bold text-gray-900 text-xs">{emp.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <Briefcase size={10} />
                                <span>{emp.position}</span>
                                <span className="text-gray-200">|</span>
                                <Building2 size={10} />
                                <span>{emp.department}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none flex gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me something..."
                  className="w-full pl-6 pr-14 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-16 w-16 rounded-3xl shadow-2xl flex items-center justify-center transition-all ${
          isOpen ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
};
