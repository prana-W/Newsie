import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please fill a valid email address',
            ],
            index: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        preferences: {
            tone: {
                type: String,
                default: 'neutral',
                trim: true,
            },
            language: {
                type: String,
                default: 'English',
                trim: true,
            },
            preferredCategories: {
                type: [String],
                default: [],
            },
        },
    },
    {timestamps: true}
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {userId: this._id, name: this.name, email: this.email, role: 'user'},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: '7d'}
    );
};

const User = mongoose.model('User', userSchema);
export default User;
