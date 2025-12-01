<!-- Banner / Logo -->
<p align="center">
  <img src="./frontend/public/icons/icon.png" alt="NetisTrackGh Logo" width="180" />
</p>

<h1 align="center">NetisTrackGh</h1>
<p align="center">
  <i>Comprehensive Site Monitoring & Management System</i>
</p>

---

<!-- Typing SVG -->
<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?lines=Monitor+Generator+Sites;Track+Fuel+Consumption;Manage+Maintenance;Offline+Capable&center=true&width=500&height=50&duration=3000" alt="Typing SVG">
</p>

---

## 📌 About NetisTrackGh
NetisTrackGh is a **robust site monitoring and management system** built to simplify operations for telecommunication sites.  
It tracks fuel consumption, schedules maintenance, logs activities, and provides role-based dashboards for admins, supervisors, and technicians.

---

## 🚀 Features
- **Real-time monitoring:** Track generator status and fuel levels in real time
- **Role-based access:** Admin, supervisor, and technician dashboards
- **Maintenance scheduling:** Automatic reminders and logging
- **Offline support:** Works even when internet connection is unstable
- **Activity logs & security tracking**  
- **Authentication & user management** via Firebase and backend JWT  

---

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | Firebase Firestore |
| Authentication | Firebase Auth + JWT |
| Hosting | Netlify (Backend & Frontend) |

---

## 🔗 Quick Links
<p align="center">
  <a href="https://github.com/AuralenX/NetisTrackGh" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-Project-blue?logo=github&logoColor=white" alt="GitHub Repo" />
  </a>
  <a href="https://netistrackgh.auralenx.com" target="_blank">
    <img src="https://img.shields.io/badge/Live-Demo-green?logo=heroku&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/AuralenX/NetisTrackGh/issues" target="_blank">
    <img src="https://img.shields.io/badge/Report%20Issue-red?logo=github&logoColor=white" alt="Report Issue" />
  </a>
</p>

---

## ⚡ Usage

### 1️⃣ Frontend
Clone the repository and open the `index.html`:

```bash
git clone https://github.com/AuralenX/NetisTrackGh.git
cd NetisTrackGh/frontend
open index.html 
```

2️⃣ Backend
Send email & password to /api/auth/verify to log in:

Request Example:

```bash
POST /api/auth/verify
{
  "email": "technician@netistrackgh.com",
  "password": "userpassword123"
}
Response Example:

{
  "message": "Login successful",
  "user": {
    "uid": "string",
    "email": "technician@netistrackgh.com",
    "role": "technician",
    "firstName": "string",
    "lastName": "string"
  },
  "token": "string",
  "refreshToken": "string",
  "expiresIn": "string"
  }
```

👥 Roles & Permissions
Role	Permissions
Technician	View assigned sites, log fuel/maintenance, view own reports
Supervisor	View all sites, verify logs, view analytics, manage technicians
Admin	Full system access, user/site management, configuration, data export

📝 License
MIT License © Auralenx

<p align="center"> Made with ❤️ by <a href="https://github.com/AuralenX">AuralenX</a> </p>