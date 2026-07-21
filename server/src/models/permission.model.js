const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    code: {
      // e.g. "products:create", "reports:export"
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['view', 'create', 'update', 'delete', 'approve', 'export', 'print'],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Permission', permissionSchema);
