'use client';

import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/components/not-found';
import { ArrowUp, Check, Clock3, Copy, Headphones, Landmark, RotateCcw, Send, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type Role = 'user' | 'assistant';
type Message = { id: string; role: Role; content: string; createdAt: Date; rating?: 'up' | 'down' };

const quickQuestions = [
  { label: 'Courses', prompt: 'What courses are available at HASC?' },
  { label: 'Fees', prompt: 'What are the course fees at HASC?' },
  { label: 'Duration', prompt: 'What is the duration of the featured course?' },
  { label: 'Admission Process', prompt: 'How do I apply for admission?' },
  { label: 'Scholarship', prompt: 'Please tell me about the scholarship scheme.' },
  { label: 'Contact Us', prompt: 'How can I contact HASC or request a callback?' },
];

const initialMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Welcome to the HASC digital counselling desk. I can help you explore your next step, understand the admission process, or connect you with an admissions professional.',
  createdAt: new Date(),
};

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function InlineText({ text }: { text: string }) {
  const chunks = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {chunks.map((chunk, index) => {
        if (chunk.startsWith('**') && chunk.endsWith('**')) {
          return <strong key={`${chunk}-${index}`}>{chunk.slice(2, -2)}</strong>;
        }
        if (chunk.startsWith('`') && chunk.endsWith('`')) {
          return <code key={`${chunk}-${index}`}>{chunk.slice(1, -1)}</code>;
        }
        return <span key={`${chunk}-${index}`}>{chunk}</span>;
      })}
    </>
  );
}

function MessageText({ content }: { content: string }) {
  return (
    <div>
      {content.split('\n').map((line, index) => {
        const listItem = line.match(/^\s*[-*]\s+(.*)/);
        if (listItem) {
          return <div className="markdown-list" key={`${line}-${index}`}><InlineText text={listItem[1]} /></div>;
        }
        return <p className="markdown-line" key={`${line}-${index}`}><InlineText text={line || ' '} /></p>;
      })}
    </div>
  );
}

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true">HA</div>;
}

