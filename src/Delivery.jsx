import { useEffect, useState, useCallback, useRef } from 'react'
import './App.css'
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Icon } from "leaflet";
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import Login from './components/Login';
import RouteMachine from './components/RouteMachine';
import { Button } from 'react-bootstrap';


const redIcon = new Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [38, 38],
});

// Blue icon for in_transit
const blueIcon = new Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [38, 38],
});

// Green icon for delivered
const greenIcon = new Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [38, 38],
});

const deliveryIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/9018/9018802.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
});

const driverIcon = new Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/4474/4474284.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export default function Delivery() {
  const [locations, setLocations] = useState({
    id: null,
    name: "",
    shipping: []
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [driverPositions, setDriverPositions] = useState({});
  const stompClientRef = useRef(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [isStompConnected, setIsStompConnected] = useState(false);

  //  Websocket
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserId = localStorage.getItem('userId');
    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(Number(savedUserId));
    }


    const client = new Client({
      // brokerURL: "ws://localhost:9001/ws",
      brokerURL: "wss://96.9.77.143:7001/loar-tinh/ws",
      reconnectDelay: 5000,
    });


    client.onConnect = () => {
      setIsStompConnected(true);
      client.subscribe("/topic/delivery", (message) => {
        try {
          const shippingData = JSON.parse(message.body);
          setLocations(prev => {
            const existing = prev.shipping || [];
            const index = existing.findIndex(item => item.trackingNumber === shippingData.trackingNumber);

            let updatedShipping;
            if (index !== -1) {
              updatedShipping = [...existing];
              updatedShipping[index] = { ...existing[index], ...shippingData };
            } else {
              updatedShipping = [...existing, shippingData];
            }

            return { ...prev, shipping: updatedShipping };
          });
          // setLocations(prev => ({
          //   ...prev,
          //   shipping: [...(prev.shipping || []), shippingData]
          // }));
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });
    };

    client.onDisconnect = () => {
      setIsStompConnected(false);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {

      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };    
  }, []);

  useEffect(() => {
    if (!isStompConnected|| !locations?.shipping) return;

    locations.shipping.forEach(ship => {
      if (ship.status === 'IN_TRANSIT') {
        stompClientRef.current.subscribe(
          `/topic/delivery/${ship.trackingNumber}/location`,
          (message) => handleLocationUpdate(JSON.parse(message.body))
        );
      }
    });
  }, [locations, isStompConnected]);


  useEffect(() => {
    const savedLocation = localStorage.getItem('currentLocation');
    if (savedLocation) {
      setCurrentLocation(JSON.parse(savedLocation));
    }
    const savedRoute = localStorage.getItem('selectedRoute');
    if (savedRoute) {
      const route = JSON.parse(savedRoute);
      if (Date.now() - route.timestamp < 3600000) {
        setSelectedRoute(route);
      } else {
        localStorage.removeItem('selectedRoute');
      }
    }
  }, []);


  const handleLocationUpdate = useCallback((update) => {
    setDriverPositions(prev => ({
      ...prev,
      [update.trackingNumber]: {
        lat: update.latitude,
        lng: update.longitude,
        status: update.status,
        timestamp: update.timestamp || Date.now()
      }
    }));

    setDriverPositions(prev => ({
      ...prev,
      [update.trackingNumber]: newPosition
    }));
  
    // If this is the currently selected route, update its 'from' point
    setSelectedRoute(prev => {
      if (prev?.trackingNumber === update.trackingNumber) {
        return {
          ...prev,
          from: { lat: update.latitude, lng: update.longitude },
          timestamp: Date.now() // Optional: reset timestamp to trigger re-render
        };
      }
      return prev;
    });
  }, []);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setCurrentLocation({ lat: latitude, lng: longitude });
          localStorage.setItem('currentLocation', JSON.stringify(location));
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 5000 ,  maximumAge: 0 }
      );
      setWatchId(id);
    }
  }
  
  const startDeliveryTracking = async (trackingNumber) => {
    try {
      await axios.post(
        // `http://localhost:9001/api/shippings/tracking/order/${trackingNumber}/${userId}/start`,
        `https://96.9.77.143:7001/loar-tinh/api/shippings/tracking/order/${trackingNumber}/${userId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsTracking(true);

      if (stompClientRef.current && isStompConnected) {
        stompClientRef.current.subscribe(
          `/topic/delivery/${trackingNumber}/location`,
          (message) => handleLocationUpdate(JSON.parse(message.body))
        );
      }
  
      
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            localStorage.setItem(
              'currentLocation',
              JSON.stringify({ lat: latitude, lng: longitude })
            );
          },
          (error) => {
            console.error("Geolocation error:", error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
  
        setWatchId(id);
      }
    } catch (error) {
      console.error("Error starting delivery tracking:", error);
    }
  };

  const markDeliveryArrived = async (trackingNumber) => {
    try {
      if (!currentLocation) {
        alert('Please enable location services first');
        return;
      }
      
      await axios.patch(
        // `http://localhost:9001/api/shippings/tracking/order/${trackingNumber}/${userId}/mark-arrived`,
        `https://96.9.77.143:7001/loar-tinh/api/shippings/tracking/order/${trackingNumber}/${userId}/mark-arrived`,

        {},
        { 
          params: {
            longitude: currentLocation.lng.toString(),
            latitude: currentLocation.lat.toString()
          },
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      setIsTracking(false);

      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }

      if (selectedRoute?.trackingNumber === trackingNumber) {
        setSelectedRoute(null);
        localStorage.removeItem('selectedRoute');
      }

       // Update marker status to "DELIVERED"
      setLocations(prev => ({
        ...prev,
        shipping: prev.shipping.map(item => 
          item.trackingNumber === trackingNumber ? { ...item, status: 'DELIVERED' } : item
        )
      }));

    } catch (error) {
      console.error("Error marking delivery as arrived:", error);
    }
  };

  const handleMarkerClick = useCallback((delivery, lat, lng) => {
    if (!currentLocation) {
      return;
    }
  
    if (selectedRoute?.trackingNumber === delivery.trackingNumber) {
      setSelectedRoute(null);
      localStorage.removeItem('selectedRoute');
      return;
    }
  
    const driverPos = driverPositions[delivery.trackingNumber];
    
    // Set the new route
    const route = {
      from: driverPos || { lat, lng },
      to: currentLocation,
      trackingNumber: delivery.trackingNumber,
      status: delivery.status,
      timestamp: Date.now() 
    };
  
    setSelectedRoute(route)
    localStorage.setItem('selectedRoute', JSON.stringify(route));
  }, [currentLocation, driverPositions, selectedRoute]);

  const handleLogin = (newToken, id) => {
    setToken(newToken);
    setUserId(id);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', id);
  };

  //  view shipping who dilvery
  useEffect(() => {
    if (!token || !userId) return;
    const fetchShippings = async () => {
      try {
        const response = await axios.get(
          // `http://localhost:9001/api/deliveries/${userId}/shipping`,
          `https://96.9.77.143:7001/loar-tinh/api/deliveries/${userId}/shipping`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response.data.data
        setLocations({
          id: data.id,
          name: data.name,
          shipping: data.shipping || []
        });
        
      } catch (error) {
        console.error("Error fetching shipping data:", error);
      }
    };
    fetchShippings();
  }, [token, userId]);

  // Handle Token
  if (!token || !userId) {
    return <Login onLogin={handleLogin} />;
  }


  return (
    <>
      <button
        onClick={() => handleCurrentLocation()}
        style={{
          position: "absolute",
          bottom: "5%",
          right: "2%",
          zIndex: 1000,
          border: "none",
          backgroundColor: "white",
          paddingInline: "10px",
          paddingTop: "10px",
          borderRadius: "50%",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          fontSize: "2rem",
          cursor: "pointer",
        }}
      >
        <ion-icon name="navigate-circle-outline"></ion-icon>
      </button>
      <MapContainer
        center={[11.576039057095235, 104.92295654456791]}
        zoom={13}
        style={{ position: "relative" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={deliveryIcon} />
        )}

        {selectedRoute && (
          <RouteMachine
            from={selectedRoute.from}
            to={selectedRoute.to}
            waypoints={selectedRoute.waypoints || []}
            
          />
        )}

        {locations?.shipping?.
          filter((location) => location.location && location.location.latitude && location.location.longitude).map(s => {
          const lat = parseFloat(s.location.latitude);
          const lng = parseFloat(s.location.longitude);
          let icon = redIcon;
          if (s.status === 'IN_TRANSIT') icon = blueIcon;
          else if (s.status === 'DELIVERED') icon = greenIcon;

          return (
            <Marker
              key={s.shippingId}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => handleMarkerClick(s, lat, lng)
              }}>
              <Popup>
                <strong>{s.trackingNumber}</strong><br />
                Status: {s.status}<br />
                City: {s.location.city}<br />
                {s.status === 'PENDING' && (
                  <Button 
                    variant="primary"
                    onClick={() => startDeliveryTracking(s.trackingNumber)}
                    disabled={!isStompConnected || isTracking}
                  >
                    Start Delivery
                  </Button>
                )}

                {s.status === 'IN_TRANSIT' && (
                  <Button 
                    variant="success"
                    onClick={() => markDeliveryArrived(s.trackingNumber)}
                    disabled={!isTracking}
                  >
                    Mark as Arrived
                  </Button>
                )}
              </Popup>
            </Marker>
          );
        })}

        {/* Display driver markers */}
        {Object.entries(driverPositions).map(([trackingNumber, position]) => (
          <Marker
            key={`driver-${trackingNumber}`}
            position={[position.lat, position.lng]}
            icon={driverIcon}
          >
            <Popup>
              Driver for {trackingNumber}<br />
              Last update: {new Date(position.timestamp).toLocaleTimeString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

    </>
  );
}

