"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Check } from "lucide-react";
import { findOrderBySP, voidOrderViaAPI, type OrderLetter } from "@/app/actions";

type MessageSender = "bot" | "user";
type MessageType = "text" | "card" | "loading" | "terminal";
type Stage = "idle" | "searching" | "confirming" | "executing" | "done";

interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  type: MessageType;
  data?: OrderLetter;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

const TERMINAL_LINES = [
  "> Initializing Void Sequence...",
  "> Authenticating User 5206...",
  "> Connecting to API Endpoint...",
  "> STATUS: 200 OK",
];

export default function AlitaChatbot({
  accessToken,
}: {
  accessToken: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [foundOrder, setFoundOrder] = useState<OrderLetter | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Phase A: Greeting on mount (1.5s typing then message)
  useEffect(() => {
    setMessages([
      { id: "typing", sender: "bot", text: "", type: "loading" },
    ]);
    const timer = setTimeout(() => {
      setMessages([
        {
          id: "greeting",
          sender: "bot",
          text: "Halo! Saya Alita. Ada nomor SP yang perlu saya batalkan hari ini?",
          type: "text",
        },
      ]);
      setStage("idle");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}` },
    ]);
  };

  const removeLoading = () => {
    setMessages((prev) => prev.filter((m) => m.type !== "loading"));
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage({ sender: "user", text: trimmed, type: "text" });
    setInput("");
    setStage("searching");

    addMessage({
      sender: "bot",
      text: "",
      type: "loading",
    });

    addMessage({
      sender: "bot",
      text: "🔍 Sedang memindai database...",
      type: "text",
    });

    try {
      const order = await findOrderBySP(trimmed);
      removeLoading();

      if (!order) {
        addMessage({
          sender: "bot",
          text: "Maaf, data tidak ditemukan. Silakan periksa nomor SP dan coba lagi.",
          type: "text",
        });
        setStage("idle");
        return;
      }

      setFoundOrder(order);
      setStage("confirming");

      addMessage({
        sender: "bot",
        text: "Data ditemukan.",
        type: "text",
      });

      addMessage({
        sender: "bot",
        text: "",
        type: "card",
        data: order,
      });
    } catch {
      removeLoading();
      addMessage({
        sender: "bot",
        text: "Terjadi kesalahan saat memindai. Silakan coba lagi.",
        type: "text",
      });
      setStage("idle");
    }
  };

  const handleBatalkan = async () => {
    if (!foundOrder || !accessToken) {
      addMessage({
        sender: "bot",
        text: "Sesi telah berakhir. Silakan login kembali.",
        type: "text",
      });
      return;
    }

    setStage("executing");

    addMessage({
      sender: "bot",
      text: "",
      type: "terminal",
    });

    try {
      const result = await voidOrderViaAPI(foundOrder.id, accessToken);

      if (result.success) {
        setStage("done");
        addMessage({
          sender: "bot",
          text: "Selesai! Pesanan berhasil di-void.",
          type: "text",
        });
        setFoundOrder(null);
      } else {
        addMessage({
          sender: "bot",
          text: result.error,
          type: "text",
        });
        setStage("idle");
      }
    } catch {
      addMessage({
        sender: "bot",
        text: "Gagal membatalkan pesanan. Silakan coba lagi.",
        type: "text",
      });
      setStage("idle");
    }
  };

  const handleJangan = () => {
    addMessage({
      sender: "bot",
      text: "Baik, tidak jadi dibatalkan. Ada nomor SP lain yang perlu dibantu?",
      type: "text",
    });
    setFoundOrder(null);
    setStage("idle");
  };

  return (
    <div className="flex h-[500px] flex-col overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200/60">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Alita Assistant</h3>
            <p className="text-xs text-slate-500">Void pesanan dengan mudah</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onBatalkan={handleBatalkan} onJangan={handleJangan} stage={stage} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik nomor SP..."
            disabled={stage === "searching" || stage === "executing"}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || stage === "searching" || stage === "executing"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      className="flex gap-1"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.15 } },
        hidden: {},
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400"
          variants={{
            visible: {
              y: [0, -6, 0],
              transition: { repeat: Infinity, duration: 0.6 },
            },
            hidden: { y: 0 },
          }}
        />
      ))}
    </motion.div>
  );
}

function MessageBubble({
  message,
  onBatalkan,
  onJangan,
  stage,
}: {
  message: Message;
  onBatalkan: () => void;
  onJangan: () => void;
  stage: Stage;
}) {
  const isBot = message.sender === "bot";

  if (message.type === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <Bot className="h-4 w-4 text-slate-600" />
        </div>
        <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-2.5">
          <TypingIndicator />
        </div>
      </motion.div>
    );
  }

  if (message.type === "terminal") {
    return (
      <TerminalBubble lines={TERMINAL_LINES} />
    );
  }

  if (message.type === "card" && message.data) {
    const order = message.data;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <Bot className="h-4 w-4 text-slate-600" />
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-slate-200 bg-white p-4 shadow-sm">
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="text-slate-500">Customer</dt>
              <dd className="font-medium text-slate-800">{order.customer_name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Total</dt>
              <dd className="font-medium text-slate-800">
                {formatPrice(order.extended_amount)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-slate-800">{order.status}</dd>
            </div>
          </dl>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onBatalkan}
              disabled={stage === "executing"}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              BATALKAN
            </button>
            <button
              type="button"
              onClick={onJangan}
              disabled={stage === "executing"}
              className="flex-1 rounded-lg bg-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-400 disabled:opacity-60"
            >
              JANGAN
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (message.type === "text" && message.text === "Selesai! Pesanan berhasil di-void.") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <Bot className="h-4 w-4 text-slate-600" />
        </div>
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-green-50 px-4 py-2.5 text-sm text-green-800 ring-1 ring-green-200">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Check className="h-5 w-5 text-green-600" strokeWidth={3} />
          </motion.div>
          <span>{message.text}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${!isBot ? "flex-row-reverse" : ""}`}
    >
      {isBot && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <Bot className="h-4 w-4 text-slate-600" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isBot
            ? "rounded-tl-md bg-slate-100 text-slate-800"
            : "rounded-tr-md bg-blue-600 text-white"
        }`}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

function TerminalBubble({ lines }: { lines: string[] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= lines.length) return;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), 400);
    return () => clearTimeout(timer);
  }, [visibleCount, lines.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
        <Bot className="h-4 w-4 text-slate-600" />
      </div>
      <div className="rounded-2xl rounded-tl-md bg-slate-900 px-4 py-3 font-mono text-xs text-green-400">
        {lines.slice(0, visibleCount).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="leading-relaxed"
          >
            {line}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
