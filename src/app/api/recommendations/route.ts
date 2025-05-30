import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Recommendation from '@/models/Recommendation';
import { getCache, setCache, deleteCache } from '@/lib/redis';

// GET /api/recommendations - Get user's received recommendations
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `recommendations:${session.user.id}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    await connectDB();
    const recommendations = await Recommendation.find({ toUserId: session.user.id })
      .populate('propertyId')
      .populate('fromUserId', 'name email')
      .sort({ createdAt: -1 });

    await setCache(cacheKey, recommendations);
    return NextResponse.json(recommendations);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching recommendations' }, { status: 500 });
  }
}

// POST /api/recommendations - Recommend a property to another user
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId, toUserEmail, message } = await request.json();
    if (!propertyId || !toUserEmail) {
      return NextResponse.json(
        { error: 'Property ID and recipient email are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find recipient user
    const toUser = await User.findOne({ email: toUserEmail });
    if (!toUser) {
      return NextResponse.json(
        { error: 'Recipient user not found' },
        { status: 404 }
      );
    }

    // Create recommendation
    const recommendation = await Recommendation.create({
      propertyId,
      fromUserId: session.user.id,
      toUserId: toUser._id,
      message
    });

    // Invalidate cache
    await deleteCache(`recommendations:${toUser._id}`);

    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating recommendation' },
      { status: 500 }
    );
  }
}

// DELETE /api/recommendations - Remove a recommendation
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recommendationId } = await request.json();
    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const recommendation = await Recommendation.findById(recommendationId);

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    if (recommendation.toUserId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this recommendation' },
        { status: 403 }
      );
    }

    await Recommendation.findByIdAndDelete(recommendationId);

    // Invalidate cache
    await deleteCache(`recommendations:${session.user.id}`);

    return NextResponse.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting recommendation' },
      { status: 500 }
    );
  }
} 