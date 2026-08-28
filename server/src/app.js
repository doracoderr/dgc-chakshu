const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const blockRoutes = require('./routes/block.routes');
const roomRoutes = require('./routes/room.routes');
const departmentRoutes = require('./routes/department.routes');
const facultyRoutes = require('./routes/faculty.routes');
const searchRoutes = require('./routes/search.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

// CLIENT_URL can be a single origin or a comma-separated list
// (e.g. "http://localhost:5173,https://your-app.vercel.app")
const allowedOrigins = (process.env.CLIENT_URL || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.includes('*')
    ? '*'
    : (origin, callback) => {
        // allow non-browser requests (no origin) and whitelisted origins
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DGC Chakshu API is running', data: { uptime: process.uptime() } });
});

app.use('/api/blocks', blockRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', error: { code: 'NOT_FOUND' } });
});

app.use(errorHandler);

module.exports = app;
