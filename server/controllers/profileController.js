const User = require('../models/User');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/mailer.js')
const fs = require('fs')
const path = require('path')
const randomCode = require('../utils/randomCode')
const PhoneList = require('../models/PhoneList');
const multer = require('multer');
require('dotenv').config()

const userEmailChangeValidationTemplate = fs.readFileSync(
    path.join(__dirname, '../templates/emailotp-change-email-address.html'),
    'utf-8'
);

const userPasswordChangeNotificationTemplate = fs.readFileSync(
    path.join(__dirname, '../templates/password-changed-notice.html'),
    'utf-8'
);

exports.getUserInfo = async(req, res)=>{
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }
        const uid = req.session.user.id;
        const user = await User.findById(uid);
        if(!user){
            return res.status(404).json({ message: 'User does not exist. ', fallback: '/auth'});
        }
        const email = user.email;
        const firstname = user.firstname;
        const lastname = user.lastname;
        res.status(201).json({
            email: email,
            firstname: firstname,
            lastname: lastname
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', fallback: '/'});
    }
};

exports.passwordMatch = async(req, res) => {
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }

        const uid = req.session.user.id;
        const password = req.body.password;
        
        const user = await User.findById(uid);
        if(!user){
            return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ message: 'Password is incorrect. Please try again. '});
        }
        
        res.status(201).json({ message: 'Authenticated' });
    } catch(error) {
        console.error("Problem occurred when comparing user's password. ", error);
        res.status(401).json({ message: `Server Error` });
    }
}

exports.setUserInfo = async(req, res)=>{
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }

        const uid = req.session.user.id;
        const { firstname, lastname } = req.body;
        const user = await User.findById(uid);
        if(!user){
            return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
        }
        user.firstname = firstname;
        user.lastname = lastname;
        await user.save();
        res.status(201).json({ message: 'User profile edited successfully. '});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error'});
    }
};

exports.requestAlterUserEmail = async(req, res)=>{
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }
        
        const uid = req.session.user.id;
        const newEmail = req.body.newEmail;
        
        if(req.session.changeEmailData) {
            const expireDuration = 10 * 60 * 1000;
            if(Date.now() - req.session.changeEmailData.createdAt < expireDuration
                && uid === req.session.changeEmailData.uid) {
                return res.status(201).json({ message: 'You already have a validation code sent to your new email address. Please check your email inbox. '});
            }
            if(newEmail !== req.session.changeEmailData.newEmail){
                delete req.session.changeEmailData;
                return res.status(401).json({ message: 'Email address not match. ' , action: 'cancelEmailAltering' });
            }
        }

        const existingUser = await User.findOne( { email: newEmail });
        if(existingUser){
            return res.status(401).json({ message: 'Email address has been used for by an existing user. ', action: 'cancelEmailAltering' });
        }

        const user = await User.findById(uid);
        if(!user){
            delete req.session.user;
            return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
        }

        const firstname = user.firstname;

        const code = randomCode.newCode(100000, 999999);

        const htmlContent = userEmailChangeValidationTemplate.replace('{{firstname}}', firstname).replace('{{code}}', code);

        await sendEmail({
            to: newEmail,
            subject: `${code} - The validation code for changing your email is here!`,
            text:'',
            html:htmlContent
        });

        req.session.changeEmailData = {
            code: code,
            uid: uid,
            newEmail: newEmail,
            createdAt: Date.now()
        };

        res.status(201).json({ message: 'The validation code for changing your email has been sent to your new email address. Please kindly check. '} );
    } catch(error) {
        console.error("Problem occurred when sending validation email to user' s new email address. ", error);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.toAlterUserEmail = async(req, res)=>{
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }
        const uid = req.session.user.id;
        const { newEmail, code } = req.body;

        if(!req.session.changeEmailData){
            return res.status(401).json({ message: 'User request not found. ' , action: 'cancelEmailAltering' });
        }

        const expireDuration = 10 * 60 * 1000;
        if((Date.now() - req.session.changeEmailData.createdAt > expireDuration)
            || req.session.changeEmailData.uid !== uid){
                delete req.session.changeEmailData;
                return res.status(401).json({ message: 'User request expired. ' , action: 'cancelEmailAltering' });
        }

        if(newEmail !== req.session.changeEmailData.newEmail){
            delete req.session.changeEmailData;
            return res.status(401).json({ message: 'Email address not match. ' , action: 'cancelEmailAltering' });
        }

        if(code !== req.session.changeEmailData.code){
            return res.status(401).json({ message: 'Validation code is incorrect. '});
        }
        
        const user = await User.findById(uid);
        if(!user){
            delete req.session.user;
            return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
        }

        user.email = newEmail;
        await user.save();

        delete req.session.changeEmailData;
        res.status(201).json({ message: 'Your email address has successfully been changed. ', action: 'cancelEmailAltering' });
    } catch {
        console.error(error);
        res.status(500).json({ message: 'Server Error', fallback: '/'});
    }
};

