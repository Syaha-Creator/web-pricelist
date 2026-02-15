"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, Package } from "lucide-react";
import clsx from "clsx";
import {
  getProducts,
  findOrderBySP,
  voidOrderViaAPI,
  searchWorkPlaces,
  updateOrderWorkPlace,
  findUserByEmail,
  getOrderForCreatorChange,
  updateOrderCreator,
  type Product,
  type OrderLetter,
  type WorkPlace,
  type User as UserType,
  type OrderForCreatorChange,
} from "@/app/actions";

// ─── Types ─────────────────────────────────────────────────────────────────

type MessageRole = "user" | "bot";
type MessageType = "text" | "products" | "void" | "store-list" | "creator-confirm";
type ActionStatus = "pending" | "completed";

interface TextContent {
  text: string;
  chips?: string[];
}

interface ProductsContent {
  text: string;
  products: Product[];
}

interface VoidContent {
  text: string;
  order: OrderLetter;
  voided?: boolean;
  error?: string;
}

interface StoreListContent {
  text: string;
  stores: WorkPlace[];
  spNumber: string;
}

interface CreatorConfirmContent {
  text: string;
  spNumber: string;
  currentCreatorName: string;
  newUser: UserType;
  status?: ActionStatus;
}

interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content:
    | TextContent
    | ProductsContent
    | VoidContent
    | StoreListContent
    | CreatorConfirmContent;
}

type Intent =
  | { type: "void" }
  | { type: "mutasi" }
  | { type: "ganti-sales" }
  | { type: "product"; keyword: string };

type ChatState =
  | "IDLE"
  | "AWAITING_SP_VOID"
  | "AWAITING_SP_MUTATION"
  | "AWAITING_STORE_NAME"
  | "AWAITING_SP_SALES"
  | "AWAITING_NEW_EMAIL";

function getThinkingDelayMs() {
  return 1500 + Math.random() * 500;
}

function parseIntent(text: string): Intent {
  const trimmed = text.trim();
  if (!trimmed) return { type: "product", keyword: "" };
  if (/void|batal|cancel|hapus/i.test(trimmed)) return { type: "void" };
  if (/pindah|ganti toko|mutasi|ganti cabang/i.test(trimmed)) return { type: "mutasi" };
  if (/ganti sales|ganti creator|ubah sales|revisi user/i.test(trimmed))
    return { type: "ganti-sales" };
  const fillerPattern = /^(tolong carikan|cari|lihat|cek|harga|stock|tampilkan|show)\s+/i;
  const keyword = trimmed.replace(fillerPattern, "").trim();
  return { type: "product", keyword: keyword || trimmed };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// ─── Animations ───────────────────────────────────────────────────────────

const entryAnimation = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -5, scale: 0.98 },
};

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 28,
};

// ─── TypingIndicator ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      {...entryAnimation}
      transition={springTransition}
      className="flex gap-3 max-w-4xl mx-auto px-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200">
        <Bot className="h-4 w-4 text-slate-600" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none bg-white border border-slate-100 px-4 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-slate-400"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── ProductCarousel ───────────────────────────────────────────────────────

