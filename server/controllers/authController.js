const { generate } = require('@vue/compiler-core');
const User = require('../models/User');
const PasswordReset = require('../models/UserPasswordReset')
const bcrypt = require('bcrypt');
const crypto = require('crypto')
const sendEmail = require('../utils/mailer.js')
const fs = require('fs')
const path = require('path')
const randomCode = require('../utils/randomCode')

const resetPasswordEmailTemplate = fs.readFileSync(
    path.join(__dirname, '../templates/resetpassword.html'),
    'utf-8'
);
const userValidationEmailTemplate = fs.readFileSync(
    path.join(__dirname, '../templates/emailotp.html'),
    'utf-8'
);

exports.register = async (req, res) => {
    try {
        const { email, password, firstname, lastname } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User has already existed. Please sign in with your email. ' });
        }
        const salt = await bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const code = randomCode.newCode(100000, 999999);

        const htmlContent = userValidationEmailTemplate.replace('{{firstname}}', firstname).replace('{{code}}', code);

        await sendEmail({
            to: email,
            subject: `${code} - Your email validation code is here!`,
            text: '',
            html: htmlContent
        });

        req.session.registrationData = {
            email: email,
            password: hashedPassword,
            firstname: firstname,
            lastname: lastname,
            code: code,
            createdAt: Date.now()
        };

        res.status(201).json({ message: `You're almost there! `, step: 'verification' });
    } catch (error) {
        console.error('Problem occurred when signing users up. ', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email address or password is not correct. Please check again. ' });
        }

        if (user.disabled == true) {
            return res.status(400).json({ message: 'You account has been disabled. Please contact support. ' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email address or password is not correct. Please check again. ' });
        }

        user.lastLogin = Date.now();
        await user.save();

        req.session.user = {
            id: user._id,
            email: user.email
        }

        res.status(201).json({ message: "Welcome to OldPhoneDeals! " });
    } catch (error) {
        console.error('Problem occurred when signing users in. ', error);
        res.status(401).json({ message: `Server Error` });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const code = req.body.code;
        const registrationData = req.session.registrationData;

        if (!registrationData) {
            return res.status(400).json({
                message: 'Your session has expired. Please kindly retry sign up. ',
                step: 'register'
            })
        }

        if (code !== registrationData.code) {
            return res.status(400).json({ message: 'Verification code is incorrect. Please check again. ' });
        }

        const expireDuration = 10 * 60 * 1000;
        if (Date.now() - registrationData.createdAt > expireDuration) {
            const code = randomCode.newCode(100000, 999999);
            req.session.registrationData.code = code;
            req.session.registrationData.createdAt = Date.now();

            const htmlContent = userValidationEmailTemplate.replace('{{firstname}}', registrationData.firstname).replace('{{code}}', code);

            await sendEmail({
                to: email,
                subject: `${code} - Your email validation code is here!`,
                text: '',
                html: htmlContent
            });

            return res.status(400).json({
                message: `Your verification code has expired. A new code will be sent to your email. `
            });
        }

        const newUser = new User({
            email: registrationData.email,
            password: registrationData.password,
            firstname: registrationData.firstname,
            lastname: registrationData.lastname
        });
        await newUser.save();

        delete req.session.registrationData;
        res.status(201).json({
            message: `Your have been successfully signed up. `,
            step: 'login'
        })
    } catch (error) {
        console.error('Problem occurred when verifying code. ', error)
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.resendVerificationCode = async (req, res) => {
    try {
        if (!req.session.registrationData) {
            return res.status(400).json({
                message: 'Your session has expired. Please kindly retry sign up. ',
                step: 'register'
            });
        }

        const code = randomCode.newCode(100000, 999999);
        req.session.registrationData.code = code;
        req.session.registrationData.createdAt = Date.now();

        const htmlContent = userValidationEmailTemplate.replace('{{firstname}}', registrationData.firstname).replace('{{code}}', code);

        await sendEmail({
            to: email,
            subject: `${code} - Your email validation code is here!`,
            text: '',
            html: htmlContent
        });

        res.json({
            message: `A new verification code has been sent to your email. Please check. `,
        });
    } catch (error) {
        console.error('Problem occurred when resending verification code. ', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getRegistrationStatus = async (req, res) => {
    if (req.session.registrationData) {
        res.json({
            step: 'verification',
            email: req.session.registrationData.email
        });
    } else if (req.session.user) {
        res.json({
            step: 'completed',
            user: {
                id: req.session.user.id,
                email: req.session.user.email
            }
        });
    } else {
        res.json({ step: 'login' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User does not exist. Please check again. ' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        const exisitingPasswordReset = await PasswordReset.findOne({
            email,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (exisitingPasswordReset) {
            return res.status(400).json({ message: 'Password reset link has already been sent to your email. Please check. ' });
        }

        const passwordReset = new PasswordReset({
            userId: user._id,
            resetPasswordToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
            resetPasswordExpires: Date.now() + 1000 * 60 * 60
        });

        await passwordReset.save();

        const firstname = user.firstname;
        const htmlContent = resetPasswordEmailTemplate.replace('{{firstname}}', firstname).replace('{{resetLink}}', `http://localhost:5173/auth/reset-password/${resetToken}`);

        await sendEmail({
            to: email,
            subject: 'Password Reset - OldPhoneDeals',
            text: '',
            html: htmlContent
        });
        res.status(201).json({ message: 'The link for password resetting has been sent to your email. Please kindly check. ' });
    } catch (error) {
        console.error('Message sent error', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.validateResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const passwordReset = await PasswordReset.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!passwordReset) {
            return res.status(400).json({ message: 'Token is not valid or has been expired. ', isValid: false });
        }
        res.status(200).json({ message: `Token is valid. `, isValid: true });
    } catch (error) {
        console.error("Problem occurred when validating password-resetting token. ", error);
        res.status(500).json({ message: 'Server Error', isValid: false });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const passwordReset = await PasswordReset.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!passwordReset) {
            return res.status(400).json({ message: 'Token is not valid or has been expired. ' });
        }
        const userId = passwordReset.userId;
        const user = await User.findById(userId);
        const salt = await bcrypt.genSaltSync(10);
        user.password = await bcrypt.hash(password, salt);

        await PasswordReset.deleteMany({ userId });

        await user.save();

        if (req.session) delete req.session;

        res.status(200).json({ message: 'Password has been successfully reset. ' });
    } catch (error) {
        console.error('Problem occurred when resetting password. ', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ message: 'Failed to sign out. ' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Successfully signed out. ' });
    })
};

exports.abortRegistration = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ message: 'Failed to abort. ', step: 'login' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Successfully signed out. ', step: 'login' });
    })
}