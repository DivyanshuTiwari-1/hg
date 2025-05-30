import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendation extends Document {
  propertyId: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  message?: string;
  createdAt: Date;
}

const RecommendationSchema: Schema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  fromUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
RecommendationSchema.index({ toUserId: 1, createdAt: -1 });
RecommendationSchema.index({ fromUserId: 1, createdAt: -1 });

export default mongoose.models.Recommendation || mongoose.model<IRecommendation>('Recommendation', RecommendationSchema); 