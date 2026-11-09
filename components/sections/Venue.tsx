'use client';

import React from 'react';
import { venue, event } from '@/content/index';

export function VenueSection() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-black/60 border border-gray-700 rounded bevel">
        <h3 className="text-xs font-pixel text-[#ffb46b] mb-1">{venue.name}</h3>
        <p className="text-xs text-gray-300 mb-3">{venue.address}</p>

        <a
          href={venue.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block px-3 py-1.5 bg-[#5b8c32] hover:bg-[#6ba33b] font-pixel text-xs text-white rounded bevel"
        >
          📍 Open in Google Maps
        </a>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-pixel text-[#e5b83b]">Travel & Transit</h4>
        {venue.travelInfo.map((info) => (
          <div key={info.mode} className="p-3 bg-black/50 border border-gray-800 rounded text-xs">
            <span className="font-bold text-[#ffb46b]">{info.mode}:</span>{' '}
            <span className="text-gray-300">{info.details}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 pt-2 border-t border-gray-800">
        Contact: <a href={`mailto:${event.contactEmail}`} className="underline text-gray-300">{event.contactEmail}</a>
      </div>
    </div>
  );
}

