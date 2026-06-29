import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, MapPin, Home, Briefcase, Trash2, Plus, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { addAddress, deleteAddress } from '../services/api';
import { setAddressOpen, setActiveAddress, addAddressState, deleteAddressState } from '../store/slices/addressSlice';

const pinIcon = L.divIcon({
  html: `<div style="background-color: #D25C78; width: 18px; height: 18px; border: 3px solid #FFF; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); position: relative;"><div style="content: ''; position: absolute; bottom: -8px; left: 5px; border-width: 5px 4px 0; border-style: solid; border-color: #D25C78 transparent;"></div></div>`,
  className: 'custom-pin-marker',
  iconSize: [20, 26],
  iconAnchor: [10, 26]
});

function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function SyncMapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center]);
  return null;
}

export default function AddressModal() {
  const dispatch = useDispatch();
  
  const isOpen = useSelector((state) => state.address.isAddressOpen);
  const user = useSelector((state) => state.auth.user);
  const addresses = useSelector((state) => state.address.addresses);
  const activeAddress = useSelector((state) => state.address.activeAddress);

  const [showForm, setShowForm] = useState(false);
  const [coords, setCoords] = useState({ lat: 23.3441, lng: 85.3096 });
  const [addressLine, setAddressLine] = useState('');
  const [label, setLabel] = useState('Home');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowForm(false);
      setAddressLine('');
      setLabel('Home');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            setCoords({ lat: 23.3441, lng: 85.3096 });
          }
        );
      } else {
        setCoords({ lat: 23.3441, lng: 85.3096 });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMapClick = (lat, lng) => {
    setCoords({ lat, lng });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!addressLine.trim()) return;
    setSaving(true);
    try {
      const newAddr = await addAddress({
        label,
        address_line: addressLine.trim(),
        latitude: coords.lat,
        longitude: coords.lng
      });
      dispatch(addAddressState(newAddr));
      setShowForm(false);
      setAddressLine('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if (confirm('Delete this address?')) {
      try {
        await deleteAddress(id);
        dispatch(deleteAddressState(id));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleClose = () => {
    dispatch(setAddressOpen(false));
  };

  const getLabelIcon = (lbl) => {
    switch (lbl.toLowerCase()) {
      case 'home':
        return <Home size={16} />;
      case 'work':
        return <Briefcase size={16} />;
      default:
        return <MapPin size={16} />;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(60, 34, 39, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFDFE',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 20px 40px rgba(60, 34, 39, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '1.5px solid var(--border-color)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: '#ffffff'
        }}>
          <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-color)' }}>
            Choose Delivery Location
          </h3>
          <button 
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
          {!showForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {user && user.role !== 'anonymous' ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {addresses.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem 1rem',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--primary-light)',
                        borderRadius: '16px',
                        border: '1px dashed var(--border-color)'
                      }}>
                        <MapPin size={32} style={{ color: 'var(--primary-color)', margin: '0 auto 8px auto' }} />
                        <p style={{ fontSize: '0.85rem' }}>No addresses saved yet.</p>
                      </div>
                    ) : (
                      addresses.map(addr => {
                        const isSelected = activeAddress && activeAddress.id === addr.id;
                        return (
                          <div 
                            key={addr.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1rem',
                              borderRadius: '16px',
                              border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                              backgroundColor: isSelected ? 'var(--primary-light)' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => {
                              dispatch(setActiveAddress(addr));
                              handleClose();
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, overflow: 'hidden' }}>
                              <div style={{
                                backgroundColor: isSelected ? 'var(--accent-color)' : 'var(--primary-light)',
                                color: isSelected ? '#ffffff' : 'var(--accent-color)',
                                padding: '8px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {getLabelIcon(addr.label)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-color)', textTransform: 'capitalize' }}>
                                  {addr.label}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {addr.address_line}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(addr.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#D9383A',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button 
                    onClick={() => setShowForm(true)}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '14px',
                      border: '1.5px dashed var(--accent-color)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--accent-color)',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.25s'
                    }}
                  >
                    <Plus size={16} />
                    <span>Add New Address</span>
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                  <MapPin size={40} style={{ color: 'var(--accent-color)', margin: '0 auto 12px auto' }} />
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-color)', fontWeight: '600', marginBottom: '10px' }}>
                    Sign in to save delivery addresses
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Saving your address helps speed up delivery checking.
                  </p>
                  <button 
                    onClick={() => {
                      handleClose();
                      window.location.href = '/login';
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }}
                  >
                    Sign In Now
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                height: '220px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1.5px solid var(--border-color)',
                position: 'relative'
              }}>
                <MapContainer center={[coords.lat, coords.lng]} zoom={14} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <SyncMapCenter center={coords} />
                  <MapEventsHandler onMapClick={handleMapClick} />
                  <Marker position={[coords.lat, coords.lng]} icon={pinIcon} />
                </MapContainer>
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(60, 34, 39, 0.85)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  zIndex: 400,
                  textAlign: 'center'
                }}>
                  Tap on Ranchi map to reposition pin.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-color)' }}>
                  Detailed Address
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Flat No., Street Name, Near Landmark, Ranchi"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  style={{
                    padding: '0.7rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--primary-light)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-color)' }}>
                  Save Location As
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Home', 'Work', 'Other'].map(lbl => (
                    <button 
                      key={lbl}
                      type="button"
                      onClick={() => setLabel(lbl)}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '12px',
                        border: label === lbl ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                        backgroundColor: label === lbl ? 'var(--primary-light)' : '#ffffff',
                        color: 'var(--text-color)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {getLabelIcon(lbl)}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-muted)',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--accent-color)',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {saving ? <Loader size={16} className="spinner" /> : 'Save Address'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
