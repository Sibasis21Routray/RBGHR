const express = require('express');
const {
    createUser,
    getAllUsers,
    getUserById,
    getUserComments,
    updateUser,
    deleteUser,
    downloadFile ,
    generateExcel,
    addComment,
    generateSingleUserExcel
} = require('../controller/form.controller');
const upload = require('../middleware/upload');

const router = express.Router();

// --- General Routes ---
router.post('/', upload.single('pdfFile'), createUser);
router.get('/', getAllUsers);

// --- Specific/Static Routes (Must come BEFORE dynamic routes) ---
// This route is for exporting ALL users' data
router.get('/download/export-excel', generateExcel);

// --- Dynamic Routes (use :id) ---
router.get('/:id', getUserById);
router.put('/:id', upload.single('pdfFile'), updateUser);
router.delete('/:id', deleteUser);
router.get('/:id/download-file', downloadFile);
// This route is for exporting a SINGLE user's data
router.get('/:id/export-excel', generateSingleUserExcel);
router.post('/:id/comments', addComment);
router.get('/:id/comments', getUserComments);

module.exports = router;
