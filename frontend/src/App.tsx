import { useEffect, useRef, useState } from "react";
import { Composer } from "./components/Composer";
import { DataSchemaPage } from "./components/DataSchemaPage";
import { EmptyState } from "./components/EmptyState";
import { Header } from "./components/Header";
import { AssistantMessage, ErrorMessage, TypingIndicator, UserMessage } from "./components/MessageBubbles";
import { MethodologyPage } from "./components/MethodologyPage";
import { useConversation } from "./hooks/useConversation";
import { useTheme } from "./hooks/useTheme";
import type { Tab } from "./types";

function App() {
  const { theme, toggleTheme } = useTheme();
  const { messages, loading, slowRequest, submitQuestion, setFeedback, toggleView, clearConversation } =
    useConversation();
  const [question, setQuestion] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSelectQuestion(value: string) {
    setQuestion(value);
    setActiveTab("chat");
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
    <div className="flex h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasMessages={messages.length > 0}
        onClear={clearConversation}
      />

      {activeTab === "data" && (
        <main className="flex-1 overflow-y-auto">
          <DataSchemaPage />
        </main>
      )}
      {activeTab === "methodology" && (
        <main className="flex-1 overflow-y-auto">
          <MethodologyPage />
        </main>
      )}

      {activeTab === "chat" && (
        <>
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
        </>
      )}
    </div>
  );
}

export default App;


