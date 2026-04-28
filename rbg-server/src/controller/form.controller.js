const User = require("../models/form.model");
const { validateUser } = require("../validation/form.validation");
const path = require("path");
const fs = require("fs").promises;
const ExcelJS = require("exceljs");
const mongoose = require("mongoose");

// Create new user
const createUser = async (req, res) => {
  try {
    // Format CTC field if present and is a number
    if (req.body.ctcInLakhs !== undefined) {
      const ctcValue = parseFloat(req.body.ctcInLakhs);
      if (!isNaN(ctcValue)) {
        req.body.ctcInLakhs = Math.round(ctcValue * 100) / 100; // Round to 2 decimals
      }
    }

    // Validate request body
    const { error, value } = validateUser(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message,
        })),
      });
    }



    // Prepare user data
    const userData = { ...value };

    // Add file information if PDF was uploaded
    if (req.file) {
      userData.pdfFile = {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer, // Save binary data
      };
    }

    // Create new user
    const newUser = new User(userData);
    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        mailId: savedUser.mailId,
        dateOfUpload: savedUser.dateOfUpload,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // =========================
    // ✅ FIXED SEARCH LOGIC
    // =========================
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      const searchTerms = searchTerm.split(/\s+/);

      const orConditions = [];

      searchTerms.forEach(term => {
        const regex = new RegExp(`^${term}`, "i"); // starts with

        orConditions.push(
          { firstName: regex },
          { mailId: regex },
          { alternateMailId: regex },
          { contactNo: regex },
          { alternateContactNo: regex },
          { panNo: regex }
        );
      });

      filter.$or = orConditions; // 🔥 MAIN FIX
    }

    // =========================
    // OTHER FILTERS (UNCHANGED)
    // =========================

    if (req.query.gender && req.query.gender !== "All Genders") {
      filter.gender = req.query.gender;
    }

    if (req.query.minExperience || req.query.maxExperience) {
      filter.$and = filter.$and || [];

      if (req.query.minExperience && req.query.minExperience !== "0") {
        filter.$and.push({
          totalExperience: { $gte: parseInt(req.query.minExperience) }
        });
      }

      if (req.query.maxExperience && req.query.maxExperience !== "All") {
        filter.$and.push({
          totalExperience: { $lte: parseInt(req.query.maxExperience) }
        });
      }
    }

    if (req.query.minCtc || req.query.maxCtc) {
      filter.$and = filter.$and || [];

      if (req.query.minCtc) {
        filter.$and.push({
          ctcInLakhs: { $gte: parseFloat(req.query.minCtc) }
        });
      }

      if (req.query.maxCtc) {
        filter.$and.push({
          ctcInLakhs: { $lte: parseFloat(req.query.maxCtc) }
        });
      }
    } else if (req.query.ctcInLakhs) {
      filter.ctcInLakhs = parseFloat(req.query.ctcInLakhs);
    }

  if (req.query.currentState && req.query.currentState !== "Current state") {
  filter.currentState = new RegExp(`^${req.query.currentState}`, "i");
}

if (req.query.currentCity && req.query.currentCity !== "Current city") {
  filter.currentCity = new RegExp(`^${req.query.currentCity}`, "i");
}

if (req.query.preferredState && req.query.preferredState !== "Preferred state") {
  filter.preferredState = new RegExp(`^${req.query.preferredState}`, "i");
}

if (req.query.preferredCity && req.query.preferredCity !== "Preferred city") {
  filter.preferredCity = new RegExp(`^${req.query.preferredCity}`, "i");
}

