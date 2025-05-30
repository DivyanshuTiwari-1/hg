import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { getCache, setCache, deleteCache } from '@/lib/redis';

// GET /api/properties - Get all properties with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query: any = {};

    // Build filter query
    if (searchParams.get('minPrice')) query.price = { $gte: parseFloat(searchParams.get('minPrice')!) };
    if (searchParams.get('maxPrice')) query.price = { ...query.price, $lte: parseFloat(searchParams.get('maxPrice')!) };
    if (searchParams.get('type')) query.type = searchParams.get('type');
    if (searchParams.get('state')) query.state = searchParams.get('state');
    if (searchParams.get('city')) query.city = { $regex: searchParams.get('city'), $options: 'i' };
    if (searchParams.get('minArea')) query.areaSqFt = { $gte: parseFloat(searchParams.get('minArea')!) };
    if (searchParams.get('maxArea')) query.areaSqFt = { ...query.areaSqFt, $lte: parseFloat(searchParams.get('maxArea')!) };
    if (searchParams.get('bedrooms')) query.bedrooms = parseInt(searchParams.get('bedrooms')!);
    if (searchParams.get('bathrooms')) query.bathrooms = parseInt(searchParams.get('bathrooms')!);
    if (searchParams.get('furnished')) query.furnished = searchParams.get('furnished') === 'true';
    if (searchParams.get('listingType')) query.listingType = searchParams.get('listingType');
    if (searchParams.get('isVerified')) query.isVerified = searchParams.get('isVerified') === 'true';
    if (searchParams.get('minRating')) query.rating = { $gte: parseFloat(searchParams.get('minRating')!) };
    if (searchParams.get('amenities')) {
      const amenities = searchParams.get('amenities')!.split(',');
      query.amenities = { $all: amenities };
    }
    if (searchParams.get('tags')) {
      const tags = searchParams.get('tags')!.split(',');
      query.tags = { $all: tags };
    }
    if (searchParams.get('availableFrom')) {
      query.availableFrom = { $gte: new Date(searchParams.get('availableFrom')!) };
    }

    // Check cache first
    const cacheKey = `properties:${JSON.stringify(query)}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    await connectDB();
    const properties = await Property.find(query)
      .populate('listedBy', 'name email')
      .sort({ createdAt: -1 });

    // Cache the results
    await setCache(cacheKey, properties);

    return NextResponse.json(properties);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching properties' }, { status: 500 });
  }
}

// POST /api/properties - Create a new property
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await connectDB();

    const property = new Property({
      ...data,
      listedBy: session.user.id
    });
    await property.save();

    // Invalidate cache
    await deleteCache('properties:*');

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating property' }, { status: 500 });
  }
} 