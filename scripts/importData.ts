const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

interface Property {
    id: string;
    title: string;
    type: string;
    price: number;
    state: string;
    city: string;
    areaSqFt: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    furnished: string;
    availableFrom: Date;
    listedBy: string;
    tags: string[];
    colorTheme: string;
    rating: number;
    isVerified: boolean;
    listingType: string;
}

async function importData() {
    // Use environment variable or fallback to local MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    });

    try {
        console.log('Attempting to connect to MongoDB...');
        await client.connect();
        console.log('Successfully connected to MongoDB');

        const db = client.db('property-listing');
        const collection = db.collection('properties');

        // Read and parse CSV file
        const csvFilePath = path.join(__dirname, '..', 'db424fd9fb74_1748258398689 (1).csv');
        console.log(`Reading CSV file from: ${csvFilePath}`);
        
        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`CSV file not found at path: ${csvFilePath}`);
        }

        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        console.log(`Found ${records.length} records in CSV file`);

        // Transform the data
        const properties: Property[] = records.map((record: any) => ({
            id: record.id,
            title: record.title,
            type: record.type,
            price: parseInt(record.price),
            state: record.state,
            city: record.city,
            areaSqFt: parseInt(record.areaSqFt),
            bedrooms: parseInt(record.bedrooms),
            bathrooms: parseInt(record.bathrooms),
            amenities: record.amenities.split('|'),
            furnished: record.furnished,
            availableFrom: new Date(record.availableFrom),
            listedBy: record.listedBy,
            tags: record.tags.split('|'),
            colorTheme: record.colorTheme,
            rating: parseFloat(record.rating),
            isVerified: record.isVerified.toLowerCase() === 'true',
            listingType: record.listingType
        }));

        // Insert the data
        const result = await collection.insertMany(properties);
        console.log(`Successfully imported ${result.insertedCount} properties`);

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
        } else {
            console.error('Unknown error occurred:', error);
        }
        throw error; // Re-throw to ensure the process exits with error
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Add proper error handling for the main execution
importData()
    .then(() => {
        console.log('Data import completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Data import failed:', error);
        process.exit(1);
    }); 