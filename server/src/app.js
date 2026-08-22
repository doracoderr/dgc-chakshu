const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const blockRoutes = require('./routes/block.routes');
const roomRoutes = require('./routes/room.routes');
const departmentRoutes = require('./routes/department.routes');
const facultyRoutes = require('./routes/faculty.routes');
const searchRoutes = require('./routes/search.routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DGC Chakshu API is running', data: { uptime: process.uptime() } });
});

app.use('/api/blocks', blockRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/search', searchRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', error: { code: 'NOT_FOUND' } });
});

app.use(errorHandler);

module.exports = app;
