"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { getProducts } from "@/app/actions";
import type { Product } from "@/types";
import ProductCard from "./ProductCard";

export default function ProductSection() {
  const { isDarkMode } = useTheme();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearched(true);
    startTransition(async () => {
      const result = await getProducts(1, q);
      setProducts(result.products);
    });
  };

  const inputClass = isDarkMode
    ? "border-slate-700 bg-slate-900/80 text-gray-200 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/30"
    : "border-slate-300 bg-white/90 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20";
  const iconClass = isDarkMode ? "text-slate-400" : "text-slate-500";
  const emptyClass = isDarkMode ? "text-slate-400" : "text-slate-500";
  const hintClass = isDarkMode ? "text-slate-500" : "text-slate-500";

  return (
    <section className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="relative">
        <Search
          className={`absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 ${iconClass}`}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari produk (brand, tipe, ukuran...)"
          className={`w-full rounded-2xl border py-4 pl-12 pr-36 focus:outline-none focus:ring-2 ${inputClass}`}
          aria-label="Search products"
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Mencari..." : "Cari"}
        </button>
      </form>

      {isPending && (
        <div className="flex items-center justify-center py-16">
          <div
            className={`h-8 w-8 animate-spin rounded-full border-2 ${
              isDarkMode
                ? "border-slate-600 border-t-cyan-400"
                : "border-slate-300 border-t-blue-500"
            }`}
          />
        </div>
      )}

      {!isPending && searched && products.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`py-12 text-center ${emptyClass}`}
        >
          Tidak ada produk ditemukan. Coba kata kunci lain.
        </motion.p>
      )}

      {!isPending && products.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </motion.div>
      )}

      {!searched && (
        <p className={`py-10 text-center ${hintClass}`}>
          Ketik kata kunci lalu klik Cari untuk menampilkan produk.
        </p>
      )}
    </section>
  );
}
