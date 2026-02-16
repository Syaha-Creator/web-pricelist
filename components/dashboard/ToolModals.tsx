"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Trash2,
  Store,
  User,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import {
  findOrderBySP,
  voidOrderViaAPI,
  searchWorkPlaces,
  updateOrderWorkPlace,
  getOrderForCreatorChange,
  findUserByEmail,
  updateOrderCreator,
} from "@/app/actions";
import type {
  OrderLetter,
  WorkPlace,
  OrderForCreatorChange,
  User as UserType,
} from "@/types";
import Modal from "@/components/ui/Modal";

export type ToolType = "void" | "mutasi" | "ganti-sales";

interface ToolModalsProps {
  isOpen: boolean;
  onClose: () => void;
  tool: ToolType;
  accessToken: string | null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

const toolConfig = {
  void: {
    title: "Void Order",
    icon: Trash2,
    gradient: "from-red-500 to-rose-600",
    iconBg: "from-red-500/20 to-rose-600/20",
  },
  mutasi: {
    title: "Mutasi Toko",
    icon: Store,
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "from-blue-500/20 to-indigo-600/20",
  },
  "ganti-sales": {
    title: "Ganti Sales",
    icon: User,
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "from-emerald-500/20 to-teal-600/20",
  },
};

export default function ToolModals({
  isOpen,
  onClose,
  tool,
  accessToken,
}: ToolModalsProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [spInput, setSpInput] = useState("");
  const [order, setOrder] = useState<OrderLetter | null>(null);
  const [orderCreator, setOrderCreator] =
    useState<OrderForCreatorChange | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [stores, setStores] = useState<WorkPlace[]>([]);
  const [selectedStore, setSelectedStore] = useState<WorkPlace | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [newUser, setNewUser] = useState<UserType | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { isDarkMode } = useTheme();
  const config = toolConfig[tool];
  const Icon = config.icon;

  const reset = () => {
    setStep(1);
    setSpInput("");
    setOrder(null);
    setOrderCreator(null);
    setStoreSearch("");
    setStores([]);
    setSelectedStore(null);
    setEmailInput("");
    setNewUser(null);
    setError("");
    setSuccessMessage("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCekSP = async () => {
    const sp = spInput.trim();
    if (!sp) {
      setError("Masukkan nomor SP.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const orderResult = await findOrderBySP(sp, accessToken);
      if (!orderResult) {
        setError("Nomor SP tidak ditemukan.");
        setIsLoading(false);
        return;
      }
      setOrder(orderResult);
      if (tool === "ganti-sales") {
        const creatorResult = await getOrderForCreatorChange(sp);
        setOrderCreator(creatorResult ?? null);
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memeriksa SP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoidConfirm = async () => {
    if (!order || !accessToken) return;
    setError("");
    setIsLoading(true);
    try {
      const result = await voidOrderViaAPI(order.id, accessToken);
      if (result.success) {
        setSuccessMessage("Pesanan berhasil di-void.");
        setStep(4);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal void.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchStore = async () => {
    const q = storeSearch.trim();
    if (!q) return;
    setError("");
    setIsLoading(true);
    try {
      const list = await searchWorkPlaces(q);
      setStores(list);
      if (list.length === 0) setError("Toko tidak ditemukan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari toko.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMutasi = async () => {
    if (!order || !selectedStore) return;
    setError("");
    setIsLoading(true);
    try {
      const result = await updateOrderWorkPlace(order.no_sp, selectedStore.id);
      if (result.success) {
        setSuccessMessage(
          `SP ${order.no_sp} berhasil dipindah ke ${selectedStore.name}.`
        );
        setStep(4);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mutasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchUser = async () => {
    const email = emailInput.trim();
    if (!email) return;
    setError("");
    setIsLoading(true);
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        setError("Email tidak ditemukan di database user.");
        setNewUser(null);
      } else {
        setNewUser(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari user.");
      setNewUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmGantiSales = async () => {
    if (!order || !newUser) return;
    setError("");
    setIsLoading(true);
    try {
      const result = await updateOrderCreator(
        order.no_sp,
        newUser.id,
        newUser.name
      );
      if (result.success) {
        setSuccessMessage(
          `SP ${order.no_sp} sekarang milik ${newUser.name}.`
        );
        setStep(4);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal ganti sales.");
    } finally {
      setIsLoading(false);
    }
  };

  const btnPrimary =
    "rounded-xl bg-gradient-to-r py-3 font-medium text-white shadow-lg transition hover:opacity-90 disabled:opacity-50";
  const panelClass = isDarkMode
    ? "border-slate-700 bg-slate-900"
    : "border-slate-200 bg-white/95 backdrop-blur-xl";
  const headerBorderClass = isDarkMode
    ? "border-b border-slate-700/80"
    : "border-b border-slate-200";
  const titleClass = isDarkMode ? "text-white" : "text-slate-900";
  const closeClass = isDarkMode
    ? "text-slate-400 hover:bg-white/5 hover:text-gray-200"
    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700";
  const inputClass = isDarkMode
    ? "border-slate-700 bg-slate-950 text-gray-200 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/30"
    : "border-slate-300 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20";
  const labelClass = isDarkMode ? "text-gray-300" : "text-slate-700";
  const reviewBoxClass = isDarkMode
    ? "border-slate-700 bg-slate-950/80"
    : "border-slate-200 bg-slate-50/80";
  const reviewLabelClass = isDarkMode ? "text-slate-500" : "text-slate-500";
  const reviewValueClass = isDarkMode ? "text-gray-200" : "text-slate-800";
  const reviewPriceClass = isDarkMode ? "text-cyan-400" : "text-blue-600";
  const secondaryBtnClass = isDarkMode
    ? "border-slate-600 bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
    : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200";
  const storeItemClass = (selected: boolean) =>
    selected
      ? isDarkMode
        ? "border-blue-500 bg-blue-500/20 text-cyan-300"
        : "border-blue-400 bg-blue-50 text-blue-800"
      : isDarkMode
        ? "border-slate-700 bg-slate-950/50 text-gray-300 hover:bg-slate-800/50"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  const userBoxClass = isDarkMode
    ? "border-emerald-500/30 bg-emerald-500/10"
    : "border-emerald-200 bg-emerald-50/80";
  const userTextClass = isDarkMode ? "text-emerald-300" : "text-emerald-800";
  const userEmailClass = isDarkMode ? "text-emerald-400/80" : "text-emerald-600";
  const successTextClass = isDarkMode ? "text-gray-200" : "text-slate-800";
  const closeBtnClass = isDarkMode
    ? "from-slate-700 to-slate-800 text-gray-200"
    : "from-slate-200 to-slate-300 text-slate-800";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      panelClassName={`w-full max-w-md border ${panelClass}`}
    >
      <div
        className={`flex items-center justify-between px-6 py-4 ${headerBorderClass}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.iconBg} text-white`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <h2 className={`text-lg font-semibold ${titleClass}`}>
            {config.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className={`rounded-lg p-2 transition ${closeClass}`}
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <label className={`block text-sm font-medium ${labelClass}`}>
              Nomor SP
            </label>
            <input
              type="text"
              value={spInput}
              onChange={(e) => setSpInput(e.target.value)}
              placeholder="Contoh: 2602141101612D"
              className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 ${inputClass}`}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCekSP}
              disabled={isLoading}
              className={`flex w-full items-center justify-center gap-2 ${btnPrimary} bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Cek SP"
              )}
            </button>
          </div>
        )}

        {step === 2 && order && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${reviewBoxClass}`}>
              <div className="grid gap-2 text-sm">
                <div>
                  <span className={reviewLabelClass}>No SP</span>
                  <p className={`font-medium ${reviewValueClass}`}>
                    {order.no_sp}
                  </p>
                </div>
                <div>
                  <span className={reviewLabelClass}>Customer</span>
                  <p className={`font-medium ${reviewValueClass}`}>
                    {order.customer_name}
                  </p>
                </div>
                <div>
                  <span className={reviewLabelClass}>Total</span>
                  <p className={`font-bold ${reviewPriceClass}`}>
                    {formatPrice(order.extended_amount)}
                  </p>
                </div>
                {orderCreator && (
                  <div>
                    <span className={reviewLabelClass}>Sales saat ini</span>
                    <p className={`font-medium ${reviewValueClass}`}>
                      {orderCreator.creator_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${secondaryBtnClass}`}
              >
                Ganti SP
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className={`flex-1 rounded-xl py-2 text-sm font-medium text-white shadow-lg bg-gradient-to-r ${config.gradient}`}
              >
                Lanjut
              </button>
            </div>
          </div>
        )}

        {step === 3 && order && (
          <div className="space-y-4">
            {tool === "void" && (
              <>
                <p className="text-sm text-gray-400">
                  Konfirmasi pembatalan pesanan {order.no_sp}?
                </p>
                <button
                  type="button"
                  onClick={handleVoidConfirm}
                  disabled={isLoading}
                  className={`flex w-full items-center justify-center gap-2 ${btnPrimary} bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/25`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      Confirm Void
                    </>
                  )}
                </button>
              </>
            )}

            {tool === "mutasi" && (
              <>
                <label
                  className={`block text-sm font-medium ${labelClass}`}
                >
                  Cari toko tujuan
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder="Nama toko..."
                    className={`flex-1 rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 ${inputClass}`}
                  />
                  <button
                    type="button"
                    onClick={handleSearchStore}
                    disabled={isLoading}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${secondaryBtnClass}`}
                  >
                    Cari
                  </button>
                </div>
                {stores.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">
                      Pilih toko:
                    </p>
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {stores.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedStore(s)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${storeItemClass(selectedStore?.id === s.id)}`}
                        >
                          [{s.category}] {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleConfirmMutasi}
                  disabled={!selectedStore || isLoading}
                  className={`flex w-full items-center justify-center gap-2 ${btnPrimary} bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Store className="h-5 w-5" />
                      Confirm Move
                    </>
                  )}
                </button>
              </>
            )}

            {tool === "ganti-sales" && (
              <>
                <label
                  className={`block text-sm font-medium ${labelClass}`}
                >
                  Email sales baru
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setNewUser(null);
                    }}
                    placeholder="email@example.com"
                    className={`flex-1 rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 ${inputClass}`}
                  />
                  <button
                    type="button"
                    onClick={handleSearchUser}
                    disabled={isLoading}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${secondaryBtnClass}`}
                  >
                    Cek
                  </button>
                </div>
                {newUser && (
                  <div
                    className={`rounded-xl border p-3 text-sm ${userBoxClass}`}
                  >
                    <p className={`font-medium ${userTextClass}`}>
                      {newUser.name}
                    </p>
                    <p className={userEmailClass}>{newUser.email}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleConfirmGantiSales}
                  disabled={!newUser || isLoading}
                  className={`flex w-full items-center justify-center gap-2 ${btnPrimary} bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/25`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <User className="h-5 w-5" />
                      Confirm Change
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30">
              <Check className="h-8 w-8" />
            </div>
            <p className={`text-center font-medium ${successTextClass}`}>
              {successMessage}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className={`rounded-xl bg-gradient-to-r px-6 py-2.5 text-sm font-medium hover:opacity-90 ${closeBtnClass}`}
            >
              Tutup
            </button>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
