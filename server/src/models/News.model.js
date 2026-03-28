import mongoose from 'mongoose';

const NEWS_COLLECTION = process.env.MONGO_NEWS_COLLECTION || 'ET-news';

const newsCommentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        userName: {
            type: String,
            default: 'Anonymous',
            trim: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {timestamps: {createdAt: true, updatedAt: false}, _id: true}
);

const newsSchema = new mongoose.Schema(
    {
        title: {type: String, required: true, trim: true},
        description: {type: String, default: '', trim: true},
        image_url: {type: String, default: ''},
        body: {type: String, default: ''},
        author: {type: String, default: ''},
        url: {type: String, default: ''},
        section: {type: String, default: 'General'},
        published_at: {type: Date, default: null},
        source: {type: String, default: 'Economic Times'},
        tags: {type: [String], default: []},
        sentiment: {type: String, default: 'neutral'},
        sentiment_score: {type: Number, default: 0},
        fetched_at: {type: Date, default: Date.now},
        likeCount: {type: Number, default: 0},
        dislikeCount: {type: Number, default: 0},
        comments: {type: [newsCommentSchema], default: []},
        ragRouting: {
            arcId: {type: String, default: null},
            similarityScore: {type: Number, default: null},
            action: {type: String, default: null},
            routedAt: {type: Date, default: null},
        },
    },
    {timestamps: true, collection: NEWS_COLLECTION}
);

newsSchema.index({fetched_at: -1});
newsSchema.index({section: 1});
newsSchema.index({tags: 1});

const News = mongoose.model('News', newsSchema);

export default News;
