const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Class = require('../models/Class');

// Create a new announcement (unchanged)
router.post('/', async (req, res) => {
    try {
        const { title, text, link, postedBy, classId, avatar, avatarBg } = req.body;

        if (!title || !text || !classId) {
            return res.status(400).json({ 
                success: false,
                error: 'Title, content, and class selection are required' 
            });
        }

        const newAnnouncement = new Announcement({
            title,
            text,
            link,
            postedBy: postedBy || 'Admin',
            classId,
            avatar: avatar || 'Y',
            avatarBg: avatarBg || '#1a73e8'
        });

        await newAnnouncement.save();
        res.status(201).json({
            success: true,
            announcement: newAnnouncement
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error creating announcement',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all announcements with class name (updated)
router.get('/', async (req, res) => {
    try {
        const { role, postedBy, classIds } = req.query; // Include classIds

        let query = {};

        if (role === 'staff' && postedBy) {
            // For staff, fetch only announcements they posted
            query.postedBy = postedBy;
            // If classIds are provided, filter by classIds
            if (classIds) {
                const classIdArray = classIds.split(',').map(id => id.trim());
                query.classId = { $in: classIdArray };
            }
        } else if (role === 'student') {
            // For students, fetch announcements for specific classes if classIds provided
            if (classIds) {
                const classIdArray = classIds.split(',').map(id => id.trim());
                query.classId = { $in: classIdArray };
            }
        } else if (role) {
            // Invalid role
            return res.status(400).json({
                success: false,
                error: 'Invalid role specified'
            });
        }

        // Fetch announcements based on query
        const announcements = await Announcement.find(query)
            .populate({
                path: 'classId',
                select: 'name',
                model: Class
            })
            .sort({ createdAt: -1 });

        // Map announcements to include class name
        const formattedAnnouncements = announcements.map(a => ({
            _id: a._id,
            title: a.title,
            text: a.text,
            link: a.link,
            postedBy: a.postedBy || 'Unknown',
            className: a.classId ? a.classId.name : 'No Class',
            avatar: a.avatar,
            avatarBg: a.avatarBg,
            createdAt: a.createdAt
        }));

        res.json({
            success: true,
            announcements: formattedAnnouncements
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error fetching announcements',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all announcements for a specific class (unchanged)
router.get('/class/:classId', async (req, res) => {
    try {
        const { classId } = req.params;
        const announcements = await Announcement.find({ classId })
            .populate({
                path: 'classId',
                select: 'name',
                model: Class
            })
            .sort({ createdAt: -1 });

        const formattedAnnouncements = announcements.map(a => ({
            _id: a._id,
            title: a.title,
            text: a.text,
            link: a.link,
            postedBy: a.postedBy || 'Unknown',
            className: a.classId ? a.classId.name : 'No Class',
            avatar: a.avatar,
            avatarBg: a.avatarBg,
            createdAt: a.createdAt
        }));

        res.json({
            success: true,
            announcements: formattedAnnouncements
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error fetching announcements',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete an announcement (unchanged)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Announcement ID is required'
            });
        }

        const deletedAnnouncement = await Announcement.findByIdAndDelete(id);

        if (!deletedAnnouncement) {
            return res.status(404).json({
                success: false,
                error: 'Announcement not found'
            });
        }

        res.json({
            success: true,
            message: 'Announcement deleted successfully',
            deletedAnnouncementId: id
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting announcement',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;