if (req.query.designation && req.query.designation !== "Designation") {
  filter.designation = new RegExp(`^${req.query.designation}`, "i");
}

    if (req.query.department && req.query.department !== "Department") {
      filter.department = req.query.department;
    }

    if (req.query.currentEmployer) {
      filter.currentEmployer = new RegExp(req.query.currentEmployer, "i");
    }

    if (req.query.startDate || req.query.endDate) {
      filter.dateOfUpload = {};
      if (req.query.startDate) {
        filter.dateOfUpload.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.dateOfUpload.$lte = new Date(req.query.endDate);
      }
    }

    if (req.query.uploadedBy) {
      filter.uploadedBy = new RegExp(req.query.uploadedBy, "i");
    }

    // =========================
    // QUERY EXECUTION
    // =========================

    const users = await User.find(filter)
      .select("-pdfFile.path")
      .sort({ dateOfUpload: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(req.params.id).select("-pdfFile.path");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get comments by user ID
const getUserComments = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        comments: user.comments,
        userName: `${user.firstName} ${user.lastName}`,
        userId: user._id,
        totalComments: user.comments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    // Format CTC field if present and is a number
    if (req.body.ctcInLakhs !== undefined) {
      const ctcValue = parseFloat(req.body.ctcInLakhs);
      if (!isNaN(ctcValue)) {
        req.body.ctcInLakhs = Math.round(ctcValue * 100) / 100; // Round to 2 decimals
      }
    }

    const { error, value } = validateUser(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message,
        })),
      });
    }

    const userId = req.params.id;
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }



    const updateData = { ...value };

    // Handle file update
    if (req.file) {
      // Add new file info
      updateData.pdfFile = {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer, // Save binary data
      };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-pdfFile.path");

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete associated file if it exists (for legacy records)
    if (user.pdfFile && user.pdfFile.path) {
      try {
        await fs.unlink(user.pdfFile.path);
      } catch (unlinkError) {
        console.error("Error deleting user file:", unlinkError);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Download file (supports PDF and other formats)
const downloadFile = async (req, res) => {
  try {
    console.log("\n========== DOWNLOAD START ==========");
    console.log("👉 Requested ID:", req.params.id);

    const user = await User.findById(req.params.id);

    console.log("👉 User found:", !!user);

    if (!user) {
      console.log("❌ User NOT found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("👉 pdfFile exists:", !!user.pdfFile);
    console.log("👉 pdfFile value:", user.pdfFile);

    if (!user.pdfFile) {
      console.log("❌ pdfFile missing");
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const file = user.toObject().pdfFile;

    console.log("📦 File keys:", Object.keys(file));
    console.log("📦 Has path:", !!file.path);
    console.log("📦 Has data:", !!file.data);
    console.log("📦 data type:", typeof file.data);
    console.log("📦 constructor:", file.data?.constructor?.name);

    // =========================
    // ✅ CASE 1: Disk file
    // =========================
    if (file.path) {
      console.log("📁 CASE: DISK FILE");

      const filePath = require("path").resolve(file.path);
      console.log("📁 Resolved path:", filePath);

      try {
        await require("fs").promises.access(filePath);
        console.log("✅ File exists on disk");
      } catch (err) {
        console.log("❌ File missing on disk:", err.message);

        return res.status(404).json({
          success: false,
          message: "File not found on server",
        });
      }

      return res.download(filePath, file.originalName);
    }

    // =========================
    // ✅ CASE 2: Mongo Binary
    // =========================
    if (file.data) {
      console.log("📦 CASE: MONGO BINARY");

      let fileBuffer;

      try {
        // 🔥 LOG ACTUAL VALUE
        console.log("🔍 Raw data sample:", file.data.toString().slice(0, 30));

        const base64 = file.data.toString("base64");
        console.log("📏 Base64 length:", base64.length);

        fileBuffer = Buffer.from(base64, "base64");
        console.log("📏 Buffer length:", fileBuffer.length);
      } catch (err) {
        console.log("❌ Conversion error:", err.message);

        return res.status(500).json({
          success: false,
          message: "Invalid file format",
        });
      }

      console.log("⬇️ Sending file...");

      res.setHeader("Content-Type", file.mimetype || "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.originalName || "file"}"`
      );

      return res.send(fileBuffer);
    }

    // =========================
    // ❌ FALLBACK
    // =========================
    console.log("❌ No path and no data detected");

    return res.status(404).json({
      success: false,
      message: "No file data available",
    });

  } catch (error) {
    console.error("🔥 Download error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    console.log("========== DOWNLOAD END ==========\n");
  }
};

const generateExcel = async (req, res) => {
  try {
    // Build filter object (same logic as getAllUsers)
    const filter = {};

    // Text search across name, email, and phone
    if (req.query.search) {
      const searchTerms = req.query.search.trim().split(/\s+/);
      filter.$and = filter.$and || [];
      searchTerms.forEach(term => {
        const searchRegex = new RegExp(term, "i");
        filter.$and.push({
          $or: [
            { firstName: searchRegex },
            { middleName: searchRegex },
            { lastName: searchRegex },
            { mailId: searchRegex },
            { alternateMailId: searchRegex },
            { contactNo: searchRegex },
            { alternateContactNo: searchRegex },
            { fatherName: searchRegex },
            { panNo: searchRegex },
          ]
        });
      });
    }

    // Gender filter
    if (req.query.gender && req.query.gender !== "All Genders") {
      filter.gender = req.query.gender;
    }

    // Experience filter (range) - using totalExperience
    if (req.query.minExperience || req.query.maxExperience) {
      filter.$and = filter.$and || [];

      if (req.query.minExperience && req.query.minExperience !== "0") {
        filter.$and.push({ totalExperience: { $gte: parseInt(req.query.minExperience) } });
      }

      if (req.query.maxExperience && req.query.maxExperience !== "All") {
        filter.$and.push({ totalExperience: { $lte: parseInt(req.query.maxExperience) } });
      }
    }

    // CTC filter (exact)
    if (req.query.ctcInLakhs) {
      filter.ctcInLakhs = parseFloat(req.query.ctcInLakhs);
    }

    // Location filters
    if (req.query.currentState && req.query.currentState !== "Current state") {
      filter.currentState = new RegExp(req.query.currentState, "i");
    }

    if (
      req.query.preferredState &&
      req.query.preferredState !== "Preferred state"
    ) {
      filter.preferredState = new RegExp(req.query.preferredState, "i");
    }

    // Job-related filters
    if (req.query.designation && req.query.designation !== "Designation") {
      filter.designation = new RegExp(req.query.designation, "i");
    }

    if (req.query.department && req.query.department !== "Department") {
      filter.department = req.query.department;
    }

    // Current employer filter
    if (req.query.currentEmployer) {
      filter.currentEmployer = new RegExp(req.query.currentEmployer, "i");
    }

    // Date range filters
    if (req.query.startDate || req.query.endDate) {
      filter.dateOfUpload = {};
      if (req.query.startDate) {
        filter.dateOfUpload.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.dateOfUpload.$lte = new Date(req.query.endDate);
      }
    }

    // Age filter (range)
    if (req.query.minAge || req.query.maxAge) {
      filter.$expr = filter.$expr || { $and: [] };
      if (req.query.minAge) {
        const minAge = parseInt(req.query.minAge);
        filter.$expr.$and.push({
          $gte: [
            { $divide: [{ $subtract: [new Date(), "$dateOfBirth"] }, 365.25 * 24 * 60 * 60 * 1000] },
            minAge
          ]
        });
      }
      if (req.query.maxAge) {
        const maxAge = parseInt(req.query.maxAge);
        filter.$expr.$and.push({
          $lte: [
            { $divide: [{ $subtract: [new Date(), "$dateOfBirth"] }, 365.25 * 24 * 60 * 60 * 1000] },
            maxAge
          ]
        });
      }
      if (filter.$expr.$and.length === 0) {
        delete filter.$expr;
      }
    }

    // Uploaded by filter
    if (req.query.uploadedBy) {
      filter.uploadedBy = new RegExp(req.query.uploadedBy, "i");
    }

    // Determine if any filter is applied - check for actual filter conditions
    const isFilterApplied = Object.keys(req.query).length > 0 &&
      Object.values(filter).some(value =>
        value !== null && value !== undefined &&
        (typeof value !== 'object' || Object.keys(value).length > 0)
      );

    const users = isFilterApplied
      ? await User.find(filter).sort({ dateOfUpload: -1 }).allowDiskUse().lean()
      : await User.find({}).limit(25).sort({ dateOfUpload: -1 }).allowDiskUse().lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found matching the applied filters to export",
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Filtered Users");

    // Define columns
    worksheet.columns = [
      // ✨ Change 1: Updated the first column to be a serial number instead of the DB ID.
      { header: "Sr. No.", key: "serialNumber", width: 10 },
      { header: "Uploaded By", key: "uploadedBy", width: 25 },
      { header: "Date Of Upload", key: "dateOfUpload", width: 20 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Middle Name", key: "middleName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Email", key: "mailId", width: 30 },
      { header: "Alternate Email", key: "alternateMailId", width: 30 },
      { header: "Contact No", key: "contactNo", width: 20 },
      { header: "Alternate Contact No", key: "alternateContactNo", width: 20 },
      { header: "Father Name", key: "fatherName", width: 25 },
      { header: "PAN No", key: "panNo", width: 20 },
      { header: "Date of Birth", key: "dateOfBirth", width: 20 },
      { header: "Gender", key: "gender", width: 15 },
      { header: "Current State", key: "currentState", width: 20 },
      { header: "Current City", key: "currentCity", width: 20 },
      { header: "Preferred State", key: "preferredState", width: 20 },
      { header: "Preferred City", key: "preferredCity", width: 20 },
      { header: "Current Employer", key: "currentEmployer", width: 25 },
      { header: "Designation", key: "designation", width: 25 },
      { header: "Department", key: "department", width: 25 },
      { header: "CTC (Lakhs)", key: "ctcInLakhs", width: 15 },
      { header: "Experience (Yrs)", key: "totalExperience", width: 15 },
      { header: "CV Link", key: "cvLink", width: 40 },
    ];

    // Add rows with corrected data and hyperlinks
    users.forEach((user, index) => {
      const rowData = {
        // ✨ Change 2: Added the serial number using the loop's index.
        serialNumber: index + 1,
        ...user,
        dateOfUpload: user.dateOfUpload
          ? new Date(user.dateOfUpload).toLocaleDateString("en-IN")
          : "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toLocaleDateString("en-IN")
          : "",
        ctcInLakhs: user.ctcInLakhs ? parseFloat(user.ctcInLakhs).toFixed(2) : "",
        totalExperience: user.totalExperience ? Math.round(parseFloat(user.totalExperience)) : "",
      };

      const row = worksheet.addRow(rowData);

      // Correctly build the hyperlink URL
      if (user.pdfFile && user.pdfFile.filename) {
        const cell = row.getCell("cvLink");
        const serverUrl =
          process.env.VITE_BACKEND_URI ||
          "http://localhost:5000";
        cell.value = {
          text: "Download CV",
          hyperlink: `${serverUrl}/uploads/${user.pdfFile.filename}`,
        };
        cell.font = { color: { argb: "FF0000FF" }, underline: true };
      }
    });

    // Style headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Style all data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = {
            horizontal: "left",
            vertical: "middle",
            wrapText: true,
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });

    // Send Excel file as response
    const appliedFilters = Object.keys(req.query).length > 0 ? "Filtered_" : "";
    const recordCount = users.length > 0 ? `${users.length}_` : "";
    const filename = `${appliedFilters}${recordCount}Users_Data.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel file:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .send("An error occurred while generating the Excel file.");
    }
  }
};

const addComment = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate userId
    if (!userId || userId === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing user ID",
      });
    }

    // Accept both 'text' and 'comment' for backward compatibility
    const text = req.body.text || req.body.comment;
    const addedBy = req.body.addedBy || "unknown";

    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment text is required and must be a non-empty string",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Ensure comments array exists
    if (!Array.isArray(user.comments)) user.comments = [];

    // Add comment object
    user.comments.push({ text, addedBy, date: new Date() });
    await user.save();

    res.json({
      success: true,
      message: "Comment added successfully",
      data: user.comments,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Generate Excel for a SINGLE user with a clickable CV link
const generateSingleUserExcel = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate the user's serial number
    const userCountBefore = await User.countDocuments({
      dateOfUpload: { $lt: user.dateOfUpload },
    });
    const serialNumber = userCountBefore + 1;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("User Details");

    // Define a structured layout
    const data = [
      // ✨ "Database ID" field has been removed.
      { field: "Sr. No.", value: serialNumber },
      { field: "Uploaded By", value: user.uploadedBy },
      {
        field: "Date Of Upload",
        value: user.dateOfUpload
          ? new Date(user.dateOfUpload).toLocaleDateString("en-IN")
          : "N/A",
      },
      { field: "First Name", value: user.firstName },
      { field: "Middle Name", value: user.middleName },
      { field: "Last Name", value: user.lastName },
      { field: "Email", value: user.mailId },
      { field: "Alternate Email", value: user.alternateMailId },
      { field: "Contact No", value: user.contactNo },
      { field: "Alternate Contact No", value: user.alternateContactNo },
      { field: "Father Name", value: user.fatherName },
      { field: "PAN No", value: user.panNo },
      {
        field: "Date of Birth",
        value: user.dateOfBirth
          ? new Date(user.dateOfBirth).toLocaleDateString("en-IN")
          : "N/A",
      },
      { field: "Gender", value: user.gender },
      { field: "Current State", value: user.currentState },
      { field: "Current City", value: user.currentCity },
      { field: "Preferred State", value: user.preferredState },
      { field: "Preferred City", value: user.preferredCity },
      { field: "Current Employer", value: user.currentEmployer },
      { field: "Designation", value: user.designation },
      { field: "Department", value: user.department },
      { field: "Comment 1", value: user.comment1 },
      { field: "Comment 2", value: user.comment2 },
      { field: "Comment 3", value: user.comment3 },
      {
        field: "CV Link",
        value:
          user.pdfFile && user.pdfFile.filename
            ? {
              text: "Download Resume",
              hyperlink: `${process.env.VITE_BACKEND_URI ||
                "https://rbgform-server-ss.onrender.com"
                }/uploads/${user.pdfFile.filename}`,
            }
            : "No CV Uploaded",
      },
    ];

    // Add headers
    worksheet.columns = [
      { header: "Field", key: "field", width: 30 },
      { header: "Value", key: "value", width: 50 },
    ];

    // Add the data rows
    data.forEach((item) => {
      const row = worksheet.addRow(item);
      if (item.value && item.value.hyperlink) {
        const cell = row.getCell("value");
        cell.font = { color: { argb: "FF0000FF" }, underline: true };
      }
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" },
      };
      cell.alignment = { vertical: "middle" };
    });

    // Set filename
    const filename = `user_${user.firstName || "details"}_${user._id}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating single user Excel:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserComments,
  updateUser,
  deleteUser,
  downloadFile,
  generateExcel,
  addComment,
  generateSingleUserExcel,
};
