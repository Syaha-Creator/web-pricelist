"use client";

import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { useTheme } from "./ThemeContext";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const { isDarkMode } = useTheme();
  const hasDiscount =
    product.pricelist > 0 && product.pricelist > product.end_user_price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.pricelist - product.end_user_price) / product.pricelist) * 100
      )
    : 0;

  const cardClass = isDarkMode
    ? "border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:shadow-cyan-500/5"
    : "border-slate-200 bg-white/60 hover:border-slate-300 hover:shadow-slate-200";
  const imageClass = isDarkMode
    ? "border-slate-800/80 bg-slate-800/80"
    : "border-slate-200/80 bg-slate-100/80";
  const brandClass = isDarkMode ? "text-slate-400" : "text-slate-500";
  const titleClass = isDarkMode ? "text-gray-200" : "text-slate-800";
  const metaClass = isDarkMode ? "text-slate-500" : "text-slate-500";
  const priceClass = isDarkMode ? "text-cyan-400" : "text-blue-600";
  const badgeClass = isDarkMode
    ? "bg-red-500/20 text-red-400"
    : "bg-red-100 text-red-700";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`flex flex-col overflow-hidden rounded-xl border shadow-lg transition-shadow ${cardClass}`}
    >
      <div
        className={`flex min-h-[120px] flex-[0_0_60%] items-center justify-center rounded-t-xl border-b ${imageClass} ${
          product.brand?.toLowerCase() === "comforta"
            ? isDarkMode
              ? "bg-blue-500/20"
              : "bg-blue-100"
            : ""
        }`}
      >
        <Package
          className={
            isDarkMode ? "h-10 w-10 text-slate-500" : "h-10 w-10 text-slate-400"
          }
          aria-hidden
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p
          className={`text-xs font-medium uppercase tracking-wider ${brandClass}`}
        >
          {product.brand || "—"}
        </p>
        <p className={`mt-1 line-clamp-2 text-sm font-medium ${titleClass}`}>
          {product.tipe}
        </p>
        <p className={`text-xs ${metaClass}`}>{product.ukuran}</p>
        <div className="mt-3 flex items-center gap-2">
          {hasDiscount && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
            >
              -{discountPct}%
            </span>
          )}
          <p className={`text-lg font-bold ${priceClass}`}>
            {formatPrice(product.end_user_price)}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
