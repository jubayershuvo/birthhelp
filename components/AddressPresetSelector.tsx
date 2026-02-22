// components/AddressPresetSelector.tsx
import React, { useState, useEffect } from 'react';
import { IAddress } from '@/models/AddressPreset';
import { X, Loader2, MapPin, AlertCircle, Trash2 } from 'lucide-react';

interface Address {
  country: string;
  geoId: string;
  division: string;
  divisionName: string;
  district: string;
  districtName: string;
  cityCorpCantOrUpazila: string;
  upazilaName: string;
  paurasavaOrUnion: string;
  unionName: string;
  postOfc: string;
  postOfcEn: string;
  vilAreaTownBn: string;
  vilAreaTownEn: string;
  houseRoadBn: string;
  houseRoadEn: string;
  ward: string;
  wardName: string;
}

interface AddressPresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: Address) => void;
}

const AddressPresetSelector: React.FC<AddressPresetSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/load-address');
      
      if (!response.ok) {
        throw new Error('Failed to load addresses');
      }
      
      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, addressId: string) => {
    e.stopPropagation(); // Prevent triggering the parent button's onClick
    
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      setDeletingId(addressId);
      const response = await fetch(`/api/delete-address?id=${addressId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      // Remove the deleted address from the list
      setAddresses(addresses.filter(addr => addr._id?.toString() !== addressId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = (address: Address) => {
    onSelect(address);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const formatAddress = (address: IAddress['address']) => {
    const parts = [];
    
    if (address.houseRoadEn) parts.push(address.houseRoadEn);
    if (address.vilAreaTownEn) parts.push(address.vilAreaTownEn);
    if (address.unionName) parts.push(address.unionName);
    if (address.upazilaName) parts.push(address.upazilaName);
    if (address.districtName) parts.push(address.districtName);
    if (address.divisionName) parts.push(address.divisionName);
    
    return parts.length > 0 ? parts.join(', ') : 'No address details';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform rounded-lg bg-white dark:bg-gray-900 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select Address Preset
            </h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Loading addresses...
                </p>
              </div>
            )}
            
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950/50 p-4">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-400">
                    Error loading addresses
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                  <button
                    onClick={fetchAddresses}
                    className="mt-2 text-sm font-medium text-red-800 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
            
            {!loading && !error && addresses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No saved addresses found
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Close
                </button>
              </div>
            )}
            
            {!loading && !error && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address._id?.toString()}
                    className="group relative"
                  >
                    <button
                      onClick={() => handleSelect(address.address as unknown as Address)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-left transition-all hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    >
                      <div className="flex items-start gap-3 pr-12"> {/* Added padding right for delete button */}
                        <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 text-xs text-gray-500 dark:text-gray-500 font-mono">
                            ID: {address._id?.toString().slice(-8)}
                          </div>
                          <div className="text-gray-900 dark:text-gray-100 text-sm line-clamp-3">
                            {formatAddress(address.address)}
                          </div>
                          {(address.address.districtName || address.address.divisionName) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {address.address.districtName && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-300">
                                  {address.address.districtName}
                                </span>
                              )}
                              {address.address.divisionName && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-300">
                                  {address.address.divisionName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, address._id?.toString() || '')}
                      disabled={deletingId === address._id?.toString()}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete address"
                    >
                      {deletingId === address._id?.toString() ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <button
              onClick={handleClose}
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressPresetSelector;