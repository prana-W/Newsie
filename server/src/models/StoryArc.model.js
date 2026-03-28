import mongoose from 'mongoose';

const storyArcEventSchema = new mongoose.Schema(
    {
        event_text: {type: String, required: true, trim: true},
        event_date: {type: String, required: true, trim: true},
        article_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'News',
            required: true,
        },
    },
    {_id: false}
);

const storyArcSchema = new mongoose.Schema(
    {
        arc_id: {type: String, required: true, unique: true, index: true},
        topic_summary: {type: String, required: true, trim: true},
        category: {type: String, default: 'Markets News', trim: true},
        compiled_timeline: {type: [storyArcEventSchema], default: []},
        associated_articles: [
            {type: mongoose.Schema.Types.ObjectId, ref: 'News'},
        ],
        hotScore: {type: Number, default: 0},
    },
    {timestamps: true, collection: 'story_arcs'}
);

storyArcSchema.index({updatedAt: -1});
storyArcSchema.index({hotScore: -1});

const StoryArc = mongoose.model('StoryArc', storyArcSchema);

export default StoryArc;
