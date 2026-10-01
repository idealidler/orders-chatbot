import { useEffect, useRef, useState } from "react";
import { Composer } from "./components/Composer";
import { EmptyState } from "./components/EmptyState";
import { Header } from "./components/Header";
import { AssistantMessage, ErrorMessage, TypingIndicator, UserMessage } from "./components/MessageBubbles";
import { Sidebar } from "./components/Sidebar";
import { useConversation } from "./hooks/useConversation";
import { useTheme } from "./hooks/useTheme";

function App() {
  const { theme, toggleTheme } = useTheme();
  const { messages, loading, slowRequest, history, submitQuestion, setFeedback, toggleView, clearConversation } =
    useConversation();
  const [question, setQuestion] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSelectQuestion(value: string) {
    setQuestion(value);
    setSidebarOpen(false);
  }

  function handleSubmit() {
    const value = question;
    setQuestion("");
    void submitQuestion(value);
  }

  function regenerate(questionText: string) {
    void submitQuestion(questionText);
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} history={history} onSelectQuestion={handleSelectQuestion} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          hasMessages={messages.length > 0}
          onClear={clearConversation}
        />

        <main id="conversation" aria-label="Conversation" className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.length === 0 && <EmptyState onSelectExample={handleSelectQuestion} />}

            {messages.map((msg, i) => {
              if (msg.role === "user") return <UserMessage key={i} message={msg} />;
              if (msg.role === "assistant-error") return <ErrorMessage key={i} message={msg} />;
              return (
                <AssistantMessage
                  key={i}
                  message={msg}
                  onFeedback={(feedback) => setFeedback(i, feedback)}
                  onRegenerate={() => regenerate(msg.question)}
                  onToggleView={() => toggleView(i)}
                />
              );
            })}

            {loading && <TypingIndicator slow={slowRequest} />}
            <div ref={conversationEndRef} />
          </div>
        </main>

        <Composer question={question} onChange={setQuestion} onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}

export default App;

