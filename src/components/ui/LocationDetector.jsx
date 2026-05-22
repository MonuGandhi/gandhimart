import { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import locationService from '../../utils/locationService';
import toast from 'react-hot-toast';

export default function LocationDetector({ onLocationDetected, onError, showManualEntry = false }) {
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error, denied
    const [userLocation, setUserLocation] = useState(null);
    const [distanceFromCenter, setDistanceFromCenter] = useState(null);

    useEffect(() => {
        // Load location settings when component mounts
        locationService.loadServiceAreaSettings();
        checkLocation();
    }, []);

    const checkLocation = async () => {
        setLocationStatus('loading');
        
        try {
            // First try to get cached location
            const cachedLocation = locationService.getCachedLocation();
            if (cachedLocation) {
                setUserLocation(cachedLocation);
                await validateLocation(cachedLocation);
                return;
            }

            // Get fresh location
            const location = await locationService.getCurrentLocation();
            setUserLocation(location);
            await validateLocation(location);
            
        } catch (error) {
            console.error('Location detection error:', error);
            setLocationStatus('error');
            
            if (error.code === 'PERMISSION_DENIED') {
                setLocationStatus('denied');
                toast.error('Location permission denied. Please enable location services for better experience.');
            } else {
                toast.error('Unable to get your location. Please check your location settings.');
            }
            
            if (onError) {
                onError(error);
            }
        }
    };

    const validateLocation = async (location) => {
        try {
            const isWithinArea = await locationService.isWithinServiceArea(location);
            const distance = await locationService.getDistanceFromCenter(location);
            
            setDistanceFromCenter(distance);
            
            if (isWithinArea) {
                setLocationStatus('success');
                toast.success(`Location verified! You're within our service area. 🎉`);
                if (onLocationDetected) {
                    onLocationDetected(location);
                }
            } else {
                setLocationStatus('error');
                const outOfAreaMessage = locationService.getOutOfAreaMessage();
                toast.error(outOfAreaMessage?.message || 'Sorry, we do not deliver to your area yet.');
                
                if (onError) {
                    onError(new Error('Service area restriction'));
                }
            }
        } catch (validationError) {
            console.error('Location validation error:', validationError);
            setLocationStatus('error');
            if (onError) {
                onError(validationError);
            }
        }
    };

    const handleManualLocation = () => {
        // For now, we'll just enable the service without location validation
        // In a real app, you might want to add manual address input
        setLocationStatus('success');
        toast.success('Location service enabled for browsing.');
        if (onLocationDetected) {
            onLocationDetected({ lat: 0, lng: 0 }); // Dummy location
        }
    };

    const handleRetry = () => {
        checkLocation();
    };

    const getStatusIcon = () => {
        switch (locationStatus) {
            case 'loading':
                return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
            case 'denied':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <MapPin className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusMessage = () => {
        switch (locationStatus) {
            case 'loading':
                return 'Detecting your location...';
            case 'success':
                if (distanceFromCenter) {
                    return `You're ${distanceFromCenter.formatted} from ${locationService.serviceArea.name}`;
                }
                return 'Location verified successfully!';
            case 'error':
                return 'Unable to verify your location';
            case 'denied':
                return 'Location permission denied';
            default:
                return 'Checking your location...';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
                {getStatusIcon()}
                <h3 className="text-lg font-semibold text-gray-800">
                    {locationStatus === 'success' ? 'Location Verified' : 'Location Detection'}
                </h3>
            </div>
            
            <p className="text-gray-600 mb-4">
                {getStatusMessage()}
            </p>

            {locationStatus === 'success' && distanceFromCenter && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-green-800">
                        🎉 Great news! We deliver to your location within {distanceFromCenter.formatted} of {locationService.serviceArea.name}.
                    </p>
                </div>
            )}

            {locationStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-red-800 mb-2">
                        {locationService.getOutOfAreaMessage()?.message}
                    </p>
                    {showManualEntry && (
                        <button
                            onClick={handleManualLocation}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Continue Without Location
                        </button>
                    )}
                </div>
            )}

            {locationStatus === 'denied' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-yellow-800 mb-2">
                        To use location features, please enable location permissions in your browser settings.
                    </p>
                    <button
                        onClick={handleManualLocation}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        Continue Without Location
                    </button>
                </div>
            )}

            {locationStatus === 'loading' && (
                <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Please wait...</span>
                </div>
            )}

            {(locationStatus === 'error' || locationStatus === 'denied') && (
                <button
                    onClick={handleRetry}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}