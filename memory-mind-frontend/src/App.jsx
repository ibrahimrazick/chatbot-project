import { useEffect, useRef, useState } from "react";
import "./App.css";

// Update this with your active ngrok URL or localhost URL
const API_URL = "https://mongrel-harmonize-decay.ngrok-free.dev/chat";

const STARTER_PROMPTS = [
  {
    icon: "🧠",
    title: "Recall Context",
    text: "What did I mention about my project earlier?",
  },
  {
    icon: "💻",
    title: "Tech Preferences",
    text: "Recall my tech stack & coding preferences",
  },
  {
    icon: "📝",
    title: "Save Memory",
    text: "Save a memory: Building Memory Mind for a competition",
  },
  {
    icon: "💡",
    title: "Brainstorm",
    text: "Help me brainstorm features for my chatbot",
  },
];

function renderInline(text, keyPrefix) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}

function FormattedReply({ text }) {
  const blocks = text
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);

  return blocks.map((block, i) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Heading check (e.g. ### Heading)
    if (lines.length === 1 && lines[0].startsWith("#")) {
      const level = (lines[0].match(/^#+/) || ["#"])[0].length;
      const cleanTitle = lines[0].replace(/^#+\s*/, "");
      return level <= 2 ? (
        <h3 key={i} className="reply-heading">
          {cleanTitle}
        </h3>
      ) : (
        <h4 key={i} className="reply-subheading">
          {cleanTitle}
        </h4>
      );
    }

    const isList = lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l));

    if (isList) {
      return (
        <ul className="reply-list" key={i}>
          {lines.map((line, j) => (
            <li key={j}>
              {renderInline(line.replace(/^[-*•]\s+/, ""), `${i}-${j}`)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p className="reply-paragraph" key={i}>
        {renderInline(lines.join(" "), `${i}`)}
      </p>
    );
  });
}

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const hasStarted = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const send = async (textToSend) => {
    const outgoing = textToSend || message;
    if (!outgoing.trim() || isThinking) return;

    setMessage("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: outgoing },
    ]);
    setIsThinking(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ message: outgoing }),
      });

      if (!res.ok) throw new Error(`Backend returned ${res.status}`);

      const data = await res.json();
      const replyText = data.reply ?? data.response ?? JSON.stringify(data);
      const memories = data.memories || data.recalled_memories || [];

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: replyText,
          memories: memories,
        },
      ]);
    } catch (err) {
      console.error("Memory Mind: failed to reach backend:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Couldn't reach the server. Please check your backend & ngrok connection.",
          error: true,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send();
  };

  const handleNewChat = () => {
    setMessages([]);
    setMessage("");
  };

  const composer = (
    <form className="composer" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          hasStarted
            ? "Message Memory Mind..."
            : "Ask anything, or recall context..."
        }
        className="composer-input"
      />
      <button
        type="submit"
        className="send-button"
        disabled={!message.trim() || isThinking}
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 19V5M12 5L6 11M12 5L18 11"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );

  if (!hasStarted) {
    return (
      <div className="hero-page">
        <div className="hero">
          <div className="logo-badge">🧠 Memory Mind AI</div>
          <h1 className="hero-title">What's on your mind today?</h1>
          <p className="hero-subhead">
            Your personal AI with long-term memory & context recall.
          </p>

          <div className="hero-composer">{composer}</div>

          <div className="prompt-grid">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt.text}
                type="button"
                className="prompt-card"
                onClick={() => send(prompt.text)}
              >
                <div className="prompt-card-icon">{prompt.icon}</div>
                <div className="prompt-card-body">
                  <span className="prompt-card-title">{prompt.title}</span>
                  <span className="prompt-card-text">{prompt.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="chat-header">
        <div className="header-left">
          <span className="header-logo">🧠</span>
          <span className="header-title">Memory Mind</span>
          <span className="header-status">🟢 Active</span>
        </div>
        <button type="button" className="new-chat-btn" onClick={handleNewChat}>
          + New Chat
        </button>
      </header>

      <div className="messages" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className={`message ${m.role}`}>
            {m.role === "assistant" && <div className="avatar">🧠</div>}

            <div className="message-content">
              {m.memories && m.memories.length > 0 && (
                <div className="memory-badge">
                  <span>🧠 Recalled context: {m.memories.join("; ")}</span>
                </div>
              )}

              {m.role === "user" ? (
                <div className="bubble">{m.text}</div>
              ) : (
                <div className={`assistant-text ${m.error ? "error" : ""}`}>
                  <FormattedReply text={m.text} />
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="message assistant">
            <div className="avatar">🧠</div>
            <div className="typing-indicator">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </div>

      <div className="composer-wrap">
        <p className="disclaimer">
          Memory Mind can make mistakes. Verify important facts.
        </p>
        {composer}
      </div>
    </div>
  );
}

export default App;
