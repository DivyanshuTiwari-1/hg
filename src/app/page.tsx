'use client';

import { Navbar } from '@/components/layout/Navbar';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyFilter } from '@/components/properties/PropertyFilter';
import { useEffect, useState } from 'react';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (filters: any) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/properties?${queryParams}`);
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error filtering properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (propertyId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      if (!response.ok) throw new Error('Failed to update favorites');
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Find Your Dream Property</h1>
        <PropertyFilter onFilter={handleFilter} />
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div>Loading...</div>
          ) : (
            properties.map((property: any) => (
              <PropertyCard
                key={property._id}
                property={property}
                onFavoriteToggle={handleFavorite}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
