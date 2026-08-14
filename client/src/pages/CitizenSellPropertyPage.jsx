import React, { useState, useRef, Component } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Layers, DollarSign, Plus, Upload, X, Camera,
  CheckCircle2, AlertTriangle, ArrowLeft, ShieldAlert, FileText, Send,
  Navigation, Image as ImageIcon, Map
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/api';
import toast from 'react-hot-toast';

class SellPropertyErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 text-white">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold">Sell Property Page Error</h3>
          <p className="text-xs text-slate-400">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-600 rounded-xl text-xs font-bold">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PROPERTY_TYPES = [
  'Commercial Plots',
  'Shops',
  'Offices',
  'Warehouses',
  'Industrial Land',
  'Residential Property',
  'Agricultural Land',
  'Other'
];

const WARDS = [
  'Ward 1 - Market Yard',
  'Ward 2 - Tilak Road',
  'Ward 3 - Station Area',
  'Ward 4 - Bypass Corridor',
  'Ward 5 - Housing Board',
  'Ward 6 - Samvatsar Border',
  'Ward 7 - Subhash Road'
];

const LAND_USES = [
  'Commercial',
  'Residential',
  'Industrial',
  'Agricultural',
  'Mixed Use',
  'Other'
];

const CONDITIONS = [
  'Vacant Land',
  'New Construction',
  'Good',
  'Average',
  'Needs Repair'
];

