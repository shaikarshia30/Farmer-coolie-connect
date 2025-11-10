import { useEffect, useRef, useState } from "react";
import { useState } from "react";
import { MessageCircle } from "lucide-react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        <MessageCircle size={24} />
      </button>

      {open && (
        <div> <!-- chat UI here --> </div>
      )}
    </>
  );
}

 import { MessageCircle } from "lucide-react";  // <--- add this
// const [open, setOpen] = useState(false);

// <button
//   onClick={() => setOpen(true)}
//   className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg"
// >
//   <MessageCircle size={24} />
// </button>

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hello 👋 मैं आपकी कैसे मदद कर सकता हूँ? / How can I help?" },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, open]);

  async function send() {
    if (!input.trim()) return;

    const next = [...msgs, { role: "user", content: input }];
    setMsgs(next);
    setInput("");
    setLoading(true);

    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });

    const data = await r.json();
    setMsgs([...next, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg"
      >
        {open ? "Close" : "Chat"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white border shadow-xl rounded-lg p-3">
          <div className="h-72 overflow-y-auto space-y-2 mb-2">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-md ${m.role === "user" ? "bg-blue-100 ml-10" : "bg-gray-200 mr-10"}`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="p-2 rounded-md bg-gray-200 animate-pulse mr-10">...</div>}
            <div ref={endRef}></div>
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Type any language..."
              className="flex-1 border p-2 rounded-md"
            />
            <button onClick={send} className="bg-blue-600 text-white px-3 py-2 rounded-md">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