function ProductCarousel({ products }: { products: Product[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={springTransition}
      className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 -mx-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {products.map((p, idx) => {
        const hasDiscount = p.pricelist > 0 && p.pricelist > p.end_user_price;
        const discountPct = hasDiscount
          ? Math.round(((p.pricelist - p.end_user_price) / p.pricelist) * 100)
          : 0;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springTransition, delay: idx * 0.04 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-48 shrink-0 snap-center flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
          >
            <div
              className={clsx(
                "flex aspect-square items-center justify-center",
                p.brand.toLowerCase() === "comforta" ? "bg-blue-500" : "bg-slate-200"
              )}
            >
              <Package className="h-10 w-10 text-white/80" />
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                {p.brand || "—"}
              </p>
              <p className="mt-0.5 line-clamp-1 text-sm font-medium text-slate-800">{p.tipe}</p>
              <p className="text-xs text-slate-500">{p.ukuran}</p>
              <div className="mt-2 flex items-center gap-2">
                {hasDiscount && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                    -{discountPct}%
                  </span>
                )}
                <p className="text-sm font-bold text-blue-600">
                  {formatPrice(p.end_user_price)}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ─── VoidConfirmationCard (Ticket/Receipt Style) ───────────────────────────

function VoidConfirmationCard({
  order,
  voided,
  error,
  onConfirm,
  isProcessing,
  accessToken,
}: {
  order: OrderLetter;
  voided?: boolean;
  error?: string;
  onConfirm: () => void;
  isProcessing: boolean;
  accessToken: string | null;
}) {
  if (voided) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col overflow-hidden rounded-xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-green-500"
      >
        <div className="p-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            ✅ Transaksi Selesai
          </span>
          <p className="mt-2 text-sm text-slate-600">Pesanan berhasil di-void.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="flex flex-col overflow-hidden rounded-xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-red-500"
    >
      <div className="p-4">
        <h4 className="text-sm font-semibold text-slate-800">Konfirmasi Pembatalan</h4>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Customer</p>
            <p className="font-medium text-slate-800">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">No SP</p>
            <p className="font-medium text-slate-800">{order.no_sp}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium text-slate-500">Total Amount</p>
            <p className="text-base font-bold text-slate-800">
              {formatPrice(order.extended_amount)}
            </p>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <motion.button
          type="button"
          onClick={onConfirm}
          disabled={isProcessing || !accessToken}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isProcessing ? "Memproses..." : "Batalkan Pesanan"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── StoreListBubble ───────────────────────────────────────────────────────

function StoreListBubble({
  stores,
  spNumber,
  onSelect,
  isProcessing,
}: {
  stores: WorkPlace[];
  spNumber: string;
  onSelect: (store: WorkPlace) => void;
  isProcessing: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={springTransition}
      className="space-y-2"
    >
      <p className="text-sm text-slate-700">Pilih toko tujuan untuk SP {spNumber}:</p>
      <div className="flex flex-col gap-2">
        {stores.map((store, idx) => (
          <motion.button
            key={store.id}
            type="button"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={isProcessing}
            onClick={() => onSelect(store)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition-all hover:border-slate-300 hover:shadow-md disabled:opacity-60"
          >
            <span className="font-medium text-slate-800">
              [{store.category}] {store.name}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── CreatorConfirmCard (Ticket/Receipt Style) ─────────────────────────────

function CreatorConfirmCard({
  spNumber,
  currentCreatorName,
  newUser,
  status = "pending",
  onConfirm,
  isProcessing,
}: {
  spNumber: string;
  currentCreatorName: string;
  newUser: UserType;
  status?: ActionStatus;
  onConfirm: () => void;
  isProcessing: boolean;
}) {
  const isCompleted = status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="flex flex-col overflow-hidden rounded-xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-green-500"
    >
      <div className="p-4">
        <h4 className="text-sm font-semibold text-slate-800">Konfirmasi Ganti Sales</h4>
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">From</p>
            <p className="font-medium text-slate-800">{currentCreatorName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">To</p>
            <p className="font-medium text-slate-800">
              {newUser.name} ({newUser.email})
            </p>
          </div>
        </div>
        {isCompleted ? (
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            ✅ Berhasil diganti oleh {newUser.name}
          </span>
        ) : (
          <motion.button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {isProcessing ? "Memproses..." : "YA, GANTI"}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── ChatMessage ───────────────────────────────────────────────────────────

function ChatMessage({
  message,
  onVoidConfirm,
  onChipClick,
  onStoreSelect,
  onCreatorConfirm,
  voidProcessingId,
  mutasiProcessing,
  creatorProcessing,
  accessToken,
}: {
  message: Message;
  onVoidConfirm: (id: string, order: OrderLetter) => void;
  onChipClick: (chip: string) => void;
  onStoreSelect: (store: WorkPlace, spNumber: string) => void;
  onCreatorConfirm: (messageId: string, spNumber: string, newUser: UserType) => void;
  voidProcessingId: string | null;
  mutasiProcessing: boolean;
  creatorProcessing: boolean;
  accessToken: string | null;
}) {
  const isBot = message.role === "bot";

  return (
    <motion.div
      layout
      {...entryAnimation}
      transition={springTransition}
      className={clsx(
        "flex gap-3 max-w-4xl mx-auto px-4",
        !isBot && "flex-row-reverse"
      )}
    >
      <div
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isBot ? "bg-slate-200" : "bg-blue-600"
        )}
      >
        {isBot ? (
          <Bot className="h-4 w-4 text-slate-600" />
        ) : (
          <User className="h-4 w-4 text-white" />
        )}
      </div>

      <div
        className={clsx(
          "max-w-[85%] space-y-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isBot
            ? "rounded-tl-none bg-white border border-slate-100 shadow-sm text-slate-700"
            : "rounded-tr-none bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20"
        )}
      >
        {message.type === "text" && (
          <>
            <p>{(message.content as TextContent).text}</p>
            {(message.content as TextContent).chips &&
              (message.content as TextContent).chips!.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(message.content as TextContent).chips!.map((chip) => (
                    <motion.button
                      key={chip}
                      type="button"
                      onClick={() => onChipClick(chip)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      {chip}
                    </motion.button>
                  ))}
                </div>
              )}
          </>
        )}
        {message.type === "products" && (
          <div className="space-y-2">
            <p>{(message.content as ProductsContent).text}</p>
            <ProductCarousel products={(message.content as ProductsContent).products} />
          </div>
        )}
        {message.type === "void" && (
          <div className="space-y-2">
            <p>{(message.content as VoidContent).text}</p>
            <VoidConfirmationCard
              order={(message.content as VoidContent).order}
              voided={(message.content as VoidContent).voided}
              error={(message.content as VoidContent).error}
              onConfirm={() =>
                onVoidConfirm(message.id, (message.content as VoidContent).order)
              }
              isProcessing={voidProcessingId === message.id}
              accessToken={accessToken}
            />
          </div>
        )}
        {message.type === "store-list" && (
          <div className="space-y-2">
            <p>{(message.content as StoreListContent).text}</p>
            <StoreListBubble
              stores={(message.content as StoreListContent).stores}
              spNumber={(message.content as StoreListContent).spNumber}
              onSelect={(store) =>
                onStoreSelect(store, (message.content as StoreListContent).spNumber)
              }
              isProcessing={mutasiProcessing}
            />
          </div>
        )}
        {message.type === "creator-confirm" && (
          <div className="space-y-2">
            <p>{(message.content as CreatorConfirmContent).text}</p>
            <CreatorConfirmCard
              spNumber={(message.content as CreatorConfirmContent).spNumber}
              currentCreatorName={(message.content as CreatorConfirmContent).currentCreatorName}
              newUser={(message.content as CreatorConfirmContent).newUser}
              status={(message.content as CreatorConfirmContent).status ?? "pending"}
              onConfirm={() => {
                const c = message.content as CreatorConfirmContent;
                onCreatorConfirm(message.id, c.spNumber, c.newUser);
              }}
              isProcessing={creatorProcessing}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main AlitaChat ────────────────────────────────────────────────────────

export default function AlitaChat({
  accessToken,
}: {
  accessToken: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("IDLE");
  const [voidProcessingId, setVoidProcessingId] = useState<string | null>(null);
  const [pendingMutasiSP, setPendingMutasiSP] = useState<string | null>(null);
  const [mutasiProcessing, setMutasiProcessing] = useState(false);
  const [pendingGantiSalesSP, setPendingGantiSalesSP] = useState<string | null>(null);
  const [pendingGantiSalesOrder, setPendingGantiSalesOrder] =
    useState<OrderForCreatorChange | null>(null);
  const [creatorConfirmProcessing, setCreatorConfirmProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addMessage = (msg: Omit<Message, "id">) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [...prev, { ...msg, id }]);
    return id;
  };

  const updateMessage = (id: string, updater: (m: Message) => Message) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  };

  const markMessageComplete = (id: string, type: "void" | "creator-confirm") => {
    updateMessage(id, (m) => {
      if (type === "void" && m.type === "void") {
        return { ...m, content: { ...m.content, voided: true } };
      }
      if (type === "creator-confirm" && m.type === "creator-confirm") {
        return { ...m, content: { ...m.content, status: "completed" as const } };
      }
      return m;
    });
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const processIntentIdle = async (intent: Intent) => {
    const minDelay = getThinkingDelayMs();
    if (intent.type === "void") {
      await sleep(minDelay);
      setChatState("AWAITING_SP_VOID");
      addMessage({ role: "bot", type: "text", content: { text: "Sebutkan nomor SP-nya." } });
      return;
    }
    if (intent.type === "mutasi") {
      await sleep(minDelay);
      setChatState("AWAITING_SP_MUTATION");
      addMessage({ role: "bot", type: "text", content: { text: "Sebutkan nomor SP-nya." } });
      return;
    }
    if (intent.type === "ganti-sales") {
      await sleep(minDelay);
      setChatState("AWAITING_SP_SALES");
      addMessage({
        role: "bot",
        type: "text",
        content: { text: "Sebutkan nomor SP yang mau diganti sales-nya." },
      });
      return;
    }
    if (intent.type === "product") {
      const start = Date.now();
      const result = await getProducts(1, intent.keyword);
      await sleep(Math.max(0, minDelay - (Date.now() - start)));
      if (result.products.length === 0) {
        addMessage({
          role: "bot",
          type: "text",
          content: {
            text: `Saya tidak menemukan produk dengan kata kunci '${intent.keyword}'. Coba kata lain ya.`,
            chips: ["Cari Kasur", "Lihat Katalog"],
          },
        });
        return;
      }
      addMessage({
        role: "bot",
        type: "products",
        content: {
          text: `Ditemukan ${result.products.length} produk:`,
          products: result.products,
        },
      });
    }
  };

  const handleSend = async (text?: string) => {
    const raw = (text ?? input).trim();
    if (!raw || isTyping) return;
    addMessage({ role: "user", type: "text", content: { text: raw } });
    setInput("");
    setIsTyping(true);
    try {
      if (chatState === "AWAITING_SP_VOID") {
        const minDelay = getThinkingDelayMs();
        const start = Date.now();
        const order = await findOrderBySP(raw);
        await sleep(Math.max(0, minDelay - (Date.now() - start)));
        if (!order) {
          addMessage({
            role: "bot",
            type: "text",
            content: { text: "Nomor SP tidak ditemukan. Mohon cek kembali." },
          });
        } else {
          setChatState("IDLE");
          addMessage({
            role: "bot",
            type: "void",
            content: { text: "Data ditemukan. Konfirmasi pembatalan?", order },
          });
        }
        return;
      }
      if (chatState === "AWAITING_SP_MUTATION") {
        const minDelay = getThinkingDelayMs();
        const start = Date.now();
        const order = await findOrderBySP(raw);
        await sleep(Math.max(0, minDelay - (Date.now() - start)));
        if (!order) {
          addMessage({
            role: "bot",
            type: "text",
            content: { text: "Nomor SP tidak ditemukan. Mohon cek kembali." },
          });
        } else {
          setPendingMutasiSP(raw);
          setChatState("AWAITING_STORE_NAME");
          addMessage({
            role: "bot",
            type: "text",
            content: { text: `Siap. SP ${raw} mau dipindah ke toko apa? Ketik nama tokonya.` },
          });
        }
        return;
      }
      if (chatState === "AWAITING_STORE_NAME") {
        const minDelay = getThinkingDelayMs();
        const start = Date.now();
        const stores = await searchWorkPlaces(raw);
        await sleep(Math.max(0, minDelay - (Date.now() - start)));
        if (stores.length === 0) {
          addMessage({
            role: "bot",
            type: "text",
            content: { text: `Tidak ada toko ditemukan untuk "${raw}". Coba kata kunci lain.` },
          });
        } else {
          addMessage({
            role: "bot",
            type: "store-list",
            content: {
              text: `Ditemukan ${stores.length} toko:`,
              stores,
              spNumber: pendingMutasiSP ?? raw,
            },
          });
        }
        return;
      }
      if (chatState === "AWAITING_SP_SALES") {
        const minDelay = getThinkingDelayMs();
        const start = Date.now();
        const order = await getOrderForCreatorChange(raw);
        await sleep(Math.max(0, minDelay - (Date.now() - start)));
        if (!order) {
          addMessage({
            role: "bot",
            type: "text",
            content: { text: "Nomor SP tidak ditemukan. Mohon cek kembali." },
          });
        } else {
          setPendingGantiSalesSP(raw);
          setPendingGantiSalesOrder(order);
          setChatState("AWAITING_NEW_EMAIL");
          addMessage({
            role: "bot",
            type: "text",
            content: {
              text: `SP ${raw} saat ini dipegang oleh ${order.creator_name ?? `ID ${order.creator}`}. Masukkan Email Sales Baru penggantinya.`,
            },
          });
        }
        return;
      }
      if (chatState === "AWAITING_NEW_EMAIL") {
        const minDelay = getThinkingDelayMs();
        const start = Date.now();
        const newUser = await findUserByEmail(raw);
        await sleep(Math.max(0, minDelay - (Date.now() - start)));
        if (!newUser) {
          addMessage({
            role: "bot",
            type: "text",
            content: { text: "Email tidak ditemukan di database user. Coba cek lagi." },
          });
        } else {
          const order = pendingGantiSalesOrder;
          const currentCreatorName = order?.creator_name ?? `ID ${order?.creator ?? "-"}`;
          setChatState("IDLE");
          addMessage({
            role: "bot",
            type: "creator-confirm",
            content: {
              text: "Konfirmasi perpindahan sales:",
              spNumber: pendingGantiSalesSP ?? raw,
              currentCreatorName,
              newUser,
              status: "pending",
            },
          });
        }
        return;
      }
      const intent = parseIntent(raw);
      await processIntentIdle(intent);
    } catch {
      addMessage({
        role: "bot",
        type: "text",
        content: { text: "Terjadi kesalahan. Silakan coba lagi.", chips: ["Cari Kasur", "Void SP"] },
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoidConfirm = async (messageId: string, order: OrderLetter) => {
    if (!accessToken) {
      addMessage({
        role: "bot",
        type: "text",
        content: { text: "Sesi telah berakhir. Silakan login kembali." },
      });
      return;
    }
    setVoidProcessingId(messageId);
    try {
      const result = await voidOrderViaAPI(order.id, accessToken);
      if (result.success) markMessageComplete(messageId, "void");
      else {
        updateMessage(messageId, (m) =>
          m.type === "void" ? { ...m, content: { ...m.content, error: result.error } } : m
        );
      }
    } catch {
      updateMessage(messageId, (m) =>
        m.type === "void"
          ? { ...m, content: { ...m.content, error: "Gagal membatalkan pesanan." } }
          : m
      );
    } finally {
      setVoidProcessingId(null);
    }
  };

  const handleChipClick = (chip: string) => setInput(chip);

  const handleCreatorConfirm = async (
    messageId: string,
    spNumber: string,
    newUser: UserType
  ) => {
    setCreatorConfirmProcessing(true);
    try {
      await updateOrderCreator(spNumber, newUser.id, newUser.name);
      markMessageComplete(messageId, "creator-confirm");
      addMessage({
        role: "bot",
        type: "text",
        content: { text: `Selesai! SP ${spNumber} sekarang milik ${newUser.name}.` },
      });
      setPendingGantiSalesSP(null);
      setPendingGantiSalesOrder(null);
      setChatState("IDLE");
    } catch {
      addMessage({
        role: "bot",
        type: "text",
        content: { text: "Gagal mengganti sales. Silakan coba lagi." },
      });
    } finally {
      setCreatorConfirmProcessing(false);
    }
  };

  const handleStoreSelect = async (store: WorkPlace, spNumber: string) => {
    setMutasiProcessing(true);
    try {
      const result = await updateOrderWorkPlace(spNumber, store.id);
      if (result.success) {
        addMessage({
          role: "bot",
          type: "text",
          content: { text: `Berhasil! SP ${spNumber} sudah dipindah ke ${store.name}.` },
        });
        setPendingMutasiSP(null);
        setChatState("IDLE");
      } else {
        addMessage({ role: "bot", type: "text", content: { text: result.error } });
      }
    } catch {
      addMessage({
        role: "bot",
        type: "text",
        content: { text: "Gagal memindah SP. Silakan coba lagi." },
      });
    } finally {
      setMutasiProcessing(false);
    }
  };

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      addMessage({
        role: "bot",
        type: "text",
        content: {
          text: "Halo! Saya Alita. Saya bisa bantu cari harga produk, void pesanan, mutasi toko, atau ganti sales. Ada yang bisa saya bantu?",
          chips: ["Cari Kasur", "Void SP", "Mutasi Toko", "Ganti Sales", "Lihat Katalog"],
        },
      });
      setIsTyping(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden font-sans antialiased">
      {/* Subtle dotted background pattern */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.15) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
          backgroundColor: "rgb(248 250 252)",
        }}
      >
        <div
          ref={scrollContainerRef}
          className="min-h-full py-6"
        >
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onVoidConfirm={handleVoidConfirm}
                  onChipClick={handleChipClick}
                  onStoreSelect={handleStoreSelect}
                  onCreatorConfirm={handleCreatorConfirm}
                  voidProcessingId={voidProcessingId}
                  mutasiProcessing={mutasiProcessing}
                  creatorProcessing={creatorConfirmProcessing}
                  accessToken={accessToken}
                />
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {isTyping && <TypingIndicator key="typing" />}
            </AnimatePresence>
          </div>
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Floating input bar */}
      <div className="shrink-0 px-4 pb-6 pt-2">
        <div className="mx-auto max-w-4xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 shadow-lg shadow-slate-200/50 backdrop-blur-md"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan..."
              disabled={isTyping}
              className={clsx(
                "flex-1 rounded-full border-0 bg-slate-100/80 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-colors",
                "focus:bg-slate-100 focus:ring-2 focus:ring-blue-500/30",
                "disabled:opacity-60"
              )}
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || isTyping}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25",
                "disabled:opacity-50"
              )}
            >
              <Send className="h-5 w-5" />
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
