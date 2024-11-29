const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for 
                                                            // our purposes we'll hash these existing users when the 
                                                            // app loads
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user", // Regular user
    },
];


// Middleware to check if a user is authenticated
function ensureAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
}

// GET /login - Render login form
app.get("/login", (request, response) => {
    response.render("login");
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    const { email, password } = request.body;

    // Find user by email
    const user = USERS.find(user => user.email === email);
    if (!user) {
        return response.render("login", { error: "Invalid email or password!" });
    }

    // Compare hashed password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return response.render("login", { error: "Invalid email or password!" });
    }

    // Set user session
    request.session.user = { id: user.id, username: user.username, role: user.role };
    console.log("User logged in:", request.session.user);

    response.redirect("/landing");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    response.render("signup");
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    const { email, username, password } = request.body;

    // Check if email or username already exists
    const existingUser = USERS.find(user => user.email === email || user.username === username);
    if (existingUser) {
        return response.render("signup", { error: "Email or username already exists!" });
    }

    // Hash password and create new user
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const newUser = {
        id: USERS.length + 1, // Simple incremental ID
        username,
        email,
        password: hashedPassword,
        role: "user", // Default to regular user
    };

    USERS.push(newUser);
    console.log("New user registered:", newUser);

    response.redirect("/login");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
    
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
