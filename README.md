# ❤️ PolyCOOP – Dating Service for Polyamorous Individuals

The purpose of this application is to allow users to create profiles, meet new people, send relationship requests, and manage connections safely.

## Project Description

PolyCOOP is a server-side web application built with **Node.js** and **Express**. Users can register, log in, browse other profiles, send and manage relationship requests, and establish matches. All user data (including passwords) is securely stored in a **MongoDB** database. Its features resemble a friend request and status system.

The front-end uses **EJS** templates with custom CSS. Profile images are handled via the **Multer** middleware. The project includes robust error handling, custom error pages, and appropriate HTTP status codes for invalid requests.

## Features

### Authentication & Authorization
- User registration with input validation
- Login and logout functionality
- Session management with middleware to protect routes

### Profiles & Relationships
- Browse other users’ profiles
- Edit your own profile (including profile picture upload)
- Send, accept, reject, or cancel relationship requests
- Establish and remove matches

### Search & Matching
- Browse users that match your criteria
- View and manage incoming/outgoing requests

### Error Handling
- Custom error pages
- Proper HTTP status codes
- Resilience to common user errors (e.g., missing session, invalid IDs)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/brtkglnski/J103
cd J103
```

### ⚠️ Prerequisites
- Node.js (v18 or newer)
- npm
- MongoDB
- Docker

### 2. Install Dependencies
```bash
npm install
```
### 3. Set up Docker
Instructions provided in the Docker.md file.


### 4. Initialize the Database
Run the seeding script to populate sample data:

```bash
npm run seed
```

**Default accounts created by the seeder** (password for all: `P@ssw0rd1` – stored encrypted):

- BartoszG
- szymonL
- Pmati07
- vvKowalik
- danielSoBaller
- CloudAntek17

Sample relationships and requests are automatically created.

### 3. Initialize the Database
Instructions provided in the [Docker.md](Docker.md) file.

### 4. Start the Application
```bash
npm start
```
The app will be available at **http://localhost:2025**.

## Endpoints

### Main Routes
- `GET /` – Homepage

### Authentication
- `GET /login` – Login form
- `POST /login` – Authenticate user
- `GET /registration` – Registration form
- `POST /registration` – Create new user
- `GET /logout` – End session

### Profiles
- `GET /profile/:slug` – View profile
- `GET /profile/:slug/edit` – Edit own profile
- `POST /profile/:slug/edit` – Update profile (with image upload)
- `POST /profile/:slug/delete` – Delete own profile

### Relationships & Matching
- `GET /match` – View available matches
- `POST /match` – Send relationship request
- `GET /profile/:slug/match/:targetSlug` – Send match request
- `GET /profile/:slug/remove-match/:targetSlug` – Send match request

### Requests
- `GET /profile/:slug/incoming` – View incoming requests
- `POST /profile/:slug/incoming` – Accept or reject request
- `GET /profile/:slug/outgoing` – View outgoing requests
- `POST /profile/:slug/outgoing` – Cancel outgoing request

## Technologies Used

- **Language**: JavaScript (Node.js)
- **Framework**: Express
- **Template Engine**: EJS
- **Database**: MongoDB
- **File Uploads**: Multer
- **Styling**: CSS

## Author

Bartosz Gliński

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.