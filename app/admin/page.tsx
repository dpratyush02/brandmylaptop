'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/currency';
import {
  Lock,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Edit states
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [newStickerStatus, setNewStickerStatus] = useState('WINNER_CONFIRMED');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Check saved session
  useEffect(() => {
    const savedToken = localStorage.getItem('bml_admin_token');
    if (savedToken) {
      setPassword(savedToken);
      fetchAdminData(savedToken);
    }
  }, []);

  const fetchAdminData = async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem('bml_admin_token');
          throw new Error('Invalid admin password.');
        }
        throw new Error('Failed to fetch admin data.');
      }

      const json = await res.json();
      setData(json);
      setIsAuthenticated(true);
      localStorage.setItem('bml_admin_token', token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData(password);
  };

  const handleAdminAction = async (action: string, payload: any = {}) => {
    setLoading(true);
    setStatusMsg(null);
    setError(null);

    try {
      const token = localStorage.getItem('bml_admin_token') || password;
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...payload }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Action failed.');
      }

      setStatusMsg(json.message || 'Action executed successfully.');
      fetchAdminData(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSticker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) return;

    handleAdminAction('UPDATE_STICKER_STATUS', {
      spotId: selectedSpot.id,
      stickerStatus: newStickerStatus,
      proofImageUrl: proofUrl || undefined,
      notes: notes || undefined,
    });
  };

  // If not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white">Admin Dashboard</h2>
              <p className="text-xs text-zinc-400 font-mono">BrandMyLaptop Control</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-zinc-500"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-red-500/40 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard →'}
            </button>
          </form>

          <div className="text-center pt-1">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 font-mono">
              ← Return to public website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const auction = data?.auction;
  const spots = auction?.spots || [];
  const totalRaised = spots.reduce((sum: number, s: any) => sum + (s.currentBid > 0 ? s.currentBid : 0), 0);
  const occupiedCount = spots.filter((s: any) => s.currentBid > 0).length;

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-zinc-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Admin Control Center
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Live Auction Operations & Sticker Pipeline
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchAdminData(password)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-bold transition"
            >
              Public Site →
            </Link>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center justify-between font-mono">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Total Raised</span>
            <span className="font-mono text-xl font-bold text-white mt-1 block">
              {formatMoney(totalRaised)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Occupied Spots</span>
            <span className="font-mono text-xl font-bold text-white mt-1 block">
              {occupiedCount} / 10
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Status</span>
            <span className="font-mono text-xs font-bold text-zinc-300 mt-1.5 block">
              {auction?.status === 'ACTIVE' ? '● ACTIVE (72h)' : '★ CLOSED'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Total Bids</span>
            <span className="font-mono text-xl font-bold text-white mt-1 block">
              {data?.bids?.length || 0}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            Auction Actions
          </h3>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleAdminAction('EXTEND_AUCTION', { hours: 24 })}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 transition"
            >
              +24h Extension
            </button>

            {auction?.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Close auction immediately and finalize winners?')) {
                    handleAdminAction('CLOSE_AUCTION');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold transition"
              >
                Close Auction & Finalize
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAdminAction('EXTEND_AUCTION', { hours: 72 })}
                className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold transition"
              >
                Reopen (72h)
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset auction to clean slate (clears all test bids and resets all 10 spots)?')) {
                  handleAdminAction('RESET_DEMO_DATA');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/40 text-red-400 border border-red-900/30 text-xs font-semibold transition ml-auto"
            >
              Reset to Clean Slate (0 Bids)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">
              10 Physical Spots
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              Click Fulfill to update sticker status
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="p-3">Spot</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Current Bid</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3">Bidder Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {spots.map((spot: any) => (
                  <tr key={spot.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-3 font-mono font-bold text-white">
                      #{spot.number.toString().padStart(2, '0')}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-zinc-200">{spot.position}</div>
                      <div className="text-zinc-500 text-[10px] font-mono">{spot.size}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-white">
                      {formatMoney(spot.currentBid > 0 ? spot.currentBid : spot.startingPrice)}
                    </td>
                    <td className="p-3">
                      {spot.currentBrandName ? (
                        <span className="font-semibold text-white">{spot.currentBrandName}</span>
                      ) : (
                        <span className="text-zinc-500">Available</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-zinc-300">{spot.currentBidderName || '—'}</div>
                      <div className="text-zinc-500 font-mono text-[10px]">{spot.currentBidderEmail || '—'}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {spot.stickerStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSpot(spot);
                          setNewStickerStatus(spot.stickerStatus || 'WINNER_CONFIRMED');
                          setProofUrl(spot.proofImageUrl || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold transition"
                      >
                        Fulfill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {selectedSpot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-sm text-white">
                  Sticker Pipeline: Spot #{selectedSpot.number.toString().padStart(2, '0')}
                </h3>
                <button onClick={() => setSelectedSpot(null)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleUpdateSticker} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={newStickerStatus}
                    onChange={(e) => setNewStickerStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-500"
                  >
                    <option value="WINNER_CONFIRMED">Winner Confirmed</option>
                    <option value="LOGO_RECEIVED">Logo Received & Vectorized</option>
                    <option value="PREPARED">Sticker Prepared (Vinyl Printed)</option>
                    <option value="INSTALLED">Sticker Installed on HP Laptop Lid</option>
                    <option value="PROOF_UPLOADED">Proof Photo Uploaded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Proof Photo URL
                  </label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://example.com/laptop-photo.jpg"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Installed high-grade matte vinyl sticker"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSpot(null)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition"
                  >
                    Save Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