function LeadDialog({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', courseInterest: '' });

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Unable to send request');
      setSubmitted(true);
    } catch {
      setError('We could not send that just now. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="lead-dialog" role="dialog" aria-modal="true" aria-labelledby="lead-title">
        <div className="dialog-heading">
          <div>
            <div className="dialog-kicker">A human follow-up</div>
            <h2 id="lead-title">Request a callback</h2>
          </div>
          <button className="close-dialog" type="button" onClick={onClose} aria-label="Close callback form" data-testid="button-close-lead"><X size={18} /></button>
        </div>
        {submitted ? (
          <div className="lead-success" data-testid="status-lead-success">
            Thank you. Your request is with the HASC admissions team. We will follow up using the details you shared.
            <button className="submit-lead" type="button" onClick={onClose} data-testid="button-done-lead">Close</button>
          </div>
        ) : (
          <>
            <p className="dialog-desc">Share a few details and an admissions professional can continue the conversation with you.</p>
            <form className="lead-form" onSubmit={submitLead}>
              <label className="field-label">Your name
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter your name" data-testid="input-lead-name" />
              </label>
              <label className="field-label">Phone number
                <input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Enter your phone number" data-testid="input-lead-phone" />
              </label>
              <label className="field-label">Course or area of interest
                <input required value={form.courseInterest} onChange={(event) => setForm({ ...form, courseInterest: event.target.value })} placeholder="What would you like to ask about?" data-testid="input-lead-course" />
              </label>
              {error && <div className="error-note" role="alert" data-testid="status-lead-error">{error}</div>}
              <button className="submit-lead" type="submit" disabled={pending} data-testid="button-submit-lead">
                {pending ? 'Sending request…' : 'Send callback request'} <ArrowUp size={14} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export function Assistant({ embed = false }: { embed?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [showLead, setShowLead] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'हिंदी'>('EN');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasConversation = messages.length > 1;
  const latestAssistantId = useMemo(() => [...messages].reverse().find((message) => message.role === 'assistant')?.id, [messages]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, isStreaming]);

  function resetChat() {
    setMessages([{ ...initialMessage, id: `welcome-${Date.now()}`, createdAt: new Date() }]);
    setError('');
    setInput('');
  }

  async function sendMessage(rawText?: string) {
    const content = (rawText ?? input).trim();
    if (!content || isStreaming) return;
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content, createdAt: new Date() };
    const assistantId = `assistant-${Date.now()}`;
    setMessages((current) => [...current, userMessage, { id: assistantId, role: 'assistant', content: '', createdAt: new Date() }]);
    setInput('');
    setError('');
    setIsStreaming(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language === 'हिंदी' ? 'hi' : 'en',
          messages: [...messages.filter((message) => message.id !== 'welcome'), userMessage].map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        }),
      });
      if (!response.ok) throw new Error('The counselling desk is unavailable');
      if (!response.body) throw new Error('No response received');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: answer } : message));
      }
      answer += decoder.decode();
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: answer } : message));
      if (!answer.trim()) throw new Error('The counselling desk returned an empty response');
    } catch {
      setError('We could not reach the counselling desk. Please try again, or request a callback.');
      setMessages((current) => current.filter((message) => message.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function copyMessage(content: string) {
    await navigator.clipboard?.writeText(content);
  }

  async function rateMessage(messageId: string, rating: 'up' | 'down') {
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, rating } : message));
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating }),
      });
    } catch {
      // Feedback is best-effort and should not interrupt counselling.
    }
  }

  return (
    <div className={embed ? 'embed-page' : 'hasc-app'}>
      <div className={embed ? 'embed-frame hasc-shell' : 'hasc-shell'}>
        {!embed && (
          <aside className="hasc-rail">
            <div className="rail-inner">
              <div className="brand-lockup"><BrandMark /><div><div className="brand-title">HASC</div><div className="brand-subtitle">HARTRON · Kaithal</div></div></div>
              <div className="rail-copy">
                <div className="rail-kicker">Digital counselling desk</div>
                <h2 className="rail-heading">A clearer way to plan your next step.</h2>
                <p className="rail-note">Ask a question in your own words. Get a considered answer, then connect with a person when you need one.</p>
                <div className="rail-rule" />
                <div className="rail-foot">Hartron Advanced Skill Centre<br />Kaithal, Haryana</div>
              </div>
            </div>
          </aside>
        )}
        <main className="chat-stage">
          <header className="chat-topbar">
            <div className="mobile-brand"><BrandMark /><div><div className="mobile-brand-title">HASC admissions</div><span className="mobile-brand-subtitle">HARTRON · Kaithal, Haryana</span></div></div>
            <div className="status-line"><span className="status-dot" /> Admissions desk online</div>
            <div className="top-actions">
              <div className="top-actions" role="group" aria-label="Language">
                <button className={`icon-button ${language === 'EN' ? 'active' : ''}`} type="button" onClick={() => setLanguage('EN')} aria-pressed={language === 'EN'} data-testid="button-language-en">EN</button>
                <button className={`icon-button ${language === 'हिंदी' ? 'active' : ''}`} type="button" onClick={() => setLanguage('हिंदी')} aria-pressed={language === 'हिंदी'} data-testid="button-language-hi">हिंदी</button>
              </div>
              <button className="top-new-chat" type="button" onClick={resetChat} data-testid="button-new-chat"><RotateCcw size={13} /> New chat</button>
              <button className="icon-button mobile-new-chat" type="button" onClick={resetChat} aria-label="Start a new chat" data-testid="button-new-chat-mobile"><RotateCcw size={15} /></button>
            </div>
          </header>
          <div className="chat-content">
            <div className="message-scroll" ref={scrollRef} aria-live="polite">
              {!hasConversation && (
                <section className="welcome" aria-labelledby="welcome-heading">
                  <div className="welcome-overline"><Landmark size={13} /> HASC admissions</div>
                  <h1 id="welcome-heading">Good questions make <span>strong starts.</span></h1>
                  <p className="welcome-lede">I’m the digital counselling desk for Hartron Advanced Skill Centre, Kaithal. Tell me what you are exploring and I’ll help you find the right next step.</p>
                  <div className="welcome-meta"><span className="meta-pill">Clear answers</span><span className="meta-pill">Hindi or English</span><span className="meta-pill">Human follow-up</span></div>
                  <div className="quick-section">
                    <div className="quick-label">Start with a question</div>
                    <div className="quick-grid">
                      {quickQuestions.map((question, index) => (
                        <button className="quick-question" key={question.label} type="button" onClick={() => void sendMessage(question.prompt)} disabled={isStreaming} data-testid={`button-quick-question-${index}`}>
                          <span>{question.label}</span><ArrowUp size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}
              {hasConversation && (
                <div className="conversation">
                  {messages.filter((message) => message.id !== 'welcome').map((message) => (
                    <div className={`message-row ${message.role}`} key={message.id} data-testid={`message-${message.role}-${message.id}`}>
                      {message.role === 'assistant' && <div className="message-avatar" aria-hidden="true">HA</div>}
                      <div className="message-content">
                        <div className="message-bubble">
                          {message.role === 'assistant' && !message.content && isStreaming ? (
                            <div className="typing-bubble" aria-label="Assistant is typing"><span /><span /><span /></div>
                          ) : <MessageText content={message.content} />}
                        </div>
                        <div className="message-time"><Clock3 size={10} /> {message.role === 'assistant' ? 'HASC desk' : 'You'} · {formatTime(message.createdAt)}</div>
                        {message.role === 'assistant' && message.content && message.id === latestAssistantId && !isStreaming && (
                          <div className="message-actions">
                            <button className={`feedback-button ${message.rating === 'up' ? 'active' : ''}`} type="button" onClick={() => void rateMessage(message.id, 'up')} aria-label="Helpful response" data-testid={`button-feedback-up-${message.id}`}><ThumbsUp size={13} /></button>
                            <button className={`feedback-button ${message.rating === 'down' ? 'active' : ''}`} type="button" onClick={() => void rateMessage(message.id, 'down')} aria-label="Unhelpful response" data-testid={`button-feedback-down-${message.id}`}><ThumbsDown size={13} /></button>
                            <button className="feedback-button" type="button" onClick={() => void copyMessage(message.content)} aria-label="Copy response" data-testid={`button-copy-${message.id}`}><Copy size={13} /></button>
                            {message.rating && <span className="copy-label"><Check size={10} /> Thank you for the feedback</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {error && <div className="error-note" role="alert" data-testid="status-chat-error">{error}</div>}
            </div>
            <div className="composer-wrap">
              <div className="composer">
                <form className="composer-box" onSubmit={handleSubmit}>
                  <textarea ref={textareaRef} value={input} maxLength={500} onChange={(event) => setInput(event.target.value)} onKeyDown={handleTextareaKeyDown} rows={1} placeholder={language === 'हिंदी' ? 'अपना सवाल लिखें…' : 'Ask about admissions, courses, or your next step…'} aria-label="Your question" data-testid="input-chat-message" />
                  <button className="send-button" type="submit" disabled={!input.trim() || isStreaming} aria-label="Send message" data-testid="button-send-message"><Send size={16} /></button>
                </form>
                <div className="composer-foot">
                  <span>Press Enter to send · Shift + Enter for a new line</span>
                  <button className="callback-link" type="button" onClick={() => setShowLead(true)} data-testid="button-request-callback"><Headphones size={10} /> Request a callback</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {!embed && <footer className="hasc-footer">AI assistant - answers may not always be accurate. Please verify with the centre.</footer>}
      {showLead && <LeadDialog onClose={() => setShowLead(false)} />}
    </div>
  );
}

function Home() {
  return <Assistant />;
}

function Embed() {
  return <Assistant embed />;
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/embed" component={Embed} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
