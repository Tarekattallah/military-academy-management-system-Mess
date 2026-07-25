const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    username: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete', 'approve', 'reject', 'login', 'logout', 'view'],
    },
    module: {
      type: String,
      required: true,
      trim: true,
    },
    documentId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    method: {
      type: String,
      trim: true,
    },
    path: {
      type: String,
      trim: true,
    },
    statusCode: {
      type: Number,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
