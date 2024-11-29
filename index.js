const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

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
        password: bcrypt.hashSync("admin123", SALT_ROUNDS),
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user",
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
app.get("/login", (req, res) => {
    res.render("login");
});

// POST /login - Authenticate user
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    const user = USERS.find(user => user.email === email);
    if (!user) {
        console.log("User not found");
        return res.render("login", { error: "Invalid email or password!" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    console.log("Password validation result:", isPasswordValid);

    if (!isPasswordValid) {
        return res.render("login", { error: "Invalid email or password!" });
    }

    req.session.user = { id: user.id, username: user.username, role: user.role };
    console.log("User session set:", req.session.user);

    req.session.save(err => {
        if (err) {
            console.error("Session save error:", err);
        }
        res.redirect("/landing");
    });
});
// GET /signup - Render signup form
app.get("/signup", (req, res) => {
    res.render("signup");
});

// POST /signup - Register a new user
app.post("/signup", (req, res) => {
    const { email, username, password } = req.body;

    const existingUser = USERS.find(user => user.email === email || user.username === username);
    if (existingUser) {
        return res.render("signup", { error: "Email or username already exists!" });
    }

    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    USERS.push({
        id: USERS.length + 1,
        username,
        email,
        password: hashedPassword,
        role: "user",
    });

    res.redirect("/login");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (req, res) => {
    if (req.session.user) {
        return res.redirect("/landing");
    }
    res.render("index");
});

// GET /landing - Render landing (home) page
app.get("/landing", ensureAuthenticated, (req, res) => {
    const user = req.session.user;

    if (user.role === "admin") {
        return res.render("home", { user, users: USERS });
    }

    res.render("home", { user, users: null });
});

// GET /logout - Log out the user
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
        }
        res.redirect("/");
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
