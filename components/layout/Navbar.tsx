"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCartStore, useAuthStore, useWishlistStore } from "@/lib/store";
import type { SiteConfig } from "@/types";
import {
  Search,
  User,
  Heart,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Package,
} from "lucide-react";

interface NavbarProps {
  site: SiteConfig;
}

export default function Navbar({ site }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const { getCount, toggleCart } = useCartStore();
  const { user, logout } = useAuthStore();
  const { items: wishlist } = useWishlistStore();
  const cartCount = getCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // Close the account dropdown when clicking anywhere outside it, or pressing Escape.
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [userMenuOpen]);

  return (
    <>
      {/* Announcement */}
      <div className="promo-strip text-xs">{site.announcement}</div>

      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              <img src={site.logo} alt={site.name} className="h-9 w-auto" />
              <span className="hidden sm:inline" style={{ fontFamily: 'var(--font-heading)' }}>{site.name}</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center mx-auto">
              {site.mainNav.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="px-4 py-5 text-sm font-medium text-gray-700 hover:text-gray-900 relative group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] group-hover:w-full transition-all"></span>
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2"
              >
                <Search size={18} />
              </button>

              {/* User */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2"
                >
                  <User size={18} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white shadow-xl rounded-lg">
                    {user ? (
                      <>
                        <div className="p-3 border-b">
                          <p className="text-sm font-semibold">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>

                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm"
                        >
                          <LayoutDashboard size={14} /> Dashboard
                        </Link>

                        <Link
                          href="/dashboard/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm"
                        >
                          <Package size={14} /> Orders
                        </Link>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="block w-full text-left px-4 py-2 text-red-500"
                        >
                          <LogOut size={14} /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm"
                        >
                          Login
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm"
                        >
                          Register
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link href="/dashboard/wishlist" className="relative p-2">
                <Heart size={18} />
                {mounted && wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1 rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button onClick={toggleCart} className="relative p-2">
                <ShoppingCart size={18} />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Search */}
          {searchOpen && (
            <div className="pb-3">
              <form action="/search" className="flex gap-2">
                <input
                  ref={searchRef}
                  name="q"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border px-3 py-2"
                  placeholder="Search..."
                />
                <button className="px-4 bg-black text-white">Search</button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="p-4 space-y-2">
              {site.mainNav.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