exports.changeUserPassword = async(req, res) => {
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }
        const uid = req.session.user.id;
        const { originalPassword, newPassword } = req.body;
        
        const user = await User.findById(uid);
        if(!user){
            delete req.session.user;
            return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
        }

        const isMatch = await bcrypt.compare(originalPassword, user.password);
        if(!isMatch) {
            return res.status(400).json({ message: 'The current password you entered is incorrect. Please check and try again. '});
        }
        const email = user.email;
        const firstname = user.firstname;

        const salt = await bcrypt.genSaltSync(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        const htmlContent = userPasswordChangeNotificationTemplate.replace('{{firstname}}', firstname);

        await sendEmail({
            to: email,
            subject: `Your password has been changed! `,
            text:'',
            html:htmlContent
        });

        res.status(201).json({ message: 'Your password has been changed successfully. Also, a notice about this password changing will be sent to your email. ' });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', fallback: '/'});
    }
};

exports.getUserComments = async(req, res) =>{
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }
        const uid = req.session.user.id;
        
        const user = await User.findById(uid);
        if(!user){
            delete req.session.user;
            return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
        }

        const phones = await PhoneList.find({ seller: user._id.toString()}).lean();
        
        for(const phone of phones){
            delete phone.brand;
            delete phone.stock;
            delete phone.price;
            delete phone.seller;
            for(const review of phone.reviews){
                const reviewer = await User.findById(review.reviewer);
                review.reviewer = `${reviewer.firstname} ${reviewer.lastname}`;
                review.isHidden = false;
                if(review.hasOwnProperty('hidden')){
                    delete review.hidden;
                    review.isHidden = true;
                }
            }
        }
        res.status(201).json(phones);
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', fallback: '/'});
    }
}

exports.getUserListings = async(req, res) =>{
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }
        const uid = req.session.user.id;
        
        const user = await User.findById(uid);
        if(!user){
            delete req.session.user;
            return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
        }

        const phones = await PhoneList.find({ seller: user._id.toString()}).lean();
        
        for(const phone of phones){
            delete phone.seller;
            delete phone.reviews;
            phone.isDisabled = false;
            if(phone.hasOwnProperty('disabled')){
                delete phone.disabled;
                phone.isDisabled = true;
            }
        }
        res.status(201).json(phones);
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', fallback: '/'});
    }
}

exports.manageListingDisabled = async(req, res) => {
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }
        const uid = req.session.user.id;
        
        const user = await User.findById(uid);
        if(!user){
            delete req.session.user;
            return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
        }

        const { phoneId, setDisabled } = req.body
        const phone = await PhoneList.findById(phoneId);
        if(setDisabled) phone.disabled = '';
        else if(!setDisabled) phone.set('disabled', undefined);

        await phone.save();
        res.status(201).json(setDisabled);
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error'});
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../public/images/PhoneImages'));
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueName + path.extname(file.originalname));
    }
});

// const upload = multer({storage})

exports.uploadListing = async(req, res) => {
    const upload = multer({storage}).single("image");
    upload(req, res, async(err) => {
        if(err){
            // console.log('File received:', req.file);
            // console.log('Body received:', req.body);
            console.error(err);
            return res.status(400).json( { message: `Unable to upload the file: ${err}` });
        }
        try{
            if(!req.session.user){
                return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
            }
            const uid = req.session.user.id;
            
            const user = await User.findById(uid);
            if(!user){
                delete req.session.user;
                return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
            }
            const { title, brand, stock, price } = req.body;
            const imgUrl = req.file ? `/images/PhoneImages/${req.file.filename}` : null; 

            // console.log(imgUrl);
            const phone = new PhoneList({
                title: title,
                brand: brand,
                image: imgUrl,
                stock: stock,
                price: price,
                seller: uid
            });
            await phone.save();

            res.status(201).json({ message: 'Added successfully!'});
        } catch(error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error'});
        }
    })
}

exports.deleteListing = async(req, res) => {
    try{
        if(!req.session.user){
            return res.status(401).json({ message: 'User not signed in. ', fallback: '/auth'});
        }
        const uid = req.session.user.id;
        
        const user = await User.findById(uid);
        if(!user){
            delete req.session.user;
            return res.status(400).json({ message: 'User not found.', fallback: '/auth'});
        }

        const { phoneId } = req.body
        const phone = await PhoneList.findByIdAndDelete(phoneId);
        if(phone){
            fs.unlinkSync(`public/${phone.image}`);
        }
        res.status(201).json({ message: 'Delete successfully! '});
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error'});
    }
}