require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const requester = await User.findOne({ email: 'testuser@lifelink.com' });
        const bloodGroup = 'O+';

        if (!requester) {
            console.log('Requester testuser@lifelink.com not found!');
            process.exit(0);
        }

        const matchingDonors = await User.find({
            _id: { $ne: requester._id },
            isVerified: true,
            profileCompleted: true,
            'profile.bloodGroup': bloodGroup,
            'profile.availableToDonate': true,
            $or: [
                { 'profile.lastDonationDate': { $exists: false } },
                { 'profile.lastDonationDate': null },
                { 'profile.lastDonationDate': { $lt: ninetyDaysAgo } },
            ],
        });

        console.log('--- DB QUERY MATCH TEST ---');
        console.log('Requester ID:', requester._id);
        console.log('Target Blood Group:', bloodGroup);
        console.log('Matching Donors Count:', matchingDonors.length);
        
        if(matchingDonors.length > 0) {
            console.log('Matched Donor Emails:', matchingDonors.map(d => d.email));
        } else {
            const donor = await User.findOne({ email: 'donor@lifelink.com' });
            console.log('\n--- WHY DONOR DID NOT MATCH ---');
            console.log('Donor Exists?', !!donor);
            if(donor) {
                console.log('isVerified:', donor.isVerified, '(Expected: true)');
                console.log('profileCompleted:', donor.profileCompleted, '(Expected: true)');
                console.log('bloodGroup:', donor.profile?.bloodGroup, '(Expected: O+)');
                console.log('availableToDonate:', donor.profile?.availableToDonate, '(Expected: true)');
                console.log('lastDonationDate:', donor.profile?.lastDonationDate, '(Expected: null or >90 days ago)');
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
});
