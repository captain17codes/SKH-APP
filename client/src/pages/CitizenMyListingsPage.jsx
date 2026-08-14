import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Layers, Clock, Eye, Trash2, Edit3, Plus,
  CheckCircle2, AlertCircle, ArrowLeft, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/api';
import toast from 'react-hot-toast';

const CitizenMyListingsPage = () => {
  const auth = useAuth() || {};
  const user = auth.user || { name: 'Aniket Sharma', id: 'USR-CITIZEN-01' };
  const navigate = useNavigate();

  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyProperties = async () => {
    setLoading(true);
    try {
      const sellerId = user?.id || 'USR-CITIZEN-01';
      const data = await propertyService.getMyListings(sellerId);
      setMyProperties(data);
    } catch (e) {
      console.error('Failed to load citizen properties:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProperties();
  }, []);

  const handleWithdraw = async (id) => {
    if (window.confirm(`Are you sure you want to withdraw listing #${id}?`)) {
      try {
        await propertyService.updateStatus(id, { status: 'Withdrawn' });
        toast.success(`Listing #${id} withdrawn`);
        fetchMyProperties();
      } catch (err) {
        console.warn('Withdraw error:', err);
      }
    }
  };

  const formatPrice = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">My Registered Land Parcels ({myProperties.length})</h3>
          <p className="text-xs text-slate-500">Review municipal verification status, views, and buyer inquiry messages.</p>
        </div>

        <Link to="/citizen/properties/sell" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>List New Property</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 animate-pulse text-xs font-bold">Loading your listings...</div>
      ) : myProperties.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
          <Clock className="w-12 h-12 text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold">No Property Listings Submitted Yet</h4>
          <p className="text-xs text-slate-500">You have not submitted any land or property listings for sale.</p>
          <Link to="/citizen/properties/sell" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs">
            + Sell My Property Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myProperties.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
              <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-500">#{p.id}</span>
                    <span className="text-slate-400">• Submitted {new Date(p.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{p.name || p.title}</h4>
                  <p className="text-slate-500 mt-0.5">{p.locality} • {p.ward}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                    p.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {p.verificationStatus === 'Verified' ? '✓ Verified Listing' : '⏳ Waiting for municipal verification'}
                  </span>

                  <span className="px-3 py-1 rounded-full font-bold text-[11px] bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {p.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Expected Price</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatPrice(p.price || p.expectedPrice)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Land Area</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{p.area?.toLocaleString()} {p.areaUnit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Views</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{p.views || 0} clicks</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Inquiries</span>
                  <span className="font-extrabold text-cyan-500">{p.inquiriesCount || 0} Buyer Inquiries</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 text-[11px]">Land Use: <strong>{p.landUse}</strong></span>

                <div className="flex space-x-2">
                  <Link to={`/citizen/properties/${p.id}`} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>

                  <button onClick={() => handleWithdraw(p.id)} className="px-3 py-1.5 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-lg font-bold flex items-center space-x-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Withdraw Listing</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitizenMyListingsPage;
