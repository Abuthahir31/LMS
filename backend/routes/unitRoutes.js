const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 
const fsPromises = require('fs').promises; 
const Unit = require('../models/unit');
const File = require('../models/files');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../Uploads');
fsPromises.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Increased to 100MB for videos
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Videos
      'video/mp4',
      'video/mpeg',
      'video/webm',
      'video/ogg',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      // Documents
      'application/pdf',
      'application/pptx',
      'application/docx',
      'text/plain',
      'application/json',
      'text/html',
      'text/css',
      'application/javascript',
      'text/markdown',
      // Archives
      'application/zip',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Supported types: ${allowedTypes.join(', ')}`));
    }
  },
});

// Utility function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get all units for a class
router.get('/:classId', async (req, res) => {
  try {
    const units = await Unit.find({ classId: req.params.classId }).populate('files');
    res.json(units);
  } catch (err) {
    console.error('Failed to fetch units:', err);
    res.status(500).json({ error: 'Failed to fetch units', details: err.message });
  }
});

// Create new unit
router.post('/', async (req, res) => {
  try {
    const { unitTitle, unitDescription, classId } = req.body;
    if (!unitTitle) {
      return res.status(400).json({ error: 'Unit title is required' });
    }
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    const newUnit = new Unit({
      title: unitTitle,
      classId,
      files: unitDescription
        ? [(await new File({ title: 'Overview', name: 'overview.txt', type: 'text/plain', size: formatFileSize(Buffer.from(unitDescription).length), content: unitDescription, lastModified: new Date().toLocaleDateString(), isNotes: true, filePath: '' }).save())._id]
        : [],
    });

    const savedUnit = await newUnit.save();
    const populatedUnit = await Unit.findById(savedUnit._id).populate('files');
    res.status(201).json(populatedUnit);
  } catch (err) {
    console.error('Error creating unit:', err);
    res.status(500).json({ error: 'Failed to create unit', details: err.message });
  }
});

// Add file to unit
router.post('/:unitId/files', upload.single('fileUpload'), async (req, res) => {
  try {
    const { unitId } = req.params;
    const { fileName, notesContent, fileType } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    let fileData;
    if (fileType === 'upload' && req.file) {
      const isTextFile =
        req.file.mimetype.startsWith('text/') ||
        req.file.mimetype === 'application/json' ||
        req.file.originalname.match(/\.(txt|js|html|css|md)$/);

      const fileContent = isTextFile
        ? await fsPromises.readFile(req.file.path, 'utf8')
        : null; // Do not read binary files (e.g., videos, audio) into memory

      fileData = new File({
        title: fileName,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: formatFileSize(req.file.size),
        content: fileContent, // Only store content for text-based files
        lastModified: new Date().toLocaleDateString(),
        isUploadedFile: true,
        filePath: req.file.path,
      });
    } else if (fileType === 'notes' && notesContent) {
      const blob = Buffer.from(notesContent);
      fileData = new File({
        title: fileName,
        name: fileName + '.txt',
        type: 'text/plain',
        size: formatFileSize(blob.length),
        content: notesContent,
        lastModified: new Date().toLocaleDateString(),
        isNotes: true,
        filePath: '', // Notes don’t need a file path
      });
    } else {
      return res.status(400).json({ error: 'Invalid file or notes content' });
    }

    const savedFile = await fileData.save();
    unit.files.push(savedFile._id);
    await unit.save();
    const populatedUnit = await Unit.findById(unitId).populate('files');
    res.status(201).json(populatedUnit);
  } catch (err) {
    console.error('Error adding file:', err);
    res.status(500).json({ error: 'Failed to add file', details: err.message });
  }
});

// Serve file (for downloading or streaming)
router.get('/files/:fileId', async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file || !file.filePath) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.resolve(file.filePath);
    const stat = await fsPromises.stat(filePath);

    if (!stat.isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Handle video/audio streaming
    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = end - start + 1;

        // Set headers for range request
        res.set({
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': file.type,
        });
        res.status(206);

        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        // Full file streaming
        res.set({
          'Content-Length': stat.size,
          'Content-Type': file.type,
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } else {
      // Handle downloads for other files (e.g., PDF, images)
      res.set({
        'Content-Type': file.type,
        'Content-Disposition': `inline; filename="${file.name}"`, // Use inline for previews
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Error serving file:', err);
    res.status(500).json({ error: 'Failed to serve file', details: err.message });
  }
});

// Update unit
router.put('/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;
    const { unitTitle, unitDescription } = req.body;

    if (!unitTitle) {
      return res.status(400).json({ error: 'Unit title is required' });
    }

    const unit = await Unit.findById(unitId).populate('files');
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Update unit title
    unit.title = unitTitle;

    // Update or create description file
    if (unitDescription !== undefined) {
      // Find existing overview file
      const overviewFile = unit.files.find(file => file.title === 'Overview' && file.isNotes);
      if (overviewFile) {
        // Update existing overview file
        overviewFile.content = unitDescription;
        overviewFile.size = formatFileSize(Buffer.from(unitDescription).length);
        overviewFile.lastModified = new Date().toLocaleDateString();
        await overviewFile.save();
      } else if (unitDescription) {
        // Create new overview file if description is provided
        const newFile = new File({
          title: 'Overview',
          name: 'overview.txt',
          type: 'text/plain',
          size: formatFileSize(Buffer.from(unitDescription).length),
          content: unitDescription,
          lastModified: new Date().toLocaleDateString(),
          isNotes: true,
          filePath: '',
        });
        const savedFile = await newFile.save();
        unit.files.push(savedFile._id);
      }
    }

    await unit.save();
    const populatedUnit = await Unit.findById(unitId).populate('files');
    res.json(populatedUnit);
  } catch (err) {
    console.error('Error updating unit:', err);
    res.status(500).json({ error: 'Failed to update unit', details: err.message });
  }
});

// Update file in unit
router.put('/:unitId/files/:fileId', upload.single('fileUpload'), async (req, res) => {
  try {
    const { unitId, fileId } = req.params;
    const { fileName, notesContent, fileType } = req.body;

    // Log received data for debugging
    console.log('Received data:', { unitId, fileId, fileName, notesContent, fileType, file: req.file });

    // Validate required fields
    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    // Find the unit
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Find the file
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Update file title and last modified date
    file.title = fileName;
    file.lastModified = new Date().toLocaleDateString();

    if (fileType === 'upload' && req.file) {
      // Delete old file if it exists and is different
      if (file.filePath && file.filePath !== req.file.path) {
        try {
          await fsPromises.unlink(file.filePath);
        } catch (err) {
          console.error(`Failed to delete old file ${file.filePath}:`, err);
        }
      }

      const isTextFile =
        req.file.mimetype.startsWith('text/') ||
        req.file.mimetype === 'application/json' ||
        req.file.originalname.match(/\.(txt|js|html|css|md)$/);

      const fileContent = isTextFile
        ? await fsPromises.readFile(req.file.path, 'utf8')
        : null;

      file.name = req.file.originalname;
      file.type = req.file.mimetype;
      file.size = formatFileSize(req.file.size);
      file.content = fileContent;
      file.isUploadedFile = true;
      file.isNotes = false;
      file.filePath = req.file.path;
    } else if (fileType === 'notes' && notesContent) {
      if (file.filePath) {
        try {
          await fsPromises.unlink(file.filePath);
        } catch (err) {
          console.error(`Failed to delete old file ${file.filePath}:`, err);
        }
      }

      const blob = Buffer.from(notesContent);
      file.name = fileName + '.txt';
      file.type = 'text/plain';
      file.size = formatFileSize(blob.length);
      file.content = notesContent;
      file.isUploadedFile = false;
      file.isNotes = true;
      file.filePath = '';
    }

    await file.save();
    const populatedUnit = await Unit.findById(unitId).populate('files');
    res.json(populatedUnit);
  } catch (err) {
    console.error('Error updating file:', err);
    res.status(500).json({ error: 'Failed to update file', details: err.message });
  }
});

// Delete unit
router.delete('/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;
    const unit = await Unit.findById(unitId).populate('files');

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Delete associated files
    for (const file of unit.files) {
      if (file.filePath) {
        try {
          await fsPromises.unlink(file.filePath);
        } catch (err) {
          console.error(`Failed to delete file ${file.filePath}:`, err);
        }
      }
      await File.findByIdAndDelete(file._id);
    }

    await Unit.findByIdAndDelete(unitId);
    res.json({ message: 'Unit deleted successfully' });
  } catch (err) {
    console.error('Error deleting unit:', err);
    res.status(500).json({ error: 'Failed to delete unit', details: err.message });
  }
});

// Delete file from unit
router.delete('/:unitId/files/:fileId', async (req, res) => {
  try {
    const { unitId, fileId } = req.params;
    const unit = await Unit.findById(unitId);

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.filePath) {
      try {
        await fsPromises.unlink(file.filePath);
      } catch (err) {
        console.error(`Failed to delete file ${file.filePath}:`, err);
      }
    }

    unit.files = unit.files.filter((f) => f.toString() !== fileId);
    await unit.save();
    await File.findByIdAndDelete(fileId);
    const populatedUnit = await Unit.findById(unitId).populate('files');
    res.json(populatedUnit);
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Failed to delete file', details: err.message });
  }
});

module.exports = router;