"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, LogOut } from "lucide-react";

const ITEMS_PER_PAGE = 20;

interface Product {
  id: number;
  brand: string;
  tipe: string;
  ukuran: string;
  pricelist: number;
  end_user_price: number;
  program: string | null;
  kasur: string;
  divan: string;
  headboard: string;
}

interface ApiResponse {
  status: string;
  data: Product[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getConfigTag(divan: string, headboard: string): string {
  if (divan === "Tanpa Divan" && headboard === "Tanpa Headboard") {
    return "Mattress Only";
  }
  return "Full Set";
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60">
      <div className="aspect-square w-full rounded-lg bg-slate-200" />
      <div className="mt-2 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
      <div className="mt-2 h-5 w-1/4 rounded bg-slate-200" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  const fetchProducts = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    setFetchError(null);
    setIsLoading(true);

    try {
      const url = `/api/proxy-products?access_token=${encodeURIComponent(token)}`;
      const response = await fetch(url, { method: "GET" });
      const json = await response.json().catch(() => ({})) as ApiResponse;

      if (!response.ok) {
        const msg = (json as { message?: string }).message ?? "Failed to fetch data";
        throw new Error(msg);
      }

      const products = Array.isArray(json.data) ? json.data : [];
      setAllProducts(products);
      setDisplayedCount(ITEMS_PER_PAGE);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load products");
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchProducts();
  }, [isAuthenticated, fetchProducts]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(allProducts.map((p) => p.brand).filter(Boolean));
    return ["All", ...Array.from(brands).sort()];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    if (selectedBrand !== "All") {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.tipe.toLowerCase().includes(q) ||
          p.ukuran.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allProducts, selectedBrand, searchQuery]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, displayedCount),
    [filteredProducts, displayedCount]
  );

  const hasMore = displayedCount < filteredProducts.length;
  const showLoadMore = hasMore && !isLoading;

  const handleLoadMore = () => {
    setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setDisplayedCount(ITEMS_PER_PAGE);
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setDisplayedCount(ITEMS_PER_PAGE);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
    router.replace("/");
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-bold text-slate-800 sm:text-xl">
            Alita Pricelist
          </h1>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200"
          >
            <LogOut className="h-5 w-5" aria-hidden size={20} />
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-5 w-5" aria-hidden size={20} />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by tipe or ukuran..."
              aria-label="Search products"
              className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Category Tabs (Brand Filter) */}
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {uniqueBrands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => handleBrandChange(brand)}
                className={`min-w-fit shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedBrand === brand
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-red-600">{fetchError}</p>
            <button
              type="button"
              onClick={() => fetchProducts()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-500">No products found.</p>
            <p className="mt-1 text-sm text-slate-400">
              {searchQuery || selectedBrand !== "All"
                ? "Try a different search or filter."
                : "The catalog is empty."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
              {displayedProducts.map((item) => (
                <article
                  key={item.id}
                  className="relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60"
                >
                  {/* Program Badge (top-right) */}
                  {item.program && (
                    <span className="absolute right-2 top-2 z-10 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                      {item.program}
                    </span>
                  )}

                  {/* Placeholder: Comforta = blue, else gray */}
                  <div
                    className={`flex aspect-square w-full items-center justify-center text-lg font-semibold text-white ${
                      item.brand.toLowerCase() === "comforta"
                        ? "bg-blue-500"
                        : "bg-slate-400"
                    }`}
                  >
                    {item.brand || "—"}
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <h2 className="line-clamp-1 text-sm font-bold text-slate-800">
                      {item.tipe}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">{item.ukuran}</p>

                    <div className="mt-2">
                      {item.pricelist > 0 && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(item.pricelist)}
                        </p>
                      )}
                      <p className="text-base font-bold text-blue-600">
                        {formatPrice(item.end_user_price)}
                      </p>
                    </div>

                    <span className="mt-2 inline-block w-fit rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {getConfigTag(item.divan, item.headboard)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            {showLoadMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
