import { Client } from '@googlemaps/google-maps-services-js';
import logger from '../utils/logger.js';

const client = new Client({});

export const geocodeAddress = async (address) => {
  try {
    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
        components: { country: 'GB' }
      }
    });

    if (response.data.results.length === 0) {
      throw new Error('Address not found');
    }

    const location = response.data.results[0].geometry.location;
    const formattedAddress = response.data.results[0].formatted_address;

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress
    };
  } catch (error) {
    logger.error('Geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
};

export const calculateDistance = async (origin, destination) => {
  try {
    const response = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.rows[0].elements[0].status !== 'OK') {
      throw new Error('Could not calculate distance');
    }

    return {
      distance: response.data.rows[0].elements[0].distance,
      duration: response.data.rows[0].elements[0].duration
    };
  } catch (error) {
    logger.error('Distance calculation error:', error);
    throw new Error('Failed to calculate distance');
  }
};

export const searchNearbyPlaces = async (location, radius, type = 'hospital') => {
  try {
    const response = await client.placesNearby({
      params: {
        location,
        radius,
        type,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    return response.data.results;
  } catch (error) {
    logger.error('Nearby places search error:', error);
    throw new Error('Failed to search nearby places');
  }
};
