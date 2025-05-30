import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCache, setCache, deleteCache } from '@/lib/redis';

// GET /api/favorites - Get user's favorite properties
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `favorites:${session.user.id}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .populate({
        path: 'favorites',
        populate: {
          path: 'createdBy',
          select: 'name email'
        }
      });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await setCache(cacheKey, user.favorites);
    return NextResponse.json(user.favorites);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching favorites' }, { status: 500 });
  }
}

// POST /api/favorites - Add a property to favorites
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId } = await request.json();
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.favorites.includes(propertyId)) {
      return NextResponse.json({ error: 'Property already in favorites' }, { status: 400 });
    }

    user.favorites.push(propertyId);
    await user.save();

    // Invalidate cache
    await deleteCache(`favorites:${session.user.id}`);

    return NextResponse.json({ message: 'Property added to favorites' });
  } catch (error) {
    return NextResponse.json({ error: 'Error adding to favorites' }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove a property from favorites
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId } = await request.json();
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.favorites = user.favorites.filter(
      (id: string) => id.toString() !== propertyId
    );
    await user.save();

    // Invalidate cache
    await deleteCache(`favorites:${session.user.id}`);

    return NextResponse.json({ message: 'Property removed from favorites' });
  } catch (error) {
    return NextResponse.json({ error: 'Error removing from favorites' }, { status: 500 });
  }
} 