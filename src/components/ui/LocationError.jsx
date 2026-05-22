import { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, RefreshCw, X } from 'lucide-react';
import locationService from '../../utils/locationService';
import toast from 'react-hot-toast';

export default function LocationError({ onDismiss, onRetry, showRetry = true }) {
    const [errorDetails, setErrorDetails] = useState(null);
    const [distance, setDistance] = useState(null);

    useEffect(() => {
        // Load location settings and get error details
        locationService.loadServiceAreaSettings();
        const errorInfo = locationService.getOutOfAreaMessage();
        setErrorDetails(errorInfo);

        // Get distance from center
        locationService.getDistanceFromCenter().then(dist => {
            setDistance(dist);
        });
    }, []);

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else {
            // Auto-retry location detection
            window.location.reload();
        }
    };

    const handleDismiss = () => {
        if (onDismiss) {
            onDismiss();
        } else {
            // Hide the error by removing it from DOM
            const element = document.querySelector('.location-error-overlay');
            if (element) {
                element.style.display = 'none';
            }
        }
    };

    if (!errorDetails) {
        return null;
    }

    return (
        <div className="location-error-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 relative">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Error icon */}
                <div className="text-center pt-6 pb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {errorDetails.title}
                    </h3>
                </div>

                {/* Error message */}
                <div className="px-6 pb-4">
                    <p className="text-gray-600 text-center mb-4">
                        {errorDetails.message}
                    </p>

                    {distance && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium text-blue-900">
                                    Distance from {locationService.serviceArea.name}
                                </span>
                            </div>
                            <p className="text-sm text-blue-700">
                                You're approximately {distance.formatted} outside our delivery area
                            </p>
                        </div>
                    )}

                    {/* Additional information */}
                    <div className="text-xs text-gray-500 text-center mb-4">
                        <p>
                            We deliver only within {locationService.serviceArea.name} and surrounding areas.
                            For inquiries about delivery to your location, please contact us:
                        </p>
                        <p className="font-medium text-gray-700 mt-1">
                            📞 {locationService.serviceArea.phone || '8607424026'}
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="px-6 pb-6 flex gap-3">
                    {showRetry && (
                        <button
                            onClick={handleRetry}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry Location
                        </button>
                    )}
                    
                    <button
                        onClick={handleDismiss}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Continue Anyway
                    </button>
                </div>
            </div>
        </div>
    );
}

// Higher-order component to wrap pages with location error handling
export function withLocationError(Component, options = {}) {
    return function LocationErrorWrapper(props) {
        const [showError, setShowError] = useState(false);
        const [checkLocation, setCheckLocation] = useState(false);

        useEffect(() => {
            // Only check location if enabled
            locationService.loadServiceAreaSettings();
            
            if (locationService.serviceArea.enabled) {
                setCheckLocation(true);
                
                // Check if user is within service area
                const validateLocation = async () => {
                    try {
                        const isWithinArea = await locationService.isWithinServiceArea();
                        if (!isWithinArea) {
                            setShowError(true);
                        }
                    } catch (error) {
                        console.error('Location validation error:', error);
                        if (options.showErrorOnFailure !== false) {
                            setShowError(true);
                        }
                    }
                };

                validateLocation();
            }
        }, []);

        const handleRetry = () => {
            setShowError(false);
            window.location.reload();
        };

        const handleDismiss = () => {
            setShowError(false);
            if (options.onDismiss) {
                options.onDismiss();
            }
        };

        return (
            <>
                <Component {...props} />
                {showError && (
                    <LocationError 
                        onRetry={handleRetry} 
                        onDismiss={handleDismiss}
                        showRetry={options.showRetry !== false}
                    />
                )}
            </>
        );
    };
}