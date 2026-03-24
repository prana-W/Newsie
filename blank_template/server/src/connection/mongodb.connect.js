import mongoose from 'mongoose';

async function connectToDatabase() {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}`
        );

        if (connectionInstance)
            console.log(`✅ Database connected: ${process.env.MONGODB_URI}`);
    } catch (error) {
        console.error('Error in connecting to database:', error);
        process.exit(1);
    }
}

export default connectToDatabase;