const CitizenSellPropertyPageInner = () => {
  const auth = useAuth() || {};
  const user = auth.user || { name: 'Aniket Sharma', id: 'USR-CITIZEN-01' };
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const docInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [locationMessage, setLocationMessage] = useState(null);

  const [form, setForm] = useState({
    title: 'Prime Commercial Plot near Bypass Corridor',
    propertyType: 'Commercial Plots',
    description: 'Clear title 5,000 sq.ft plot parcel on 24m DP road frontage opposite Kopargaon Bypass Corridor.',
    area: 5000,
    areaUnit: 'sq.ft',
    expectedPrice: 7500000,
    priceNegotiable: 'Yes',
    ward: 'Ward 4 - Bypass Corridor',
    locality: 'Bypass Road Junction',
    address: 'Plot #42, Bypass Road Corridor, Ward 4, Kopargaon',
    latitude: 19.8850,
    longitude: 74.4620,
    landUse: 'Commercial',
    condition: 'Vacant Land',
    roadAccess: '24m DP Road Access',
    waterAvailable: true,
    electricityAvailable: true,
    drainageAvailable: true,
    nearbyLandmarks: 'Bypass Flyover, SBI ATM, Logistics Hub',
    photos: [],
    documents: []
  });

  const handleFetchGps = () => {
    setLocationMessage(null);
    if (!navigator.geolocation) {
      const msg = 'Location permission unavailable. You can enter the location manually.';
      setLocationMessage(msg);
      toast.error(msg);
      return;
    }

    toast.loading('Acquiring current GPS location...', { duration: 1500 });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          locality: `GPS Pin (${lat}° N, ${lng}° E)`,
          address: `Current Location (${lat}° N, ${lng}° E), Kopargaon Municipal Limits`
        }));
        setLocationMessage(null);
        toast.success(`GPS position acquired: ${lat}° N, ${lng}° E`);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        const msg = 'Location permission unavailable. You can enter the location manually.';
        setLocationMessage(msg);
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleImageSelect = (e) => {
    setUploadError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (form.photos.length + files.length > 10) {
      const err = 'Maximum 10 property photos allowed';
      setUploadError(err);
      toast.error(err);
      return;
    }

    const validFiles = [];
    for (const f of files) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)) {
        const err = `Image upload failed for ${f.name}. Only JPG, PNG, WEBP formats are accepted.`;
        setUploadError(err);
        toast.error(err);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        const err = `Image ${f.name} exceeds 10MB limit. Please try another image.`;
        setUploadError(err);
        toast.error(err);
        continue;
      }
      const previewUrl = URL.createObjectURL(f);
      validFiles.push({ file: f, previewUrl, name: f.name });
    }

    if (validFiles.length > 0) {
      setForm(prev => ({ ...prev, photos: [...prev.photos, ...validFiles] }));
      toast.success(`${validFiles.length} photo(s) added`);
    }
  };

  const handleRemovePhoto = (idx) => {
    setForm(prev => {
      const updated = [...prev.photos];
      if (updated[idx] && updated[idx].previewUrl) {
        URL.revokeObjectURL(updated[idx].previewUrl);
      }
      updated.splice(idx, 1);
      return { ...prev, photos: updated };
    });
    toast('Photo removed', { icon: '🗑️' });
  };

  const handleDocSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const docNames = files.map(f => f.name);
    setForm(prev => ({ ...prev, documents: [...prev.documents, ...docNames] }));
    toast.success(`${files.length} document(s) attached for confidential verification`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!form.title.trim()) {
      toast.error('Please enter a Property Title');
      return;
    }
    if (!form.expectedPrice || Number(form.expectedPrice) <= 0) {
      toast.error('Please enter a valid Expected Price');
      return;
    }
    if (!form.area || Number(form.area) <= 0) {
      toast.error('Please enter valid Land Area');
      return;
    }
    if (!form.locality.trim()) {
      toast.error('Please enter Locality / Landmark');
      return;
    }

    setIsSubmitting(true);

    const imageUrls = form.photos.length > 0
      ? form.photos.map(p => p.previewUrl)
      : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80'];

    const payload = {
      sellerId: user?.id || 'USR-CITIZEN-01',
      sellerName: user?.name || 'Aniket Sharma',
      title: form.title,
      name: form.title,
      propertyType: form.propertyType,
      type: form.propertyType,
      description: form.description,
      area: Number(form.area),
      areaUnit: form.areaUnit,
      expectedPrice: Number(form.expectedPrice),
      price: Number(form.expectedPrice),
      priceNegotiable: form.priceNegotiable === 'Yes',
      ward: form.ward,
      locality: form.locality,
      address: form.address,
      latitude: Number(form.latitude) || 19.8850,
      longitude: Number(form.longitude) || 74.4620,
      coordinates: [Number(form.latitude) || 19.8850, Number(form.longitude) || 74.4620],
      landUse: form.landUse,
      condition: form.condition,
      roadAccess: form.roadAccess,
      waterAvailable: Boolean(form.waterAvailable),
      electricityAvailable: Boolean(form.electricityAvailable),
      drainageAvailable: Boolean(form.drainageAvailable),
      nearbyLandmarks: form.nearbyLandmarks,
      images: imageUrls,
      documents: form.documents,
      status: 'Under Verification',
      verificationStatus: 'Pending Verification'
    };

    try {
      await propertyService.create(payload);
      toast.success('Property submitted successfully. Your listing is pending verification.');
      navigate('/citizen/properties/my-listings');
    } catch (err) {
      console.error('[Sell Property Submit Error]:', err);
      setApiError('Unable to submit property right now. Please try again.');
      toast.error('Unable to submit property right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500/20 p-6 rounded-2xl text-white shadow-xl flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Municipal Land Registry</span>
          <h2 className="text-xl sm:text-2xl font-black">Sell Your Property</h2>
          <p className="text-xs text-slate-300 mt-1">List your land or property on Kopargaon Property Intelligence.</p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs">
          Status: ⏳ Pending Verification
        </span>
      </div>

      {apiError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button onClick={() => setApiError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-xs space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: PROPERTY DETAILS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span>PROPERTY DETAILS</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Property Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prime Commercial Plot on Station Road"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Property Type *</label>
                <select
                  value={form.propertyType}
                  onChange={e => setForm({ ...form, propertyType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                >
                  {PROPERTY_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Price (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 8500000"
                  value={form.expectedPrice}
                  onChange={e => setForm({ ...form, expectedPrice: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Land Area *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    placeholder="e.g. 4500"
                    value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  />
                  <select
                    value={form.areaUnit}
                    onChange={e => setForm({ ...form, areaUnit: e.target.value })}
                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                  >
                    <option value="sq.ft">sq.ft</option>
                    <option value="sq.m">sq.m</option>
                    <option value="Acres">Acres</option>
                    <option value="Guntha">Guntha</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Price Negotiable?</label>
                <select
                  value={form.priceNegotiable}
                  onChange={e => setForm({ ...form, priceNegotiable: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                >
                  <option value="Yes">Yes (Negotiable)</option>
                  <option value="No">No (Fixed Price)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
              <textarea
                rows={3}
                required
                placeholder="Provide details about accessibility, road frontage, surrounding land context..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION 2: LOCATION */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>LOCATION</span>
              </h3>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleFetchGps}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] flex items-center space-x-1 shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Use Current Location</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/citizen/properties/map')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-[11px] flex items-center space-x-1"
                >
                  <Map className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Select on Map</span>
                </button>
              </div>
            </div>

            {locationMessage && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                ⚠️ {locationMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Municipal Ward *</label>
                <select
                  value={form.ward}
                  onChange={e => setForm({ ...form, ward: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                >
                  {WARDS.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Locality / Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Station Road Corridor"
                  value={form.locality}
                  onChange={e => setForm({ ...form, locality: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Property Address</label>
                <input
                  type="text"
                  placeholder="e.g. Plot #42, opposite SBI ATM, Station Road, Ward 3, Kopargaon"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={e => setForm({ ...form, latitude: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={e => setForm({ ...form, longitude: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: LAND INFORMATION */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>LAND INFORMATION</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Land Use Classification</label>
                <select
                  value={form.landUse}
                  onChange={e => setForm({ ...form, landUse: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                >
                  {LAND_USES.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Property Condition</label>
                <select
                  value={form.condition}
                  onChange={e => setForm({ ...form, condition: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                >
                  {CONDITIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Road Access</label>
                <input
                  type="text"
                  placeholder="e.g. 24m DP Road Access"
                  value={form.roadAccess}
                  onChange={e => setForm({ ...form, roadAccess: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Infrastructure Toggles */}
            <div className="pt-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Municipal Utilities Available</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.waterAvailable}
                    onChange={e => setForm({ ...form, waterAvailable: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Water Supply Grid</span>
                </label>

                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.electricityAvailable}
                    onChange={e => setForm({ ...form, electricityAvailable: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Electricity Substation Line</span>
                </label>

                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.drainageAvailable}
                    onChange={e => setForm({ ...form, drainageAvailable: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Stormwater Drainage</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 4: NEARBY LANDMARK */}
          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="block font-bold text-slate-700 dark:text-slate-300">NEARBY LANDMARKS</label>
            <input
              type="text"
              placeholder="e.g. Near Station Bridge, SBI ATM, Godavari Promenade"
              value={form.nearbyLandmarks}
              onChange={e => setForm({ ...form, nearbyLandmarks: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
            />
          </div>

          {/* SECTION 5: PHOTO UPLOAD */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>Upload Property Photos</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Max 10 Images (JPG, JPEG, PNG, WEBP)</span>
            </h3>

            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                ⚠️ {uploadError}
              </div>
            )}

            <input ref={fileInputRef} type="file" onChange={handleImageSelect} accept="image/jpeg,image/jpg,image/png,image/webp" multiple className="hidden" />
            <input ref={cameraInputRef} type="file" onChange={handleImageSelect} accept="image/jpeg,image/jpg,image/png,image/webp" capture="environment" className="hidden" />

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-950 transition-colors">
              <div className="flex justify-center items-center space-x-3 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Browse Photos</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">{form.photos.length}/10 property photos selected</p>
            </div>

            {form.photos.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Selected Photo Previews:</span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {form.photos.map((item, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-950 group">
                      <img src={item.previewUrl} alt={`Photo ${idx+1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: DOCUMENTS */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>PROPERTY DOCUMENTS (OPTIONAL)</span>
              </h3>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">🔒 Confidential — Admin Only</span>
            </div>

            <input ref={docInputRef} type="file" onChange={handleDocSelect} multiple className="hidden" />

            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center space-x-2"
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Attach 7/12 Extract or CTS Title Document PDF</span>
            </button>

            {form.documents.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {form.documents.map((d, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    📄 {d} (Stored securely for municipal verification)
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-slate-500 italic">
              Note: Uploaded title documents are stored securely for verification and are NOT publicly displayed.
            </p>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Listing...' : 'Submit Property for Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CitizenSellPropertyPage = () => (
  <SellPropertyErrorBoundary>
    <CitizenSellPropertyPageInner />
  </SellPropertyErrorBoundary>
);

export default CitizenSellPropertyPage;
