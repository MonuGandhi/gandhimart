import { useEffect, useState } from 'react';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import locationService from '../../utils/locationService';
import toast from 'react-hot-toast';

export default function LocationStatus({ showDetails = false }) {
    const [locationStatus, setLocationStatus] = useState('checking');
    const [userLocation, setUserLocation] = useState(null);
    const [distanceFromCenter, setDistanceFromCenter] = useState(null);

    useEffect(() => {
        checkLocationStatus();
    }, []);

    const checkLocationStatus = async () => {
        try {
            // Load location settings
            locationService.loadServiceAreaSettings();
            
            // Get cached location
            const cachedLocation = locationService.getCachedLocation();
            if (cachedLocation) {
                setUserLocation(cachedLocation);
                const isWithinArea = await locationService.isWithinServiceArea(cachedLocation);
                const distance = await locationService.getDistanceFromCenter(cachedLocation);
                
                setDistanceFromCenter(distance);
                setLocationStatus(isWithinArea ? 'within' : 'outside');
            } else {
                setLocationStatus('no-location');
            }
        } catch (error) {
            console.error('Location status check error:', error);
            setLocationStatus('error');
        }
    };

    const handleRefreshLocation = () => {
        checkLocationStatus();
        toast.success('Location status refreshed');
    };

    const getStatusIcon = () => {
        switch (locationStatus) {
            case 'within':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'outside':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'no-location':
                return <MapPin className="h-4 w-4 text-gray-400" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            default:
                return <MapPin className="h-4 w-4 text-blue-500 animate-pulse" />;
        }
    };

    const getStatusText = () => {
        switch (locationStatus) {
            case 'within':
                return 'Within Delivery Area';
            case 'outside':
                return 'Outside Delivery Area';
            case 'no-location':
                return 'Location Not Set';
            case 'error':
                return 'Location Error';
            default:
                return 'Checking Location...';
        }
    };

    const getStatusColor = () => {
        switch (locationStatus) {
            case 'within':
                return 'text-green-600 bg-green-50';
            case 'outside':
                return 'text-red-600 bg-red-50';
            case 'no-location':
                return 'text-gray-600 bg-gray-50';
            case 'error':
                return 'text-yellow-600 bg-yellow-50';
            default:
                return 'text-blue-600 bg-blue-50';
        }
    };

    if (!showDetails) {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {getStatusIcon()}
                {getStatusText()}
            </div>
        );
    }

    return (
        <div className={`p-3 rounded-lg border ${getStatusColor().replace('text-', 'border-').replace('bg-', '')}`}>
            <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <span className="font-medium">{getStatusText()}</span>
                <button
                    onClick={handleRefreshLocation}
                    className="ml-auto text-xs text-blue-500 hover:text-blue-600"
                >
                    Refresh
                </button>
            </div>
            
            {locationStatus === 'within' && distanceFromCenter && (
                <p className="text-sm text-gray-600">
                    You're {distanceFromCenter.formatted} from {locationService.serviceArea.name}
                </p>
            )}
            
            {locationStatus === 'outside' && (
                <div className="text-sm text-red-600">
                    <p>{locationService.getOutOfAreaMessage()?.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-xs underline"
                    >
                        Try Again
                    </button>
                </div>
            )}
            
            {locationStatus === 'no-location' && (
                <p className="text-sm text-gray-600">
                    Location detection is not enabled. Enable location services for better experience.
                </p>
            )}
            
            {locationStatus === 'error' && (
                <p className="text-sm text-yellow-600">
                    Error checking location. Please check your location settings.
                </p>
            )}
        </div>
    );
}