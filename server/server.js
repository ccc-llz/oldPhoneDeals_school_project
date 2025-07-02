/**
 * The file to start a server
 *
 */
/**
 * The file to start a server
 */
require('dotenv').config();

// Set default environment variables if not present
if (!process.env.SECRET_KEY) {
	process.env.SECRET_KEY = 'yoursecretkey123456';
}
if (!process.env.TOKEN_EXPIRES_IN) {
	process.env.TOKEN_EXPIRES_IN = '24h';
}

const cors = require('cors');
const express = require('express');
const initAdmin = require('./utils/initAdmin');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const db = require('./models/db');

const routes = require('./routes/routes');
const authRoutes = require('./routes/auth');
const userProfileRoutes = require('./routes/userprofile');
const adminRoutes = require('./routes/adminRoutes');

const http = require('http'); 
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// create socket.io instance
const io = new Server(server, {
	cors: {
		origin: 'http://localhost:5173',
		methods: ['GET', 'POST']
	}
});

io.on('connection', (socket) => {
	console.log('Admin connected to Socket.IO');

	socket.on('disconnect', () => {
		console.log('Admin disconnected from Socket.IO');
	});
});
app.set('io', io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, '/views'));

app.use(cors({
	origin: 'http://localhost:5173',
	credentials: true
}));

app.use(session({
	secret: 'chimitan',
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: process.env.NODE_ENV === 'production',
		maxAge: 1000 * 60 * 60 * 24 // One Day
	},
	store: MongoStore.create({
		client: db.connection.getClient(),
		collectionName: 'sessions'
	})
}));

app.use(express.static(path.join(__dirname, '/public')));

// routes
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/userprofile', userProfileRoutes);
app.use('/api/admin', adminRoutes);

// error handler
app.use((err, req, res, next) => {
	console.error('Global error handler caught:', err);
	res.status(err.status || 500).json({
		message: err.message || 'An unexpected error occurred',
		error: process.env.NODE_ENV === 'development' ? err : {}
	});
});

//init the admin account
initAdmin();

server.listen(3000, () => {
	console.log('Server running on http://localhost:3000');
});
