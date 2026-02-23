import * as authService from './service.js';

export const register = async (req, res) => {
    try {
        const { name, email, password, organizationName } = req.body;
        const { user, token } = await authService.registerOrganization({
            name,
            email,
            password,
            organizationName
        });

        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.loginUser({ email, password });

        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        res.status(200).json({ user, token });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

export const me = async (req, res) => {
    try {
        const user = await authService.getUserById(req.user.id);
        res.status(200).json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const logout = async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};
