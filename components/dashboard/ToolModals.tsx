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
  FileEdit,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  Package,
  MapPin,
  Calendar,
  ClipboardList,
  Phone,
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
  getSPFullOverview,
  getProducts,
  swapItemProduct,
} from "@/app/actions";
import type {
  OrderLetter,
  WorkPlace,
  OrderForCreatorChange,
  User as UserType,
  SPFullOverview,
  OrderLetterDetail,
  Product,
} from "@/types";
import Modal from "@/components/ui/Modal";

export type ToolType = "void" | "mutasi" | "ganti-sales" | "edit-order";

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
  "edit-order": {
    title: "Edit Order",
    icon: FileEdit,
    gradient: "from-violet-500 to-purple-600",
    iconBg: "from-violet-500/20 to-purple-600/20",
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
  const [spOverview, setSpOverview] = useState<SPFullOverview | null>(null);
  const [editOrderTab, setEditOrderTab] = useState<"items" | "payments" | "approvals">("items");
  const [replaceItemOverlay, setReplaceItemOverlay] = useState<{
    detailId: number;
    item: OrderLetterDetail;
  } | null>(null);
  const [productSearchKeyword, setProductSearchKeyword] = useState("");
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductSearching, setIsProductSearching] = useState(false);
  const [isSwapLoading, setIsSwapLoading] = useState(false);

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
    setSpOverview(null);
    setEditOrderTab("items");
    setReplaceItemOverlay(null);
    setProductSearchKeyword("");
    setProductSearchResults([]);
    setSelectedProduct(null);
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
      if (tool === "edit-order") {
        const overview = await getSPFullOverview(sp);
        if (!overview) {
          setError("Nomor SP tidak ditemukan.");
          setIsLoading(false);
          return;
        }
        setSpOverview(overview);
        setOrder({
          id: overview.header.id,
          no_sp: overview.header.no_sp,
          customer_name: overview.header.customer_name,
          extended_amount: overview.header.extended_amount,
          status: overview.header.status,
        });
        setStep(2);
      } else {
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
      }
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

  const handleSearchProduct = async () => {
    const q = productSearchKeyword.trim();
    if (!q) return;
    setError("");
    setIsProductSearching(true);
    try {
      const result = await getProducts(1, q);
      setProductSearchResults(result.products);
      setSelectedProduct(null);
      if (result.products.length === 0) setError("Produk tidak ditemukan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari produk.");
    } finally {
      setIsProductSearching(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!replaceItemOverlay || !selectedProduct) return;
    setError("");
    setIsSwapLoading(true);
    try {
      const result = await swapItemProduct(replaceItemOverlay.detailId, selectedProduct.id);
      if (result.success) {
        const sp = spOverview?.header.no_sp ?? spInput.trim();
        const refreshed = await getSPFullOverview(sp);
        if (refreshed) setSpOverview(refreshed);
        setReplaceItemOverlay(null);
        setProductSearchKeyword("");
        setProductSearchResults([]);
        setSelectedProduct(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengganti barang.");
    } finally {
      setIsSwapLoading(false);
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
      panelClassName={`w-full ${tool === "edit-order" ? "max-w-5xl" : "max-w-md"} border ${panelClass}`}
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
              {tool === "edit-order"
                ? "Masukkan Nomor SP (misal: 2602...)"
                : "Nomor SP"}
            </label>
            <input
              type="text"
              value={spInput}
              onChange={(e) => setSpInput(e.target.value)}
              placeholder={tool === "edit-order" ? "2602..." : "Contoh: 2602141101612D"}
              className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 ${inputClass}`}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCekSP}
              disabled={isLoading}
              className={`flex w-full items-center justify-center gap-2 ${btnPrimary} ${
                tool === "edit-order"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 shadow-violet-500/25"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : tool === "edit-order" ? (
                "Cek Detail Lengkap"
              ) : (
                "Cek SP"
              )}
            </button>
          </div>
        )}

        {step === 2 && order && tool === "edit-order" && spOverview && !replaceItemOverlay && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${isDarkMode ? "bg-slate-900/50" : "bg-slate-50"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 space-y-1 text-xs sm:text-sm">
                      <p className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Pelanggan</p>
                      <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>{spOverview.header.customer_name || "—"}</p>
                      {spOverview.header.phone && (
                        <p className={`flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          <Phone className="h-3 w-3 shrink-0" />
                          {spOverview.header.phone}
                        </p>
                      )}
                      {spOverview.header.email && (
                        <p className={isDarkMode ? "text-slate-400" : "text-slate-600"}>{spOverview.header.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                      <MapPin className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 space-y-1 text-xs sm:text-sm">
                      <p className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Pengiriman</p>
                      <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                        {(spOverview.header.address_ship_to || spOverview.header.address) || "—"}
                      </p>
                      {spOverview.header.request_date && (
                        <p className={`flex items-center gap-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          <Calendar className="h-3 w-3 shrink-0" />
                          Req: {new Date(spOverview.header.request_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      )}
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${spOverview.header.take_away ? (isDarkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-800") : (isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-800")}`}>
                        {spOverview.header.take_away ? "Ambil Sendiri" : "Kirim"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                      <ClipboardList className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 space-y-1 text-xs sm:text-sm">
                      <p className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Info Order</p>
                      {spOverview.header.sales_code && (
                        <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>Sales: {spOverview.header.sales_code}</p>
                      )}
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"}`}>
                        {spOverview.header.status || "—"}
                      </span>
                      {spOverview.header.note && (
                        <p className={`italic ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>{spOverview.header.note}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Total</p>
                  <p className={`text-xl font-bold sm:text-2xl ${reviewPriceClass}`}>{formatPrice(spOverview.header.extended_amount)}</p>
                  <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>{spOverview.header.no_sp}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
              {(["items", "payments", "approvals"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEditOrderTab(t)}
                  className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
                    editOrderTab === t
                      ? isDarkMode
                        ? "bg-slate-800 text-cyan-300"
                        : "bg-slate-100 text-blue-700"
                      : isDarkMode
                        ? "text-slate-400 hover:bg-slate-800/50"
                        : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t === "items" && <Package className="h-4 w-4" />}
                  {t === "payments" && <CreditCard className="h-4 w-4" />}
                  {t === "approvals" && <ShieldCheck className="h-4 w-4" />}
                  {t === "items" ? "ITEMS" : t === "payments" ? "PAYMENTS" : "APPROVALS"}
                </button>
              ))}
            </div>
            {editOrderTab === "items" && (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}>
                      <th className="w-[30%] px-3 py-2 text-left text-xs font-medium uppercase tracking-wide">Produk</th>
                      <th className="w-[5%] px-3 py-2 text-center text-xs font-medium uppercase tracking-wide">Qty</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium uppercase tracking-wide">Pricelist</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium uppercase tracking-wide">Harga Deal</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium uppercase tracking-wide">Diskon (Potongan)</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium uppercase tracking-wide">Total</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {spOverview.items.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
                      >
                        <td className="w-[30%] px-3 py-2">{item.item_description}</td>
                        <td className="w-[5%] px-3 py-2 text-center">{item.qty}</td>
                        <td className={`whitespace-nowrap px-3 py-2 text-right ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {formatPrice(item.unit_price)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400">
                          {item.customer_price != null ? formatPrice(item.customer_price) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-sm">
                          {(() => {
                            const netPrice = item.net_price ?? 0;
                            const discount = netPrice === 0 ? item.unit_price : item.unit_price - netPrice;
                            return discount === 0 ? (
                              <span className={isDarkMode ? "text-slate-500" : "text-slate-400"}>—</span>
                            ) : (
                              <span className="text-red-500 dark:text-red-400">- {formatPrice(discount)}</span>
                            );
                          })()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-medium">
                          {item.extended_price === 0 ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-400/30 dark:text-emerald-400">
                              BONUS
                            </span>
                          ) : (
                            formatPrice(item.extended_price)
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setReplaceItemOverlay({ detailId: item.id, item })}
                            className="flex items-center gap-1 rounded-lg border border-violet-500/50 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-600 hover:bg-violet-500/20 dark:text-violet-400"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Ganti
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {editOrderTab === "payments" && (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}>
                      <th className="px-3 py-2 text-left font-medium">Metode</th>
                      <th className="px-3 py-2 text-right font-medium">Jumlah</th>
                      <th className="px-3 py-2 text-left font-medium">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spOverview.payments.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                          Tidak ada data pembayaran
                        </td>
                      </tr>
                    ) : (
                      spOverview.payments.map((p) => (
                        <tr
                          key={p.id}
                          className={`border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
                        >
                          <td className="px-3 py-2">{p.payment_method}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatPrice(p.payment_amount)}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID") : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {editOrderTab === "approvals" && (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}>
                      <th className="px-3 py-2 text-left font-medium">Approver</th>
                      <th className="px-3 py-2 text-center font-medium">Level</th>
                      <th className="px-3 py-2 text-right font-medium">Diskon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spOverview.approvals.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                          Tidak ada data approval
                        </td>
                      </tr>
                    ) : (
                      spOverview.approvals.map((a) => (
                        <tr
                          key={a.id}
                          className={`border-t ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}
                        >
                          <td className="px-3 py-2">{a.approver_name}</td>
                          <td className="px-3 py-2 text-center">{a.approver_level_id}</td>
                          <td className="px-3 py-2 text-right">
                            {a.discount != null ? `${a.discount}%` : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${secondaryBtnClass}`}
            >
              Ganti SP
            </button>
          </div>
        )}

        {step === 2 && replaceItemOverlay && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setReplaceItemOverlay(null);
                  setProductSearchKeyword("");
                  setProductSearchResults([]);
                  setSelectedProduct(null);
                }}
                className={`rounded-lg p-1.5 ${secondaryBtnClass}`}
              >
                <X className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">Ganti Barang</span>
            </div>
            <div className={`rounded-xl border p-3 text-sm ${reviewBoxClass}`}>
              <p className={reviewLabelClass}>Saat ini:</p>
              <p className={reviewValueClass}>{replaceItemOverlay.item.item_description}</p>
              <p className={reviewPriceClass}>
                {formatPrice(replaceItemOverlay.item.unit_price)} × {replaceItemOverlay.item.qty} ={" "}
                {formatPrice(replaceItemOverlay.item.extended_price)}
              </p>
            </div>
            <div>
              <label className={`mb-1 block text-sm font-medium ${labelClass}`}>Cari produk baru</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={productSearchKeyword}
                  onChange={(e) => setProductSearchKeyword(e.target.value)}
                  placeholder="Kata kunci produk..."
                  className={`flex-1 rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={handleSearchProduct}
                  disabled={isProductSearching}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${secondaryBtnClass}`}
                >
                  {isProductSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
                </button>
              </div>
            </div>
            {productSearchResults.length > 0 && (
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {productSearchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProduct(prod)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${storeItemClass(selectedProduct?.id === prod.id)}`}
                  >
                    <span className="font-medium">{prod.brand} {prod.tipe}</span>
                    <span className="block text-xs opacity-80">{prod.ukuran} - {formatPrice(prod.end_user_price)}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedProduct && (
              <div className={`rounded-xl border p-3 text-sm ${userBoxClass}`}>
                <p className={reviewLabelClass}>Diganti ke:</p>
                <p className={reviewValueClass}>{selectedProduct.brand} {selectedProduct.tipe} {selectedProduct.ukuran}</p>
                <p className={reviewPriceClass}>
                  {formatPrice(selectedProduct.end_user_price)} × {replaceItemOverlay.item.qty} ={" "}
                  {formatPrice(selectedProduct.end_user_price * replaceItemOverlay.item.qty)}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleConfirmSwap}
              disabled={!selectedProduct || isSwapLoading}
              className={`flex w-full items-center justify-center gap-2 ${btnPrimary} bg-gradient-to-r from-violet-600 to-purple-600 shadow-violet-500/25`}
            >
              {isSwapLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Konfirmasi Ganti Barang"
              )}
            </button>
          </div>
        )}

        {step === 2 && order && tool !== "edit-order" && (
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
