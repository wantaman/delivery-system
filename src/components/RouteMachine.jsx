import { useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { useMap } from 'react-leaflet';

export default function RouteMachine({ from, to ,waypoints = []}) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!from || !to) return;

    // Clear previous routing control if exists
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    const allWaypoints = [
      L.latLng(from.lat, from.lng),
      ...waypoints.map(wp => L.latLng(wp.lat, wp.lng)),
      L.latLng(to.lat, to.lng)
    ];

    const routingControl = L.Routing.control({
      waypoints: allWaypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [
          {
            color: '#3b82f6',
            opacity: 0.8,
            weight: 5,
            // dashArray: '10, 10'
          }
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 1
      },
      createMarker: (i, wp) => {
        if (i === 0) {
          return L.marker(wp.latLng, {
            draggable: false,
            icon: L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/4474/4474284.png',
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            })
          });
        }
        if (i === allWaypoints.length - 1) {
          return L.marker(wp.latLng, {
            draggable: false,
            icon: L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            })
          });
        }
        return null;
      },
      show: false, // Hide default instructions panel
      collapsible: false,
      serviceUrl: 'https://router.project-osrm.org/route/v1',
      formatter: new L.Routing.Formatter({
        language: 'en',
        units: 'metric'
      })
    }).addTo(map);

    routingControlRef.current = routingControl;

    routingControl.on('routesfound', (e) => {
      const route = e.routes[0];
      const distance = (route.summary.totalDistance / 1000).toFixed(1);
      const time = (route.summary.totalTime / 60).toFixed(0);
      
      // Create custom route summary
      const container = L.DomUtil.create('div', 'route-summary');
      container.innerHTML = `
        <div class="route-info">
          <strong>Route Summary</strong>
          <div>Distance: ${distance} km</div>
          <div>Estimated Time: ${time} minutes</div>
        </div>
      `;
      
      // Add custom container to map
      if (map._routeInfoControl) {
        map.removeControl(map._routeInfoControl);
      }
      
      map._routeInfoControl = L.control({ position: 'bottomleft' });
      map._routeInfoControl.onAdd = () => container;
      map._routeInfoControl.addTo(map);
    });

    // Handle errors
    routingControl.on('routingerror', (e) => {
      console.error('Routing error:', e.error);
    });

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      if (map._routeInfoControl) {
        map.removeControl(map._routeInfoControl);
        map._routeInfoControl = null;
      }
    };


  }, [from, to,waypoints, map]);

  return null;
}