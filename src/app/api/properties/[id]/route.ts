import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { getCache, setCache, deleteCache } from '@/lib/redis';

// GET /api/properties/[id] - Get a single property
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cacheKey = `property:${params.id}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    await connectDB();
    const property = await Property.findById(params.id)
      .populate('createdBy', 'name email');

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    await setCache(cacheKey, property);
    return NextResponse.json(property);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching property' }, { status: 500 });
  }
}

// PUT /api/properties/[id] - Update a property
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const property = await Property.findById(params.id);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to update this property' }, { status: 403 });
    }

    const data = await request.json();
    const updatedProperty = await Property.findByIdAndUpdate(
      params.id,
      { ...data },
      { new: true }
    ).populate('createdBy', 'name email');

    // Invalidate caches
    await deleteCache(`property:${params.id}`);
    await deleteCache('properties:*');

    return NextResponse.json(updatedProperty);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating property' }, { status: 500 });
  }
}

// DELETE /api/properties/[id] - Delete a property
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const property = await Property.findById(params.id);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this property' }, { status: 403 });
    }

    await Property.findByIdAndDelete(params.id);

    // Invalidate caches
    await deleteCache(`property:${params.id}`);
    await deleteCache('properties:*');

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting property' }, { status: 500 });
  }
} 