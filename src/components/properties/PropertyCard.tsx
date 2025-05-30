import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

interface PropertyCardProps {
  property: {
    _id: string;
    title: string;
    price: number;
    type: string;
    city: string;
    state: string;
    bedrooms: number;
    bathrooms: number;
    areaSqFt: number;
    isVerified: boolean;
  };
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
}

export function PropertyCard({ property, isFavorite = false, onFavoriteToggle }: PropertyCardProps) {
  const { data: session } = useSession();
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavorite = async () => {
    if (!session) return;
    setFavorite(!favorite);
    onFavoriteToggle?.(property._id);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="relative">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{property.title}</h3>
          {session && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavorite}
              className={favorite ? 'text-red-500' : ''}
            >
              <Heart className={favorite ? 'fill-current' : ''} />
            </Button>
          )}
        </div>
        <p className="text-2xl font-bold">${property.price.toLocaleString()}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {property.type} • {property.city}, {property.state}
          </p>
          <div className="flex gap-4 text-sm">
            <span>{property.bedrooms} beds</span>
            <span>{property.bathrooms} baths</span>
            <span>{property.areaSqFt} sqft</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  );
} 