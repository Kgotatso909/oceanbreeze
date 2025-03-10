const mongoose = require('mongoose');
const Admin = require("./admin")

const auditLogSchema = new mongoose.Schema({
  monitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Admin, // Reference to the Admin model (only monitors)
    required: true,
  },
  actionType: {
    type: String,
    enum: ['UPDATE_BOOKING', 'CREATE_ROOM', 'UPDATE_ROOM', 'DELETE_ROOM', 'MANAGE_MESSAGE', 'OTHER'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
