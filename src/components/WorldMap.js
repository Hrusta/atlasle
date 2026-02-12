import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Rectangle, useMapEvents } from "react-leaflet";
import L from "leaflet";

function fixLeafletMarker() {
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });
}

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickCatcher({ onClick, disabled }) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}


function boundsFromKm(lat, lng, radiusKm) {
 
  const dLat = radiusKm / 111;
  
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const southWest = [lat - dLat, lng - dLng];
  const northEast = [lat + dLat, lng + dLng];
  return [southWest, northEast];
}

export default function WorldMap({ marker, wonMarker, targetBox, onMapClick, disabled }) {
  useEffect(() => {
    fixLeafletMarker();
  }, []);

  const rectBounds = useMemo(() => {
    if (!targetBox) return null;
    const { lat, lng, radiusKm } = targetBox;
    return boundsFromKm(lat, lng, radiusKm);
  }, [targetBox]);

  return (
    <MapContainer
  className="map"
  center={[20, 0]}
  zoom={2}
  worldCopyJump={true}
>

     <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
    />


      <ClickCatcher onClick={onMapClick} disabled={disabled} />

      {marker ? <Marker position={[marker.lat, marker.lng]} /> : null}

      {wonMarker ? <Marker position={[wonMarker.lat, wonMarker.lng]} icon={greenIcon} /> : null}

    
      {rectBounds && wonMarker ? (
        <Rectangle
          bounds={rectBounds}
          pathOptions={{ color: "rgba(80,255,140,0.9)", weight: 2, fillOpacity: 0.1 }}
        />
      ) : null}
    </MapContainer>
  );
}
