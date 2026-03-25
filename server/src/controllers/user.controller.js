import User from '../models/User.model.js';
import {asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {ApiResponse} from '../utility/index.js';
import {ApiError} from '../utility/index.js';
import cookieOptions from '../constants/cookieOptions.js';


export const registerUser = asyncHandler(async (req, res) => {
    const {name, email, password} = req.body;

    if (!name || !email || !password) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Missing required fields');
    }

    const existingUser = await User.findOne({email});
    if (existingUser) {
        throw new ApiError(
            statusCode.CONFLICT,
            'User with this email already exists'
        );
    }

    const newUser = new User({
        name,
        email,
        password,
    });

    await newUser.save();

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                {email: newUser?.email},
                'User registered successfully'
            )
        );
});

export const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Email and password are required'
        );
    }

    const user = await User.findOne({email}).select('+password');

    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(statusCode.UNAUTHORIZED, 'Invalid password');
    }

    const accessToken = user.generateAccessToken();

    res.cookie('accessToken', accessToken, cookieOptions)
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                {email: user.email},
                'User logged in successfully'
            )
        );
});

export const getUserProfile = asyncHandler(async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        throw new ApiError(statusCode.BAD_REQUEST, 'User ID is required');
    }

    const user = await User.findById(userId).select('-password -refreshToken');

    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found');
    }

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                user,
                'User profile fetched successfully'
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        throw new ApiError(statusCode.BAD_REQUEST, 'User ID is required');
    }

    res.clearCookie('accessToken', cookieOptions);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(statusCode.OK, null, 'User logged out successfully')
        );
});
