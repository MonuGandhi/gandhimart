// Location Service for G-Mart
// Handles user location detection and service area validation

import { useAdminStore } from '../store/adminStore';

export const locationService = {
    // Store user location in localStorage
    userLocation: null,

    // Service area settings (will be loaded from admin settings)
    serviceArea: {
        enabled: false,
        center: { lat: 0, lng: 0 }, // Village center coordinates
        radius: 5000, // 5km default radius in meters
        name: 'My Village', // Village name
        message: 'Sorry, we currently deliver only within our village area. Thank you for your understanding!'
    },

    // Check if geolocation is available in browser
    isGeolocationAvailable: () => {
        return 'geolocation' in navigator;
    },

    // Get user's current location
    getCurrentLocation: () => {
        return new Promise((resolve, reject) => {
            if (!locationService.isGeolocationAvailable()) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: position.timestamp
                    };
                    locationService.userLocation = location;
                    localStorage.setItem('gmart_user_location', JSON.stringify(location));
                    resolve(location);
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true, // Use high accuracy to ensure better lock
                    timeout: 15000, // Give phone 15 seconds to wake up GPS
                    maximumAge: 300000 // 5 minutes — use recent cached position if available
                }
            );
        });
    },

    // Load location from localStorage if available
    getCachedLocation: () => {
        try {
            const cached = localStorage.getItem('gmart_user_location');
            if (cached) {
                locationService.userLocation = JSON.parse(cached);
                return locationService.userLocation;
            }
        } catch (error) {
            console.error('Error loading cached location:', error);
        }
        return null;
    },

    // Calculate distance between two points using Haversine formula
    calculateDistance: (point1, point2) => {
        const R = 6371000; // Earth's radius in meters
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLng = (point2.lng - point1.lng) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // Check if user is within service area
    isWithinServiceArea: async (userLocation = null) => {
        if (!locationService.serviceArea.enabled) {
            return true; // Service area restriction disabled
        }

        const location = userLocation || locationService.userLocation || locationService.getCachedLocation();

        if (!location) {
            throw new Error('User location not available');
        }

        const distance = locationService.calculateDistance(
            location,
            locationService.serviceArea.center
        );

        return distance <= locationService.serviceArea.radius;
    },

    // Get formatted distance from center
    getDistanceFromCenter: (userLocation = null) => {
        const location = userLocation || locationService.userLocation || locationService.getCachedLocation();

        if (!location || !locationService.serviceArea.enabled) {
            return null;
        }

        const distance = locationService.calculateDistance(
            location,
            locationService.serviceArea.center
        );

        return {
            distance: Math.round(distance),
            unit: distance > 1000 ? 'km' : 'm',
            formatted: distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`
        };
    },

    // Update service area settings
    updateServiceArea: (settings) => {
        locationService.serviceArea = {
            ...locationService.serviceArea,
            ...settings
        };
    },

    // Load service area settings from admin store
    loadServiceAreaSettings: () => {
        try {
            const storeSettings = useAdminStore.getState().storeSettings;
            if (storeSettings?.locationService) {
                locationService.serviceArea = {
                    ...locationService.serviceArea,
                    ...storeSettings.locationService,
                    name: storeSettings.locationService.villageName || 'My Village'
                };
            }
        } catch (error) {
            console.error('Error loading location settings:', error);
        }
    },

    // Get user-friendly error message for out-of-area
    getOutOfAreaMessage: () => {
        if (!locationService.serviceArea.enabled) {
            return null;
        }

        const distanceInfo = locationService.getDistanceFromCenter();
        return {
            title: 'Service Area Restriction',
            message: locationService.serviceArea.message || `Sorry, we currently deliver only within ${locationService.serviceArea.name}. Your location is outside our delivery area.`,
            action: 'Change Location',
            distance: distanceInfo?.formatted
        };
    },

    // Get location permission status
    getPermissionStatus: () => {
        if (!locationService.isGeolocationAvailable()) {
            return 'unsupported';
        }

        return navigator.permissions.query({ name: 'geolocation' });
    }
};

export default locationService;