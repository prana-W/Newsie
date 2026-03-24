import Router from 'express';

import {
    registerUser,
    loginUser,
    getUserProfile,
    logoutUser,
} from '../controllers/user.controller.js';
import {verifyAccessToken} from '../middlewares/index.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', verifyAccessToken, getUserProfile);
router.post('/logout', verifyAccessToken, logoutUser);

export default router;