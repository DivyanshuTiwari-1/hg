import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  type: string;
  price: number;
  state: string;
  city: string;
  areaSqFt: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  furnished: boolean;
  availableFrom: Date;
  listedBy: mongoose.Types.ObjectId;
  tags: string[];
  colorTheme: string;
  rating: number;
  isVerified: boolean;
  listingType: string;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  areaSqFt: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  amenities: [{ type: String }],
  furnished: { type: Boolean, default: false },
  availableFrom: { type: Date, required: true },
  listedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tags: [{ type: String }],
  colorTheme: { type: String },
  rating: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  listingType: { type: String, required: true }
}, {
  timestamps: true
});

// Create indexes for better search performance
PropertySchema.index({ title: 'text', city: 'text', state: 'text' });
PropertySchema.index({ price: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ listingType: 1 });
PropertySchema.index({ isVerified: 1 });
PropertySchema.index({ rating: -1 });

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema); 